import { describe, expect, it } from "vitest";
import { RecommendationService, scoreGame } from "@/lib/services/recommendation-service";
import type { LibraryGame } from "@/lib/types";

function game(overrides: Partial<LibraryGame>): LibraryGame {
  return {
    id: overrides.id ?? String(overrides.appId ?? Math.random()),
    appId: overrides.appId ?? 1,
    name: overrides.name ?? "Test Game",
    iconUrl: null,
    headerUrl: null,
    playtimeMinutes: overrides.playtimeMinutes ?? 0,
    playtimeTwoWeeksMinutes: overrides.playtimeTwoWeeksMinutes ?? 0,
    lastPlayedAt: overrides.lastPlayedAt ?? null,
    manualStatus: overrides.manualStatus ?? null,
    genres: overrides.genres ?? [],
    categories: overrides.categories ?? [],
    tags: overrides.tags ?? [],
  };
}

describe("RecommendationService", () => {
  it("boosts low-playtime games that match the user's taste profile", () => {
    const service = new RecommendationService();
    const favorites = [
      game({ appId: 10, name: "Deep RPG", playtimeMinutes: 6000, genres: ["RPG"], tags: ["Open World"] }),
      game({ appId: 11, name: "Strategy RPG", playtimeMinutes: 2400, genres: ["RPG"], tags: ["Tactical"] }),
    ];
    const profile = service.buildTasteProfile(favorites);
    const matchingBacklog = game({ appId: 20, name: "Untouched RPG", playtimeMinutes: 0, genres: ["RPG"] });
    const unrelatedBacklog = game({ appId: 21, name: "Racer", playtimeMinutes: 0, genres: ["Racing"] });

    expect(scoreGame(matchingBacklog, profile, "BACKLOG_GEM", 0)).toBeGreaterThan(
      scoreGame(unrelatedBacklog, profile, "BACKLOG_GEM", 0),
    );
  });

  it("excludes not interested games from recommendation lists", () => {
    const service = new RecommendationService();
    const recommendations = service.recommend(
      [
        game({ appId: 1, name: "Favorite RPG", playtimeMinutes: 2000, genres: ["RPG"] }),
        game({ appId: 2, name: "Hidden RPG", playtimeMinutes: 0, genres: ["RPG"], manualStatus: "NOT_INTERESTED" }),
        game({ appId: 3, name: "Open RPG", playtimeMinutes: 0, genres: ["RPG"] }),
      ],
      "BACKLOG_GEM",
      { count: 5, seed: 1 },
    );

    expect(recommendations.map((recommendation) => recommendation.game.name)).not.toContain("Hidden RPG");
    expect(recommendations.map((recommendation) => recommendation.game.name)).toContain("Open RPG");
  });

  it("prioritizes briefly tried games in retry mode", () => {
    const service = new RecommendationService();
    const recommendations = service.recommend(
      [
        game({ appId: 1, name: "Favorite RPG", playtimeMinutes: 2000, genres: ["RPG"] }),
        game({ appId: 2, name: "Brief RPG", playtimeMinutes: 42, genres: ["RPG"] }),
        game({ appId: 3, name: "Never RPG", playtimeMinutes: 0, genres: ["RPG"] }),
      ],
      "RETRY_THIS",
      { count: 5, seed: 1 },
    );

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].game.name).toBe("Brief RPG");
  });
});
