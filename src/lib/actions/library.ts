"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function markModuleComplete(moduleId: string) {
  const user = await requireUser();
  await db.moduleProgress.upsert({
    where: { userId_moduleId: { userId: user.id, moduleId } },
    update: { completedAt: new Date() },
    create: { userId: user.id, moduleId, completedAt: new Date() },
  });
  revalidatePath("/library");
}
