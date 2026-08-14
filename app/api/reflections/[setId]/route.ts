/**
 * GET /api/reflections/:setId
 *   A single set the athlete has been sent, plus their own answers and the
 *   full note thread. 404s (not 403) for a set that isn't theirs, doesn't
 *   exist, or is still a draft — draft sets are indistinguishable from
 *   "not found" to the athlete.
 *   Response: { set: ReflectionSetRow; answers: Record<string,string> | null; notes: ReflectionNoteRow[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import type { ReflectionSetRow, ReflectionAnswerRow, ReflectionNoteRow } from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ setId: string }> };

const SET_SELECT = "id,coach_id,athlete_id,title,intro,questions,status,created_at,updated_at,sent_at";

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { setId } = await params;

  const sets = await dbSelect<ReflectionSetRow>("reflection_sets", {
    select: SET_SELECT,
    id: `eq.${setId}`,
    athlete_id: `eq.${user.id}`,
    status: "in.(sent,archived)",
    limit: "1",
  });
  const set = sets[0];
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
