/**
 * GET  /api/voices — list all voices for the current user, each with thought_count
 * POST /api/voices — create a new voice
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import type { Voice, CreateVoiceRequest } from "@/lib/voices";

type VoiceRow = Omit<Voice, "thought_count">;

type JournalEntryVoiceRow = {
  id: string;
  voice_id: string | null;
};

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json({ voices: [] });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const voices = await dbSelect<VoiceRow>("voices", {
    user_id: `eq.${user.id}`,
    order: "updated_at.desc",
    select: [
      "id", "user_id", "name", "shape", "shape_custom_description",
      "color", "size", "tone", "volume", "body_locations",
      "current_distance", "current_side", "desired_distance", "desired_side",
      "helps_when", "helps_note", "created_at", "updated_at",
    ].join(","),
  });

  if (!voices.length) {
    return NextResponse.json({ voices: [] });
  }

  // Fetch journal entries linked to any of these voices to compute thought_count
  const voiceIds = voices.map((v) => v.id);
  const linkedEntries = await dbSelect<JournalEntryVoiceRow>("journal_entries", {
    user_id: `eq.${user.id}`,
    voice_id: `in.(${voiceIds.join(",")})`,
    select: "id,voice_id",
    limit: "5000",
  });

  // Group counts client-side
  const countMap: Record<string, number> = {};
  for (const entry of linkedEntries) {
    if (entry.voice_id) {
      countMap[entry.voice_id] = (countMap[entry.voice_id] ?? 0) + 1;
    }
  }

  const result = voices.map((v) => ({
    ...v,
    thought_count: countMap[v.id] ?? 0,
  }));

  return NextResponse.json({ voices: result });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateVoiceRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const row = await dbInsert("voices", {
    user_id: user.id,
    name: String(body.name).trim().slice(0, 60),
    shape: body.shape ?? "cloud",
    shape_custom_description: body.shape_custom_description ?? null,
    color: body.color ?? "#7DD3FC",
    size: body.size ?? 3,
    tone: body.tone ?? 50,
    volume: body.volume ?? 50,
    body_locations: body.body_locations ?? [],
    current_distance: body.current_distance ?? "close",
    current_side: body.current_side ?? "front",
    desired_distance: body.desired_distance ?? "arm",
    desired_side: body.desired_side ?? "front",
    helps_when: body.helps_when ?? [],
    helps_note: body.helps_note ?? "",
  });

  if (!row) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  return NextResponse.json(row, { status: 201 });
}
