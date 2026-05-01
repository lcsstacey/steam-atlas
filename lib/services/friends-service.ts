import { prisma } from "@/lib/prisma";
import { steamApiService } from "@/lib/steam/steam-api-service";

/**
 * Refresh the friend list and (for each friend with a public library) cache
 * the appids they own. Skips friends whose library is private.
 */
export async function refreshFriendLibraries(
  userId: string,
  steamId: string,
  options: { maxFriends?: number } = {},
) {
  const maxFriends = options.maxFriends ?? 30;

  const friends = await steamApiService.getFriendList(steamId);
  if (friends.length === 0) {
    return { friendsFetched: 0, withGames: 0 };
  }

  // Pull persona names in bulk (fast, single call).
  const summaries = await steamApiService.getPlayerSummaries(
    friends.slice(0, maxFriends).map((f) => f.steamid),
  );
  const summaryMap = new Map(summaries.map((s) => [s.steamid, s]));

  let withGames = 0;
  for (const friend of friends.slice(0, maxFriends)) {
    const summary = summaryMap.get(friend.steamid);
    let ownedAppIds: number[] = [];
    try {
      const lib = await steamApiService.getOwnedGames(friend.steamid);
      if (!lib.isPrivateOrEmpty) {
        ownedAppIds = lib.games.map((g) => g.appid);
        withGames += 1;
      }
    } catch {
      // private library, skip
    }

    await prisma.friendLink.upsert({
      where: {
        userId_friendSteamId: { userId, friendSteamId: friend.steamid },
      },
      create: {
        userId,
        friendSteamId: friend.steamid,
        displayName: summary?.personaname ?? null,
        avatarUrl: summary?.avatarfull ?? summary?.avatarmedium ?? null,
        profileUrl: summary?.profileurl ?? null,
        ownedGamesAppIds: ownedAppIds,
      },
      update: {
        displayName: summary?.personaname ?? null,
        avatarUrl: summary?.avatarfull ?? summary?.avatarmedium ?? null,
        profileUrl: summary?.profileurl ?? null,
        ownedGamesAppIds: ownedAppIds,
        fetchedAt: new Date(),
      },
    });

    await new Promise((r) => setTimeout(r, 150));
  }

  return { friendsFetched: friends.length, withGames };
}

export type FriendOverlapEntry = {
  appId: number;
  name: string;
  headerUrl: string | null;
  isMultiplayer: boolean;
  isCoop: boolean;
  ownerCount: number;          // how many of "you + friends" own this
  friends: Array<{ steamId: string; displayName: string | null; avatarUrl: string | null }>;
};

/**
 * Compute the overlap between the user and their cached friends. Boosts
 * games that look multiplayer / co-op based on stored categories.
 */
export async function computeOverlap(userId: string): Promise<FriendOverlapEntry[]> {
  const [userGames, friends] = await Promise.all([
    prisma.userGame.findMany({
      where: { userId },
      select: {
        game: {
          select: {
            appId: true,
            name: true,
            headerUrl: true,
            metadata: { select: { categories: true } },
          },
        },
      },
    }),
    prisma.friendLink.findMany({ where: { userId } }),
  ]);

  if (friends.length === 0) return [];

  const ownedByUser = new Map(
    userGames.map((entry) => [
      entry.game.appId,
      {
        name: entry.game.name,
        headerUrl: entry.game.headerUrl,
        categories: arrayifyJson(entry.game.metadata?.categories),
      },
    ]),
  );

  const ownersByAppId = new Map<
    number,
    Array<{ steamId: string; displayName: string | null; avatarUrl: string | null }>
  >();

  for (const friend of friends) {
    const friendApps = arrayifyJson(friend.ownedGamesAppIds).filter(
      (value): value is number => typeof value === "number",
    );
    for (const appId of friendApps) {
      if (!ownedByUser.has(appId)) continue;
      const list = ownersByAppId.get(appId) ?? [];
      list.push({
        steamId: friend.friendSteamId,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl,
      });
      ownersByAppId.set(appId, list);
    }
  }

  const entries: FriendOverlapEntry[] = [];
  for (const [appId, friendList] of ownersByAppId) {
    if (friendList.length === 0) continue;
    const meta = ownedByUser.get(appId);
    if (!meta) continue;
    const cats = meta.categories
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.toLowerCase());
    const isMultiplayer = cats.some((c) => c.includes("multi-player") || c === "pvp");
    const isCoop = cats.some((c) => c.includes("co-op") || c.includes("co op"));

    entries.push({
      appId,
      name: meta.name,
      headerUrl: meta.headerUrl,
      isMultiplayer,
      isCoop,
      ownerCount: friendList.length + 1,
      friends: friendList,
    });
  }

  return entries.sort((a, b) => {
    // co-op multiplayer with most owners first
    const score = (e: FriendOverlapEntry) =>
      e.ownerCount * 10 + (e.isCoop ? 6 : 0) + (e.isMultiplayer ? 3 : 0);
    return score(b) - score(a);
  });
}

function arrayifyJson(value: unknown) {
  if (Array.isArray(value)) return value as Array<string | number>;
  return [];
}
