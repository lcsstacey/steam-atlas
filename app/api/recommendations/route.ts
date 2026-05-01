import { NextRequest, NextResponse } from "next/server";
import type { RecommendationMode } from "@/app/generated/prisma/enums";
import { requireCurrentSessionUser } from "@/lib/http";
import { libraryAnalysisService } from "@/lib/services/library-analysis-service";
import {
  RECOMMENDATION_MODES,
  recommendationService,
} from "@/lib/services/recommendation-service";

export async function GET(request: NextRequest) {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const games = await libraryAnalysisService.getLibrary(user.id);
  const requestedMode = request.nextUrl.searchParams.get("mode") as RecommendationMode | null;
  const knownModes = new Set(RECOMMENDATION_MODES.map((entry) => entry.mode));

  if (requestedMode && knownModes.has(requestedMode)) {
    const recommendations = recommendationService.recommend(games, requestedMode, {
      count: 8,
      seed: Date.now(),
    });
    await recommendationService.persist(user.id, recommendations.slice(0, 3));
    return NextResponse.json({
      mode: requestedMode,
      recommendations,
    });
  }

  const groups = recommendationService.recommendAll(games, 6);
  await recommendationService.persist(
    user.id,
    groups.flatMap((group) => group.recommendations.slice(0, 2)),
  );

  return NextResponse.json({ groups });
}
