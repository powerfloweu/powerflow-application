/**
 * PATCH  /api/voice-drafts/:id — merge state update into the existing draft
 * DELETE /api/voice-drafts/:id — delete draft (called after successful voice save)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch, dbDelete } from "@/lib/supabaseAdmin";
import type { VoiceDraft } from "@/lib/voices";

type Params = { params: Promise<{ id: string }> };

type DraftRow = VoiceDraft;

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const existing = await dbSelect<DraftRow>("voice_drafts", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: "id,state",
  });
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { state: Partial<VoiceDraft["state"]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Merge incoming state with existing state
  const merged = { ...existing[0].state, ...(body.state ?? {}) };

  const ok = await dbPatch(
    "voice_drafts",
    { id, user_id: user.id },
    { state: merged, updated_at: new Date().toISOString() },
  );

  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, state: merged });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership before deleting
  const existing = await dbSelect<{ id: string }>("voice_drafts", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: "id",
  });
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await dbDelete("voice_drafts", { id, user_id: user.id });
  return new NextResponse(null, { status: 204 });
}
