/**
 * Course reflection answers API.
 *
 * GET   /api/course/answers?week=<slug>    → list answers for a given week
 * GET   /api/course/answers                → list ALL the user's answers
 * POST  /api/course/answers                → upsert a single answer
 *   body: {
 *     week_slug: string,
 *     question_id: string,
 *     answer: string,
 *     journalMirror?: boolean,   // if true, mirror to journal_entries
 *     questionPrompt?: string    // used as a header in the journal mirror
 *   }
 *
 * Row uniqueness: (user_id, week_slug, question_id).
 *
 * Journal mirror behaviour:
 *   - If journalMirror is true AND there is no existing journal_entry_id,
 *     we INSERT a new journal_entries row and link it.
 *   - If journalMirror is true AND journal_entry_id exists, we PATCH the
 *     existing row so reflection edits flow through.
 *   - The journal row is tagged with the "course" theme so athletes and
 *     coaches can filter for coursework in the journal view.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import type { CourseAnswerRow } from "@/lib/course";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params: Record<string, string> = {
    user_id: `eq.${user.id}`,
    select: "id,user_id,week_slug,question_id,answer,journal_entry_id,created_at,updated_at",
    order: "updated_at.desc",
  };

  const week = req.nextUrl.searchParams.get("week");
  if (week) params.week_slug = `eq.${week}`;

  const rows = await dbSelect<CourseAnswerRow>("course_answers", params);
  return NextResponse.json(rows);
}

// ── POST (upsert) ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    week_slug?: string;
    question_id?: string;
    answer?: string;
    journalMirror?: boolean;
    questionPrompt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const week_slug = body.week_slug?.trim();
  const question_id = body.question_id?.trim();
  const answer = (body.answer ?? "").slice(0, 4000);
  if (!week_slug || !question_id) {
    return NextResponse.json({ error: "Missing week_slug or question_id" }, { status: 400 });
  }

  // Fetch existing row if any
  const existing = await dbSelect<CourseAnswerRow>("course_answers", {
    user_id: `eq.${user.id}`,
    week_slug: `eq.${week_slug}`,
    question_id: `eq.${question_id}`,
    select: "id,user_id,week_slug,question_id,answer,journal_entry_id,created_at,updated_at",
    limit: "1",
  });

  // ── Handle journal mirror ──────────────────────────────────────────────────
  // Only create/update a journal row when there is actual content to mirror.
  let journal_entry_id: string | null = existing[0]?.journal_entry_id ?? null;
  if (body.journalMirror && answer.trim().length > 0) {
    const journalContent =
      (body.questionPrompt ? `${body.questionPrompt}\n\n` : "") + answer.trim();

    if (journal_entry_id) {
      await dbPatch(
        "journal_entries",
        { id: journal_entry_id, user_id: user.id },
        { content: journalContent },
      );
    } else {
      const created = await dbInsert("journal_entries", {
        user_id: user.id,
        content: journalContent.slice(0, 4000),
        sentiment: "neutral",
        context: "general",
        themes: ["course"],
      });
      journal_entry_id = created?.id ?? null;
    }
  }

  // ── Upsert the answer row ──────────────────────────────────────────────────
  if (existing.length) {
    await dbPatch(
      "course_answers",
      { id: existing[0].id },
      {
        answer,
        journal_entry_id,
        updated_at: new Date().toISOString(),
      },
    );
    return NextResponse.json({ ok: true, updated: true, journal_entry_id });
  }

  const created = await dbInsert("course_answers", {
    user_id: user.id,
    week_slug,
    question_id,
    answer,
    journal_entry_id,
  });
  return NextResponse.json({ ok: true, created: true, id: created?.id, journal_entry_id }, { status: 201 });
}
