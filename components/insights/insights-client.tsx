"use client";

import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { useState } from "react";
import { AchievementsPanel } from "@/components/insights/achievements-panel";
import { CustomTagsPanel } from "@/components/insights/custom-tags-panel";
import { FriendsOverlapPanel } from "@/components/insights/friends-overlap-panel";
import { ImportDiffPanel } from "@/components/insights/import-diff-panel";
import { PhaseTimelinePanel } from "@/components/insights/phase-timeline-panel";
import { TimeDebtPanel } from "@/components/insights/time-debt-panel";
import { WishlistSanityPanel } from "@/components/insights/wishlist-panel";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { LoadingLibraryScan } from "@/components/dashboard/loading-library-scan";
import type { DashboardSummary } from "@/lib/types";

const TABS = [
  "Achievements",
  "Time debt",
  "Co-op picker",
  "Wishlist",
  "Phase timeline",
  "Tags",
  "Import diff",
] as const;

async function fetchDashboard() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) throw new Error("Could not load dashboard.");
  return (await response.json()) as DashboardSummary;
}

export function InsightsClient() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Achievements");
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  if (dashboard.isLoading) return <LoadingLibraryScan />;

  return (
    <div className="space-y-5">
      <Panel className="overflow-hidden p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[rgba(93,184,255,0.12)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 ambient-grid opacity-30" />
        <div className="relative">
          <Badge variant="teal">
            <Compass className="h-3 w-3" strokeWidth={2.4} />
            Library insights
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)] lg:text-[44px]">
            The numbers behind the shelf.
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-[var(--muted-strong)]">
            Achievements, friends overlap, wishlist sanity, time debt, phases, custom tags, and
            scan-to-scan diffs. Some panels lazy-load from Steam — first scan is the slow one.
          </p>
        </div>
      </Panel>

      <section className="glass-panel hide-scrollbar flex gap-1 overflow-x-auto p-1.5">
        {TABS.map((t) => (
          <button
            className={
              tab === t
                ? "min-w-max rounded-[10px] bg-[rgba(93,184,255,0.12)] px-3 py-2 text-[13px] font-semibold text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(93,184,255,0.28)]"
                : "min-w-max rounded-[10px] px-3 py-2 text-[13px] font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--foreground)]"
            }
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </section>

      {tab === "Achievements" ? <AchievementsPanel /> : null}
      {tab === "Time debt" ? <TimeDebtPanel /> : null}
      {tab === "Co-op picker" ? <FriendsOverlapPanel /> : null}
      {tab === "Wishlist" ? <WishlistSanityPanel /> : null}
      {tab === "Phase timeline" ? (
        dashboard.data?.phaseTimeline ? (
          <PhaseTimelinePanel data={dashboard.data.phaseTimeline} />
        ) : null
      ) : null}
      {tab === "Tags" ? <CustomTagsPanel /> : null}
      {tab === "Import diff" ? <ImportDiffPanel /> : null}
    </div>
  );
}
