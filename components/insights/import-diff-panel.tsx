"use client";

/* eslint-disable @next/next/no-img-element */
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatMinutes } from "@/lib/utils";

type Snapshot = {
  importedAt: string;
  gameCount: number;
  totalPlaytimeMinutes: number;
  newGames: Array<{ appId: number; name: string; headerUrl: string | null }>;
  playtimeDeltas: Array<{
    appId: number;
    name: string;
    deltaMinutes: number;
    totalMinutes: number;
  }>;
  previousImportedAt: string | null;
  gameCountDelta: number | null;
  totalPlaytimeDeltaMinutes: number | null;
};

async function fetchSnapshot() {
  const response = await fetch("/api/import-snapshot");
  if (!response.ok) throw new Error("Failed.");
  return (await response.json()) as { snapshot: Snapshot | null };
}

export function ImportDiffPanel() {
  const query = useQuery({ queryKey: ["import-snapshot"], queryFn: fetchSnapshot });
  const snapshot = query.data?.snapshot;

  if (!snapshot) {
    return (
      <Panel className="p-6">
        <Badge variant="amber">
          <Sparkles className="h-3 w-3" strokeWidth={2.4} />
          Import diff
        </Badge>
        <p className="mt-3 text-[14px] text-[var(--muted-strong)]">
          Refresh your library to start tracking import-to-import changes.
        </p>
      </Panel>
    );
  }

  const isFirstScan = !snapshot.previousImportedAt;
  const playtimeDelta = snapshot.totalPlaytimeDeltaMinutes ?? 0;
  const gameCountDelta = snapshot.gameCountDelta ?? 0;

  return (
    <Panel className="overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(163,230,53,0.1)] blur-3xl" />

      <Badge variant="lime">
        <TrendingUp className="h-3 w-3" strokeWidth={2.4} />
        Library diff
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {isFirstScan
          ? `First scan — ${snapshot.gameCount.toLocaleString()} games imported.`
          : `Since last scan: ${formatDelta(gameCountDelta, "game")}, ${formatDelta(playtimeDelta, "min")} of playtime.`}
      </h2>
      <p className="mt-1.5 text-[13px] text-[var(--muted)]">
        Last scan {new Date(snapshot.importedAt).toLocaleString()}
        {snapshot.previousImportedAt
          ? ` · Previous ${new Date(snapshot.previousImportedAt).toLocaleString()}`
          : ""}
      </p>

      {snapshot.newGames.length > 0 ? (
        <div className="mt-5">
          <div className="mono-label mb-2">+{snapshot.newGames.length} new in your library</div>
          <div className="flex flex-wrap gap-2">
            {snapshot.newGames.slice(0, 10).map((game) => (
              <a
                className="group flex items-center gap-2 rounded-[10px] border border-[var(--line)] bg-white/[0.02] py-1.5 pl-1.5 pr-2.5 transition hover:border-[rgba(163,230,53,0.32)]"
                href={`https://store.steampowered.com/app/${game.appId}/`}
                key={game.appId}
                rel="noreferrer"
                target="_blank"
              >
                <div className="h-6 w-12 shrink-0 overflow-hidden rounded-[6px] bg-[#0a1421]">
                  {game.headerUrl ? (
                    <img alt="" className="h-full w-full object-cover" src={game.headerUrl} />
                  ) : null}
                </div>
                <span className="max-w-[140px] truncate text-[12px] text-[var(--foreground)]">
                  {game.name}
                </span>
                <ArrowUpRight
                  className="h-3 w-3 text-[var(--muted)] transition group-hover:text-[var(--foreground)]"
                  strokeWidth={2.2}
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {snapshot.playtimeDeltas.length > 0 ? (
        <div className="mt-5">
          <div className="mono-label mb-2">Sessions since last scan</div>
          <ul className="space-y-1.5">
            {snapshot.playtimeDeltas.slice(0, 6).map((entry) => (
              <li
                className="flex items-center justify-between rounded-[10px] border border-[var(--line)] bg-white/[0.02] px-3 py-1.5"
                key={entry.appId}
              >
                <span className="truncate text-[13px] text-[var(--foreground)]">{entry.name}</span>
                <span className="shrink-0 text-[12px] tabular-nums text-[var(--brand)]">
                  +{formatMinutes(entry.deltaMinutes)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}

function formatDelta(delta: number, unit: "game" | "min") {
  if (unit === "min") {
    if (delta === 0) return "no change";
    if (delta > 0) return `+${formatMinutes(delta)}`;
    return `−${formatMinutes(Math.abs(delta))}`;
  }
  if (delta === 0) return "no new games";
  if (delta > 0) return `+${delta} game${delta === 1 ? "" : "s"}`;
  return `−${Math.abs(delta)} game${Math.abs(delta) === 1 ? "" : "s"}`;
}
