/**
 * POST /api/coach/reflections/:setId/notes
 *   Coach adds a note (text and/or voice) to a set's ongoing note thread.
 *   Body: { body?: string; audio_url?: string }  — at least one required.
 *   Response: { ok: true; id: string }  (status 201)
 *
 *   Fires a push notification to the athlete (skipped if the set is still a
 *   draft — the athlete can't see it yet).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";
import { validateNoteInput, type ReflectionSetRow } from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ setId: string }> };

async function getCoachId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { setId } = await params;

  const sets = await dbSelect<Pick<ReflectionSetRow, "id" | "athlete_id" | "title" | "status">>("reflection_sets", {
    select: "id,athlete_id,title,status",
    id: `eq.${setId}`,
    coach_id: `eq.${coachId}`,
    limit: "1",
  });
  const set = sets[0];
  if (!set) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const result = validateNoteInput(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const inserted = await dbInsert("reflection_notes", {
    reflection_set_id: setId,
    author_id: coachId,
    body: result.value.body,
    audio_url: result.value.audio_url,
  });

  if (!inserted) {
    console.error("[api/coach/reflections/:setId/notes] insert failed", setId);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  if (set.status !== "draft") {
    const coachProfiles = await dbSelect<{ display_name: string }>("profiles", {
      id: `eq.${coachId}`, select: "display_name",
    });
    const coachName = coachProfiles[0]?.display_name ?? "Your coach";
    await sendPushToUser(set.athlete_id, {
      title: "A note from your coach",
      body: `${coachName} added a note to "${set.title}"`,
      url: `/reflections/${setId}`,
      tag: `reflection-note-${setId}`,
    }).catch((err) => console.error("[api/coach/reflections/:setId/notes] push send failed", err));
  }

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
