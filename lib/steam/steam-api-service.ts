import { requireServerEnv } from "@/lib/env";
import type {
  SteamOwnedGame,
  SteamOwnedGamesResponse,
  SteamPlayerSummary,
  SteamStoreMetadata,
} from "@/lib/steam/types";

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_API_BASE = "https://store.steampowered.com/api";

export class SteamApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SteamApiError";
  }
}

async function fetchJson<T>(url: string, init?: RequestInit, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...init?.headers,
        },
      });

      if (!response.ok) {
        throw new SteamApiError(
          `Steam API returned ${response.status} for ${new URL(url).pathname}`,
          response.status,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new SteamApiError("Steam API request failed.");
}

export class SteamApiService {
  private get apiKey() {
    return requireServerEnv("STEAM_API_KEY");
  }

  async getPlayerSummary(steamId: string): Promise<SteamPlayerSummary> {
    const url = new URL("/ISteamUser/GetPlayerSummaries/v0002/", STEAM_API_BASE);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("steamids", steamId);

    const data = await fetchJson<{ response?: { players?: SteamPlayerSummary[] } }>(
      url.toString(),
    );
    const player = data.response?.players?.[0];

    if (!player) {
      throw new SteamApiError("Steam profile was not found.");
    }

    return player;
  }

  async getOwnedGames(steamId: string) {
    const url = new URL("/IPlayerService/GetOwnedGames/v0001/", STEAM_API_BASE);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("format", "json");
    url.searchParams.set("include_appinfo", "true");
    url.searchParams.set("include_played_free_games", "true");

    const data = await fetchJson<SteamOwnedGamesResponse>(url.toString());
    const games = data.response?.games ?? [];

    return {
      gameCount: data.response?.game_count ?? games.length,
      games,
      isPrivateOrEmpty: !data.response?.games,
    };
  }

  async getStoreMetadata(appId: number): Promise<SteamStoreMetadata | null> {
    const url = new URL("/appdetails", STEAM_STORE_API_BASE);
    url.searchParams.set("appids", String(appId));
    url.searchParams.set("filters", "genres,categories");

    const data = await fetchJson<Record<string, { success: boolean; data?: unknown }>>(
      url.toString(),
      {},
      1,
    );
    const app = data[String(appId)];
    if (!app?.success || !app.data || typeof app.data !== "object") return null;

    const record = app.data as {
      genres?: Array<{ description?: string }>;
      categories?: Array<{ description?: string }>;
    };

    return {
      genres: cleanLabels(record.genres?.map((genre) => genre.description)),
      categories: cleanLabels(record.categories?.map((category) => category.description)),
      tags: [],
    };
  }
}

export function buildSteamIconUrl(game: Pick<SteamOwnedGame, "appid" | "img_icon_url">) {
  if (!game.img_icon_url) return null;
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;
}

export function buildSteamHeaderUrl(appId: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

function cleanLabels(values?: Array<string | undefined>) {
  return [...new Set((values ?? []).filter((value): value is string => Boolean(value)))];
}

export const steamApiService = new SteamApiService();
