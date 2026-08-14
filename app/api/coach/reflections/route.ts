/**
 * POST /api/coach/reflections
 *   Create a new draft reflection set for one of the coach's own athletes.
 *   Body: { athlete_id: string; title: string; intro?: string | null; questions: ReflectionQuestion[] }
 *   Response: { ok: true; id: string }  (status 201)
 *
 * GET /api/coach/reflections?athlete_id=<uuid>
 *   List all sets (any status) this coach has authored for the given athlete,
 *   newest first.
 *   Response: ReflectionSetRow[]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import { validateQuestions, validateTitle, validateIntro, type ReflectionSetRow } from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SET_SELECT = "id,coach_id,athlete_id,title,intro,questions,status,created_at,updated_at,sent_at";

async function getCoachId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

async function coachOwnsAthlete(coachId: string, athleteId: string): Promise<boolean> {
  const rows = await dbSelect<{ coach_id: string | null }>("profiles", {
    id: `eq.${athleteId}`, select: "coach_id",
  });
  return rows[0]?.coach_id === coachId;
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get("athlete_id");
  if (!athleteId) return NextResponse.json({ error: "missing athlete_id" }, { status: 400 });

  const rows = await dbSelect<ReflectionSetRow>("reflection_sets", {
    select: SET_SELECT,
    coach_id: `eq.${coachId}`,
    athlete_id: `eq.${athleteId}`,
    order: "created_at.desc",
  });

  return NextResponse.json(rows);
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });

  const athleteId = body.athlete_id;
  if (!athleteId || typeof athleteId !== "string") {
    return NextResponse.json({ error: "athlete_id required" }, { status: 400 });
  }

  const titleResult = validateTitle(body.title);
  if (!titleResult.ok) return NextResponse.json({ error: titleResult.error }, { status: 400 });

  const introResult = validateIntro(body.intro);
  if (!introResult.ok) return NextResponse.json({ error: introResult.error }, { status: 400 });

  const questionsResult = validateQuestions(body.questions ?? []);
  if (!questionsResult.ok) return NextResponse.json({ error: questionsResult.error }, { status: 400 });

  if (!await coachOwnsAthlete(coachId, athleteId)) {
    return NextResponse.json({ error: "athlete not found or not under this coach" }, { status: 404 });
  }

  const inserted = await dbInsert("reflection_sets", {
    coach_id: coachId,
    athlete_id: athleteId,
    title: titleResult.value,
    intro: introResult.value,
    questions: questionsResult.value,
    status: "draft",
  });

  if (!inserted) {
    console.error("[api/coach/reflections] insert failed for athlete", athleteId);
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
