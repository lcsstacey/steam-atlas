import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireCurrentSessionUser } from "@/lib/http";
import {
  createTag,
  deleteTag,
  listTagsWithCounts,
} from "@/lib/services/custom-tags-service";

export async function GET() {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const tags = await listTagsWithCounts(user.id);
  return NextResponse.json({ tags });
}

const createSchema = z.object({
  label: z.string().min(1).max(40),
  color: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid tag payload.");

  try {
    const tag = await createTag(user.id, parsed.data.label, parsed.data.color ?? null);
    return NextResponse.json({ tag });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create tag.");
  }
}

export async function DELETE(request: Request) {
  const { user, response } = await requireCurrentSessionUser();
  if (response) return response;

  const url = new URL(request.url);
  const tagId = url.searchParams.get("id");
  if (!tagId) return jsonError("Missing tag id.");
  await deleteTag(user.id, tagId);
  return NextResponse.json({ ok: true });
}
