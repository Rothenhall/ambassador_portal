"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function claimReward(rewardId: string, detail?: string) {
  const user = await requireUser();
  const existing = await db.rewardGrant.findUnique({ where: { userId_rewardId: { userId: user.id, rewardId } } });
  if (existing) {
    await db.rewardGrant.update({ where: { id: existing.id }, data: { status: "claimed", detail: detail ?? existing.detail } });
  } else {
    await db.rewardGrant.create({ data: { userId: user.id, rewardId, status: "claimed", detail } });
  }
  revalidatePath("/rewards");
  revalidatePath("/admin/rewards");
}

export async function fulfillGrant(grantId: string) {
  await requireAdmin();
  await db.rewardGrant.update({ where: { id: grantId }, data: { status: "fulfilled", fulfilledAt: new Date() } });
  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
}
