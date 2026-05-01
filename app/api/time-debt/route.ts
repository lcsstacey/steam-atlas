import { NextResponse } from "next/server";
import { getTimeDebt, refreshHltbForUnplayed } from "@/lib/services/time-debt-service";
import { requireCurrentSessionUser } from "@/lib/http";

export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const result = await getTimeDebt(user.id);
  return NextResponse.json(result);
}

export async function POST() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  // Throttled inside the service. Cap requests per call to keep response time reasonable.
  const result = await refreshHltbForUnplayed(user.id, { maxRequests: 15 });
  return NextResponse.json(result);
}
