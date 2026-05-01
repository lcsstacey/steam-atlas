import { requireServerEnv } from "@/lib/env";
import type {
  SteamFriend,
  SteamGameSchema,
  SteamOwnedGame,
  SteamOwnedGamesResponse,
  SteamPlayerAchievementsResponse,
  SteamPlayerSummary,
  SteamStoreMetadata,
  SteamWishlistItem,
} from "@/lib/steam/types";

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_API_BASE = "https://store.steampowered.com/api";
const STEAM_COMMUNITY_BASE = "https://store.steampowered.com";

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

  async getPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]> {
    if (steamIds.length === 0) return [];
    // GetPlayerSummaries accepts up to 100 ids per call
    const chunks: string[][] = [];
    for (let i = 0; i < steamIds.length; i += 100) {
      chunks.push(steamIds.slice(i, i + 100));
    }

    const results: SteamPlayerSummary[] = [];
    for (const chunk of chunks) {
      const url = new URL("/ISteamUser/GetPlayerSummaries/v0002/", STEAM_API_BASE);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("steamids", chunk.join(","));
      const data = await fetchJson<{ response?: { players?: SteamPlayerSummary[] } }>(
        url.toString(),
      );
      results.push(...(data.response?.players ?? []));
    }
    return results;
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

  /**
   * Storefront-level metadata: genres, categories, and Steam Deck compatibility
   * (which the storefront exposes inline via the `category` records).
   */
  async getStoreMetadata(appId: number): Promise<SteamStoreMetadata | null> {
    const url = new URL("/appdetails", STEAM_STORE_API_BASE);
    url.searchParams.set("appids", String(appId));
    url.searchParams.set("filters", "genres,categories,platforms");

    const data = await fetchJson<Record<string, { success: boolean; data?: unknown }>>(
      url.toString(),
      {},
      1,
    );
    const app = data[String(appId)];
    if (!app?.success || !app.data || typeof app.data !== "object") return null;

    const record = app.data as {
      genres?: Array<{ description?: string }>;
      categories?: Array<{ id?: number; description?: string }>;
    };

    const categories = cleanLabels(record.categories?.map((category) => category.description));
    const deckCompat = inferDeckCompatFromCategories(record.categories);

    return {
      genres: cleanLabels(record.genres?.map((genre) => genre.description)),
      categories,
      tags: [],
      deckCompat,
    };
  }

  /**
   * Concurrent player count for an app. Free, no key needed.
   */
  async getCurrentPlayers(appId: number): Promise<number | null> {
    const url = new URL("/ISteamUserStats/GetNumberOfCurrentPlayers/v1/", STEAM_API_BASE);
    url.searchParams.set("appid", String(appId));

    try {
      const data = await fetchJson<{
        response?: { player_count?: number; result?: number };
      }>(url.toString(), {}, 1);
      const count = data.response?.player_count;
      return typeof count === "number" ? count : null;
    } catch {
      return null;
    }
  }

  /**
   * Game's achievement schema — gives us the total achievement count
   * and per-achievement display names/icons.
   */
  async getGameSchema(appId: number): Promise<SteamGameSchema | null> {
    const url = new URL("/ISteamUserStats/GetSchemaForGame/v2/", STEAM_API_BASE);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("appid", String(appId));

    try {
      return await fetchJson<SteamGameSchema>(url.toString(), {}, 1);
    } catch {
      return null;
    }
  }

  /**
   * Per-user achievement state for one game.
   * Returns null when the user has no stats (e.g. private profile, or game has none).
   */
  async getPlayerAchievements(steamId: string, appId: number) {
    const url = new URL("/ISteamUserStats/GetPlayerAchievements/v1/", STEAM_API_BASE);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("appid", String(appId));

    try {
      const data = await fetchJson<SteamPlayerAchievementsResponse>(url.toString(), {}, 1);
      if (!data.playerstats?.success) return null;
      return data.playerstats.achievements ?? [];
    } catch {
      return null;
    }
  }

  async getFriendList(steamId: string): Promise<SteamFriend[]> {
    const url = new URL("/ISteamUser/GetFriendList/v0001/", STEAM_API_BASE);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("relationship", "friend");

    try {
      const data = await fetchJson<{ friendslist?: { friends?: SteamFriend[] } }>(
        url.toString(),
        {},
        1,
      );
      return data.friendslist?.friends ?? [];
    } catch {
      // Private friends list throws — that's expected.
      return [];
    }
  }

  /**
   * Public wishlist endpoint. Steam used to expose `wishlist/profiles/<id>/wishlistdata`
   * which still works for most public profiles but is undocumented and rate-limited.
   */
  async getWishlist(steamId: string): Promise<SteamWishlistItem[]> {
    const url = `${STEAM_COMMUNITY_BASE}/wishlist/profiles/${steamId}/wishlistdata/`;

    try {
      const data = await fetchJson<Record<
        string,
        { name?: string; capsule?: string; priority?: number }
      >>(url, {}, 1);

      return Object.entries(data).map(([appid, value]) => ({
        appid: Number(appid),
        name: value.name ?? `App ${appid}`,
        capsule: value.capsule ?? undefined,
        priority: typeof value.priority === "number" ? value.priority : undefined,
      }));
    } catch {
      // Private wishlist or other failure
      return [];
    }
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

/**
 * Steam Deck compatibility category IDs (from /appdetails categories):
 *   42 = Steam Deck Verified
 *   43 = Steam Deck Playable
 *   44 = Steam Deck Unsupported
 *   45 = Steam Deck Untested (rarely shown)
 */
function inferDeckCompatFromCategories(
  categories?: Array<{ id?: number; description?: string }>,
): SteamStoreMetadata["deckCompat"] {
  if (!categories) return "unknown";
  const idSet = new Set(categories.map((category) => category.id));
  const labelSet = new Set(
    categories
      .map((category) => category.description?.toLowerCase() ?? "")
      .filter(Boolean),
  );

  if (idSet.has(42) || labelSet.has("steam deck verified")) return "verified";
  if (idSet.has(43) || labelSet.has("steam deck playable")) return "playable";
  if (idSet.has(44) || labelSet.has("steam deck unsupported")) return "unsupported";
  return "unknown";
}

export const steamApiService = new SteamApiService();
