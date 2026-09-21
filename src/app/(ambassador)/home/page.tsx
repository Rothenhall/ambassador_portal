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
  if (!data) {
    // Reachable when a cohort or campus row was removed underneath an active membership.
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="font-display text-xl text-ink">Your cohort record is missing</p>
          <p className="mt-2 text-sm text-ink-60">
            Your account is valid but it no longer points at a cohort. Sign out and ask your campus lead to re-enrol you.
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard data={data} initialTab={tab} />;
}
