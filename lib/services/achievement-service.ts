import { prisma } from "@/lib/prisma";
import { steamApiService } from "@/lib/steam/steam-api-service";

const ACHIEVEMENT_CACHE_MS = 6 * 60 * 60 * 1000; // 6 hours

export type AchievementSummary = {
  userGameId: string;
  appId: number;
  name: string;
  headerUrl: string | null;
  unlocked: number;
  total: number;
  progress: number; // 0–1
};

/**
 * Refresh per-user achievement progress for up to N games. Prioritizes games
 * the user has actually played and that have stale or missing data.
 */
export async function refreshAchievements(
  userId: string,
  steamId: string,
  options: { maxGames?: number } = {},
) {
  const maxGames = options.maxGames ?? 60;

  const candidates = await prisma.userGame.findMany({
    where: {
      userId,
      playtimeForeverMinutes: { gt: 0 },
    },
    orderBy: [
      { achievementsAt: { sort: "asc", nulls: "first" } },
      { playtimeForeverMinutes: "desc" },
    ],
    take: maxGames,
    select: {
      id: true,
      achievementsAt: true,
      game: { select: { id: true, appId: true, name: true, totalAchievements: true } },
    },
  });

  let refreshed = 0;
  for (const entry of candidates) {
    const isFresh =
      entry.achievementsAt &&
      Date.now() - entry.achievementsAt.getTime() < ACHIEVEMENT_CACHE_MS;
    if (isFresh) continue;

    // Make sure we know the schema (total achievements). If totalAchievements
    // is null, fetch the schema once.
    let total = entry.game.totalAchievements ?? null;
    if (total === null) {
      const schema = await steamApiService.getGameSchema(entry.game.appId);
      const list = schema?.game?.availableGameStats?.achievements ?? [];
      total = list.length;
      await prisma.game.update({
        where: { id: entry.game.id },
        data: { totalAchievements: total },
      });

      // Persist the achievement definitions so the UI can show details later.
      if (list.length > 0) {
        for (const def of list) {
          await prisma.achievementDefinition.upsert({
            where: { gameId_apiName: { gameId: entry.game.id, apiName: def.name } },
            create: {
              gameId: entry.game.id,
              apiName: def.name,
              displayName: def.displayName ?? def.name,
              description: def.description ?? null,
              iconUrl: def.icon ?? null,
              hiddenFromUser: def.hidden === 1,
            },
            update: {
              displayName: def.displayName ?? def.name,
              description: def.description ?? null,
              iconUrl: def.icon ?? null,
              hiddenFromUser: def.hidden === 1,
            },
          });
        }
      }
    }

    if (!total || total === 0) {
      await prisma.userGame.update({
        where: { id: entry.id },
        data: {
          achievementsTotal: 0,
          achievementsUnlocked: 0,
          achievementsAt: new Date(),
        },
      });
      continue;
    }

    const player = await steamApiService.getPlayerAchievements(steamId, entry.game.appId);
    if (!player) {
      await prisma.userGame.update({
        where: { id: entry.id },
        data: { achievementsAt: new Date() },
      });
      continue;
    }

    const unlocked = player.filter((a) => a.achieved === 1).length;
    await prisma.userGame.update({
      where: { id: entry.id },
      data: {
        achievementsTotal: total,
        achievementsUnlocked: unlocked,
        achievementsAt: new Date(),
      },
    });

    refreshed += 1;
    // Stay polite on the API
    await new Promise((r) => setTimeout(r, 200));
  }

  return { refreshed };
}

/**
 * For the dashboard panel: closest-to-100% games with progress >= 50%.
 */
export async function getCloseToCompletion(userId: string, limit = 8) {
  const rows = await prisma.userGame.findMany({
    where: {
      userId,
      achievementsTotal: { gt: 0 },
    },
    select: {
      id: true,
      achievementsUnlocked: true,
      achievementsTotal: true,
      game: { select: { appId: true, name: true, headerUrl: true } },
    },
  });

  return rows
    .filter(
      (row) =>
        (row.achievementsUnlocked ?? 0) > 0 &&
        (row.achievementsUnlocked ?? 0) < (row.achievementsTotal ?? 0),
    )
    .map((row): AchievementSummary => ({
      userGameId: row.id,
      appId: row.game.appId,
      name: row.game.name,
      headerUrl: row.game.headerUrl,
      unlocked: row.achievementsUnlocked ?? 0,
      total: row.achievementsTotal ?? 0,
      progress: (row.achievementsUnlocked ?? 0) / (row.achievementsTotal ?? 1),
    }))
    .sort((a, b) => b.progress - a.progress || a.total - a.unlocked - (b.total - b.unlocked))
    .slice(0, limit);
}

export async function getAchievementHighlights(userId: string) {
  const all = await prisma.userGame.findMany({
    where: {
      userId,
      achievementsTotal: { gt: 0 },
    },
    select: {
      achievementsUnlocked: true,
      achievementsTotal: true,
    },
  });

  let totalUnlocked = 0;
  let totalAvailable = 0;
  let perfectGames = 0;
  let inProgress = 0;
  for (const row of all) {
    const unlocked = row.achievementsUnlocked ?? 0;
    const total = row.achievementsTotal ?? 0;
    totalUnlocked += unlocked;
    totalAvailable += total;
    if (total > 0 && unlocked === total) perfectGames += 1;
    else if (unlocked > 0) inProgress += 1;
  }

  return {
    gamesTracked: all.length,
    totalUnlocked,
    totalAvailable,
    completionRate: totalAvailable > 0 ? totalUnlocked / totalAvailable : 0,
    perfectGames,
    inProgress,
  };
}
