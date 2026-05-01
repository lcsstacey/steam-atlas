"use client";

import { Clock3, Gamepad2, LibraryBig, ListChecks, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BacklogBreakdownChart, GenreRadarChart, PlaytimeBarChart } from "@/components/dashboard/charts";
import { CommandCenterHero } from "@/components/dashboard/command-center-hero";
import { EmptyPrivateProfileState } from "@/components/dashboard/empty-private-profile-state";
import { GameCarousel } from "@/components/dashboard/game-carousel";
import { LoadingLibraryScan } from "@/components/dashboard/loading-library-scan";
import { RandomGamePicker } from "@/components/dashboard/random-game-picker";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TasteProfileCard } from "@/components/dashboard/taste-profile-card";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { SignalMeter } from "@/components/ui/signal-meter";
import type { DashboardSummary, RecommendationModeGroup } from "@/lib/types";
import { compactNumber, formatMinutes } from "@/lib/utils";

const tabs = ["Overview", "Backlog", "Recommendations", "Genres", "Timeline"] as const;

async function fetchDashboard() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) throw new Error("Could not load dashboard.");
  return (await response.json()) as DashboardSummary;
}

async function fetchRecommendations() {
  const response = await fetch("/api/recommendations");
  if (!response.ok) throw new Error("Could not load recommendations.");
  return (await response.json()) as { groups: RecommendationModeGroup[] };
}

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const queryClient = useQueryClient();
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const recommendations = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
    enabled: Boolean(dashboard.data && !dashboard.data.isPrivateOrEmpty),
  });

  // Refresh "currently alive" counts for visible games once per dashboard load.
  // The endpoint caches its own results, so it's cheap to call.
  useEffect(() => {
    const data = dashboard.data;
    if (!data) return;
    const candidateAppIds = [
      ...data.topPlayed,
      ...data.backlogGems,
      ...data.recentlyDropped.map((entry) => entry.game),
    ]
      .map((game) => game.appId)
      .slice(0, 24);
    if (candidateAppIds.length === 0) return;

    let cancelled = false;
    fetch("/api/live-players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appIds: candidateAppIds }),
    })
      .then(() => {
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Run once per dashboard load — re-pinging is unnecessary because the API
    // service caches counts for 30 minutes anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(dashboard.data)]);

  if (dashboard.isLoading) return <LoadingLibraryScan />;
  if (dashboard.data?.isPrivateOrEmpty) return <EmptyPrivateProfileState />;
  if (!dashboard.data) {
    return (
      <Panel className="p-6 text-sm text-[#ffd1b8]">
        {dashboard.error instanceof Error ? dashboard.error.message : "Dashboard failed to load."}
      </Panel>
    );
  }

  const data = dashboard.data;
  const firstGroup = recommendations.data?.groups[0];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="teal"
          detail="Synced from Steam Web API"
          icon={LibraryBig}
          index={0}
          label="Games owned"
          value={compactNumber(data.totals.gamesOwned)}
        />
        <StatCard
          accent="amber"
          detail="Across every imported game"
          icon={Clock3}
          index={1}
          label="Total playtime"
          value={formatMinutes(data.totals.totalPlaytimeMinutes)}
        />
        <StatCard
          accent="rose"
          detail="Untouched backlog"
          icon={Gamepad2}
          index={2}
          label="Never played"
          value={compactNumber(data.totals.neverPlayed)}
        />
        <StatCard
          accent="lime"
          detail="Your manual short list"
          icon={ListChecks}
          index={3}
          label="Play next"
          value={compactNumber(data.totals.manualPlayNext)}
        />
      </section>

      <section aria-label="Dashboard sections" className="glass-panel p-1.5" role="tablist">
        <div className="grid gap-1 sm:grid-cols-5">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab}
              className={
                activeTab === tab
                  ? "rounded-[10px] bg-[rgba(93,184,255,0.12)] px-3 py-2 text-[13px] font-semibold text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(93,184,255,0.28)]"
                  : "rounded-[10px] px-3 py-2 text-[13px] font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--foreground)]"
              }
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "Overview" ? (
        <div className="space-y-5">
          <CommandCenterHero
            data={data}
            onPickNext={() => setActiveTab("Recommendations")}
            recommendation={firstGroup?.recommendations[0]}
          />
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <TasteProfileCard signals={data.tasteSignals} />
            <Panel className="p-6">
              <Badge variant="amber">
                <Sparkles className="h-3 w-3" />
                Read on the room
              </Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                The backlog isn&apos;t the enemy. It&apos;s inventory.
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-[var(--muted-strong)]">
                Your scan separates comfort games from games that only need one honest session.
                Mark anything as <em className="not-italic font-medium text-[var(--foreground)]">Play Next</em> or{" "}
                <em className="not-italic font-medium text-[var(--foreground)]">Not Interested</em> and the
                recommendation layer adapts around your preference.
              </p>
            </Panel>
          </div>
          {data.recentlyDropped.length > 0 ? (
            <GameCarousel
              description="Started recently, played for a chunk, then quietly stopped. Resume?"
              games={data.recentlyDropped.map((entry) => entry.game)}
              title="Recently dropped"
            />
          ) : null}
          <GameCarousel
            description="Low-playtime games that still resemble your taste profile."
            games={data.backlogGems}
            title="Backlog gems"
          />
          <GameCarousel
            description="Your highest-confidence favorites by playtime."
            games={data.topPlayed}
            title="Top played games"
          />
        </div>
      ) : null}

      {activeTab === "Backlog" ? (
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1fr]">
          <BacklogBreakdownChart data={data.backlogBreakdown} />
          <GameCarousel
            description="Never launched or barely tried, sorted by taste overlap."
            games={data.backlogGems}
            title="Backlog candidates"
          />
        </div>
      ) : null}

      {activeTab === "Recommendations" ? (
        <div className="space-y-5">
          <RandomGamePicker />
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendations.data?.groups.slice(0, 4).map((group) => (
              <Panel className="p-5" key={group.mode}>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">{group.label}</h2>
                <p className="mt-1 text-[13px] text-[var(--muted-strong)]">{group.description}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {group.recommendations.slice(0, 2).map((recommendation) => (
                    <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "Genres" ? (
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1fr]">
          <GenreRadarChart signals={data.tasteSignals} />
          <TasteProfileCard signals={data.tasteSignals} />
        </div>
      ) : null}

      {activeTab === "Timeline" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <PlaytimeBarChart data={data.playtimeChart} />
          <Panel className="p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Recent activity cadence</h2>
            <div className="mt-5 space-y-3">
              {data.timeline.length > 0 ? (
                data.timeline.map((item) => (
                  <div className="flex items-center gap-3" key={item.label}>
                    <div className="w-16 text-[11px] text-[var(--muted)]">{item.label}</div>
                    <SignalMeter className="flex-1" tone="citrine" value={Math.min(100, item.value * 12)} />
                    <div className="w-8 text-right text-[12px] tabular-nums text-[var(--muted-strong)]">{item.value}</div>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-[var(--muted)]">Steam did not return last-played timestamps.</p>
              )}
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
