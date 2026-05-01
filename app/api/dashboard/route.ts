import { NextResponse } from "next/server";
import { requireCurrentSessionUser } from "@/lib/http";
import { libraryAnalysisService } from "@/lib/services/library-analysis-service";

export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const dashboard = await libraryAnalysisService.getDashboard(user);
  return NextResponse.json(dashboard);
}
