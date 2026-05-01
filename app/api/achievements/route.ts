import { NextResponse } from "next/server";
import {
  getAchievementHighlights,
  getCloseToCompletion,
  refreshAchievements,
} from "@/lib/services/achievement-service";
import { requireCurrentSessionUser } from "@/lib/http";

export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const [highlights, close] = await Promise.all([
    getAchievementHighlights(user.id),
    getCloseToCompletion(user.id, 12),
  ]);

  return NextResponse.json({ highlights, closeToCompletion: close });
}

export async function POST() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const result = await refreshAchievements(user.id, user.steamId, { maxGames: 40 });
  return NextResponse.json(result);
}
