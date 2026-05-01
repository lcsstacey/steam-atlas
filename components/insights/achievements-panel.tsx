"use client";

/* eslint-disable @next/next/no-img-element */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { SignalMeter } from "@/components/ui/signal-meter";

type AchievementsPayload = {
  highlights: {
    gamesTracked: number;
    totalUnlocked: number;
    totalAvailable: number;
    completionRate: number;
    perfectGames: number;
    inProgress: number;
  };
  closeToCompletion: Array<{
    userGameId: string;
    appId: number;
    name: string;
    headerUrl: string | null;
    unlocked: number;
    total: number;
    progress: number;
  }>;
};

async function fetchAchievements() {
  const response = await fetch("/api/achievements");
  if (!response.ok) throw new Error("Failed to load achievements.");
  return (await response.json()) as AchievementsPayload;
}

export function AchievementsPanel() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["achievements"], queryFn: fetchAchievements });
  const refresh = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/achievements", { method: "POST" });
      if (!response.ok) throw new Error("Refresh failed.");
      return response.json();
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["achievements"] }),
  });

  const data = query.data;
  const completionPct = data ? Math.round(data.highlights.completionRate * 100) : 0;

  return (
    <Panel className="overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(245,189,99,0.1)] blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="amber">
            <Trophy className="h-3 w-3" strokeWidth={2.4} />
            Achievement hunter
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Your closest 100% wins.
          </h2>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted-strong)]">
            Refresh pulls per-game achievement progress from the Steam API for your top games.
          </p>
        </div>
        <Button
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
          variant="secondary"
        >
          {refresh.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <RefreshCw className="h-4 w-4" strokeWidth={2.4} />
          )}
          {refresh.isPending ? "Scanning…" : "Scan achievements"}
        </Button>
      </div>

      {data ? (
        <>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Games tracked" value={data.highlights.gamesTracked.toString()} />
            <Stat
              label="Total unlocked"
              value={`${data.highlights.totalUnlocked.toLocaleString()} / ${data.highlights.totalAvailable.toLocaleString()}`}
            />
            <Stat label="Completion" value={`${completionPct}%`} />
            <Stat
              label="Perfect games"
              value={data.highlights.perfectGames.toString()}
              hint={`${data.highlights.inProgress} in progress`}
            />
          </div>

          {data.closeToCompletion.length > 0 ? (
            <div className="relative mt-6">
              <div className="mono-label mb-3">Closest to 100%</div>
              <div className="grid gap-2">
                {data.closeToCompletion.map((entry) => (
                  <CloseRow entry={entry} key={entry.userGameId} />
                ))}
              </div>
            </div>
          ) : (
            <p className="relative mt-6 rounded-[14px] border border-dashed border-[var(--line-strong)] bg-white/[0.02] p-6 text-center text-[13px] text-[var(--muted)]">
              Hit <em className="not-italic font-medium text-[var(--foreground)]">Scan achievements</em> to load
              progress data. The first scan fetches per-game schemas + your unlock state.
            </p>
          )}
        </>
      ) : (
        <p className="relative mt-6 text-[13px] text-[var(--muted)]">Loading…</p>
      )}
    </Panel>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--line)] bg-white/[0.025] p-3.5">
      <div className="mono-label">{label}</div>
      <p className="mt-2 text-[20px] font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function CloseRow({ entry }: { entry: AchievementsPayload["closeToCompletion"][number] }) {
  const remaining = entry.total - entry.unlocked;
  const pct = Math.round(entry.progress * 100);
  return (
    <a
      className="group flex items-center gap-3 rounded-[12px] border border-[var(--line)] bg-white/[0.02] p-2.5 transition hover:border-[rgba(245,189,99,0.32)] hover:bg-white/[0.04]"
      href={`https://store.steampowered.com/app/${entry.appId}/`}
      rel="noreferrer"
      target="_blank"
    >
      <div className="h-12 w-24 shrink-0 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[#0a1421]">
        {entry.headerUrl ? (
          <img alt="" className="h-full w-full object-cover" src={entry.headerUrl} />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">{entry.name}</p>
        <p className="text-[11px] text-[var(--muted)]">
          {entry.unlocked} / {entry.total}{" "}
          <span className="text-[var(--brand)]">· {remaining} to go</span>
        </p>
      </div>
      <div className="w-32 shrink-0">
        <SignalMeter tone={pct >= 80 ? "citrine" : "amber"} value={pct} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums text-[var(--foreground)] w-10 text-right">
        {pct}%
      </span>
    </a>
  );
}
