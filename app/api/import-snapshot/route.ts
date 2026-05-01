import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentSessionUser } from "@/lib/http";

/**
 * Returns the most recent import snapshot. Used by the dashboard's
 * "Import diff" panel after a refresh.
 */
export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const snapshots = await prisma.libraryImportSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { importedAt: "desc" },
    take: 2,
  });
  const [latest, previous] = snapshots;
  if (!latest) return NextResponse.json({ snapshot: null });

  // Hydrate "new game" details from the Game table for nicer rendering.
  const newAppIds = Array.isArray(latest.newAppIds)
    ? (latest.newAppIds as number[]).filter((value) => typeof value === "number")
    : [];
  const newGames = newAppIds.length
    ? await prisma.game.findMany({
        where: { appId: { in: newAppIds } },
        select: { appId: true, name: true, headerUrl: true },
      })
    : [];

  return NextResponse.json({
    snapshot: {
      importedAt: latest.importedAt.toISOString(),
      gameCount: latest.gameCount,
      totalPlaytimeMinutes: latest.totalPlaytimeMinutes,
      newGames,
      playtimeDeltas: latest.playtimeDeltas,
      previousImportedAt: previous?.importedAt.toISOString() ?? null,
      gameCountDelta: previous ? latest.gameCount - previous.gameCount : null,
      totalPlaytimeDeltaMinutes: previous
        ? latest.totalPlaytimeMinutes - previous.totalPlaytimeMinutes
        : null,
    },
  });
}
