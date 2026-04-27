/**
 * GET  /api/training/entries?date=YYYY-MM-DD  — entry for that date (default: today)
 * GET  /api/training/entries?week=YYYY-MM-DD  — all entries for the Mon–Sun week
 * GET  /api/training/entries?all=true         — all entries for the user (journal feed)
 * POST /api/training/entries                  — upsert entry
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch, dbInsert } from "@/lib/supabaseAdmin";
import type { TrainingEntry } from "@/lib/training";
import { ymdLocal, mondayOfWeek, sundayOfWeek } from "@/lib/date";

const ENTRY_SELECT =
  "id,user_id,entry_date,is_training_day,mood_rating,thoughts_before,thoughts_after,what_went_well,frustrations,next_session,coach_note,created_at,updated_at";

const todayISO    = (): string         => ymdLocal();
const getMondayOf = (d: Date): string  => mondayOfWeek(d);
const getSundayOf = (d: Date): string  => sundayOfWeek(d);

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekParam = searchParams.get("week");
  const dateParam = searchParams.get("date");

  // All entries for journal feed
  if (searchParams.get("all") === "true") {
    const rows = await dbSelect<TrainingEntry>("training_entries", {
      user_id: `eq.${user.id}`,
      select: ENTRY_SELECT,
      order: "entry_date.desc",
    });
    return NextResponse.json(rows);
  }

  if (weekParam) {
    const ref = new Date(weekParam);
    const monday = getMondayOf(ref);
    const sunday = getSundayOf(ref);

    const rows = await dbSelect<TrainingEntry>("training_entries", {
      user_id: `eq.${user.id}`,
      entry_date: `gte.${monday}`,
      select: ENTRY_SELECT,
      order: "entry_date.asc",
    });

    // Filter client-side for <= sunday (avoids duplicate key issue with URLSearchParams)
    const filtered = rows.filter((e) => e.entry_date <= sunday);
    return NextResponse.json(filtered);
  }

  // Single-date lookup
  const date = dateParam ?? todayISO();
  const rows = await dbSelect<TrainingEntry>("training_entries", {
    user_id: `eq.${user.id}`,
    entry_date: `eq.${date}`,
    select: ENTRY_SELECT,
  });

  return NextResponse.json(rows[0] ?? null);
}

const PATCHABLE = [
  "is_training_day",
  "mood_rating",
  "thoughts_before",
  "thoughts_after",
  "what_went_well",
  "frustrations",
  "next_session",
] as const;

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const entry_date = typeof body.entry_date === "string" ? body.entry_date : todayISO();

  // Build patch payload from allowlist
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of PATCHABLE) {
    if (key in body) {
      payload[key] = body[key] ?? null;
    }
  }

  // Check if row exists
  const existing = await dbSelect<TrainingEntry>("training_entries", {
    user_id: `eq.${user.id}`,
    entry_date: `eq.${entry_date}`,
    select: "id",
  });

  if (existing.length > 0) {
    await dbPatch("training_entries", { user_id: user.id, entry_date }, payload);
  } else {
    await dbInsert("training_entries", {
      user_id: user.id,
      entry_date,
      ...payload,
    });
  }

  return NextResponse.json({ ok: true });
}
