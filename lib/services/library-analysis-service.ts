import { prisma } from "@/lib/prisma";
import { getTagsForUserGames } from "@/lib/services/custom-tags-service";
import type { DeckCompat } from "@/app/generated/prisma/enums";
import type {
  DashboardSummary,
  LibraryCategory,
  LibraryGame,
  SessionUser,
  TasteSignal,
} from "@/lib/types";
import { daysSince } from "@/lib/utils";

type UserGameWithRelations = {
  id: string;
  playtimeForeverMinutes: number;
  playtimeTwoWeeksMinutes: number;
  lastPlayedAt: Date | null;
  achievementsUnlocked: number | null;
  achievementsTotal: number | null;
  game: {
    appId: number;
    name: string;
    iconUrl: string | null;
    headerUrl: string | null;
    deckCompat: DeckCompat;
    currentPlayers: number | null;
    hltbMainMinutes: number | null;
    metadata: {
      genres: unknown;
      categories: unknown;
      tags: unknown;
    } | null;
  };
  status: {
    status: LibraryGame["manualStatus"];
  } | null;
};

type CustomTagMap = Map<string, Array<{ id: string; label: string; color: string | null }>>;

export class LibraryAnalysisService {
  async getLibrary(userId: string) {
    const [userGames, tagsByUserGameId] = await Promise.all([
      prisma.userGame.findMany({
        where: { userId },
        include: {
          game: { include: { metadata: true } },
          status: true,
        },
        orderBy: [{ playtimeForeverMinutes: "desc" }, { updatedAt: "desc" }],
      }),
      getTagsForUserGames(userId),
    ]);

    return userGames.map((row) => toLibraryGame(row, tagsByUserGameId));
  }

  async getDashboard(user: SessionUser): Promise<DashboardSummary> {
    const games = await this.getLibrary(user.id);
    const totalPlaytimeMinutes = games.reduce((sum, game) => sum + game.playtimeMinutes, 0);
    const neverPlayed = games.filter((game) => game.playtimeMinutes === 0).length;
    const underOneHour = games.filter(
      (game) => game.playtimeMinutes > 0 && game.playtimeMinutes < 60,
    ).length;
    const playedRecently = games.filter((game) => game.playtimeTwoWeeksMinutes > 0).length;
    const topPlayed = [...games]
      .filter((game) => game.playtimeMinutes > 0)
      .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
      .slice(0, 10);
    const recentlyPlayed = [...games]
      .filter((game) => game.lastPlayedAt)
      .sort(
        (a, b) =>
          new Date(b.lastPlayedAt ?? 0).getTime() - new Date(a.lastPlayedAt ?? 0).getTime(),
      )
      .slice(0, 10);
    const backlogGems = getBacklogGems(games);
    const tasteSignals = getTasteSignals(games);
    const categories = buildCategories(games);
    const recentlyDropped = getRecentlyDropped(games);
    const phaseTimeline = buildPhaseTimeline(games);

    return {
      user,
      isPrivateOrEmpty: games.length === 0,
      totals: {
        gamesOwned: games.length,
        totalPlaytimeMinutes,
        neverPlayed,
        underOneHour,
        playedRecently,
        manualPlayNext: games.filter((game) => game.manualStatus === "PLAY_NEXT").length,
      },
      topPlayed,
      recentlyPlayed,
      backlogGems,
      recentlyDropped,
      categories,
      tasteSignals,
      playtimeChart: topPlayed.slice(0, 8).map((game) => ({
        name: game.name,
        minutes: game.playtimeMinutes,
        hours: Number((game.playtimeMinutes / 60).toFixed(1)),
      })),
      backlogBreakdown: [
        { name: "Never launched", value: neverPlayed },
        { name: "Under 1 hour", value: underOneHour },
        { name: "1-5 hours", value: games.filter((game) => game.playtimeMinutes >= 60 && game.playtimeMinutes < 300).length },
        { name: "5-20 hours", value: games.filter((game) => game.playtimeMinutes >= 300 && game.playtimeMinutes < 1200).length },
        { name: "20+ hours", value: games.filter((game) => game.playtimeMinutes >= 1200).length },
      ].filter((bucket) => bucket.value > 0),
      timeline: buildTimeline(games),
      phaseTimeline,
    };
  }
}

function toLibraryGame(
  userGame: UserGameWithRelations,
  tagsByUserGameId: CustomTagMap,
): LibraryGame {
  const metadata = userGame.game.metadata;

  return {
    id: userGame.id,
    appId: userGame.game.appId,
    name: userGame.game.name,
    iconUrl: userGame.game.iconUrl,
    headerUrl: userGame.game.headerUrl,
    playtimeMinutes: userGame.playtimeForeverMinutes,
    playtimeTwoWeeksMinutes: userGame.playtimeTwoWeeksMinutes,
    lastPlayedAt: userGame.lastPlayedAt?.toISOString() ?? null,
    manualStatus: userGame.status?.status ?? null,
    genres: labelsFromJson(metadata?.genres),
    categories: labelsFromJson(metadata?.categories),
    tags: labelsFromJson(metadata?.tags),
    deckCompat: userGame.game.deckCompat,
    currentPlayers: userGame.game.currentPlayers,
    achievementsUnlocked: userGame.achievementsUnlocked,
    achievementsTotal: userGame.achievementsTotal,
    hltbMainMinutes: userGame.game.hltbMainMinutes,
    customTags: tagsByUserGameId.get(userGame.id) ?? [],
  };
}

function labelsFromJson(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function getBacklogGems(games: LibraryGame[]) {
  const taste = getTasteSignals(games).map((signal) => signal.label.toLowerCase());

  return games
    .filter((game) => game.playtimeMinutes < 120)
    .map((game) => ({
      game,
      score:
        signalLabels(game).filter((signal) => taste.includes(signal.toLowerCase())).length * 10 +
        (game.playtimeMinutes === 0 ? 8 : 4) +
        Math.min(5, game.name.length / 8),
    }))
    .filter((entry) => entry.score > 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((entry) => entry.game);
}

export function getTasteSignals(games: LibraryGame[]): TasteSignal[] {
  const scores = new Map<string, { score: number; type: TasteSignal["type"] }>();
  const topPlayed = [...games]
    .filter((game) => game.playtimeMinutes > 0)
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
    .slice(0, 20);

  for (const game of topPlayed) {
    const weight = Math.max(1, Math.log1p(game.playtimeMinutes / 60));
    const signals = structuredSignals(game);

    for (const signal of signals) {
      const current = scores.get(signal.label) ?? { score: 0, type: signal.type };
      current.score += weight;
      scores.set(signal.label, current);
    }
  }

  if (scores.size === 0 && games.length > 0) {
    scores.set("Backlog explorer", { score: 1, type: "pattern" });
  }

  return [...scores.entries()]
    .map(([label, value]) => ({
      label,
      score: Number(value.score.toFixed(2)),
      type: value.type,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function structuredSignals(game: LibraryGame): TasteSignal[] {
  const signals: TasteSignal[] = [
    ...game.genres.map((label) => ({ label, score: 0, type: "genre" as const })),
    ...game.categories.map((label) => ({ label, score: 0, type: "category" as const })),
    ...game.tags.map((label) => ({ label, score: 0, type: "tag" as const })),
  ];

  if (signals.length > 0) return signals;

  return inferPatternSignals(game).map((label) => ({
    label,
    score: 0,
    type: "pattern",
  }));
}

export function inferPatternSignals(game: Pick<LibraryGame, "name" | "playtimeMinutes">) {
  const name = game.name.toLowerCase();
  const signals = new Set<string>();

  if (/\b(rpg|elder scrolls|fallout|witcher|baldur|dragon age|pathfinder)\b/.test(name)) {
    signals.add("RPG leaning");
  }
  if (/\b(total war|civilization|xcom|stellaris|crusader|europa|strategy)\b/.test(name)) {
    signals.add("Strategy leaning");
  }
  if (/\b(simulator|cities|manager|tycoon|farming|stardew)\b/.test(name)) {
    signals.add("Simulation leaning");
  }
  if (/\b(racing|forza|dirt|f1|motogp|need for speed)\b/.test(name)) {
    signals.add("Racing leaning");
  }
  if (/\b(horror|resident evil|outlast|amnesia|dead space)\b/.test(name)) {
    signals.add("Horror leaning");
  }
  if (/\b(co-?op|left 4 dead|payday|deep rock|vermintide)\b/.test(name)) {
    signals.add("Co-op leaning");
  }
  if (game.playtimeMinutes >= 1200) signals.add("Long-session favorite");
  if (game.playtimeMinutes > 0 && game.playtimeMinutes < 120) signals.add("Retry candidate");
  if (game.playtimeMinutes === 0) signals.add("Untouched backlog");

  return signals.size > 0 ? [...signals] : ["Steam library pattern"];
}

function signalLabels(game: LibraryGame) {
  return structuredSignals(game).map((signal) => signal.label);
}

function buildCategories(games: LibraryGame[]): LibraryCategory[] {
  const categories: LibraryCategory[] = [
    {
      id: "most-played",
      label: "Most Played",
      description: "The games that have clearly earned permanent real estate.",
      games: [...games].filter((game) => game.playtimeMinutes > 0).sort((a, b) => b.playtimeMinutes - a.playtimeMinutes).slice(0, 12),
    },
    {
      id: "recently-played",
      label: "Recently Played",
      description: "Fresh activity from the last sync.",
      games: [...games]
        .filter((game) => game.lastPlayedAt)
        .sort((a, b) => new Date(b.lastPlayedAt ?? 0).getTime() - new Date(a.lastPlayedAt ?? 0).getTime())
        .slice(0, 12),
    },
    {
      id: "never-launched",
      label: "Never Launched",
      description: "Owned, waiting, and quietly judging the backlog.",
      games: games.filter((game) => game.playtimeMinutes === 0).slice(0, 12),
    },
    {
      id: "barely-tried",
      label: "Barely Tried",
      description: "Games with less than an hour of playtime.",
      games: games.filter((game) => game.playtimeMinutes > 0 && game.playtimeMinutes < 60).slice(0, 12),
    },
    {
      id: "forgotten-favorites",
      label: "Forgotten Favorites",
      description: "High-playtime games you have not touched in a while.",
      games: games.filter((game) => game.playtimeMinutes >= 600 && daysSince(game.lastPlayedAt) > 120).slice(0, 12),
    },
    {
      id: "backlog-candidates",
      label: "Backlog Candidates",
      description: "Low-playtime picks with enough signal to be worth a second look.",
      games: getBacklogGems(games).slice(0, 12),
    },
    {
      id: "comfort-games",
      label: "Comfort Games",
      description: "Reliable games with repeat playtime or recent activity.",
      games: games.filter((game) => game.playtimeMinutes >= 1200 || game.playtimeTwoWeeksMinutes > 0).slice(0, 12),
    },
    {
      id: "long-term-games",
      label: "Long-Term Games",
      description: "The deep wells: 20+ hours played.",
      games: games.filter((game) => game.playtimeMinutes >= 1200).slice(0, 12),
    },
    ...metadataCategories(games),
  ];

  return categories.filter((category) => category.games.length >= 3);
}

function metadataCategories(games: LibraryGame[]): LibraryCategory[] {
  const wanted = [
    "Quick Picks",
    "Multiplayer",
    "Single Player",
    "Co-op",
    "Strategy",
    "RPG",
    "Action",
    "Indie",
    "Racing",
    "Simulation",
    "Horror",
    "Open World",
  ];

  return wanted.map((label) => ({
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    description: `Games that match ${label.toLowerCase()} signals.`,
    games: games
      .filter((game) =>
        signalLabels(game).some((signal) => signal.toLowerCase().includes(label.toLowerCase())),
      )
      .slice(0, 12),
  }));
}

function buildTimeline(games: LibraryGame[]) {
  const buckets = new Map<string, number>();
  for (const game of games) {
    if (!game.lastPlayedAt) continue;
    const date = new Date(game.lastPlayedAt);
    const label = date.toLocaleDateString("en", { month: "short", year: "2-digit" });
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .map(([label, value]) => ({ label, value }))
    .slice(-12);
}

/**
 * Phase Timeline: stacked area data showing how the user's genre mix changed
 * over time. Buckets games by `lastPlayedAt` quarter, then ranks the top
 * genres globally and produces one row per quarter with each genre's count.
 */
export function buildPhaseTimeline(games: LibraryGame[], maxGenres = 5) {
  type Bucket = { quarter: string; ts: number; genres: Map<string, number> };
  const byQuarter = new Map<string, Bucket>();

  for (const game of games) {
    if (!game.lastPlayedAt) continue;
    const date = new Date(game.lastPlayedAt);
    const year = date.getUTCFullYear();
    const q = Math.floor(date.getUTCMonth() / 3) + 1;
    const key = `${year}-Q${q}`;
    let bucket = byQuarter.get(key);
    if (!bucket) {
      bucket = {
        quarter: key,
        ts: Date.UTC(year, (q - 1) * 3, 1),
        genres: new Map(),
      };
      byQuarter.set(key, bucket);
    }
    const tags = game.genres.length > 0 ? game.genres : game.categories;
    if (tags.length === 0) continue;
    for (const tag of tags) {
      bucket.genres.set(tag, (bucket.genres.get(tag) ?? 0) + 1);
    }
  }

  // Pick the top N genres by overall count.
  const totals = new Map<string, number>();
  for (const bucket of byQuarter.values()) {
    for (const [genre, count] of bucket.genres) {
      totals.set(genre, (totals.get(genre) ?? 0) + count);
    }
  }
  const topGenres = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxGenres)
    .map(([genre]) => genre);

  const series = [...byQuarter.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((bucket) => {
      const row: Record<string, string | number> = { quarter: bucket.quarter };
      for (const genre of topGenres) row[genre] = bucket.genres.get(genre) ?? 0;
      return row;
    });

  return { topGenres, series };
}

/**
 * Recently-Dropped: games you started in the last few months, played for a
 * meaningful chunk, then stopped touching. The "fell off the wagon" pile.
 */
export function getRecentlyDropped(games: LibraryGame[], limit = 8) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return games
    .map((game) => {
      const lastPlayed = game.lastPlayedAt ? new Date(game.lastPlayedAt).getTime() : null;
      if (!lastPlayed) return null;
      const daysAgo = (now - lastPlayed) / dayMs;
      if (daysAgo < 14 || daysAgo > 90) return null;
      // Played for at least 1 hour but fewer than 30 — i.e. a real start, not a finish
      if (game.playtimeMinutes < 60 || game.playtimeMinutes > 1800) return null;
      if (game.playtimeTwoWeeksMinutes > 0) return null;
      if (game.manualStatus === "FINISHED" || game.manualStatus === "NOT_INTERESTED") return null;

      const score =
        Math.min(20, game.playtimeMinutes / 60) +
        Math.max(0, 60 - daysAgo) / 6;

      return { game, score, daysAgo: Math.round(daysAgo) };
    })
    .filter((entry): entry is { game: LibraryGame; score: number; daysAgo: number } =>
      Boolean(entry),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const libraryAnalysisService = new LibraryAnalysisService();
