/**
 * GET  /api/weekly-checkin — recent check-ins + whether the window is open
 * POST /api/weekly-checkin — submit (or overwrite) this week's check-in
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import { checkinTargetWeek } from "@/lib/weeklyCheckin";
import type { WeeklyCheckin } from "@/lib/weeklyCheckin";

const SELECT =
  "id,user_id,week_number,year,week_start,mood_rating,training_quality,readiness_rating,energy_rating,sleep_rating,biggest_win,biggest_challenge,focus_next_week,created_at,updated_at";

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json({ checkins: [], windowOpen: false, targetWeek: null, currentSubmitted: false });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = checkinTargetWeek();

  const checkins = await dbSelect<WeeklyCheckin>("weekly_checkins", {
    user_id: `eq.${user.id}`,
    order: "year.desc,week_number.desc",
    limit: "16",
    select: SELECT,
  });

  const currentSubmitted = target
    ? checkins.some((c) => c.year === target.year && c.week_number === target.week)
    : false;

  return NextResponse.json({ checkins, windowOpen: target !== null, targetWeek: target, currentSubmitted });
}

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = checkinTargetWeek();
  if (!target) return NextResponse.json({ error: "Check-in window is closed" }, { status: 400 });

  let body: {
    mood_rating: number;
    training_quality: number;
    readiness_rating: number;
    energy_rating: number;
    sleep_rating: number;
    biggest_win?: string;
    biggest_challenge?: string;
    focus_next_week?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const ratings = [
    body.mood_rating, body.training_quality, body.readiness_rating,
    body.energy_rating, body.sleep_rating,
  ];
  if (ratings.some((r) => typeof r !== "number" || r < 1 || r > 10)) {
    return NextResponse.json({ error: "All ratings must be 1–10" }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    mood_rating:      body.mood_rating,
    training_quality: body.training_quality,
    readiness_rating: body.readiness_rating,
    energy_rating:    body.energy_rating,
    sleep_rating:     body.sleep_rating,
    biggest_win:      body.biggest_win?.trim() || null,
    biggest_challenge: body.biggest_challenge?.trim() || null,
    focus_next_week:  body.focus_next_week?.trim() || null,
    updated_at:       new Date().toISOString(),
  };

  // Upsert: check if this week's check-in already exists
  const existing = await dbSelect<{ id: string }>("weekly_checkins", {
    user_id:     `eq.${user.id}`,
    year:        `eq.${target.year}`,
    week_number: `eq.${target.week}`,
    select: "id",
  });

  if (existing.length > 0) {
    await dbPatch("weekly_checkins", { id: existing[0].id }, data);
  } else {
    await dbInsert("weekly_checkins", {
      ...data,
      user_id:     user.id,
      week_number: target.week,
      year:        target.year,
      week_start:  target.weekStart,
    } as Record<string, unknown>);
  }

  return NextResponse.json({ ok: true });
}
