/**
 * GET   /api/meet-attempts?meet_date=YYYY-MM-DD              — athlete's own attempts
 * GET   /api/meet-attempts?athlete_id=x&meet_date=YYYY-MM-DD — coach fetches athlete's attempts
 * POST  /api/meet-attempts  — upsert an attempt { lift, attempt_num, planned_kg?, actual_kg?, result?, notes? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
export const runtime = "nodejs";

type AttemptRow = {
  id: string; athlete_id: string; meet_date: string;
  lift: string; attempt_num: number;
  planned_kg: number | null; actual_kg: number | null;
  result: string | null; notes: string | null;
  created_at: string; updated_at: string;
};

async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

async function isCoachOf(coachId: string, athleteId: string): Promise<boolean> {
  const rows = await dbSelect<{ coach_id: string | null }>("profiles", { id: `eq.${athleteId}`, select: "coach_id" });
  return rows[0]?.coach_id === coachId;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const meetDate = sp.get("meet_date");
  const requestedAthleteId = sp.get("athlete_id");

  const targetId = requestedAthleteId ?? userId;

  if (targetId !== userId && !await isCoachOf(userId, targetId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params: Record<string, string> = {
    athlete_id: `eq.${targetId}`,
    select: "id,lift,attempt_num,planned_kg,actual_kg,result,notes,meet_date",
    order: "lift.asc,attempt_num.asc",
  };
  if (meetDate) params.meet_date = `eq.${meetDate}`;
  const rows = await dbSelect<AttemptRow>("meet_attempts", params);
  return NextResponse.json(rows);
}

/**
 * PATCH /api/meet-attempts — coach updates planned_kg for an athlete's attempt
 * Body: { athlete_id, lift, attempt_num, meet_date, planned_kg }
 */
export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { athlete_id: string; lift: string; attempt_num: number; meet_date: string; planned_kg: number | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { athlete_id, lift, attempt_num, meet_date, planned_kg } = body;
  if (!athlete_id || !lift || !attempt_num || !meet_date) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (athlete_id === userId) return NextResponse.json({ error: "Use POST for your own attempts" }, { status: 400 });
  if (!await isCoachOf(userId, athlete_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await dbSelect<{ id: string }>("meet_attempts", {
    athlete_id: `eq.${athlete_id}`, meet_date: `eq.${meet_date}`,
    lift: `eq.${lift}`, attempt_num: `eq.${attempt_num}`, select: "id",
  });
  const data: Record<string, unknown> = { planned_kg, updated_at: new Date().toISOString() };
  if (existing.length > 0) {
    await dbPatch("meet_attempts", { id: existing[0].id }, data);
    return NextResponse.json({ ok: true, id: existing[0].id });
  } else {
    const inserted = await dbInsert("meet_attempts", { ...data, athlete_id, meet_date, lift, attempt_num });
    return NextResponse.json({ ok: true, id: inserted?.id });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { lift: string; attempt_num: number; meet_date: string; planned_kg?: number | null; actual_kg?: number | null; result?: string | null; notes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { lift, attempt_num, meet_date, planned_kg, actual_kg, result, notes } = body;
  if (!lift || !attempt_num || !meet_date) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const existing = await dbSelect<{ id: string }>("meet_attempts", {
    athlete_id: `eq.${userId}`, meet_date: `eq.${meet_date}`, lift: `eq.${lift}`, attempt_num: `eq.${attempt_num}`, select: "id",
  });

  const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (planned_kg !== undefined) data.planned_kg = planned_kg;
  if (actual_kg  !== undefined) data.actual_kg  = actual_kg;
  if (result     !== undefined) data.result     = result;
  if (notes      !== undefined) data.notes      = notes;

  if (existing.length > 0) {
    await dbPatch("meet_attempts", { id: existing[0].id }, data);
    return NextResponse.json({ ok: true, id: existing[0].id });
  } else {
    const inserted = await dbInsert("meet_attempts", { ...data, athlete_id: userId, meet_date, lift, attempt_num });
    return NextResponse.json({ ok: true, id: inserted?.id });
  }
}
