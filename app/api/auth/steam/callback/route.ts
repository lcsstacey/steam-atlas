import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { steamAuthService } from "@/lib/auth/steam-openid";
import { getAppBaseUrl } from "@/lib/env";
import { libraryImportService } from "@/lib/services/library-import-service";

export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl(request);

  try {
    const { steamId } = await steamAuthService.verifyCallback(request);
    const result = await libraryImportService.importForSteamId(steamId);
    const destination = new URL(
      result.isPrivateOrEmpty ? "/dashboard?state=private" : "/dashboard?scan=complete",
      baseUrl,
    );
    const response = NextResponse.redirect(destination);

    setSessionCookie(response, {
      userId: result.userId,
      steamId: result.steamId,
    });

    return response;
  } catch (error) {
    const destination = new URL("/", baseUrl);
    destination.searchParams.set(
      "auth_error",
      error instanceof Error ? error.message : "Steam sign-in failed.",
    );
    return NextResponse.redirect(destination);
  }
}
