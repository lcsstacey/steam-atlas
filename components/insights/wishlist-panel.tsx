"use client";

/* eslint-disable @next/next/no-img-element */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type Pick = {
  appId: number;
  name: string;
  headerUrl: string | null;
  priority: number | null;
  matchScore: number;
  reason: string;
};

type Payload = {
  totalWishlisted: number;
  unplayedOwned: number;
  topPicks: Pick[];
};

async function fetchWishlist() {
  const response = await fetch("/api/wishlist");
  if (!response.ok) throw new Error("Failed.");
  return (await response.json()) as Payload;
}

export function WishlistSanityPanel() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["wishlist"], queryFn: fetchWishlist });
  const refresh = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/wishlist", { method: "POST" });
      if (!response.ok) throw new Error("Refresh failed.");
      return response.json();
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const data = query.data;

  return (
    <Panel className="overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(255,138,92,0.1)] blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="rose">
            <Heart className="h-3 w-3" strokeWidth={2.4} />
            Wishlist sanity
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {data
              ? `You have ${data.unplayedOwned} unplayed games and ${data.totalWishlisted} more on your wishlist.`
              : "Wishlist gut-check."}
          </h2>
          <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted-strong)]">
            Maybe play one before buying another. These wishlisted games match your taste profile
            better than most things you own and haven&apos;t played.
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
          Sync wishlist
        </Button>
      </div>

      {data && data.topPicks.length > 0 ? (
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.topPicks.map((pick) => (
            <a
              className="group overflow-hidden rounded-[14px] border border-[var(--line)] bg-white/[0.02] transition hover:border-[rgba(255,138,92,0.32)]"
              href={`https://store.steampowered.com/app/${pick.appId}/`}
              key={pick.appId}
              rel="noreferrer"
              target="_blank"
            >
              <div className="relative h-24 overflow-hidden bg-[#0a1421]">
                {pick.headerUrl ? (
                  <img
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-[1.04]"
                    src={pick.headerUrl}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                {pick.priority !== null ? (
                  <span className="absolute right-2 top-2 rounded-full border border-[rgba(255,138,92,0.4)] bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-[#ffd1b8]">
                    #{pick.priority + 1}
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                  {pick.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-[var(--muted)]">{pick.reason}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="relative mt-6 rounded-[14px] border border-dashed border-[var(--line-strong)] bg-white/[0.02] p-6 text-center text-[13px] text-[var(--muted)]">
          {data
            ? "No taste-matched picks yet. The wishlist endpoint can be private or empty."
            : "Loading…"}
        </p>
      )}
    </Panel>
  );
}
