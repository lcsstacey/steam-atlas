import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InsightsClient } from "@/components/insights/insights-client";
import { getCurrentUser } from "@/lib/auth/session";

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <DashboardShell user={user}>
      <InsightsClient />
    </DashboardShell>
  );
}
