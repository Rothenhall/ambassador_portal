import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/admin-dashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  // Layouts and pages render in parallel, so the layout's guard cannot be relied on here:
  // a stale cookie (a re-seeded database, a deleted account) must fail to sign-in, not crash.
  const user = await getSession();
  if (!user) redirect("/");
  if (user.role !== "admin" && user.role !== "reviewer") redirect("/home");

  const data = await getAdminDashboard();
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="font-display text-xl text-ink">No cohort yet</p>
          <p className="mt-2 text-sm text-ink-60">
            Nothing to operate on until a cohort exists. Locally: <span className="font-mono text-xs">npm run db:seed</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      data={data}
      admin={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarColor: user.avatarColor,
        hasPassword: Boolean(user.passwordHash),
      }}
    />
  );
}
