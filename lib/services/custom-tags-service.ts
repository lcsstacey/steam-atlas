import { prisma } from "@/lib/prisma";

export async function listTagsWithCounts(userId: string) {
  const tags = await prisma.customTag.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { userGames: true } } },
  });
  return tags.map((tag) => ({
    id: tag.id,
    label: tag.label,
    color: tag.color,
    gameCount: tag._count.userGames,
  }));
}

export async function createTag(
  userId: string,
  label: string,
  color: string | null = null,
) {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Tag label cannot be empty.");
  if (trimmed.length > 40) throw new Error("Tag label too long.");

  return prisma.customTag.create({
    data: { userId, label: trimmed, color },
  });
}

export async function deleteTag(userId: string, tagId: string) {
  await prisma.customTag.deleteMany({ where: { id: tagId, userId } });
}

export async function setTagsForUserGame(
  userId: string,
  userGameId: string,
  tagIds: string[],
) {
  // Confirm the user owns this UserGame
  const owned = await prisma.userGame.findFirst({
    where: { id: userGameId, userId },
    select: { id: true },
  });
  if (!owned) throw new Error("UserGame not found.");

  // Confirm all requested tags belong to the user
  const validTags = await prisma.customTag.findMany({
    where: { id: { in: tagIds }, userId },
    select: { id: true },
  });
  const validIds = new Set(validTags.map((t) => t.id));

  await prisma.userGameTag.deleteMany({ where: { userGameId } });
  if (validIds.size > 0) {
    await prisma.userGameTag.createMany({
      data: [...validIds].map((tagId) => ({ userGameId, tagId })),
    });
  }
}

export async function getTagsForUserGames(userId: string) {
  const rows = await prisma.userGameTag.findMany({
    where: { userGame: { userId } },
    select: {
      userGameId: true,
      tag: { select: { id: true, label: true, color: true } },
    },
  });
  const map = new Map<string, Array<{ id: string; label: string; color: string | null }>>();
  for (const row of rows) {
    const list = map.get(row.userGameId) ?? [];
    list.push(row.tag);
    map.set(row.userGameId, list);
  }
  return map;
}
