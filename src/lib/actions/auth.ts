"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function signInAs(userId: string) {
  await createSession(userId);
  const user = await db.user.findUnique({ where: { id: userId } });
  redirect(user?.role === "admin" || user?.role === "reviewer" ? "/admin" : "/home");
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
