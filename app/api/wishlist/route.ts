import { NextResponse } from "next/server";
import { getWishlistSanityCheck, refreshWishlist } from "@/lib/services/wishlist-service";
import { requireCurrentSessionUser } from "@/lib/http";

export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const result = await getWishlistSanityCheck(user.id);
  return NextResponse.json(result);
}

export async function POST() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const result = await refreshWishlist(user.id, user.steamId);
  return NextResponse.json(result);
}
