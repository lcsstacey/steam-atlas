import type {
  DeckCompat,
  ManualGameStatus,
  RecommendationMode,
} from "@/app/generated/prisma/enums";

export type SessionUser = {
  id: string;
  steamId: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  lastLibraryImportAt: string | null;
};

export type LibraryGame = {
  id: string;
  appId: number;
  name: string;
  iconUrl: string | null;
  headerUrl: string | null;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes: number;
  lastPlayedAt: string | null;
  manualStatus: ManualGameStatus | null;
  genres: string[];
  categories: string[];
  tags: string[];
  // New fields — all optional / nullable so older serialized payloads still parse
  deckCompat?: DeckCompat;
  currentPlayers?: number | null;
  achievementsUnlocked?: number | null;
  achievementsTotal?: number | null;
  hltbMainMinutes?: number | null;
  customTags?: Array<{ id: string; label: string; color: string | null }>;
};

export type LibraryCategory = {
  id: string;
  label: string;
  description: string;
  games: LibraryGame[];
};

export type TasteSignal = {
  label: string;
  score: number;
  type: "genre" | "category" | "tag" | "pattern";
};

export type DashboardSummary = {
  user: SessionUser;
  isPrivateOrEmpty: boolean;
  totals: {
    gamesOwned: number;
    totalPlaytimeMinutes: number;
    neverPlayed: number;
    underOneHour: number;
    playedRecently: number;
    manualPlayNext: number;
  };
  topPlayed: LibraryGame[];
  recentlyPlayed: LibraryGame[];
  backlogGems: LibraryGame[];
  recentlyDropped: Array<{ game: LibraryGame; daysAgo: number }>;
  categories: LibraryCategory[];
  tasteSignals: TasteSignal[];
  playtimeChart: Array<{ name: string; minutes: number; hours: number }>;
  backlogBreakdown: Array<{ name: string; value: number }>;
  timeline: Array<{ label: string; value: number }>;
  phaseTimeline: {
    topGenres: string[];
    series: Array<Record<string, string | number>>;
  };
};

export type RecommendationDto = {
  id: string;
  mode: RecommendationMode;
  score: number;
  reason: string;
  game: LibraryGame;
};

export type RecommendationModeGroup = {
  mode: RecommendationMode;
  label: string;
  description: string;
  recommendations: RecommendationDto[];
};
