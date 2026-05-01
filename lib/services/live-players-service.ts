import { prisma } from "@/lib/prisma";
import { steamApiService } from "@/lib/steam/steam-api-service";

const LIVE_CACHE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Refresh "currently alive" concurrent player counts for a small batch of
 * appIds. Caches the answer so we don't pound `GetNumberOfCurrentPlayers`
 * on every request.
 */
export async function refreshCurrentPlayers(appIds: number[]) {
  if (appIds.length === 0) return { refreshed: 0 };
  const games = await prisma.game.findMany({
    where: { appId: { in: appIds } },
    select: { id: true, appId: true, currentPlayersAt: true },
  });

  let refreshed = 0;
  for (const game of games) {
    const fresh =
      game.currentPlayersAt &&
      Date.now() - game.currentPlayersAt.getTime() < LIVE_CACHE_MS;
    if (fresh) continue;

    const count = await steamApiService.getCurrentPlayers(game.appId);
    await prisma.game.update({
      where: { id: game.id },
      data: {
        currentPlayers: count ?? null,
        currentPlayersAt: new Date(),
      },
    });
    refreshed += 1;
    await new Promise((r) => setTimeout(r, 100));
  }

  return { refreshed };
}

export async function getLivePlayersByAppIds(appIds: number[]) {
  if (appIds.length === 0) return new Map<number, number | null>();
  const rows = await prisma.game.findMany({
    where: { appId: { in: appIds } },
    select: { appId: true, currentPlayers: true },
  });
  return new Map(rows.map((r) => [r.appId, r.currentPlayers]));
}
