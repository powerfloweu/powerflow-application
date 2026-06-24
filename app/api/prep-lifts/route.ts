/**
 * GET    /api/prep-lifts              — athlete's own prep lifts
 * GET    /api/prep-lifts?athlete_id=x — coach fetches athlete's lifts (must be their coach)
 * POST   /api/prep-lifts              — athlete adds a prep lift
 * PATCH  /api/prep-lifts/[id]         — athlete edits / coach adds coach_notes
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch, dbDelete } from "@/lib/supabaseAdmin";
export const runtime = "nodejs";

type PrepLift = {
  id: string; athlete_id: string; lift: string; weight_kg: number | null;
  title: string | null; video_url: string | null; mux_playback_id: string | null;
  lift_date: string | null; athlete_notes: string | null; coach_notes: string | null;
  created_at: string; updated_at: string;
};

async function getUser(): Promise<{ id: string; role?: string } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id };
  } catch { return null; }
}

async function isCoachOf(coachId: string, athleteId: string): Promise<boolean> {
  const rows = await dbSelect<{ coach_id: string | null }>("profiles", { id: `eq.${athleteId}`, select: "coach_id" });
  return rows[0]?.coach_id === coachId;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const athleteId = new URL(req.url).searchParams.get("athlete_id") ?? user.id;
  if (athleteId !== user.id && !await isCoachOf(user.id, athleteId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await dbSelect<PrepLift>("prep_lifts", {
    athlete_id: `eq.${athleteId}`,
    select: "id,athlete_id,lift,weight_kg,title,video_url,mux_playback_id,lift_date,athlete_notes,coach_notes,created_at",
    order: "lift_date.desc,created_at.desc",
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { lift: string; weight_kg?: number; title?: string; video_url?: string; mux_playback_id?: string; lift_date?: string; athlete_notes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.lift) return NextResponse.json({ error: "lift required" }, { status: 400 });
  const inserted = await dbInsert("prep_lifts", {
    athlete_id:      user.id,
    lift:            body.lift,
    weight_kg:       body.weight_kg ?? null,
    title:           body.title?.trim() || null,
    video_url:       body.video_url?.trim() || null,
    mux_playback_id: body.mux_playback_id?.trim() || null,
    lift_date:       body.lift_date || null,
    athlete_notes:   body.athlete_notes?.trim() || null,
  });
  return NextResponse.json({ ok: true, id: inserted?.id });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id: string; lift?: string; weight_kg?: number; title?: string; video_url?: string; mux_playback_id?: string; lift_date?: string; athlete_notes?: string; coach_notes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify ownership or coach permission
  const rows = await dbSelect<{ athlete_id: string }>("prep_lifts", { id: `eq.${body.id}`, select: "athlete_id" });
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const athleteId = rows[0].athlete_id;
  const isOwner = athleteId === user.id;
  const isCoach = !isOwner && await isCoachOf(user.id, athleteId);
  if (!isOwner && !isCoach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (isOwner) {
    if (body.lift             !== undefined) data.lift             = body.lift;
    if (body.weight_kg        !== undefined) data.weight_kg        = body.weight_kg;
    if (body.title            !== undefined) data.title            = body.title?.trim() || null;
    if (body.video_url        !== undefined) data.video_url        = body.video_url?.trim() || null;
    if (body.mux_playback_id  !== undefined) data.mux_playback_id  = body.mux_playback_id?.trim() || null;
    if (body.lift_date        !== undefined) data.lift_date        = body.lift_date || null;
    if (body.athlete_notes    !== undefined) data.athlete_notes    = body.athlete_notes?.trim() || null;
  }
  if (isCoach && body.coach_notes !== undefined) data.coach_notes = body.coach_notes?.trim() || null;

  await dbPatch("prep_lifts", { id: body.id }, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const rows = await dbSelect<{ athlete_id: string }>("prep_lifts", { id: `eq.${id}`, select: "athlete_id" });
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rows[0].athlete_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbDelete("prep_lifts", { id });
  return NextResponse.json({ ok: true });
}
