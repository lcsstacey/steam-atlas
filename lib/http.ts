import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireCurrentSessionUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: jsonError("Authentication required.", 401) };
  }

  return { user, response: null };
}
