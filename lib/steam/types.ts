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
};
