"use client";

/* eslint-disable @next/next/no-img-element */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type Friend = {
  steamId: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type OverlapEntry = {
  appId: number;
  name: string;
  headerUrl: string | null;
  isMultiplayer: boolean;
  isCoop: boolean;
  ownerCount: number;
  friends: Friend[];
};

async function fetchOverlap() {
  const response = await fetch("/api/friends");
  if (!response.ok) throw new Error("Failed.");
  return (await response.json()) as { overlap: OverlapEntry[] };
}

export function FriendsOverlapPanel() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["friends-overlap"], queryFn: fetchOverlap });
  const refresh = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/friends", { method: "POST" });
      if (!response.ok) throw new Error("Refresh failed.");
      return response.json();
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["friends-overlap"] }),
  });

  const overlap = query.data?.overlap ?? [];
  const coopFirst = [...overlap].filter((entry) => entry.isCoop || entry.isMultiplayer);
  const others = [...overlap].filter((entry) => !entry.isCoop && !entry.isMultiplayer);

  return (
    <Panel className="overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(154,140,255,0.12)] blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="teal">
            <Users2 className="h-3 w-3" strokeWidth={2.4} />
            Co-op picker
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            What you and friends both own.
          </h2>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted-strong)]">
            Caches your friend list and each friend&apos;s public library. Multiplayer + co-op
            games float to the top.
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
          {refresh.isPending ? "Scanning friends…" : "Sync friends"}
        </Button>
      </div>

      {overlap.length === 0 ? (
        <p className="relative mt-6 rounded-[14px] border border-dashed border-[var(--line-strong)] bg-white/[0.02] p-6 text-center text-[13px] text-[var(--muted)]">
          No overlap yet. Tap <em className="not-italic font-medium text-[var(--foreground)]">Sync friends</em> —
          friends with private libraries are silently skipped.
        </p>
      ) : (
        <div className="relative mt-6 space-y-5">
          {coopFirst.length > 0 ? (
            <Section title="Co-op & multiplayer" entries={coopFirst.slice(0, 8)} />
          ) : null}
          {others.length > 0 ? (
            <Section title="Other shared games" entries={others.slice(0, 8)} />
          ) : null}
        </div>
      )}
    </Panel>
  );
}

function Section({ title, entries }: { title: string; entries: OverlapEntry[] }) {
  return (
    <div>
      <div className="mono-label mb-2">{title}</div>
      <div className="grid gap-2">
        {entries.map((entry) => (
          <div
            className="flex items-center gap-3 rounded-[12px] border border-[var(--line)] bg-white/[0.02] p-2.5 transition hover:border-[rgba(154,140,255,0.32)]"
            key={entry.appId}
          >
            <div className="h-12 w-24 shrink-0 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[#0a1421]">
              {entry.headerUrl ? (
                <img alt="" className="h-full w-full object-cover" src={entry.headerUrl} />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                  {entry.name}
                </p>
                {entry.isCoop ? (
                  <Badge variant="lime">co-op</Badge>
                ) : entry.isMultiplayer ? (
                  <Badge variant="teal">multi</Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {entry.ownerCount} owners — you and {entry.friends.length}{" "}
                {entry.friends.length === 1 ? "friend" : "friends"}
              </p>
            </div>
            <div className="flex -space-x-2">
              {entry.friends.slice(0, 4).map((friend) => (
                <div
                  className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[var(--line-strong)] bg-[#0a1421]"
                  key={friend.steamId}
                  title={friend.displayName ?? friend.steamId}
                >
                  {friend.avatarUrl ? (
                    <img alt="" className="h-full w-full object-cover" src={friend.avatarUrl} />
                  ) : null}
                </div>
              ))}
              {entry.friends.length > 4 ? (
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] bg-black/30 text-[10px] font-semibold text-[var(--muted-strong)]">
                  +{entry.friends.length - 4}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
