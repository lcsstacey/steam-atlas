import type { ManualGameStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export class UserGameStatusService {
  async setStatus(userId: string, userGameId: string, status: ManualGameStatus | null) {
    const userGame = await prisma.userGame.findFirst({
      where: { id: userGameId, userId },
      select: { id: true },
    });

    if (!userGame) {
      throw new Error("Game was not found in this Steam library.");
    }

    if (!status) {
      await prisma.userGameStatus.deleteMany({ where: { userGameId } });
      return null;
    }

    return prisma.userGameStatus.upsert({
      where: { userGameId },
      create: { userGameId, status },
      update: { status },
    });
  }
}

export const userGameStatusService = new UserGameStatusService();
