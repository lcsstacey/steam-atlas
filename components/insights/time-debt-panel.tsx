"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Hourglass, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { formatMinutes } from "@/lib/utils";

type Payload = {
  unplayedCount: number;
  knownCount: number;
  totalMainMinutes: number;
  averageMainMinutes: number;
  yearsAtFourHrsWeek: number;
  longest: Array<{ name: string; minutes: number }>;
  shortest: Array<{ name: string; minutes: number }>;
};

async function fetchTimeDebt() {
  const response = await fetch("/api/time-debt");
  if (!response.ok) throw new Error("Failed.");
  return (await response.json()) as Payload;
}

export function TimeDebtPanel() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["time-debt"], queryFn: fetchTimeDebt });
  const refresh = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/time-debt", { method: "POST" });
      if (!response.ok) throw new Error("Refresh failed.");
      return response.json();
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["time-debt"] }),
  });

  const [hoursPerWeek, setHoursPerWeek] = useState(4);
  const data = query.data;

  const yearsAtCustom =
    data && hoursPerWeek > 0
      ? Number((data.totalMainMinutes / (hoursPerWeek * 60 * 52)).toFixed(1))
      : 0;

  return (
    <Panel className="premium-ring overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(255,138,92,0.12)] blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="rose">
            <Hourglass className="h-3 w-3" strokeWidth={2.4} />
            Time debt
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Your unplayed library, in years.
          </h2>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted-strong)]">
            Pulls main-story estimates from HowLongToBeat and adds them up. The first scan is
            slow (~1 game/sec, throttled politely).
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
          {refresh.isPending ? "Looking up…" : "Pull HLTB data"}
        </Button>
      </div>

      {data ? (
        <>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Unplayed games" value={data.unplayedCount.toString()} />
            <Stat label="With HLTB data" value={`${data.knownCount}`} />
            <Stat
              label="Avg. main story"
              value={data.averageMainMinutes ? formatMinutes(data.averageMainMinutes) : "—"}
            />
            <Stat
              accent
              label="Total to clear"
              value={data.totalMainMinutes ? formatMinutes(data.totalMainMinutes) : "—"}
            />
          </div>

          <div className="relative mt-6 rounded-[14px] border border-[rgba(255,138,92,0.32)] bg-[rgba(255,138,92,0.05)] p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <p className="text-[13px] text-[var(--muted-strong)]">If you played</p>
                <div className="mt-1 inline-flex items-baseline gap-2">
                  <input
                    aria-label="Hours per week"
                    className="w-16 rounded-[10px] border border-[var(--line-strong)] bg-black/30 px-2 py-1 text-center text-[18px] font-semibold tabular-nums text-[var(--foreground)] outline-none focus:border-[rgba(255,138,92,0.5)]"
                    inputMode="numeric"
                    max={168}
                    min={1}
                    onChange={(e) => setHoursPerWeek(Number.parseInt(e.target.value, 10) || 1)}
                    type="number"
                    value={hoursPerWeek}
                  />
                  <span className="text-[13px] text-[var(--muted-strong)]">hrs / week</span>
                </div>
              </div>
              <div className="text-right">
                <p className="mono-label">years to clear backlog</p>
                <p className="mt-1 text-[36px] font-semibold leading-none tabular-nums text-[#ffd1b8]">
                  {yearsAtCustom || data.yearsAtFourHrsWeek}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">
              That&apos;s {Math.round((yearsAtCustom || data.yearsAtFourHrsWeek) * 12)} months of
              evenings, weekends, and holidays — assuming you stop buying games today.
            </p>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
            <BacklogList title="The biggest commitments" entries={data.longest} />
            <BacklogList title="One-sitting candidates" entries={data.shortest} />
          </div>
        </>
      ) : (
        <p className="relative mt-6 text-[13px] text-[var(--muted)]">Loading…</p>
      )}
    </Panel>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-[12px] border border-[rgba(255,138,92,0.32)] bg-[rgba(255,138,92,0.08)] p-3.5"
          : "rounded-[12px] border border-[var(--line)] bg-white/[0.025] p-3.5"
      }
    >
      <div className="mono-label">{label}</div>
      <p
        className={
          accent
            ? "mt-2 text-[20px] font-semibold tabular-nums tracking-tight text-[#ffd1b8]"
            : "mt-2 text-[20px] font-semibold tabular-nums tracking-tight text-[var(--foreground)]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function BacklogList({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ name: string; minutes: number }>;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-white/[0.02] p-4">
      <div className="mono-label flex items-center gap-1.5">
        <Clock3 className="h-3 w-3" strokeWidth={2.4} />
        {title}
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-[12px] text-[var(--muted)]">
          No HLTB matches yet — try the scan.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li className="flex items-center justify-between gap-2" key={entry.name}>
              <span className="truncate text-[13px] text-[var(--foreground)]">{entry.name}</span>
              <span className="shrink-0 text-[12px] tabular-nums text-[var(--muted-strong)]">
                {formatMinutes(entry.minutes)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
