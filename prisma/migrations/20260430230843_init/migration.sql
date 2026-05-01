-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "steamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLibraryImportAt" DATETIME
);

-- CreateTable
CREATE TABLE "SteamProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "avatarMediumUrl" TEXT,
    "avatarFullUrl" TEXT,
    "profileUrl" TEXT,
    "visibilityState" INTEGER,
    "personaState" INTEGER,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SteamProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iconHash" TEXT,
    "iconUrl" TEXT,
    "headerUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playtimeForeverMinutes" INTEGER NOT NULL DEFAULT 0,
    "playtimeTwoWeeksMinutes" INTEGER NOT NULL DEFAULT 0,
    "playtimeWindowsMinutes" INTEGER,
    "playtimeMacMinutes" INTEGER,
    "playtimeLinuxMinutes" INTEGER,
    "lastPlayedAt" DATETIME,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'steam',
    "genres" JSONB,
    "categories" JSONB,
    "tags" JSONB,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameMetadata_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGameStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userGameId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserGameStatus_userGameId_fkey" FOREIGN KEY ("userGameId") REFERENCES "UserGame" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "dismissedAt" DATETIME,
    CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_steamId_key" ON "User"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "SteamProfile_userId_key" ON "SteamProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SteamProfile_steamId_key" ON "SteamProfile"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_appId_key" ON "Game"("appId");

-- CreateIndex
CREATE INDEX "UserGame_userId_playtimeForeverMinutes_idx" ON "UserGame"("userId", "playtimeForeverMinutes");

-- CreateIndex
CREATE INDEX "UserGame_userId_lastPlayedAt_idx" ON "UserGame"("userId", "lastPlayedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_userId_gameId_key" ON "UserGame"("userId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameMetadata_gameId_key" ON "GameMetadata"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameStatus_userGameId_key" ON "UserGameStatus"("userGameId");

-- CreateIndex
CREATE INDEX "Recommendation_userId_mode_createdAt_idx" ON "Recommendation"("userId", "mode", "createdAt");
