/**
 * GET /api/coach/reflections/:setId
 *   Full detail for a set this coach authored: the set itself, the athlete's
 *   answers (if any), and the full note thread.
 *   Response: { set: ReflectionSetRow; answers: Record<string,string> | null; notes: ReflectionNoteRow[] }
 *
 * PATCH /api/coach/reflections/:setId
 *   Update a set. Body is a partial subset of:
 *     { title?: string; intro?: string | null; questions?: ReflectionQuestion[]; status?: "draft" | "sent" | "archived" }
 *   Transitioning status to "sent" for the first time stamps `sent_at` and
 *   fires a push notification to the athlete linking to /reflections/:setId.
 *   Sending an empty set (no questions) is rejected with 409.
 *   Response: { ok: true; set: ReflectionSetRow }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";
import {
  validateQuestions,
  validateTitle,
  validateIntro,
  canSend,
  type ReflectionSetRow,
  type ReflectionAnswerRow,
  type ReflectionNoteRow,
  type ReflectionSetStatus,
} from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ setId: string }> };

const SET_SELECT = "id,coach_id,athlete_id,title,intro,questions,status,created_at,updated_at,sent_at";
const VALID_STATUSES = new Set<ReflectionSetStatus>(["draft", "sent", "archived"]);

async function getCoachId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

async function loadOwnedSet(coachId: string, setId: string): Promise<ReflectionSetRow | null> {
  const rows = await dbSelect<ReflectionSetRow>("reflection_sets", {
    select: SET_SELECT,
    id: `eq.${setId}`,
    coach_id: `eq.${coachId}`,
    limit: "1",
  });
  return rows[0] ?? null;
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { setId } = await params;
  const set = await loadOwnedSet(coachId, setId);
  if (!set) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [answerRows, notes] = await Promise.all([
    dbSelect<ReflectionAnswerRow>("reflection_answers", {
      select: "answers",
      reflection_set_id: `eq.${setId}`,
      limit: "1",
    }),
    dbSelect<ReflectionNoteRow>("reflection_notes", {
      select: "id,reflection_set_id,author_id,body,audio_url,created_at",
      reflection_set_id: `eq.${setId}`,
      order: "created_at.asc",
    }),
  ]);

  return NextResponse.json({
    set,
    answers: answerRows[0]?.answers ?? null,
    notes,
  });
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { setId } = await params;
  const existing = await loadOwnedSet(coachId, setId);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("title" in body) {
    const r = validateTitle(body.title);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    update.title = r.value;
  }
  if ("intro" in body) {
    const r = validateIntro(body.intro);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    update.intro = r.value;
  }
  if ("questions" in body) {
    const r = validateQuestions(body.questions);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    update.questions = r.value;
  }

  let willSend = false;
  if ("status" in body) {
    const status = body.status;
    if (typeof status !== "string" || !VALID_STATUSES.has(status as ReflectionSetStatus)) {
      return NextResponse.json({ error: "status must be draft, sent, or archived" }, { status: 400 });
    }
    const nextQuestions = (update.questions as typeof existing.questions | undefined) ?? existing.questions;
    if (status === "sent" && existing.status === "draft") {
      if (!canSend(nextQuestions)) {
        return NextResponse.json({ error: "cannot send a set with no questions" }, { status: 409 });
      }
      willSend = true;
      update.sent_at = new Date().toISOString();
    }
    update.status = status;
  }

  const ok = await dbPatch("reflection_sets", { id: setId }, update);
  if (!ok) {
    console.error("[api/coach/reflections/:setId] patch failed", setId);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  const updatedRows = await dbSelect<ReflectionSetRow>("reflection_sets", {
    select: SET_SELECT,
    id: `eq.${setId}`,
    limit: "1",
  });
  const updated = updatedRows[0] ?? null;

  if (willSend && updated) {
    const coachProfiles = await dbSelect<{ display_name: string }>("profiles", {
      id: `eq.${coachId}`, select: "display_name",
    });
    const coachName = coachProfiles[0]?.display_name ?? "Your coach";
    await sendPushToUser(existing.athlete_id, {
      title: "A reflection from your coach",
      body: `${coachName} sent you "${updated.title}"`,
      url: `/reflections/${setId}`,
      tag: `reflection-sent-${setId}`,
    }).catch((err) => console.error("[api/coach/reflections/:setId] push send failed", err));
  }

  return NextResponse.json({ ok: true, set: updated });
}
