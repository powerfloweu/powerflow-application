/**
 * GET  /api/meet-reflections?meet_date=YYYY-MM-DD[&athlete_id=x]
 *   Returns the single reflection row for (athlete, meet_date).
 *
 * GET  /api/meet-reflections?athlete_id=x          (no meet_date)
 *   Returns all reflection rows for the athlete, newest first (coach use).
 *
 * POST /api/meet-reflections
 *   Body: { meet_date, athlete_id?, answers }
 *   Upserts (athlete_id, meet_date) — merges answer keys, doesn't overwrite.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function isCoachOf(coachId: string, athleteId: string): Promise<boolean> {
  const rows = await dbSelect<{ id: string }>("profiles", {
    select: "id",
    id: `eq.${athleteId}`,
    coach_id: `eq.${coachId}`,
  });
  return rows.length > 0;
}

export type ReflectionRow = {
  id: string;
  athlete_id: string;
  meet_date: string;
  answers: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const meetDate  = searchParams.get("meet_date");
  const athleteId = searchParams.get("athlete_id") ?? userId;

  if (athleteId !== userId && !await isCoachOf(userId, athleteId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params: Record<string, string> = {
    select: "id,athlete_id,meet_date,answers,created_at,updated_at",
    athlete_id: `eq.${athleteId}`,
    order: "meet_date.desc",
  };
  if (meetDate) params.meet_date = `eq.${meetDate}`;

  const rows = await dbSelect<ReflectionRow>("meet_reflections", params);

  // Single-meet mode: return object or null
  if (meetDate) return NextResponse.json(rows[0] ?? null);

  // History mode: return array
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { meet_date?: string; athlete_id?: string; answers?: Record<string, string> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { meet_date, answers } = body;
  const athleteId = body.athlete_id ?? userId;

  if (!meet_date) return NextResponse.json({ error: "meet_date required" }, { status: 400 });
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }

  if (athleteId !== userId && !await isCoachOf(userId, athleteId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await dbSelect<ReflectionRow>("meet_reflections", {
    select: "id,answers",
    athlete_id: `eq.${athleteId}`,
    meet_date:  `eq.${meet_date}`,
  });

  if (existing.length > 0) {
    const merged = { ...existing[0].answers, ...answers };
    await dbPatch(
      "meet_reflections",
      { id: `eq.${existing[0].id}` },
      { answers: merged, updated_at: new Date().toISOString() },
    );
    return NextResponse.json({ ok: true, merged: true });
  }

  await dbInsert("meet_reflections", { athlete_id: athleteId, meet_date, answers });
  return NextResponse.json({ ok: true, merged: false }, { status: 201 });
}
