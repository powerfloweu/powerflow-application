/**
 * Course progress API — tracks per-step completion per module.
 *
 * GET  /api/course/progress
 *   → all progress rows for the current user
 *
 * POST /api/course/progress
 *   body: { slug: string, step: 'video' | 'exercise' | 'quiz' | 'complete' | 'practice' }
 *
 *   - video / exercise / quiz / complete  → sets the corresponding timestamptz column
 *   - practice                            → increments practice_count by 1
 *
 * Rows are upserted on (user_id, module_slug). Safe to call multiple times.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { COURSE_MODULES, type CourseProgressRow } from "@/lib/course";

const SUPABASE_URL  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const STEP_COL: Record<string, string> = {
  video:    "video_done_at",
  exercise: "exercise_done_at",
  quiz:     "quiz_done_at",
  complete: "completed_at",
};

const SELECT_COLS = [
  "user_id", "module_slug", "week_num",
  "video_done_at", "exercise_done_at", "quiz_done_at",
  "completed_at", "practice_count", "updated_at",
].join(",");

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<CourseProgressRow>("course_progress", {
    user_id: `eq.${user.id}`,
    select: SELECT_COLS,
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

  let body: { slug?: string; step?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const step = (body.step ?? "").trim();

  // Validate slug against module library
  const mod = COURSE_MODULES.find((m) => m.slug === slug);
  if (!mod) {
    return NextResponse.json({ error: `Unknown module slug: ${slug}` }, { status: 400 });
  }

  if (step !== "practice" && !STEP_COL[step]) {
    return NextResponse.json(
      { error: "step must be video | exercise | quiz | complete | practice" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  // Fetch existing row
  const existing = await dbSelect<CourseProgressRow>("course_progress", {
    user_id:     `eq.${user.id}`,
    module_slug: `eq.${slug}`,
    select:      SELECT_COLS,
    limit:       "1",
  });

  if (step === "practice") {
    // ── Increment practice_count ─────────────────────────────────────────────
    if (existing.length) {
      // Use RPC-style raw PATCH with increment
      await fetch(`${SUPABASE_URL}/rest/v1/course_progress?user_id=eq.${user.id}&module_slug=eq.${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ practice_count: existing[0].practice_count + 1, updated_at: now }),
      });
    } else {
      // Insert new row with practice_count = 1
      await fetch(`${SUPABASE_URL}/rest/v1/course_progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          user_id:      user.id,
          module_slug:  slug,
          week_num:     mod.weekNumber,
          practice_count: 1,
          updated_at:   now,
        }),
      });
    }
  } else {
    // ── Set timestamp column ─────────────────────────────────────────────────
    const col = STEP_COL[step];
    if (existing.length) {
      const current = existing[0] as Record<string, unknown>;
      if (!current[col]) {
        await fetch(`${SUPABASE_URL}/rest/v1/course_progress?user_id=eq.${user.id}&module_slug=eq.${encodeURIComponent(slug)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ [col]: now, updated_at: now }),
        });
      }
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/course_progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          user_id:     user.id,
          module_slug: slug,
          week_num:    mod.weekNumber,
          [col]:       now,
          updated_at:  now,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
