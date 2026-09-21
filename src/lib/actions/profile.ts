"use server";

import { db } from "@/lib/db";
import { getActionUser } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { profileInput } from "@/lib/validation";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import { audit, revalidateAmbassador } from "@/lib/audit";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const { user, error } = await getActionUser();
  if (!user) return fail(error ?? "Sign in first.");

  const parsed = profileInput.safeParse({
    pageUrl: String(formData.get("pageUrl") ?? ""),
    lane: String(formData.get("lane") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Some of that did not look right.");

  const { pageUrl, lane, bio } = parsed.data;
  // Always http(s) or nothing. A javascript: or data: URL here used to be stored verbatim
  // and rendered as an href on the reviewer's own screen.
  await db.user.update({
    where: { id: user.id },
    data: { pageUrl: pageUrl || null, lane: lane || null, bio: bio || null },
  });
  revalidateAmbassador();
  return ok(undefined, "Saved.");
}

export type PasswordState = { ok: boolean; error?: string; message?: string };

/**
 * Set or change your own password. Someone signing in by link for the first time has no
 * current password to prove, so the first one only needs to pass the policy — after that,
 * changing it requires the old one.
 */
export async function changeOwnPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const { user, error } = await getActionUser();
  if (!user) return { ok: false, error: error ?? "Sign in first." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (user.passwordHash && !verifyPassword(current, user.passwordHash)) {
    return { ok: false, error: "That current password is not right." };
  }
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: problem };
  if (next !== confirm) return { ok: false, error: "The two new passwords do not match." };
  if (user.passwordHash && verifyPassword(next, user.passwordHash)) {
    return { ok: false, error: "That is the password you already have." };
  }

  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next), passwordSetAt: new Date() } });
  await audit({ actorId: user.id, action: user.passwordHash ? "auth.password_changed" : "auth.password_set", target: user.email });
  return { ok: true, message: user.passwordHash ? "Password changed. Your other devices stay signed in until their sessions expire." : "Password set. You can sign in with it or with a link." };
}

const VISIBILITY_FIELDS: Set<string> = new Set(["showInDirectory", "showOnLeaderboard"]);

export async function setVisibility(field: string, value: boolean): Promise<ActionResult> {
  const { user, error } = await getActionUser();
  if (!user) return fail(error ?? "Sign in first.");
  if (!VISIBILITY_FIELDS.has(field)) return fail("That is not a visibility setting.");

  await db.user.update({
    where: { id: user.id },
    data: field === "showInDirectory" ? { showInDirectory: Boolean(value) } : { showOnLeaderboard: Boolean(value) },
  });
  revalidateAmbassador();
  return ok();
}
