import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LibraryClient } from "@/components/library/library-client";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <DashboardShell user={user}>
      <LibraryClient />
    </DashboardShell>
  );
}
