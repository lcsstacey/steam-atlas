import type { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/env";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_OPENID_NS = "http://specs.openid.net/auth/2.0";
const STEAM_IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";

export class SteamAuthService {
  getLoginUrl(request: NextRequest) {
    const baseUrl = getAppBaseUrl(request);
    const callbackUrl = `${baseUrl}/api/auth/steam/callback`;
    const params = new URLSearchParams({
      "openid.ns": STEAM_OPENID_NS,
      "openid.mode": "checkid_setup",
      "openid.return_to": callbackUrl,
      "openid.realm": baseUrl,
      "openid.identity": STEAM_IDENTIFIER_SELECT,
      "openid.claimed_id": STEAM_IDENTIFIER_SELECT,
    });

    return `${STEAM_OPENID_URL}?${params.toString()}`;
  }

  async verifyCallback(request: NextRequest) {
    const params = new URLSearchParams(request.nextUrl.searchParams);
    params.set("openid.mode", "check_authentication");

    const response = await fetch(STEAM_OPENID_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Steam OpenID verification failed.");
    }

    const body = await response.text();
    if (!body.includes("is_valid:true")) {
      throw new Error("Steam OpenID did not validate the sign-in response.");
    }

    const claimedId = request.nextUrl.searchParams.get("openid.claimed_id");
    const match = claimedId?.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
    const steamId = match?.[1];

    if (!steamId) {
      throw new Error("Steam OpenID did not return a valid SteamID64.");
    }

    return { steamId };
  }
}

export const steamAuthService = new SteamAuthService();
