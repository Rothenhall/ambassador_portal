import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/");
  if (!user.membership) redirect(user.role === "admin" || user.role === "reviewer" ? "/admin" : "/");

  return <>{children}</>;
}
