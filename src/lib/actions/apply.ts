"use server";

import { db } from "@/lib/db";

export type ApplyState = { ok: boolean; error?: string };

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const campus = String(formData.get("campus") ?? "").trim();
  const field = String(formData.get("field") ?? "").trim();
  const answerText = String(formData.get("answerText") ?? "").trim();

  if (!name || !email || !campus || !field) {
    return { ok: false, error: "Every field above the question is required." };
  }
  if (answerText.split(/\s+/).filter(Boolean).length < 40) {
    return { ok: false, error: "That answer reads short. Give us the real 150 words, specifics beat length." };
  }

  await db.application.create({
    data: { name, email, campus, city: "", field, answerText, status: "pending" },
  });

  return { ok: true };
}
