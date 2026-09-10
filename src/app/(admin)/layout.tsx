import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/");
  if (user.role !== "admin" && user.role !== "reviewer") redirect("/home");

  return <>{children}</>;
}
