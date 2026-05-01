import { prisma } from "@/lib/prisma";
import { steamApiService } from "@/lib/steam/steam-api-service";

export async function refreshWishlist(userId: string, steamId: string) {
  const items = await steamApiService.getWishlist(steamId);
  if (items.length === 0) {
    return { wishlistCount: 0 };
  }

  // Drop any items no longer present, then upsert the rest.
  await prisma.wishlistItem.deleteMany({
    where: { userId, appId: { notIn: items.map((i) => i.appid) } },
  });

  for (const item of items) {
    await prisma.wishlistItem.upsert({
      where: { userId_appId: { userId, appId: item.appid } },
      create: {
        userId,
        appId: item.appid,
        name: item.name,
        headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`,
        priority: item.priority ?? null,
      },
      update: {
        name: item.name,
        headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`,
        priority: item.priority ?? null,
        fetchedAt: new Date(),
      },
    });
  }

  return { wishlistCount: items.length };
}

export type WishlistSanityResult = {
  totalWishlisted: number;
  unplayedOwned: number;
  topPicks: Array<{
    appId: number;
    name: string;
    headerUrl: string | null;
    priority: number | null;
    matchScore: number;
    reason: string;
  }>;
};

/**
 * For the Sanity Check panel — show wishlist items whose name pattern matches
 * the user's strongest taste signals, alongside the count of currently
 * unplayed games they own.
 */
export async function getWishlistSanityCheck(userId: string): Promise<WishlistSanityResult> {
  const [items, unplayedCount, taste] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: [{ priority: { sort: "asc", nulls: "last" } }],
    }),
    prisma.userGame.count({
      where: { userId, playtimeForeverMinutes: 0 },
    }),
    getUserTasteWords(userId),
  ]);

  const matchers = buildTasteMatchers(taste);

  const scored = items.map((item) => {
    const lower = item.name.toLowerCase();
    const matchedMatchers = matchers.filter((m) => m.regex.test(lower));
    const matchedScore = matchedMatchers.reduce((sum, m) => sum + m.weight, 0);
    return {
      appId: item.appId,
      name: item.name,
      headerUrl: item.headerUrl,
      priority: item.priority ?? null,
      matchScore: matchedScore,
      matched: matchedMatchers.map((m) => m.label),
    };
  });

  const top = scored
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6)
    .map((s) => ({
      appId: s.appId,
      name: s.name,
      headerUrl: s.headerUrl,
      priority: s.priority,
      matchScore: s.matchScore,
      reason:
        s.matched.length > 0
          ? `Matches your ${s.matched.slice(0, 2).join(" + ")} signals`
          : "Close to your taste profile",
    }));

  return {
    totalWishlisted: items.length,
    unplayedOwned: unplayedCount,
    topPicks: top,
  };
}

async function getUserTasteWords(userId: string): Promise<Map<string, number>> {
  const top = await prisma.userGame.findMany({
    where: { userId, playtimeForeverMinutes: { gt: 60 } },
    orderBy: { playtimeForeverMinutes: "desc" },
    take: 25,
    select: {
      playtimeForeverMinutes: true,
      game: { select: { metadata: { select: { genres: true, categories: true, tags: true } } } },
    },
  });

  const counts = new Map<string, number>();
  for (const entry of top) {
    const meta = entry.game.metadata;
    const labels = [
      ...arrayifyJson(meta?.genres),
      ...arrayifyJson(meta?.categories),
      ...arrayifyJson(meta?.tags),
    ];
    const weight = Math.max(1, Math.log1p(entry.playtimeForeverMinutes / 60));
    for (const label of labels) {
      const key = label.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + weight);
    }
  }
  return counts;
}

function buildTasteMatchers(counts: Map<string, number>) {
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return top.map(([label, weight]) => ({
    label,
    weight,
    regex: new RegExp(`\\b${escapeRegex(label.split(/\s+/)[0])}`, "i"),
  }));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function arrayifyJson(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}
