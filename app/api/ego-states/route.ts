/**
 * GET  /api/ego-states — list all ego states for the current user
 * POST /api/ego-states — create a new ego state
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import type { EgoState, CreateEgoStateRequest } from "@/lib/egoStates";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json([]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let rows: EgoState[] = [];
  try {
    rows = await dbSelect<EgoState>("ego_states", {
      user_id: `eq.${user.id}`,
      order: "sort_order.asc,created_at.asc",
    });
  } catch {
    // Table may not exist yet — migration pending
    return NextResponse.json([]);
  }

  return NextResponse.json(rows);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateEgoStateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const row = await dbInsert("ego_states", {
    user_id: user.id,
    name: String(body.name).trim().slice(0, 80),
    color: body.color ?? "#7C3AED",
    posture: body.posture ?? null,
    body_feeling: body.body_feeling ?? null,
    voice_tone: body.voice_tone ?? null,
    origin_story: body.origin_story ?? null,
    domain: body.domain ?? null,
    shadow_side: body.shadow_side ?? null,
    activation_ritual: body.activation_ritual ?? null,
    sort_order: 0,
  });

  if (!row) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  return NextResponse.json(row, { status: 201 });
}
