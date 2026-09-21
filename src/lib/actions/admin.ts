"use server";

import { db } from "@/lib/db";
import { getActionAdmin } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { announcementInput } from "@/lib/validation";
import { provisionAmbassador } from "@/lib/provision";
import { audit, revalidateConsoles } from "@/lib/audit";

export async function decideApplication(
  applicationId: string,
  decision: "accepted" | "rejected"
): Promise<ActionResult<{ inviteUrl?: string }>> {
  const { user, error } = await getActionAdmin();
  if (!user) return fail(error ?? "Only an admin can decide applications.");

  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application) return fail("That application is gone.");
  if (application.status !== "pending") return fail(`Already ${application.status}.`);

  if (decision === "rejected") {
    const flipped = await db.application.updateMany({
      where: { id: application.id, status: "pending" },
      data: { status: "rejected", decidedById: user.id, decidedAt: new Date() },
    });
    if (flipped.count === 0) return fail("Someone else just decided this application.");
    await audit({ actorId: user.id, action: "application.rejected", target: application.id, meta: { email: application.email } });
    revalidateConsoles();
    return ok(undefined, `${application.name} was rejected. Nobody is emailed automatically — say so personally if it warrants it.`);
  }

  const result = await provisionAmbassador({ applicationId: application.id, actorId: user.id });
  if (!result.ok) return fail(result.error);

  await audit({
    actorId: user.id,
    action: "application.accepted",
    target: application.id,
    meta: { email: application.email, userId: result.userId, emailSent: result.emailSent },
  });
  revalidateConsoles();

  if (!result.emailSent) {
    return ok(
      { inviteUrl: result.inviteUrl },
      result.inviteUrl
        ? "Accepted and enrolled. Email is not configured on this deployment, so send this link yourself: " + result.inviteUrl
        : "Accepted and enrolled, but no sign-in link could be issued. Ask them to request one from the sign-in page."
    );
  }
  return ok(undefined, `Accepted. ${application.name}'s account and sign-in link are in their inbox.`);
}

export async function postAnnouncement(cohortId: string, formData: FormData): Promise<ActionResult> {
  const { user, error } = await getActionAdmin();
  if (!user) return fail(error ?? "Only an admin can post announcements.");

  const parsed = announcementInput.safeParse(String(formData.get("bodyMd") ?? ""));
  if (!parsed.success) return fail("Write something between 1 and 2000 characters.");

  const cohort = await db.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort) return fail("That cohort no longer exists.");

  await db.announcement.create({ data: { cohortId, bodyMd: parsed.data } });
  await audit({ actorId: user.id, action: "announcement.posted", target: cohortId });
  revalidateConsoles();
  return ok(undefined, "Posted. Every ambassador sees it at the top of their console.");
}

export async function setTaskPublished(taskId: string, published: boolean): Promise<ActionResult> {
  const { user, error } = await getActionAdmin();
  if (!user) return fail(error ?? "Only an admin can publish tasks.");

  const task = await db.task.findUnique({ where: { id: taskId }, select: { id: true, cohortId: true, code: true } });
  if (!task) return fail("That task no longer exists.");
  // Admins are not cohort-scoped, but confirm the cohort id so a stray id cannot flip
  // something in a cohort nobody runs.
  const cohort = await db.cohort.findUnique({ where: { id: task.cohortId }, select: { id: true } });
  if (!cohort) return fail("That task belongs to a cohort that no longer exists.");

  await db.task.update({ where: { id: task.id }, data: { published } });
  await audit({ actorId: user.id, action: published ? "task.published" : "task.unpublished", target: task.code });
  revalidateConsoles();
  return ok(undefined, published ? `${task.code} is live for ambassadors.` : `${task.code} is hidden from ambassadors.`);
}
