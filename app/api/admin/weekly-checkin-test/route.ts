/**
 * POST /api/admin/weekly-checkin-test
 * Admin-only: returns weekly check-in window status for any user, bypassing the
 * Sun/Mon day restriction so it can be tested on any day of the week.
 *
 * Body: { userId?: string }   — omit to use the caller's own account
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { isoWeekYear } from "@/lib/weeklyCheckin";
import { mondayOfWeek } from "@/lib/date";
import type { WeeklyCheckin } from "@/lib/weeklyCheckin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "trainer.pod@gmail.com";

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = (user.email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (!isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  let body: { userId?: string } = {};
  try { body = await req.json(); } catch { /* no body is fine */ }

  const targetUserId = body.userId ?? user.id;

  // Compute current week info (no day restriction)
  const now = new Date();
  const { week, year } = isoWeekYear(now);
  const weekStart = mondayOfWeek(now);
  const targetWeek = { week, year, weekStart };

  const existing = await dbSelect<WeeklyCheckin>("weekly_checkins", {
    user_id:     `eq.${targetUserId}`,
    year:        `eq.${year}`,
    week_number: `eq.${week}`,
    select: "id,week_number,year,week_start,mood_rating,training_quality,readiness_rating,energy_rating,sleep_rating,biggest_win,biggest_challenge,focus_next_week,created_at",
  });

  return NextResponse.json({
    targetWeek,
    currentSubmitted: existing.length > 0,
    existing: existing[0] ?? null,
    windowOpen: true, // forced open for testing
  });
}
