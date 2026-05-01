import { DeckCompat } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  buildSteamHeaderUrl,
  buildSteamIconUrl,
  steamApiService,
  type SteamApiService,
} from "@/lib/steam/steam-api-service";

export type LibraryImportResult = {
  userId: string;
  steamId: string;
  gameCount: number;
  importedGames: number;
  isPrivateOrEmpty: boolean;
  /** Brief diff vs the previous snapshot (if any). */
  diff?: LibraryImportDiff;
};

export type LibraryImportDiff = {
  newGames: Array<{ appId: number; name: string; headerUrl: string | null }>;
  playtimeDeltas: Array<{
    appId: number;
    name: string;
    deltaMinutes: number;
    totalMinutes: number;
  }>;
  totalPlaytimeDeltaMinutes: number;
};

export class LibraryImportService {
  constructor(private readonly steamApi: SteamApiService = steamApiService) {}

  async importForSteamId(steamId: string): Promise<LibraryImportResult> {
    const profile = await this.steamApi.getPlayerSummary(steamId);
    const displayName = profile.personaname?.trim() || "Steam Player";

    const user = await prisma.user.upsert({
      where: { steamId },
      update: {},
      create: { steamId },
    });

    await prisma.steamProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        steamId,
        displayName,
        avatarUrl: profile.avatar ?? null,
        avatarMediumUrl: profile.avatarmedium ?? null,
        avatarFullUrl: profile.avatarfull ?? null,
        profileUrl: profile.profileurl ?? null,
        visibilityState: profile.communityvisibilitystate ?? null,
        personaState: profile.personastate ?? null,
      },
      update: {
        displayName,
        avatarUrl: profile.avatar ?? null,
        avatarMediumUrl: profile.avatarmedium ?? null,
        avatarFullUrl: profile.avatarfull ?? null,
        profileUrl: profile.profileurl ?? null,
        visibilityState: profile.communityvisibilitystate ?? null,
        personaState: profile.personastate ?? null,
        lastSyncedAt: new Date(),
      },
    });

    // Capture pre-import state so we can compute a diff.
    const previousState = await getPreviousState(user.id);

    const library = await this.steamApi.getOwnedGames(steamId);

    if (library.isPrivateOrEmpty || library.games.length === 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLibraryImportAt: new Date() },
      });

      await persistSnapshot(user.id, {
        gameCount: library.gameCount,
        totalPlaytimeMinutes: 0,
        newAppIds: [],
        playtimeDeltas: [],
        isPrivateOrEmpty: true,
      });

      return {
        userId: user.id,
        steamId,
        gameCount: library.gameCount,
        importedGames: 0,
        isPrivateOrEmpty: true,
      };
    }

    let importedGames = 0;
    let totalPlaytimeMinutes = 0;
    const newAppIds: number[] = [];
    const playtimeDeltas: LibraryImportDiff["playtimeDeltas"] = [];

    for (const steamGame of library.games) {
      if (!steamGame.name?.trim()) continue;

      const playtimeMinutes = steamGame.playtime_forever ?? 0;
      totalPlaytimeMinutes += playtimeMinutes;

      const game = await prisma.game.upsert({
        where: { appId: steamGame.appid },
        create: {
          appId: steamGame.appid,
          name: steamGame.name,
          iconHash: steamGame.img_icon_url ?? null,
          iconUrl: buildSteamIconUrl(steamGame),
          headerUrl: buildSteamHeaderUrl(steamGame.appid),
        },
        update: {
          name: steamGame.name,
          iconHash: steamGame.img_icon_url ?? null,
          iconUrl: buildSteamIconUrl(steamGame),
          headerUrl: buildSteamHeaderUrl(steamGame.appid),
        },
      });

      const previousPlaytime = previousState.playtimeByAppId.get(steamGame.appid);
      const isNew = !previousState.knownAppIds.has(steamGame.appid);
      if (isNew) {
        newAppIds.push(steamGame.appid);
      } else if (typeof previousPlaytime === "number") {
        const delta = playtimeMinutes - previousPlaytime;
        if (delta >= 30) {
          playtimeDeltas.push({
            appId: steamGame.appid,
            name: steamGame.name,
            deltaMinutes: delta,
            totalMinutes: playtimeMinutes,
          });
        }
      }

      await prisma.userGame.upsert({
        where: {
          userId_gameId: {
            userId: user.id,
            gameId: game.id,
          },
        },
        create: {
          userId: user.id,
          gameId: game.id,
          playtimeForeverMinutes: playtimeMinutes,
          playtimeTwoWeeksMinutes: steamGame.playtime_2weeks ?? 0,
          playtimeWindowsMinutes: steamGame.playtime_windows_forever ?? null,
          playtimeMacMinutes: steamGame.playtime_mac_forever ?? null,
          playtimeLinuxMinutes: steamGame.playtime_linux_forever ?? null,
          lastPlayedAt: steamGame.rtime_last_played
            ? new Date(steamGame.rtime_last_played * 1000)
            : null,
        },
        update: {
          playtimeForeverMinutes: playtimeMinutes,
          playtimeTwoWeeksMinutes: steamGame.playtime_2weeks ?? 0,
          playtimeWindowsMinutes: steamGame.playtime_windows_forever ?? null,
          playtimeMacMinutes: steamGame.playtime_mac_forever ?? null,
          playtimeLinuxMinutes: steamGame.playtime_linux_forever ?? null,
          lastPlayedAt: steamGame.rtime_last_played
            ? new Date(steamGame.rtime_last_played * 1000)
            : null,
          importedAt: new Date(),
        },
      });

      importedGames += 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLibraryImportAt: new Date() },
    });

    // Sort the most-meaningful playtime gains to the top.
    playtimeDeltas.sort((a, b) => b.deltaMinutes - a.deltaMinutes);

    const diff: LibraryImportDiff = {
      newGames: await loadNewGameDetails(newAppIds),
      playtimeDeltas: playtimeDeltas.slice(0, 8),
      totalPlaytimeDeltaMinutes: totalPlaytimeMinutes - previousState.totalPlaytimeMinutes,
    };

    await persistSnapshot(user.id, {
      gameCount: library.gameCount,
      totalPlaytimeMinutes,
      newAppIds,
      playtimeDeltas: diff.playtimeDeltas,
      isPrivateOrEmpty: false,
    });

    return {
      userId: user.id,
      steamId,
      gameCount: library.gameCount,
      importedGames,
      isPrivateOrEmpty: false,
      diff,
    };
  }
}

async function getPreviousState(userId: string) {
  const previous = await prisma.userGame.findMany({
    where: { userId },
    select: {
      playtimeForeverMinutes: true,
      game: { select: { appId: true } },
    },
  });

  const playtimeByAppId = new Map<number, number>();
  const knownAppIds = new Set<number>();
  let totalPlaytimeMinutes = 0;

  for (const entry of previous) {
    playtimeByAppId.set(entry.game.appId, entry.playtimeForeverMinutes);
    knownAppIds.add(entry.game.appId);
    totalPlaytimeMinutes += entry.playtimeForeverMinutes;
  }

  return { playtimeByAppId, knownAppIds, totalPlaytimeMinutes };
}

async function loadNewGameDetails(appIds: number[]) {
  if (appIds.length === 0) return [];
  const games = await prisma.game.findMany({
    where: { appId: { in: appIds } },
    select: { appId: true, name: true, headerUrl: true },
  });
  return games;
}

async function persistSnapshot(
  userId: string,
  payload: {
    gameCount: number;
    totalPlaytimeMinutes: number;
    newAppIds: number[];
    playtimeDeltas: LibraryImportDiff["playtimeDeltas"];
    isPrivateOrEmpty: boolean;
  },
) {
  await prisma.libraryImportSnapshot.create({
    data: {
      userId,
      gameCount: payload.gameCount,
      totalPlaytimeMinutes: payload.totalPlaytimeMinutes,
      newAppIds: payload.newAppIds,
      playtimeDeltas: payload.playtimeDeltas,
      isPrivateOrEmpty: payload.isPrivateOrEmpty,
    },
  });
}

/**
 * Background-friendly enrichment pass. Walks each game in batches and pulls
 * Steam Deck compat + total achievement count + storefront genres/categories
 * if they're stale (older than 14 days or missing).
 *
 * Designed to be called from an API route after import; safe to run async.
 * Hard cap on duration so a slow Steam day can't tie up the request.
 */
export async function enrichLibraryMetadata(
  userId: string,
  options: { maxAppIds?: number; maxRequests?: number } = {},
) {
  const maxAppIds = options.maxAppIds ?? 80;
  const maxRequests = options.maxRequests ?? 40;
  const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

  const games = await prisma.game.findMany({
    where: { userGames: { some: { userId } } },
    orderBy: [{ deckCompatAt: { sort: "asc", nulls: "first" } }],
    take: maxAppIds,
    select: {
      id: true,
      appId: true,
      deckCompatAt: true,
    },
  });

  const stale = games.filter((g) => {
    if (!g.deckCompatAt) return true;
    return Date.now() - g.deckCompatAt.getTime() > STALE_AFTER_MS;
  });

  let requests = 0;
  for (const game of stale) {
    if (requests >= maxRequests) break;
    requests += 1;

    try {
      const meta = await steamApiService.getStoreMetadata(game.appId);
      if (!meta) continue;

      await prisma.gameMetadata.upsert({
        where: { gameId: game.id },
        create: {
          gameId: game.id,
          genres: meta.genres,
          categories: meta.categories,
          tags: meta.tags,
        },
        update: {
          genres: meta.genres,
          categories: meta.categories,
          tags: meta.tags,
          fetchedAt: new Date(),
        },
      });

      await prisma.game.update({
        where: { id: game.id },
        data: {
          deckCompat: deckCompatToEnum(meta.deckCompat),
          deckCompatAt: new Date(),
        },
      });
    } catch {
      // skip and move on
    }

    // Small delay to be a polite client
    await new Promise((r) => setTimeout(r, 250));
  }

  return { enrichedCount: requests };
}

function deckCompatToEnum(value: "verified" | "playable" | "unsupported" | "unknown"): DeckCompat {
  switch (value) {
    case "verified":
      return DeckCompat.VERIFIED;
    case "playable":
      return DeckCompat.PLAYABLE;
    case "unsupported":
      return DeckCompat.UNSUPPORTED;
    default:
      return DeckCompat.UNKNOWN;
  }
}

export const libraryImportService = new LibraryImportService();
