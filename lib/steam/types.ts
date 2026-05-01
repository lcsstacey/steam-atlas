export type SteamPlayerSummary = {
  steamid: string;
  communityvisibilitystate?: number;
  profilestate?: number;
  personaname?: string;
  profileurl?: string;
  avatar?: string;
  avatarmedium?: string;
  avatarfull?: string;
  personastate?: number;
};

export type SteamOwnedGame = {
  appid: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  img_icon_url?: string;
  rtime_last_played?: number;
};

export type SteamOwnedGamesResponse = {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
};

export type SteamStoreMetadata = {
  genres: string[];
  categories: string[];
  tags: string[];
  /**
   * Steam Deck verified status, when the storefront returns it.
   * "verified" | "playable" | "unsupported" | "unknown"
   */
  deckCompat: "verified" | "playable" | "unsupported" | "unknown";
};

export type SteamFriend = {
  steamid: string;
  relationship?: string;
  friend_since?: number;
};

export type SteamGameSchema = {
  game?: {
    gameName?: string;
    availableGameStats?: {
      achievements?: Array<{
        name: string;
        displayName?: string;
        description?: string;
        icon?: string;
        icongray?: string;
        hidden?: 0 | 1;
      }>;
    };
  };
};

export type SteamPlayerAchievement = {
  apiname: string;
  achieved: 0 | 1;
  unlocktime?: number;
  name?: string;
  description?: string;
};

export type SteamPlayerAchievementsResponse = {
  playerstats?: {
    steamID?: string;
    gameName?: string;
    success?: boolean;
    error?: string;
    achievements?: SteamPlayerAchievement[];
  };
};

export type SteamWishlistItem = {
  appid: number;
  name: string;
  priority?: number;
  capsule?: string;
};
