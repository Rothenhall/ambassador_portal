"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function decideApplication(applicationId: string, decision: "accepted" | "rejected") {
  await requireAdmin();
  await db.application.update({ where: { id: applicationId }, data: { status: decision } });
  revalidatePath("/admin/applications");
}

export async function postAnnouncement(cohortId: string, bodyMd: string) {
  await requireAdmin();
  if (!bodyMd.trim()) return;
  await db.announcement.create({ data: { cohortId, bodyMd: bodyMd.trim() } });
  revalidatePath("/admin/content");
  revalidatePath("/home");
}

export async function setTaskPublished(taskId: string, published: boolean) {
  await requireAdmin();
  await db.task.update({ where: { id: taskId }, data: { published } });
  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
}
