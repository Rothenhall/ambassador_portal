import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getLetterData } from "@/lib/letter";
import { LetterDocument } from "@/components/letter/LetterDocument";

export const metadata: Metadata = { title: "Your appointment letter", robots: { index: false, follow: false } };

export default async function MyLetterPage() {
  const user = await getSession();
  if (!user) redirect("/");
  if (!user.membership) redirect(user.role === "admin" || user.role === "reviewer" ? "/admin" : "/");

  // Always the signed-in ambassador's own letter — there is no id in this route, on purpose,
  // so there is no authorization check to get wrong.
  const letter = await getLetterData(user.id);
  if (!letter) redirect("/home");

  return <LetterDocument data={letter} />;
}
