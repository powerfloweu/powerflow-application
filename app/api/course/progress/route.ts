/**
 * Course progress API — tracks per-step completion per week.
 *
 * GET  /api/course/progress              → all progress rows for current user
 * POST /api/course/progress              → mark a step done (or mark complete)
 *   body: { week_num: number, step: 'video' | 'exercise' | 'quiz' | 'complete' }
 *
 * Each step sets a timestamptz column on the (user_id, week_num) row.
 * Rows are upserted — safe to call multiple times.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import type { CourseProgressRow } from "@/lib/course";

const STEP_COL: Record<string, string> = {
  video:    "video_done_at",
  exercise: "exercise_done_at",
  quiz:     "quiz_done_at",
  complete: "completed_at",
};

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<CourseProgressRow>("course_progress", {
    user_id: `eq.${user.id}`,
    select: "user_id,week_num,video_done_at,exercise_done_at,quiz_done_at,completed_at,updated_at",
    order: "week_num.asc",
  });
  return NextResponse.json(rows);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { week_num?: number; step?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const week_num = Number(body.week_num);
  const step = body.step?.trim() ?? "";

  if (!week_num || week_num < 1 || week_num > 16) {
    return NextResponse.json({ error: "week_num must be 1–16" }, { status: 400 });
  }
  if (!STEP_COL[step]) {
    return NextResponse.json({ error: "step must be video|exercise|quiz|complete" }, { status: 400 });
  }

  const col = STEP_COL[step];
  const now = new Date().toISOString();

  // Try to update an existing row first
  const existing = await dbSelect<CourseProgressRow>("course_progress", {
    user_id: `eq.${user.id}`,
    week_num: `eq.${week_num}`,
    select: "user_id,week_num,video_done_at,exercise_done_at,quiz_done_at,completed_at,updated_at",
    limit: "1",
  });

  if (existing.length) {
    // Only set the timestamp if not already set (idempotent for step completion)
    const current = existing[0] as Record<string, unknown>;
    if (!current[col]) {
      await dbPatch("course_progress", { user_id: user.id, week_num: String(week_num) }, {
        [col]: now,
        updated_at: now,
      });
    }
  } else {
    // Insert new row via upsert — use REST POST with Prefer: resolution=merge-duplicates
    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    await fetch(`${SUPABASE_URL}/rest/v1/course_progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: user.id,
        week_num,
        [col]: now,
        updated_at: now,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
