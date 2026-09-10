"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const pageUrl = String(formData.get("pageUrl") ?? "").trim();
  const lane = String(formData.get("lane") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  await db.user.update({ where: { id: user.id }, data: { pageUrl, lane, bio } });
  revalidatePath("/me");
  revalidatePath("/circle");
}

export async function setVisibility(field: "showInDirectory" | "showOnLeaderboard", value: boolean) {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { [field]: value } });
  revalidatePath("/me");
  revalidatePath("/circle");
}
