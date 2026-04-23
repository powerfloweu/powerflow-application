/**
 * Course reflection answers API.
 *
 * GET  /api/course/answers?week=<num>  → answers for a given week
 * GET  /api/course/answers             → all answers for the user
 * POST /api/course/answers             → upsert a single answer
 *   body: { week_num: number, question_id: string, text: string }
 *
 * Audio upload is handled by /api/course/answers/audio (Phase 4).
 *
 * Saving an answer also auto-marks the quiz step as done when at least one
 * question in the week has a non-empty answer.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import type { CourseAnswerRow } from "@/lib/course";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params: Record<string, string> = {
    user_id: `eq.${user.id}`,
    select: "id,user_id,week_num,question_id,text,audio_url,audio_duration_s,created_at,updated_at",
    order: "updated_at.desc",
  };

  const week = req.nextUrl.searchParams.get("week");
  if (week) params.week_num = `eq.${week}`;

  const rows = await dbSelect<CourseAnswerRow>("course_answers", params);
  return NextResponse.json(rows);
}

// ── POST (upsert) ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { week_num?: number; question_id?: string; text?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const week_num    = Number(body.week_num);
  const question_id = body.question_id?.trim();
  const text        = (body.text ?? "").slice(0, 4000);

  if (!week_num || week_num < 1 || week_num > 16) {
    return NextResponse.json({ error: "week_num must be 1–16" }, { status: 400 });
  }
  if (!question_id) {
    return NextResponse.json({ error: "Missing question_id" }, { status: 400 });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const now = new Date().toISOString();

  // Upsert the answer row
  const res = await fetch(`${SUPABASE_URL}/rest/v1/course_answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({ user_id: user.id, week_num, question_id, text, updated_at: now }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[course/answers] upsert failed", res.status, err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  // Auto-mark quiz step done when at least one answer is non-empty
  if (text.trim().length > 0) {
    const progressRows = await dbSelect<{ quiz_done_at: string | null }>("course_progress", {
      user_id:  `eq.${user.id}`,
      week_num: `eq.${week_num}`,
      select:   "quiz_done_at",
      limit:    "1",
    });

    if (!progressRows.length || !progressRows[0].quiz_done_at) {
      // Upsert progress row with quiz_done_at
      await fetch(`${SUPABASE_URL}/rest/v1/course_progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ user_id: user.id, week_num, quiz_done_at: now, updated_at: now }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
