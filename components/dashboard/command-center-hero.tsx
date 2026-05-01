"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { ArrowUpRight, Radio, Sparkles, TimerReset } from "lucide-react";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardSummary, RecommendationDto } from "@/lib/types";
import { formatMinutes } from "@/lib/utils";

export function CommandCenterHero({
  data,
  recommendation,
  onPickNext,
}: {
  data: DashboardSummary;
  recommendation?: RecommendationDto;
  onPickNext: () => void;
}) {
  const showcase = [...data.topPlayed, ...data.backlogGems].slice(0, 4);
  const backlogRatio = data.totals.gamesOwned
    ? Math.round((data.totals.neverPlayed / data.totals.gamesOwned) * 100)
    : 0;

  return (
    <section className="glass-panel premium-ring relative overflow-hidden p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-40" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[rgba(93,184,255,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[rgba(154,140,255,0.1)] blur-3xl" />

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <Badge variant="amber">
            <Radio className="h-3 w-3" />
            Live signal
          </Badge>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] lg:text-5xl">
            Your library has a signal.
            <br />
            <span className="bg-gradient-to-r from-[#b6dfff] via-[#5db8ff] to-[#ff8a5c] bg-clip-text text-transparent">
              Steam Compass found the next move.
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted-strong)]">
            This scan weighs the games you return to, the ones you forgot, and the untouched shelf
            that still matches your taste. The result is a shortlist that feels intentional — not random.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <SignalPill label="Backlog pressure" value={`${backlogRatio}%`} hint="unopened" />
            <SignalPill label="Recent motion" value={String(data.totals.playedRecently)} hint="active" />
            <SignalPill label="Time invested" value={formatMinutes(data.totals.totalPlaytimeMinutes)} hint="total" />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={onPickNext} size="lg">
              <TimerReset className="h-4 w-4" strokeWidth={2.4} />
              Pick my next game
            </Button>
            <a
              className="premium-control inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-[var(--line-strong)] bg-white/[0.04] px-5 text-[15px] font-medium text-[var(--foreground)] transition hover:bg-white/[0.07] hover:border-[rgba(93,184,255,0.32)]"
              href="/library"
            >
              Open library grid
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
            </a>
          </div>
        </div>

        <div className="relative min-h-[360px]">
          {recommendation ? (
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="mono-label">tonight&apos;s pick</span>
              </div>
              <RecommendationCard recommendation={recommendation} />
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--line-strong)] bg-white/[0.02] p-8 text-center">
              <Sparkles className="h-6 w-6 text-[var(--brand)]" />
              <p className="mt-3 text-sm text-[var(--muted-strong)]">Recommendations are warming up.</p>
            </div>
          )}

          {showcase.length > 0 ? (
            <div className="mt-5 flex gap-2 overflow-hidden">
              {showcase.map((game, index) => (
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  className="relative h-12 flex-1 overflow-hidden rounded-[10px] border border-[var(--line)] bg-[#0a1421]"
                  key={game.id}
                  transition={{ duration: 4 + index * 0.4, delay: index * 0.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {game.headerUrl ? (
                    <img
                      alt=""
                      className="h-full w-full object-cover opacity-80"
                      decoding="async"
                      loading="lazy"
                      src={game.headerUrl}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </motion.div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SignalPill({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--line)] bg-white/[0.025] p-3.5 transition-colors hover:border-[rgba(93,184,255,0.22)]">
      <div className="mono-label">{label}</div>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{value}</span>
        <span className="text-[11px] text-[var(--muted)]">{hint}</span>
      </p>
    </div>
  );
}
