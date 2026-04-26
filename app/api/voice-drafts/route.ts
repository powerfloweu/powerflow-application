/**
 * GET  /api/voice-drafts — current draft for user (editing_voice_id IS NULL)
 * POST /api/voice-drafts — create a blank draft for new-voice flow
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import type { VoiceDraft } from "@/lib/voices";

type DraftRow = VoiceDraft;

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json(null);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<DraftRow>("voice_drafts", {
    user_id: `eq.${user.id}`,
    editing_voice_id: "is.null",
    order: "updated_at.desc",
    limit: "1",
    select: "id,user_id,editing_voice_id,state,updated_at",
  });

  return NextResponse.json(rows[0] ?? null);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST() {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await dbInsert("voice_drafts", {
    user_id: user.id,
    editing_voice_id: null,
    state: { current_step: 1 },
  });

  if (!row) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  return NextResponse.json({ id: row.id, state: { current_step: 1 } }, { status: 201 });
}
