import { prisma } from "@/lib/prisma";
import { hltbService } from "@/lib/services/hltb-service";

const HLTB_CACHE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const DEFAULT_MAIN_FALLBACK_MIN = 12 * 60; // 12h fallback when HLTB has no data

export async function refreshHltbForUnplayed(
  userId: string,
  options: { maxRequests?: number } = {},
) {
  const maxRequests = options.maxRequests ?? 25;

  const candidates = await prisma.userGame.findMany({
    where: {
      userId,
      playtimeForeverMinutes: { lt: 120 },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
    select: {
      game: { select: { id: true, name: true, hltbAt: true } },
    },
  });

  let refreshed = 0;
  for (const entry of candidates) {
    if (refreshed >= maxRequests) break;
    const fresh =
      entry.game.hltbAt && Date.now() - entry.game.hltbAt.getTime() < HLTB_CACHE_MS;
    if (fresh) continue;

    const result = await hltbService.lookup(entry.game.name);
    await prisma.game.update({
      where: { id: entry.game.id },
      data: {
        hltbMainMinutes: result.mainMinutes,
        hltbExtraMinutes: result.extraMinutes,
        hltbCompletionistMinutes: result.completionistMinutes,
        hltbAt: new Date(),
      },
    });
    refreshed += 1;
  }

  return { refreshed };
}

export type TimeDebtSummary = {
  unplayedCount: number;
  knownCount: number; // unplayed games with HLTB data
  totalMainMinutes: number;
  averageMainMinutes: number;
  // 4 hrs/week assumption — also returns custom rates
  yearsAtFourHrsWeek: number;
  longest: Array<{ name: string; minutes: number }>;
  shortest: Array<{ name: string; minutes: number }>;
};

export async function getTimeDebt(userId: string): Promise<TimeDebtSummary> {
  const rows = await prisma.userGame.findMany({
    where: { userId, playtimeForeverMinutes: 0 },
    select: {
      game: {
        select: {
          name: true,
          hltbMainMinutes: true,
        },
      },
    },
  });

  const known: Array<{ name: string; minutes: number }> = [];
  for (const row of rows) {
    if (row.game.hltbMainMinutes && row.game.hltbMainMinutes > 0) {
      known.push({ name: row.game.name, minutes: row.game.hltbMainMinutes });
    }
  }

  // Estimate the unknown ones at the average of known ones (or fallback).
  const knownAvg =
    known.length > 0
      ? known.reduce((s, e) => s + e.minutes, 0) / known.length
      : DEFAULT_MAIN_FALLBACK_MIN;
  const unknownCount = rows.length - known.length;
  const totalMain =
    known.reduce((s, e) => s + e.minutes, 0) + unknownCount * knownAvg;

  const longest = [...known].sort((a, b) => b.minutes - a.minutes).slice(0, 5);
  const shortest = [...known].sort((a, b) => a.minutes - b.minutes).slice(0, 5);

  // 4 hrs/week => 4*60=240 min/week, *52 = 12480 min/year
  const yearsAtFourHrsWeek = totalMain / 12480;

  return {
    unplayedCount: rows.length,
    knownCount: known.length,
    totalMainMinutes: Math.round(totalMain),
    averageMainMinutes: Math.round(known.length ? knownAvg : DEFAULT_MAIN_FALLBACK_MIN),
    yearsAtFourHrsWeek: Number(yearsAtFourHrsWeek.toFixed(1)),
    longest,
    shortest,
  };
}
