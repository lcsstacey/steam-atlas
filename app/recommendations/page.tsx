import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RecommendationsClient } from "@/components/recommendations/recommendations-client";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <DashboardShell user={user}>
      <RecommendationsClient />
    </DashboardShell>
  );
}
