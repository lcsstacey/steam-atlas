import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { cache } from "react";
import { getAuthSecret } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

const SESSION_COOKIE = "steam_atlas_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  steamId: string;
  iat: number;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function verifySignedValue(value: string) {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as SessionPayload;
    if (!parsed.userId || !parsed.steamId || !parsed.iat) return null;

    const ageMs = Date.now() - parsed.iat;
    if (ageMs > SESSION_MAX_AGE_SECONDS * 1000) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function createSessionValue(payload: Omit<SessionPayload, "iat">) {
  const encoded = encodeBase64Url(
    JSON.stringify({
      ...payload,
      iat: Date.now(),
    }),
  );

  return `${encoded}.${sign(encoded)}`;
}

export function setSessionCookie(
  response: NextResponse,
  payload: Omit<SessionPayload, "iat">,
) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionValue(payload),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySignedValue(raw);
}

// Wrapped in React's request-scoped cache() so multiple server components
// in the same render (e.g. layout + page) share a single DB lookup instead
// of round-tripping per call site.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { steamProfile: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    steamId: user.steamId,
    displayName: user.steamProfile?.displayName ?? "Steam Player",
    avatarUrl: user.steamProfile?.avatarFullUrl ?? user.steamProfile?.avatarUrl ?? null,
    profileUrl: user.steamProfile?.profileUrl ?? null,
    lastLibraryImportAt: user.lastLibraryImportAt?.toISOString() ?? null,
  };
});
