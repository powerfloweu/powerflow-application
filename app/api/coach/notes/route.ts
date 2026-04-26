/**
 * GET  /api/coach/notes                    → all notes for this coach keyed by athlete_id
 * GET  /api/coach/notes?athlete_id=<uuid>  → single note { content, updated_at }
 * PUT  /api/coach/notes                    → body: { athlete_id, content } — upserts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";

type NoteRow = {
  id: string;
  coach_id: string;
  athlete_id: string;
  content: string;
  updated_at: string;
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

  if (athleteId) {
    // Return single note
    const rows = await dbSelect<NoteRow>("coach_notes", {
      coach_id: `eq.${user.id}`,
      athlete_id: `eq.${athleteId}`,
      select: "id,content,updated_at",
    });
    if (!rows.length) return NextResponse.json({ content: "", updated_at: null });
    return NextResponse.json({ content: rows[0].content, updated_at: rows[0].updated_at });
  }

  // Return all notes for this coach keyed by athlete_id
  const rows = await dbSelect<NoteRow>("coach_notes", {
    coach_id: `eq.${user.id}`,
    select: "id,athlete_id,content,updated_at",
  });

  const result: Record<string, { content: string; updated_at: string }> = {};
  for (const row of rows) {
    result[row.athlete_id] = { content: row.content, updated_at: row.updated_at };
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
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

  let body: { athlete_id: string; content: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.athlete_id) return NextResponse.json({ error: "athlete_id required" }, { status: 400 });

  const now = new Date().toISOString();

  // Check if note already exists
  const existing = await dbSelect<NoteRow>("coach_notes", {
    coach_id: `eq.${user.id}`,
    athlete_id: `eq.${body.athlete_id}`,
    select: "id",
  });

  if (existing.length > 0) {
    const ok = await dbPatch(
      "coach_notes",
      { id: existing[0].id },
      { content: body.content, updated_at: now },
    );
    if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } else {
    const inserted = await dbInsert("coach_notes", {
      coach_id: user.id,
      athlete_id: body.athlete_id,
      content: body.content,
      updated_at: now,
    });
    if (!inserted) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated_at: now });
}
