import { NextResponse } from "next/server";
import { requireCurrentSessionUser } from "@/lib/http";
import { libraryImportService } from "@/lib/services/library-import-service";

export async function POST() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const result = await libraryImportService.importForSteamId(user.steamId);
  return NextResponse.json(result);
}
