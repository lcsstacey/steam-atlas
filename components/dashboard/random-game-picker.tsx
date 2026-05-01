"use client";

import { Dices, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/dashboard/game-card";
import type { RecommendationDto } from "@/lib/types";

export function RandomGamePicker() {
  const picker = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/recommendations?mode=WILDCARD&ts=${Date.now()}`);
      if (!response.ok) throw new Error("Could not pick a game.");
      const data = (await response.json()) as { recommendations: RecommendationDto[] };
      return data.recommendations[0] ?? null;
    },
  });

  return (
    <section className="glass-panel premium-ring relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(93,184,255,0.12)] blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Surprise me, but intelligently.
          </h2>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted-strong)]">
            Weighted toward your taste profile, with just enough chaos to break the
            stare-at-library loop.
          </p>
        </div>
        <Button onClick={() => picker.mutate()} disabled={picker.isPending}>
          {picker.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <Dices className="h-4 w-4" strokeWidth={2.4} />
          )}
          Surprise me
        </Button>
      </div>
      {picker.data ? (
        <div className="relative mt-5 max-w-sm">
          <GameCard game={picker.data.game} reason={picker.data.reason} />
        </div>
      ) : null}
    </section>
  );
}
