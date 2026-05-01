import { prisma } from "@/lib/prisma";
import {
  buildSteamHeaderUrl,
  buildSteamIconUrl,
  steamApiService,
  type SteamApiService,
} from "@/lib/steam/steam-api-service";

export type LibraryImportResult = {
  userId: string;
  steamId: string;
  gameCount: number;
  importedGames: number;
  isPrivateOrEmpty: boolean;
};

export class LibraryImportService {
  constructor(private readonly steamApi: SteamApiService = steamApiService) {}

  async importForSteamId(steamId: string): Promise<LibraryImportResult> {
    const profile = await this.steamApi.getPlayerSummary(steamId);
    const displayName = profile.personaname?.trim() || "Steam Player";

    const user = await prisma.user.upsert({
      where: { steamId },
      update: {},
      create: { steamId },
    });

    await prisma.steamProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        steamId,
        displayName,
        avatarUrl: profile.avatar ?? null,
        avatarMediumUrl: profile.avatarmedium ?? null,
        avatarFullUrl: profile.avatarfull ?? null,
        profileUrl: profile.profileurl ?? null,
        visibilityState: profile.communityvisibilitystate ?? null,
        personaState: profile.personastate ?? null,
      },
      update: {
        displayName,
        avatarUrl: profile.avatar ?? null,
        avatarMediumUrl: profile.avatarmedium ?? null,
        avatarFullUrl: profile.avatarfull ?? null,
        profileUrl: profile.profileurl ?? null,
        visibilityState: profile.communityvisibilitystate ?? null,
        personaState: profile.personastate ?? null,
        lastSyncedAt: new Date(),
      },
    });

    const library = await this.steamApi.getOwnedGames(steamId);

    if (library.isPrivateOrEmpty || library.games.length === 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLibraryImportAt: new Date() },
      });

      return {
        userId: user.id,
        steamId,
        gameCount: library.gameCount,
        importedGames: 0,
        isPrivateOrEmpty: true,
      };
    }

    let importedGames = 0;
    for (const steamGame of library.games) {
      if (!steamGame.name?.trim()) continue;

      const game = await prisma.game.upsert({
        where: { appId: steamGame.appid },
        create: {
          appId: steamGame.appid,
          name: steamGame.name,
          iconHash: steamGame.img_icon_url ?? null,
          iconUrl: buildSteamIconUrl(steamGame),
          headerUrl: buildSteamHeaderUrl(steamGame.appid),
        },
        update: {
          name: steamGame.name,
          iconHash: steamGame.img_icon_url ?? null,
          iconUrl: buildSteamIconUrl(steamGame),
          headerUrl: buildSteamHeaderUrl(steamGame.appid),
        },
      });

      await prisma.userGame.upsert({
        where: {
          userId_gameId: {
            userId: user.id,
            gameId: game.id,
          },
        },
        create: {
          userId: user.id,
          gameId: game.id,
          playtimeForeverMinutes: steamGame.playtime_forever ?? 0,
          playtimeTwoWeeksMinutes: steamGame.playtime_2weeks ?? 0,
          playtimeWindowsMinutes: steamGame.playtime_windows_forever ?? null,
          playtimeMacMinutes: steamGame.playtime_mac_forever ?? null,
          playtimeLinuxMinutes: steamGame.playtime_linux_forever ?? null,
          lastPlayedAt: steamGame.rtime_last_played
            ? new Date(steamGame.rtime_last_played * 1000)
            : null,
        },
        update: {
          playtimeForeverMinutes: steamGame.playtime_forever ?? 0,
          playtimeTwoWeeksMinutes: steamGame.playtime_2weeks ?? 0,
          playtimeWindowsMinutes: steamGame.playtime_windows_forever ?? null,
          playtimeMacMinutes: steamGame.playtime_mac_forever ?? null,
          playtimeLinuxMinutes: steamGame.playtime_linux_forever ?? null,
          lastPlayedAt: steamGame.rtime_last_played
            ? new Date(steamGame.rtime_last_played * 1000)
            : null,
          importedAt: new Date(),
        },
      });

      importedGames += 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLibraryImportAt: new Date() },
    });

    return {
      userId: user.id,
      steamId,
      gameCount: library.gameCount,
      importedGames,
      isPrivateOrEmpty: false,
    };
  }
}

export const libraryImportService = new LibraryImportService();
