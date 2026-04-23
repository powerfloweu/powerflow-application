/**
 * Course progress API.
 *
 * GET   /api/course/progress                 → list all progress rows for current user
 * POST  /api/course/progress                 → mark a week complete (or reopen)
 *   body: { week_slug: string, completed: boolean }
 *
 * Rows are unique on (user_id, week_slug) — POST upserts.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import type { CourseProgressRow } from "@/lib/course";

export async function GET() {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<CourseProgressRow>("course_progress", {
    user_id: `eq.${user.id}`,
    select: "id,user_id,week_slug,completed,started_at,completed_at",
    order: "started_at.asc",
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { week_slug?: string; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const week_slug = body.week_slug?.trim();
  const completed = Boolean(body.completed);
  if (!week_slug) return NextResponse.json({ error: "Missing week_slug" }, { status: 400 });

  // Look up existing row for this (user, week)
  const existing = await dbSelect<CourseProgressRow>("course_progress", {
    user_id: `eq.${user.id}`,
    week_slug: `eq.${week_slug}`,
    select: "id,user_id,week_slug,completed,started_at,completed_at",
    limit: "1",
  });

  if (existing.length) {
    await dbPatch(
      "course_progress",
      { id: existing[0].id },
      { completed, completed_at: completed ? new Date().toISOString() : null },
    );
    return NextResponse.json({ ok: true, updated: true });
  }

  await dbInsert("course_progress", {
    user_id: user.id,
    week_slug,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  });
  return NextResponse.json({ ok: true, created: true }, { status: 201 });
}
