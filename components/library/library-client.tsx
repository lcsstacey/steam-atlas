"use client";

import { ArrowDownAZ, Clock, LibraryBig, Shuffle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { EmptyPrivateProfileState } from "@/components/dashboard/empty-private-profile-state";
import { FilterSidebar, type LibraryFilter } from "@/components/dashboard/filter-sidebar";
import { GameCard } from "@/components/dashboard/game-card";
import { LoadingLibraryScan } from "@/components/dashboard/loading-library-scan";
import { SearchCommandMenu } from "@/components/dashboard/search-command-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import type { LibraryGame } from "@/lib/types";
import { daysSince } from "@/lib/utils";

type SortMode = "playtime-desc" | "playtime-asc" | "name" | "recent" | "random";

async function fetchLibrary() {
  const response = await fetch("/api/library");
  if (!response.ok) throw new Error("Could not load library.");
  return (await response.json()) as { isPrivateOrEmpty: boolean; games: LibraryGame[] };
}

export function LibraryClient() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [sort, setSort] = useState<SortMode>("playtime-desc");
  const [randomSalt, setRandomSalt] = useState(1);
  const queryClient = useQueryClient();
  const library = useQuery({ queryKey: ["library"], queryFn: fetchLibrary });

  const games = useMemo(() => library.data?.games ?? [], [library.data?.games]);
  const counts = useMemo(() => buildCounts(games), [games]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selected = games.filter((game) => {
      if (query && !game.name.toLowerCase().includes(query)) return false;
      return matchesFilter(game, filter);
    });

    return sortGames(selected, sort, randomSalt);
  }, [filter, games, randomSalt, search, sort]);

  if (library.isLoading) return <LoadingLibraryScan />;
  if (library.data?.isPrivateOrEmpty) return <EmptyPrivateProfileState />;
  if (!library.data) return <Panel className="p-5 text-sm text-[#ffd1b8]">Library failed to load.</Panel>;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <FilterSidebar active={filter} counts={counts} onChange={setFilter} />
      <section className="min-w-0 space-y-4">
        <Panel className="overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[rgba(93,184,255,0.1)] blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Badge variant="teal">
                <LibraryBig className="h-3 w-3" />
                Library
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                Every game, sorted into intent.
              </h1>
              <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--muted-strong)]">
                Search the full import, cut through stale backlog pockets, and mark games as
                installed, queued, finished, dropped, or not worth your attention.
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3 xl:min-w-[360px]">
              <MiniMetric label="Imported" value={games.length} />
              <MiniMetric label="Unopened" value={counts.never ?? 0} />
              <MiniMetric label="Shortlist" value={games.filter((game) => game.manualStatus === "PLAY_NEXT").length} />
            </div>
          </div>
        </Panel>
        <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
          <SearchCommandMenu onChange={setSearch} value={search} />
          <div className="glass-panel flex flex-wrap items-center gap-1 p-1.5">
            <Button size="sm" onClick={() => setSort("playtime-desc")} variant={sort === "playtime-desc" ? "primary" : "ghost"}>
              <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
              High playtime
            </Button>
            <Button size="sm" onClick={() => setSort("name")} variant={sort === "name" ? "primary" : "ghost"}>
              <ArrowDownAZ className="h-3.5 w-3.5" strokeWidth={2.4} />
              Name
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSort("random");
                setRandomSalt((value) => value + 1);
              }}
              variant={sort === "random" ? "primary" : "ghost"}
            >
              <Shuffle className="h-3.5 w-3.5" strokeWidth={2.4} />
              Random
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[var(--muted)]">
            Showing <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> of{" "}
            <span className="font-semibold text-[var(--foreground)]">{games.length}</span> games
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((game) => (
            <GameCard
              game={game}
              key={game.id}
              onStatusChange={() => {
                queryClient.invalidateQueries({ queryKey: ["library"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                queryClient.invalidateQueries({ queryKey: ["recommendations"] });
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] border border-[var(--line)] bg-white/[0.025] p-3.5">
      <div className="mono-label">{label}</div>
      <p className="mt-2 text-[22px] font-semibold tracking-tight tabular-nums text-[var(--foreground)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function buildCounts(games: LibraryGame[]) {
  return {
    all: games.length,
    never: games.filter((game) => game.playtimeMinutes === 0).length,
    "under-1": games.filter((game) => game.playtimeMinutes > 0 && game.playtimeMinutes < 60).length,
    "1-5": games.filter((game) => game.playtimeMinutes >= 60 && game.playtimeMinutes < 300).length,
    "5-20": games.filter((game) => game.playtimeMinutes >= 300 && game.playtimeMinutes < 1200).length,
    "20-plus": games.filter((game) => game.playtimeMinutes >= 1200).length,
    recent: games.filter((game) => game.playtimeTwoWeeksMinutes > 0 || daysSince(game.lastPlayedAt) < 14).length,
    forgotten: games.filter((game) => game.playtimeMinutes >= 600 && daysSince(game.lastPlayedAt) > 120).length,
    high: games.filter((game) => game.playtimeMinutes >= 1200).length,
    low: games.filter((game) => game.playtimeMinutes < 300).length,
    random: games.filter((game) => game.playtimeMinutes < 300 && game.manualStatus !== "NOT_INTERESTED").length,
  };
}

function matchesFilter(game: LibraryGame, filter: LibraryFilter) {
  switch (filter) {
    case "never":
      return game.playtimeMinutes === 0;
    case "under-1":
      return game.playtimeMinutes > 0 && game.playtimeMinutes < 60;
    case "1-5":
      return game.playtimeMinutes >= 60 && game.playtimeMinutes < 300;
    case "5-20":
      return game.playtimeMinutes >= 300 && game.playtimeMinutes < 1200;
    case "20-plus":
      return game.playtimeMinutes >= 1200;
    case "recent":
      return game.playtimeTwoWeeksMinutes > 0 || daysSince(game.lastPlayedAt) < 14;
    case "forgotten":
      return game.playtimeMinutes >= 600 && daysSince(game.lastPlayedAt) > 120;
    case "high":
      return game.playtimeMinutes >= 1200;
    case "low":
      return game.playtimeMinutes < 300;
    case "random":
      return game.playtimeMinutes < 300 && game.manualStatus !== "NOT_INTERESTED";
    default:
      return true;
  }
}

function sortGames(games: LibraryGame[], sort: SortMode, salt: number) {
  const copy = [...games];
  if (sort === "name") return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "playtime-asc") return copy.sort((a, b) => a.playtimeMinutes - b.playtimeMinutes);
  if (sort === "recent") {
    return copy.sort(
      (a, b) => new Date(b.lastPlayedAt ?? 0).getTime() - new Date(a.lastPlayedAt ?? 0).getTime(),
    );
  }
  if (sort === "random") {
    return copy.sort((a, b) => seededValue(a.appId, salt) - seededValue(b.appId, salt));
  }
  return copy.sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);
}

function seededValue(appId: number, salt: number) {
  const x = Math.sin(appId * 999 + salt * 17) * 10000;
  return x - Math.floor(x);
}
