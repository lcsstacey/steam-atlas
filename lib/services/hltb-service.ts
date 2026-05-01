/**
 * Lightweight HowLongToBeat client. HLTB has no official public API; this
 * uses the same internal POST endpoint their search box uses. We:
 *   1. Cache aggressively (per-game minute counts in the Game table)
 *   2. Throttle calls — never burst more than 1 per second
 *   3. Treat failures as "unknown" rather than throwing
 *
 * The endpoint returns an array of game records with `comp_main`,
 * `comp_plus`, and `comp_100` in seconds.
 */

const HLTB_SEARCH_URL = "https://howlongtobeat.com/api/seek/9eb04c3f4e2c7d8a";
const HLTB_REFERRER = "https://howlongtobeat.com";

export type HltbResult = {
  mainMinutes: number | null;
  extraMinutes: number | null;
  completionistMinutes: number | null;
};

type HltbGameRecord = {
  game_name?: string;
  comp_main?: number; // seconds
  comp_plus?: number;
  comp_100?: number;
};

const EMPTY: HltbResult = {
  mainMinutes: null,
  extraMinutes: null,
  completionistMinutes: null,
};

// Module-level throttle state — one global queue tail across the process.
let throttleTail: Promise<void> = Promise.resolve();
function throttle(): Promise<void> {
  const wait = throttleTail.then(() => new Promise<void>((r) => setTimeout(r, 1100)));
  throttleTail = wait;
  return wait;
}

export class HltbService {
  /**
   * Lookup main / extra / completionist hours for a game by name.
   * Returns nulls on any failure (network, rate-limit, no match).
   */
  async lookup(name: string): Promise<HltbResult> {
    if (!name?.trim()) return EMPTY;
    await throttle();

    const trimmed = name.trim().slice(0, 80);
    const body = {
      searchType: "games",
      searchTerms: trimmed.split(/\s+/),
      searchPage: 1,
      size: 5,
      searchOptions: {
        games: {
          userId: 0,
          platform: "",
          sortCategory: "popular",
          rangeCategory: "main",
          rangeTime: { min: null, max: null },
          gameplay: { perspective: "", flow: "", genre: "" },
          rangeYear: { min: "", max: "" },
          modifier: "",
        },
        users: { sortCategory: "postcount" },
        lists: { sortCategory: "follows" },
        filter: "",
        sort: 0,
        randomizer: 0,
      },
      useCache: true,
    };

    try {
      const response = await fetch(HLTB_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: HLTB_REFERRER,
          Origin: HLTB_REFERRER,
          "User-Agent":
            "Mozilla/5.0 (compatible; SteamAtlas/1.0; +https://github.com/lcsstacey/steam-atlas)",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!response.ok) return EMPTY;

      const data = (await response.json()) as { data?: HltbGameRecord[] };
      const candidates = data.data ?? [];
      // Prefer exact name match, fall back to first popular result
      const exact = candidates.find(
        (entry) => entry.game_name?.toLowerCase() === trimmed.toLowerCase(),
      );
      const pick = exact ?? candidates[0];
      if (!pick) return EMPTY;

      const toMinutes = (seconds?: number): number | null => {
        if (!seconds || seconds <= 0) return null;
        return Math.round(seconds / 60);
      };

      return {
        mainMinutes: toMinutes(pick.comp_main),
        extraMinutes: toMinutes(pick.comp_plus),
        completionistMinutes: toMinutes(pick.comp_100),
      };
    } catch {
      return EMPTY;
    }
  }
}

export const hltbService = new HltbService();
