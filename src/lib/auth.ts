import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "./db";

// Dev-only session. Pre-launch, there is no live Supabase project wired to this app yet,
// so sign-in is "continue as" over the seeded roster rather than a real magic link.
// Swap this file for Supabase Auth (magic link) per UI-SPEC.md §8 when circle.rothenhall.com
// goes live — every call site below (getSession / requireAmbassador / requireAdmin) stays
// the same shape, only the cookie issuance changes.

const COOKIE = "cc_session";
const SECRET = process.env.SESSION_SECRET ?? "campus-circle-dev-secret";

function sign(value: string) {
  const mac = crypto.createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 16);
  return `${value}.${mac}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 16);
  return mac === expected ? value : null;
}

export async function createSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const userId = verify(raw);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { membership: { include: { cohort: true, campus: true } } },
  });
  return user;
}

export async function requireUser() {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "reviewer") throw new Error("FORBIDDEN");
  return user;
}
