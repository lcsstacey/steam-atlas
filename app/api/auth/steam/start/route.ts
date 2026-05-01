import { NextRequest, NextResponse } from "next/server";
import { steamAuthService } from "@/lib/auth/steam-openid";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(steamAuthService.getLoginUrl(request));
}
