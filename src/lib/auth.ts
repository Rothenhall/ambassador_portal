import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "./db";
import { equalisingVerify, verifyPassword } from "./password";

// Identity, app-owned.
//
// The old version signed the user id into a cookie with an 8-byte HMAC and called that a
// session: anyone holding a validly-signed id had access forever, with nothing to revoke.
// This version issues an opaque random token, stores only its SHA-256 in the Session table,
// and treats that row as the authority — sign out, suspend, or rotate and the cookie is
// dead on the next request.
//
// Sign-in is a one-time magic link emailed to an address already on file. Supabase Auth was
// the original plan and is still a fine swap, but it needs SMTP configured in the dashboard
// regardless, and this keeps every call site (getSession / requireUser / requireReviewer /
// requireAdmin) exactly as the rest of the app already uses them.

const COOKIE = "cc_session";
const SESSION_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;
const MAGIC_LINK_MAX_ATTEMPTS = 5;

export const SESSION_COOKIE = COOKIE;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}

// ── sessions ────────────────────────────────────────────────────────────────

export async function createSession(userId: string, userAgent?: string) {
  const token = newToken();
  const jar = await cookies();
  await db.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000),
      userAgent: userAgent?.slice(0, 250) ?? null,
    },
  });
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  jar.delete(COOKIE);
}

export async function revokeAllSessions(userId: string): Promise<number> {
  const result = await db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  return result.count;
}

/** Named for call sites that mean "this person's sessions", not "all of them somewhere". */
export const revokeSessionsForUser = revokeAllSessions;

type SessionUser = Awaited<ReturnType<typeof loadUser>>;

function loadUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: { membership: { include: { cohort: true, campus: true } } },
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const user = await loadUser(session.userId);
  if (!user) return null; // account deleted or reseeded under an unexpired cookie
  if (user.status === "suspended") return null;

  // Write at most once a day, so a page-load-per-action does not become a write-per-action.
  if (Date.now() - session.lastSeenAt.getTime() > 86400_000) {
    await db.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }
  return user;
}

/** Null-safe guard for server actions: return this as an ActionResult instead of throwing. */
export async function getActionUser() {
  const user = await getSession();
  if (!user) return { user: null, error: "Your session has expired. Sign in again." } as const;
  if (!user.membership) return { user: null, error: "This account has no cohort membership yet. Ask your campus lead." } as const;
  return { user, error: null } as const;
}

export async function requireUser() {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Reviewers: read the queue, grade submissions. Nothing else. */
export async function requireReviewer() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "reviewer") throw new Error("FORBIDDEN");
  return user;
}

/** Admins only. Applications, publishing, announcements, fulfilment. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export async function getActionReviewer() {
  const user = await getSession();
  if (!user) return { user: null, error: "Your session has expired. Sign in again." } as const;
  if (user.role !== "admin" && user.role !== "reviewer") return { user: null, error: "Only reviewers can do that." } as const;
  return { user, error: null } as const;
}

export async function getActionAdmin() {
  const user = await getSession();
  if (!user) return { user: null, error: "Your session has expired. Sign in again." } as const;
  if (user.role !== "admin") return { user: null, error: "Only Campus Circle admins can do that." } as const;
  return { user, error: null } as const;
}

/** The ambassador may only act on their own rows. Every self-scoped action starts here. */
export async function requireMembership() {
  const user = await requireUser();
  if (!user.membership) throw new Error("NO_MEMBERSHIP");
  return user;
}

// ── password sign-in ────────────────────────────────────────────────────────

export type PasswordLoginResult = { user: NonNullable<SessionUser>; email: string } | { error: "invalid" | "suspended" };

/**
 * Checks an email and password. The failure paths are deliberately indistinguishable:
 * unknown address, address with no password set, and wrong password all return "invalid" and
 * all take the same work, because a login form that answers "no such account" is a roster.
 * Only someone who got the password right learns their account is suspended.
 */
export async function loginWithPassword(email: string, password: string): Promise<PasswordLoginResult> {
  const normalized = String(email ?? "").trim().toLowerCase();
  const candidate = String(password ?? "");
  if (!normalized || !candidate) {
    equalisingVerify(candidate);
    return { error: "invalid" };
  }

  const user = await db.user.findUnique({
    where: { email: normalized },
    include: { membership: { include: { cohort: true, campus: true } } },
  });

  if (!user || !user.passwordHash) {
    equalisingVerify(candidate);
    return { error: "invalid" };
  }
  if (!verifyPassword(candidate, user.passwordHash)) return { error: "invalid" };
  if (user.status === "suspended") return { error: "suspended" };

  return { user, email: normalized };
}

// ── magic links ─────────────────────────────────────────────────────────────

export type MagicLinkResult = { token: string; expiresAt: Date } | null;

export async function issueMagicLink(email: string): Promise<MagicLinkResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  // Expire anything outstanding first, so a queue of links cannot accumulate for one address.
  await db.magicLink.updateMany({
    where: { email: normalized, usedAt: null, expiresAt: { lt: new Date() } },
    data: { expiresAt: new Date(0) },
  });

  const token = newToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_MINUTES * 60_000);
  await db.magicLink.create({ data: { email: normalized, tokenHash: sha256(token), expiresAt } });
  return { token, expiresAt };
}

/**
 * Redeems a token for an email, or null. Single use, short lived, and a row is burnt after
 * a handful of wrong guesses so a leaked-but-expired token is not a permanent oracle.
 */
export async function consumeMagicLink(token: string): Promise<string | null> {
  if (!token || token.length < 20) return null;
  const hash = sha256(token);
  const row = await db.magicLink.findUnique({ where: { tokenHash: hash } });
  if (!row) return null;
  if (row.usedAt || row.expiresAt < new Date()) return null;
  if (row.attempts >= MAGIC_LINK_MAX_ATTEMPTS) return null;

  const burnt = await db.magicLink.updateMany({
    where: { id: row.id, usedAt: null, tokenHash: hash },
    data: { usedAt: new Date() },
  });
  if (burnt.count === 0) return null; // two tabs raced; only one wins
  return row.email;
}

// ── dev sign-in ─────────────────────────────────────────────────────────────

/**
 * The "continue as" picker exists because a preview build needs to be clickable without an
 * inbox. It hands out a session for a bare user id with no credential at all, so it is
 * unreachable unless both the flag is set AND we are not in production.
 */
export function devSignInEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ALLOW_DEV_SIGNIN === "1";
}
