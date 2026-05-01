import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireCurrentSessionUser } from "@/lib/http";
import {
  getLivePlayersByAppIds,
  refreshCurrentPlayers,
} from "@/lib/services/live-players-service";

const querySchema = z.object({
  appIds: z.array(z.number().int().positive()).max(40),
});

/**
 * Body: `{ appIds: [number, ...] }` — refresh + return live counts for the
 * given appIds. Refresh is cached (30 min) inside the service so spamming
 * this endpoint is cheap.
 */
export async function POST(request: Request) {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.");
  }
  const parsed = querySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload.");

  await refreshCurrentPlayers(parsed.data.appIds);
  const map = await getLivePlayersByAppIds(parsed.data.appIds);
  return NextResponse.json({
    counts: Object.fromEntries(map),
    userId: user.id,
  });
}
