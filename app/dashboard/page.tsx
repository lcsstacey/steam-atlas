import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <DashboardShell user={user}>
      <DashboardClient />
    </DashboardShell>
  );
}
