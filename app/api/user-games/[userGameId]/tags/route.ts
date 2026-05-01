import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireCurrentSessionUser } from "@/lib/http";
import { setTagsForUserGame } from "@/lib/services/custom-tags-service";

const schema = z.object({
  tagIds: z.array(z.string()).max(20),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userGameId: string }> },
) {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const { userGameId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload.");

  try {
    await setTagsForUserGame(user.id, userGameId, parsed.data.tagIds);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed.", 404);
  }
}
