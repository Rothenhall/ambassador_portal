import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getLetterData } from "@/lib/letter";
import { LetterDocument } from "@/components/letter/LetterDocument";

export const metadata: Metadata = { title: "Appointment letter", robots: { index: false, follow: false } };

export default async function AdminLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Same guard style as the rest of the admin surface: a page checks itself rather than
  // trusting the layout, since layouts and pages render in parallel.
  const user = await getSession();
  if (!user) redirect("/");
  if (user.role !== "admin" && user.role !== "reviewer") redirect("/home");

  const letter = await getLetterData(id);
  if (!letter) notFound();

  return <LetterDocument data={letter} />;
}
