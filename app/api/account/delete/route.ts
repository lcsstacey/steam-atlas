import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { getAppBaseUrl } from "@/lib/env";
import { jsonError, requireCurrentSessionUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  await prisma.user.delete({ where: { id: user.id } });

  const nextResponse = NextResponse.json({
    ok: true,
    redirectTo: new URL("/", getAppBaseUrl(request)).toString(),
  });
  clearSessionCookie(nextResponse);
  return nextResponse;
}

export async function POST(request: NextRequest) {
  try {
    return await DELETE(request);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not delete account.", 500);
  }
}
