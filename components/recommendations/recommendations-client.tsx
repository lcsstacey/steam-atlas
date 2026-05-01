"use client";

import { Compass, Dices, Loader2, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyPrivateProfileState } from "@/components/dashboard/empty-private-profile-state";
import { LoadingLibraryScan } from "@/components/dashboard/loading-library-scan";
import { RandomGamePicker } from "@/components/dashboard/random-game-picker";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { RecommendationDto, RecommendationModeGroup } from "@/lib/types";

type Mode =
  | "PLAY_SOMETHING_SIMILAR"
  | "BACKLOG_GEM"
  | "COMFORT_PICK"
  | "WILDCARD"
  | "SHORT_SESSION"
  | "DEEP_DIVE"
  | "RETRY_THIS";

async function fetchRecommendations() {
  const response = await fetch("/api/recommendations");
  if (!response.ok) throw new Error("Could not load recommendations.");
  return (await response.json()) as { groups: RecommendationModeGroup[] };
}

export function RecommendationsClient() {
  const [activeMode, setActiveMode] = useState<Mode>("BACKLOG_GEM");
  const recommendations = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });
  const regenerate = useMutation({
    mutationFn: async (mode: Mode) => {
      const response = await fetch(`/api/recommendations?mode=${mode}&ts=${Date.now()}`);
      if (!response.ok) throw new Error("Could not regenerate mode.");
      return (await response.json()) as { recommendations: RecommendationDto[] };
    },
  });

  if (recommendations.isLoading) return <LoadingLibraryScan />;
  if (!recommendations.data?.groups.length) return <EmptyPrivateProfileState />;

  const group = recommendations.data.groups.find((entry) => entry.mode === activeMode) ?? recommendations.data.groups[0];
  const activeRecommendations =
    regenerate.data && activeMode === group.mode ? regenerate.data.recommendations : group.recommendations;

  return (
    <div className="space-y-5">
      <Panel className="premium-ring overflow-hidden p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 ambient-grid opacity-30" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[rgba(93,184,255,0.12)] blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="teal">
              <Compass className="h-3 w-3" />
              Owned-library recommender
            </Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--foreground)] lg:text-[44px]">
              Let the library make the case.
            </h1>
            <p className="mt-3 max-w-3xl text-[14px] leading-6 text-[var(--muted-strong)]">
              These picks come only from games you already own. Steam can&apos;t tell us what is
              installed locally — so your manual statuses become the correction layer: ready,
              parked, finished, dropped, or not for tonight.
            </p>
          </div>
          <Button disabled={regenerate.isPending} onClick={() => regenerate.mutate(activeMode)} size="lg">
            {regenerate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <Dices className="h-4 w-4" strokeWidth={2.4} />
            )}
            Reroll mode
          </Button>
        </div>
      </Panel>

      <div className="glass-panel hide-scrollbar flex gap-1 overflow-x-auto p-1.5">
        {recommendations.data.groups.map((entry) => (
          <button
            className={
              activeMode === entry.mode
                ? "min-w-max rounded-[10px] bg-[rgba(93,184,255,0.12)] px-3 py-2 text-[13px] font-semibold text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(93,184,255,0.28)]"
                : "min-w-max rounded-[10px] px-3 py-2 text-[13px] font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--foreground)]"
            }
            key={entry.mode}
            onClick={() => setActiveMode(entry.mode as Mode)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <Panel className="overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[rgba(93,184,255,0.1)] blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="icon-crystal">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{group.label}</h2>
            <p className="mt-0.5 text-[13px] text-[var(--muted-strong)]">{group.description}</p>
          </div>
        </div>
        <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeRecommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      </Panel>

      <RandomGamePicker />
    </div>
  );
}
