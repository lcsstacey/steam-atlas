-- AlterTable
ALTER TABLE "UserGame" ADD COLUMN "achievementsAt" DATETIME;
ALTER TABLE "UserGame" ADD COLUMN "achievementsTotal" INTEGER;
ALTER TABLE "UserGame" ADD COLUMN "achievementsUnlocked" INTEGER;

-- CreateTable
CREATE TABLE "CustomTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGameTag" (
    "userGameId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userGameId", "tagId"),
    CONSTRAINT "UserGameTag_userGameId_fkey" FOREIGN KEY ("userGameId") REFERENCES "UserGame" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserGameTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CustomTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AchievementDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "hiddenFromUser" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AchievementDefinition_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LibraryImportSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameCount" INTEGER NOT NULL,
    "totalPlaytimeMinutes" INTEGER NOT NULL,
    "newAppIds" JSONB NOT NULL,
    "playtimeDeltas" JSONB NOT NULL,
    "isPrivateOrEmpty" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "LibraryImportSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "appId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "headerUrl" TEXT,
    "priority" INTEGER,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FriendLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "friendSteamId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "ownedGamesAppIds" JSONB NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FriendLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iconHash" TEXT,
    "iconUrl" TEXT,
    "headerUrl" TEXT,
    "deckCompat" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "deckCompatAt" DATETIME,
    "totalAchievements" INTEGER,
    "currentPlayers" INTEGER,
    "currentPlayersAt" DATETIME,
    "hltbMainMinutes" INTEGER,
    "hltbExtraMinutes" INTEGER,
    "hltbCompletionistMinutes" INTEGER,
    "hltbAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Game" ("appId", "createdAt", "headerUrl", "iconHash", "iconUrl", "id", "name", "updatedAt") SELECT "appId", "createdAt", "headerUrl", "iconHash", "iconUrl", "id", "name", "updatedAt" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_appId_key" ON "Game"("appId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CustomTag_userId_idx" ON "CustomTag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomTag_userId_label_key" ON "CustomTag"("userId", "label");

-- CreateIndex
CREATE INDEX "UserGameTag_tagId_idx" ON "UserGameTag"("tagId");

-- CreateIndex
CREATE INDEX "AchievementDefinition_gameId_idx" ON "AchievementDefinition"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementDefinition_gameId_apiName_key" ON "AchievementDefinition"("gameId", "apiName");

-- CreateIndex
CREATE INDEX "LibraryImportSnapshot_userId_importedAt_idx" ON "LibraryImportSnapshot"("userId", "importedAt");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_priority_idx" ON "WishlistItem"("userId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_appId_key" ON "WishlistItem"("userId", "appId");

-- CreateIndex
CREATE INDEX "FriendLink_userId_idx" ON "FriendLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendLink_userId_friendSteamId_key" ON "FriendLink"("userId", "friendSteamId");
