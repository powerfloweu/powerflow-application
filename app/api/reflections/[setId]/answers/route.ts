/**
 * POST /api/reflections/:setId/answers
 *   Per-question autosave. Body: { answers: Record<string, string> }
 *   Upserts the athlete's single answers row for this set, merging incoming
 *   keys into whatever's already stored — exactly like
 *   POST /api/meet-reflections. A partial save (one question's worth) is the
 *   normal case; never send the whole answers object just to save one field.
 *   Response: { ok: true; merged: boolean }  (merged: false only on first save,
 *   201 status; 200 on every subsequent merge)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import { validateAnswersPatch, mergeAnswers, type ReflectionSetRow, type ReflectionAnswerRow } from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ setId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { setId } = await params;

  const body = await req.json().catch(() => null);
  const patchResult = validateAnswersPatch((body as Record<string, unknown> | null)?.answers);
  if (!patchResult.ok) return NextResponse.json({ error: patchResult.error }, { status: 400 });

  // The set must exist, belong to this athlete, and actually have been sent —
  // an athlete can never write answers against a draft they can't see.
  const sets = await dbSelect<Pick<ReflectionSetRow, "id" | "status">>("reflection_sets", {
    select: "id,status",
    id: `eq.${setId}`,
    athlete_id: `eq.${user.id}`,
    status: "in.(sent,archived)",
    limit: "1",
  });
  if (!sets.length) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await dbSelect<ReflectionAnswerRow>("reflection_answers", {
    select: "id,answers",
    reflection_set_id: `eq.${setId}`,
    limit: "1",
  });

  if (existing.length > 0) {
    const merged = mergeAnswers(existing[0].answers, patchResult.value);
    const ok = await dbPatch(
      "reflection_answers",
      { id: existing[0].id },
      { answers: merged, updated_at: new Date().toISOString() },
    );
    if (!ok) return NextResponse.json({ error: "save failed" }, { status: 500 });
    return NextResponse.json({ ok: true, merged: true });
  }

  const inserted = await dbInsert("reflection_answers", {
    reflection_set_id: setId,
    athlete_id: user.id,
    answers: patchResult.value,
  });
  if (!inserted) return NextResponse.json({ error: "save failed" }, { status: 500 });

  return NextResponse.json({ ok: true, merged: false }, { status: 201 });
}
