/**
 * POST /api/monthly-checkin — submit (or overwrite) this week's monthly check-in.
 * Only accepted on ISO weeks where week % 4 === 0 (or when force_checkin is set).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import { checkinTargetWeek, isoWeekYear, isMonthlyWeek } from "@/lib/weeklyCheckin";
import { mondayOfWeek } from "@/lib/date";

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve target week (respects force_checkin flag)
  const profileRows = await dbSelect<{ force_checkin: boolean }>("profiles", {
    id: `eq.${user.id}`, select: "force_checkin",
  });
  const forceFlag = profileRows[0]?.force_checkin === true;

  let target = checkinTargetWeek();
  if (forceFlag && !target) {
    const now = new Date();
    const { week, year } = isoWeekYear(now);
    target = { week, year, weekStart: mondayOfWeek(now) };
    await dbPatch("profiles", { id: user.id }, { force_checkin: false });
  }

  if (!target) return NextResponse.json({ error: "Check-in window is closed" }, { status: 400 });
  if (!isMonthlyWeek(target.week)) {
    return NextResponse.json({ error: "Not a monthly check-in week" }, { status: 400 });
  }

  let body: {
    mood_rating: number;
    training_quality: number;
    readiness_rating: number;
    energy_rating: number;
    sleep_rating: number;
    overall_progress: number;
    biggest_win?: string;
    biggest_challenge?: string;
    focus_next_week?: string;
    biggest_breakthrough?: string;
    key_lesson?: string;
    next_month_intention?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const ratings = [
    body.mood_rating, body.training_quality, body.readiness_rating,
    body.energy_rating, body.sleep_rating, body.overall_progress,
  ];
  if (ratings.some((r) => typeof r !== "number" || r < 1 || r > 10)) {
    return NextResponse.json({ error: "All ratings must be 1–10" }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    mood_rating:           body.mood_rating,
    training_quality:      body.training_quality,
    readiness_rating:      body.readiness_rating,
    energy_rating:         body.energy_rating,
    sleep_rating:          body.sleep_rating,
    overall_progress:      body.overall_progress,
    biggest_win:           body.biggest_win?.trim()           || null,
    biggest_challenge:     body.biggest_challenge?.trim()     || null,
    focus_next_week:       body.focus_next_week?.trim()       || null,
    biggest_breakthrough:  body.biggest_breakthrough?.trim()  || null,
    key_lesson:            body.key_lesson?.trim()            || null,
    next_month_intention:  body.next_month_intention?.trim()  || null,
    updated_at:            new Date().toISOString(),
  };

  const existing = await dbSelect<{ id: string }>("monthly_checkins", {
    user_id:     `eq.${user.id}`,
    year:        `eq.${target.year}`,
    week_number: `eq.${target.week}`,
    select: "id",
  });

  if (existing.length > 0) {
    await dbPatch("monthly_checkins", { id: existing[0].id }, data);
  } else {
    await dbInsert("monthly_checkins", {
      ...data,
      user_id:     user.id,
      week_number: target.week,
      year:        target.year,
      week_start:  target.weekStart,
    } as Record<string, unknown>);
  }

  return NextResponse.json({ ok: true });
}
