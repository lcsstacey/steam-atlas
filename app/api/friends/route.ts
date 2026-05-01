import { NextResponse } from "next/server";
import { computeOverlap, refreshFriendLibraries } from "@/lib/services/friends-service";
import { requireCurrentSessionUser } from "@/lib/http";

export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const overlap = await computeOverlap(user.id);
  return NextResponse.json({ overlap });
}

export async function POST() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const result = await refreshFriendLibraries(user.id, user.steamId, { maxFriends: 25 });
  return NextResponse.json(result);
}
