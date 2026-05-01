import { NextResponse } from "next/server";
import { requireCurrentSessionUser } from "@/lib/http";
import { libraryAnalysisService } from "@/lib/services/library-analysis-service";

export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const games = await libraryAnalysisService.getLibrary(user.id);
  return NextResponse.json({
    isPrivateOrEmpty: games.length === 0,
    games,
  });
}
