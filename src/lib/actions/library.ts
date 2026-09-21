"use server";

import { db } from "@/lib/db";
import { getActionUser } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { revalidateAmbassador } from "@/lib/audit";

export async function setModuleComplete(moduleId: string, completed: boolean): Promise<ActionResult> {
  const { user, error } = await getActionUser();
  if (!user) return fail(error ?? "Sign in first.");

  const mod = await db.libraryModule.findUnique({ where: { id: moduleId }, select: { id: true } });
  if (!mod) return fail("That module is no longer in the library.");

  if (!completed) {
    await db.moduleProgress.updateMany({ where: { userId: user.id, moduleId }, data: { completedAt: null } });
    revalidateAmbassador();
    return ok();
  }

  await db.moduleProgress.upsert({
    where: { userId_moduleId: { userId: user.id, moduleId } },
    update: { completedAt: new Date() },
    create: { userId: user.id, moduleId, completedAt: new Date() },
  });
  revalidateAmbassador();
  return ok(undefined, "Marked done.");
}
