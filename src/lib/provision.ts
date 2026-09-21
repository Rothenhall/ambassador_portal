import "server-only";
import { db, prismaErrorCode } from "./db";
import { activeCohort, avatarColorFor } from "./cohort";
import { issueMagicLink } from "./auth";
import { sendAmbassadorInvite } from "./notify";
import { emailInput } from "./validation";

// Turning a name and an email into someone who can sign in.
//
// Two callers: an accepted application, and an admin adding a person directly. Both used to
// be impossible — `decideApplication` wrote a status and stopped, so the only way to get an
// ambassador into the database was to edit the seed file.

export type AccountResult =
  | { ok: true; userId: string; email: string; campusName: string; emailSent: boolean; inviteUrl?: string }
  | { ok: false; error: string };

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://campusscout.rothenhall.com";
}

export async function createAccount(opts: {
  email: string;
  name: string;
  campusName: string;
  city?: string;
  cohortId?: string;
  tier?: "applicant" | "ambassador" | "senior" | "campus_lead" | "alumnus";
  role?: "ambassador" | "reviewer" | "admin";
  actorId: string;
  invite?: boolean;
}): Promise<AccountResult> {
  const email = opts.email.trim().toLowerCase();
  if (!emailInput.safeParse(email).success) return { ok: false, error: "That email address is not usable." };

  const existing = await db.user.findUnique({ where: { email }, include: { membership: { select: { id: true } } } });
  if (existing) {
    return { ok: false, error: `${email} already has an account${existing.membership ? "" : " that is not yet in a cohort"}. Manage it from Ambassadors instead of creating a second one.` };
  }

  const cohort = opts.cohortId
    ? await db.cohort.findUnique({ where: { id: opts.cohortId } })
    : await activeCohort();
  if (!cohort) return { ok: false, error: "There is no cohort to enrol this person into." };

  const role = opts.role ?? "ambassador";
  const name = opts.name.trim().slice(0, 120);
  const campusName = opts.campusName.trim().slice(0, 120) || "Unassigned campus";

  let created: { userId: string; campusName: string };
  try {
    created = await db.$transaction(async (tx) => {
      const found = await tx.campus.findFirst({ where: { cohortId: cohort.id, name: campusName } });
      const campus = found ?? (await tx.campus.create({ data: { cohortId: cohort.id, name: campusName, city: (opts.city ?? "").trim().slice(0, 80) } }));
      const user = await tx.user.create({
        data: { email, name, role, status: "invited", avatarColor: avatarColorFor(email) },
      });
      // Staff who only review do not need a cohort seat; ambassadors always have one.
      if (role === "ambassador") {
        await tx.membership.create({ data: { userId: user.id, cohortId: cohort.id, campusId: campus.id, tier: opts.tier ?? "ambassador" } });
      }
      return { userId: user.id, campusName: campus.name };
    });
  } catch (e) {
    if (prismaErrorCode(e) === "P2002") return { ok: false, error: "That email was claimed by another account a moment ago." };
    throw e;
  }

  let emailSent = false;
  let inviteUrl: string | undefined;
  if (opts.invite !== false) {
    const link = await issueMagicLink(email);
    inviteUrl = link ? `${appUrl()}/auth/callback?token=${link.token}` : undefined;
    if (inviteUrl) {
      const result = await sendAmbassadorInvite({ to: email, name, campusName: created.campusName, url: inviteUrl });
      emailSent = result.ok;
    }
  }

  return { ok: true, userId: created.userId, email, campusName: created.campusName, emailSent, inviteUrl };
}

export async function provisionAmbassador(opts: {
  applicationId: string;
  actorId: string;
}): Promise<AccountResult> {
  const application = await db.application.findUnique({ where: { id: opts.applicationId } });
  if (!application) return { ok: false, error: "That application no longer exists." };
  if (application.userId) {
    const linked = await db.user.findUnique({ where: { id: application.userId } });
    if (linked) return { ok: true, userId: linked.id, email: linked.email, campusName: "", emailSent: false };
  }

  const email = application.email.trim().toLowerCase();
  const already = await db.user.findUnique({ where: { email }, include: { membership: { select: { id: true } } } });

  if (already?.membership) {
    // Same person, second application: attach the existing account rather than refuse, but
    // never silently create a duplicate.
    await db.application.update({
      where: { id: application.id },
      data: { status: "accepted", userId: already.id, decidedById: opts.actorId, decidedAt: new Date() },
    });
    return { ok: true, userId: already.id, email, campusName: "", emailSent: false };
  }
  if (already) {
    return { ok: false, error: `${email} already has an account that is not yet in a cohort. Give it a cohort seat from Ambassadors first.` };
  }

  const created = await createAccount({
    email,
    name: application.name,
    campusName: application.campus,
    city: application.city,
    actorId: opts.actorId,
  });
  if (!created.ok) return created;

  await db.application.update({
    where: { id: application.id },
    data: { status: "accepted", userId: created.userId, decidedById: opts.actorId, decidedAt: new Date() },
  });
  return created;
}

/** Re-sends a sign-in link for an account that already exists (lost email, new device). */
export async function sendSignInLink(email: string): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });
  if (!user) return { error: "no_account", sent: false };
  if (user.status === "suspended") return { error: "suspended", sent: false };

  const link = await issueMagicLink(normalized);
  if (!link) return { error: "link_failed", sent: false };

  const url = `${appUrl()}/auth/callback?token=${link.token}`;
  const minutes = Math.max(1, Math.round((link.expiresAt.getTime() - Date.now()) / 60_000));
  const { sendMagicLink } = await import("./notify");
  const result = await sendMagicLink(normalized, url, minutes);
  if (result.ok) return { sent: true };
  if (result.skipped) return { sent: false, skipped: true };
  return { error: "delivery_failed", sent: false };
}

/** Same link, for an account id rather than an address — used by the admin console. */
export async function sendLinkToUser(userId: string): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, status: true } });
  if (!user) return { error: "no_account", sent: false };
  if (user.status === "suspended") return { error: "suspended", sent: false };
  return sendSignInLink(user.email);
}
