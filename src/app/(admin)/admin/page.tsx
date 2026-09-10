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
  return <AdminDashboard data={data} admin={{ name: user.name, role: user.role, avatarColor: user.avatarColor }} />;
}
