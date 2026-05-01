import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ManualGameStatus } from "@/app/generated/prisma/enums";
import { requireCurrentSessionUser } from "@/lib/http";
import { userGameStatusService } from "@/lib/services/user-game-status-service";

const statusSchema = z.object({
  status: z
    .enum([
      "INSTALLED",
      "WANT_TO_INSTALL",
      "PLAY_NEXT",
      "FINISHED",
      "DROPPED",
      "NOT_INTERESTED",
    ])
    .nullable(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userGameId: string }> },
) {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const { userGameId } = await context.params;
  const body = statusSchema.parse(await request.json());
  const status = await userGameStatusService.setStatus(
    user.id,
    userGameId,
    body.status as ManualGameStatus | null,
  );

  return NextResponse.json({ status });
}
