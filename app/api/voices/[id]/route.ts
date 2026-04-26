/**
 * GET    /api/voices/:id — single voice (must belong to user)
 * PATCH  /api/voices/:id — update voice fields
 * DELETE /api/voices/:id — delete voice (journal_entries.voice_id → null via DB cascade)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch, dbDelete } from "@/lib/supabaseAdmin";
import type { Voice, UpdateVoiceRequest } from "@/lib/voices";

type Params = { params: Promise<{ id: string }> };

type VoiceRow = Omit<Voice, "thought_count">;

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rows = await dbSelect<VoiceRow>("voices", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: [
      "id", "user_id", "name", "shape", "shape_custom_description",
      "color", "size", "tone", "volume", "body_locations",
      "current_distance", "current_side", "desired_distance", "desired_side",
      "helps_when", "helps_note", "created_at", "updated_at",
    ].join(","),
  });

  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const existing = await dbSelect<{ id: string }>("voices", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: "id",
  });
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: UpdateVoiceRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const PATCHABLE: Array<keyof UpdateVoiceRequest> = [
    "name", "shape", "shape_custom_description", "color", "size",
    "tone", "volume", "body_locations",
    "current_distance", "current_side", "desired_distance", "desired_side",
    "helps_when", "helps_note",
  ];

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of PATCHABLE) {
    if (key in body) patch[key] = body[key] ?? null;
  }

  if (typeof patch.name === "string") {
    patch.name = (patch.name as string).trim().slice(0, 60);
    if (!patch.name) delete patch.name;
  }

  const ok = await dbPatch("voices", { id, user_id: user.id }, patch);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership before deleting
  const existing = await dbSelect<{ id: string }>("voices", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: "id",
  });
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await dbDelete("voices", { id, user_id: user.id });
  return new NextResponse(null, { status: 204 });
}
