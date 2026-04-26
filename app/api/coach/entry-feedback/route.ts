/**
 * POST /api/coach/entry-feedback
 *   body: { entry_id, athlete_id, content }
 *   → creates feedback row, returns { id, content, created_at }
 *
 * GET  /api/coach/entry-feedback?athlete_id=<uuid>
 *   → returns all feedback for that athlete as { [entry_id]: { id, content, created_at } }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";

type FeedbackRow = {
  id: string;
  coach_id: string;
  entry_id: string;
  athlete_id: string;
  content: string;
  created_at: string;
};

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({}, { status: 200 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify coach role
  const profiles = await dbSelect<{ id: string; role: string }>("profiles", {
    id: `eq.${user.id}`,
    role: "eq.coach",
    select: "id,role",
  });
  if (!profiles.length) return NextResponse.json({ error: "Not a coach" }, { status: 403 });

  const athleteId = req.nextUrl.searchParams.get("athlete_id");
  if (!athleteId) return NextResponse.json({ error: "athlete_id required" }, { status: 400 });

  const rows = await dbSelect<FeedbackRow>("entry_feedback", {
    athlete_id: `eq.${athleteId}`,
    coach_id: `eq.${user.id}`,
    select: "id,entry_id,content,created_at",
    order: "created_at.asc",
  });

  const result: Record<string, { id: string; content: string; created_at: string }> = {};
  for (const row of rows) {
    result[row.entry_id] = { id: row.id, content: row.content, created_at: row.created_at };
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify coach role
  const profiles = await dbSelect<{ id: string; role: string }>("profiles", {
    id: `eq.${user.id}`,
    role: "eq.coach",
    select: "id,role",
  });
  if (!profiles.length) return NextResponse.json({ error: "Not a coach" }, { status: 403 });

  let body: { entry_id: string; athlete_id: string; content: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.entry_id || !body.athlete_id || !body.content?.trim()) {
    return NextResponse.json({ error: "entry_id, athlete_id, and content are required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const inserted = await dbInsert<Record<string, unknown>>("entry_feedback", {
    coach_id: user.id,
    entry_id: body.entry_id,
    athlete_id: body.athlete_id,
    content: body.content.trim(),
    created_at: now,
  });

  if (!inserted) return NextResponse.json({ error: "Insert failed" }, { status: 500 });

  return NextResponse.json({ id: inserted.id, content: body.content.trim(), created_at: now });
}
