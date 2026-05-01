import type { RecommendationMode } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { LibraryGame, RecommendationDto, RecommendationModeGroup } from "@/lib/types";
import { clamp, daysSince } from "@/lib/utils";
import { inferPatternSignals } from "@/lib/services/library-analysis-service";

type TasteProfile = {
  signals: Map<string, number>;
  favorites: LibraryGame[];
  strongestSignals: string[];
};

export const RECOMMENDATION_MODES: Array<{
  mode: RecommendationMode;
  label: string;
  description: string;
}> = [
  {
    mode: "PLAY_SOMETHING_SIMILAR",
    label: "Play something similar",
    description: "The familiar lane: games that echo where your hours already went.",
  },
  {
    mode: "BACKLOG_GEM",
    label: "Backlog gem",
    description: "Low-playtime games that look much more relevant than the backlog admits.",
  },
  {
    mode: "COMFORT_PICK",
    label: "Comfort pick",
    description: "Reliable choices for when you want friction low and odds high.",
  },
  {
    mode: "WILDCARD",
    label: "Wildcard",
    description: "A little chaos, still anchored to the things your library says you like.",
  },
  {
    mode: "SHORT_SESSION",
    label: "Short session",
    description: "Good candidates when you have one clean hour and no appetite for setup.",
  },
  {
    mode: "DEEP_DIVE",
    label: "Deep dive",
    description: "Games with enough gravity for a long evening or a dangerous weekend.",
  },
  {
    mode: "RETRY_THIS",
    label: "Retry this",
    description: "Brief first attempts that still look aligned with your actual taste.",
  },
];

export class RecommendationService {
  buildTasteProfile(games: LibraryGame[]): TasteProfile {
    const favorites = [...games]
      .filter((game) => game.playtimeMinutes > 0)
      .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
      .slice(0, 20);
    const signals = new Map<string, number>();

    for (const game of favorites) {
      const weight = Math.max(1, Math.log1p(game.playtimeMinutes / 60));
      for (const signal of getSignals(game)) {
        signals.set(signal, (signals.get(signal) ?? 0) + weight);
      }
    }

    if (signals.size === 0) {
      for (const game of games.slice(0, 20)) {
        for (const signal of getSignals(game)) {
          signals.set(signal, (signals.get(signal) ?? 0) + 1);
        }
      }
    }

    const strongestSignals = [...signals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([signal]) => signal)
      .slice(0, 5);

    return { signals, favorites, strongestSignals };
  }

  recommend(
    games: LibraryGame[],
    mode: RecommendationMode,
    options: { count?: number; seed?: number } = {},
  ) {
    const profile = this.buildTasteProfile(games);
    const seed = options.seed ?? Date.now();
    const random = mulberry32(seed);

    return games
      .filter((game) => shouldConsider(game, mode))
      .map((game) => {
        const randomFactor = random();
        const score = scoreGame(game, profile, mode, randomFactor);

        return {
          id: `${mode}-${game.id}`,
          mode,
          score,
          reason: explainRecommendation(game, profile, mode),
          game,
        } satisfies RecommendationDto;
      })
      .filter((recommendation) => recommendation.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.count ?? 8);
  }

  recommendAll(games: LibraryGame[], count = 6): RecommendationModeGroup[] {
    return RECOMMENDATION_MODES.map((mode) => ({
      ...mode,
      recommendations: this.recommend(games, mode.mode, { count }),
    })).filter((group) => group.recommendations.length > 0);
  }

  async persist(userId: string, recommendations: RecommendationDto[]) {
    if (recommendations.length === 0) return;

    const gameIds = new Map(
      (
        await prisma.game.findMany({
          where: { appId: { in: recommendations.map((recommendation) => recommendation.game.appId) } },
          select: { id: true, appId: true },
        })
      ).map((game) => [game.appId, game.id]),
    );

    await prisma.recommendation.createMany({
      data: recommendations
        .map((recommendation) => {
          const gameId = gameIds.get(recommendation.game.appId);
          if (!gameId) return null;

          return {
            userId,
            gameId,
            mode: recommendation.mode,
            score: recommendation.score,
            reason: recommendation.reason,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    });
  }
}

export function scoreGame(
  game: LibraryGame,
  profile: TasteProfile,
  mode: RecommendationMode,
  randomFactor = Math.random(),
) {
  const similarity = getSimilarity(game, profile);
  const backlogBoost =
    game.playtimeMinutes === 0 ? 1 : game.playtimeMinutes < 60 ? 0.78 : game.playtimeMinutes < 300 ? 0.42 : 0;
  const recencyModifier = getRecencyModifier(game);
  const statusBoost = game.manualStatus === "PLAY_NEXT" ? 0.18 : game.manualStatus === "WANT_TO_INSTALL" ? 0.1 : 0;
  const heavyPlayPenalty = mode === "COMFORT_PICK" ? 0 : clamp(game.playtimeMinutes / 6000, 0, 0.28);

  let score =
    similarity * 0.45 +
    similarity * 0.25 +
    backlogBoost * 0.15 +
    randomFactor * 0.1 +
    recencyModifier * 0.05 +
    statusBoost -
    heavyPlayPenalty;

  if (mode === "COMFORT_PICK") {
    score += clamp(game.playtimeMinutes / 3000, 0, 0.4) + (game.playtimeTwoWeeksMinutes > 0 ? 0.18 : 0);
  }

  if (mode === "BACKLOG_GEM") {
    score += backlogBoost * 0.32;
  }

  if (mode === "WILDCARD") {
    score = score * 0.78 + randomFactor * 0.28;
  }

  if (mode === "SHORT_SESSION") {
    score += shortSessionScore(game) * 0.3;
  }

  if (mode === "DEEP_DIVE") {
    score += deepDiveScore(game) * 0.3;
  }

  if (mode === "RETRY_THIS") {
    const retryWindow = game.playtimeMinutes > 0 && game.playtimeMinutes < 180 ? 0.55 : -0.2;
    score += retryWindow + (daysSince(game.lastPlayedAt) > 60 ? 0.2 : 0);
  }

  return Number(clamp(score, 0, 1.5).toFixed(4));
}

function getSignals(game: LibraryGame) {
  const structured = [...game.genres, ...game.categories, ...game.tags]
    .map((signal) => signal.trim())
    .filter(Boolean);

  if (structured.length > 0) return [...new Set(structured)];
  return inferPatternSignals(game);
}

function getSimilarity(game: LibraryGame, profile: TasteProfile) {
  const signals = getSignals(game);
  if (signals.length === 0 || profile.signals.size === 0) return 0.15;

  const max = Math.max(...profile.signals.values(), 1);
  const raw = signals.reduce((sum, signal) => sum + (profile.signals.get(signal) ?? 0) / max, 0);
  return clamp(raw / Math.max(1, signals.length), 0.05, 1);
}

function getRecencyModifier(game: LibraryGame) {
  if (game.playtimeTwoWeeksMinutes > 0) return 1;
  const days = daysSince(game.lastPlayedAt);
  if (!Number.isFinite(days)) return 0.35;
  if (days < 30) return 0.8;
  if (days < 180) return 0.5;
  return 0.25;
}

function shouldConsider(game: LibraryGame, mode: RecommendationMode) {
  if (game.manualStatus === "NOT_INTERESTED" || game.manualStatus === "FINISHED") return false;
  if (mode !== "RETRY_THIS" && game.manualStatus === "DROPPED") return false;
  if (mode === "BACKLOG_GEM") return game.playtimeMinutes < 180;
  if (mode === "RETRY_THIS") return game.playtimeMinutes > 0 && game.playtimeMinutes < 180;
  if (mode === "COMFORT_PICK") return game.playtimeMinutes > 0;
  return true;
}

function shortSessionScore(game: LibraryGame) {
  const signals = getSignals(game).join(" ").toLowerCase();
  const quickWords = ["casual", "arcade", "roguelike", "puzzle", "platform", "quick", "sports"];
  return quickWords.some((word) => signals.includes(word)) || game.playtimeMinutes < 300 ? 1 : 0.25;
}

function deepDiveScore(game: LibraryGame) {
  const signals = getSignals(game).join(" ").toLowerCase();
  const deepWords = ["rpg", "strategy", "simulation", "open world", "grand strategy", "management"];
  return deepWords.some((word) => signals.includes(word)) || game.playtimeMinutes >= 1200 ? 1 : 0.25;
}

function explainRecommendation(game: LibraryGame, profile: TasteProfile, mode: RecommendationMode) {
  const strongest = profile.strongestSignals.slice(0, 2);
  const taste = strongest.length > 0 ? strongest.join(" and ") : "the games you actually return to";
  const favoriteAnchor = profile.favorites[0]?.name;
  const anchor = favoriteAnchor
    ? `Your longest sessions point back to ${favoriteAnchor}, so this pick is not coming out of nowhere.`
    : "Your longest sessions are doing the sorting here, not store-page hype.";
  const playState =
    game.playtimeMinutes === 0
      ? "you have not given it a first real session yet"
      : game.playtimeMinutes < 60
        ? "your first look was so short that it still has room to surprise you"
        : `you already have about ${Math.round(game.playtimeMinutes / 60)} hours in it`;

  if (mode === "BACKLOG_GEM") {
    return `Try ${game.name} soon. It overlaps with your ${taste} streak, but ${playState}. ${anchor}`;
  }
  if (mode === "COMFORT_PICK") {
    return `${game.name} is the low-friction choice tonight. You have already built some muscle memory here, and it sits close to ${taste}, so it should feel familiar without turning the evening into setup.`;
  }
  if (mode === "WILDCARD") {
    return `${game.name} is the interesting left turn. It is not the safest pick, but it still touches ${taste}, which makes the surprise feel chosen rather than random.`;
  }
  if (mode === "SHORT_SESSION") {
    return `${game.name} looks right for a shorter session. The commitment stays manageable, the ${taste} signal is still present, and you can start playing without making a whole evening contract with it.`;
  }
  if (mode === "DEEP_DIVE") {
    return `${game.name} has enough gravity for a proper deep dive. The signals line up with ${taste}, so this is a better long-session bet than simply choosing the largest title in the list.`;
  }
  if (mode === "RETRY_THIS") {
    return `Give ${game.name} one clean retry. You barely tested it, but it still overlaps with ${taste}, which makes it feel more like unfinished business than a bad fit.`;
  }

  return `Try ${game.name} because it sits close to the games that earned your longest sessions. ${anchor} It looks familiar enough to land, but neglected enough to feel fresh.`;
}

function mulberry32(seed: number) {
  let value = seed;
  return function next() {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export const recommendationService = new RecommendationService();
