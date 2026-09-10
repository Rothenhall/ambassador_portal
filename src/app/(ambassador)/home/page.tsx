import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAmbassadorDashboard } from "@/lib/dashboard";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  // Layouts and pages render in parallel, so guard here too rather than trusting the layout.
  const user = await getSession();
  if (!user) redirect("/");
  if (!user.membership) redirect(user.role === "admin" || user.role === "reviewer" ? "/admin" : "/");

  const data = await getAmbassadorDashboard(user.id);
  return <Dashboard data={data} initialTab={tab} />;
}
