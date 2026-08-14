/**
 * POST /api/reflections/:setId/notes
 *   Athlete replies in the note thread of a set that's been sent to them.
 *   Body: { body?: string; audio_url?: string }  — at least one required.
 *   Response: { ok: true; id: string }  (status 201)
 *
 *   Fires a push notification to the coach.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";
import { validateNoteInput, type ReflectionSetRow } from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ setId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { setId } = await params;

  const sets = await dbSelect<Pick<ReflectionSetRow, "id" | "coach_id" | "title">>("reflection_sets", {
    select: "id,coach_id,title",
    id: `eq.${setId}`,
    athlete_id: `eq.${user.id}`,
    status: "in.(sent,archived)",
    limit: "1",
  });
  const set = sets[0];
  if (!set) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const result = validateNoteInput(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const inserted = await dbInsert("reflection_notes", {
    reflection_set_id: setId,
    author_id: user.id,
    body: result.value.body,
    audio_url: result.value.audio_url,
  });

  if (!inserted) {
    console.error("[api/reflections/:setId/notes] insert failed", setId);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  const athleteProfiles = await dbSelect<{ display_name: string }>("profiles", {
    id: `eq.${user.id}`, select: "display_name",
  });
  const athleteName = athleteProfiles[0]?.display_name ?? "Your athlete";
  await sendPushToUser(set.coach_id, {
    title: "New reflection note",
    body: `${athleteName} replied on "${set.title}"`,
    url: `/coach`,
    tag: `reflection-note-reply-${setId}`,
  }).catch((err) => console.error("[api/reflections/:setId/notes] push send failed", err));

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
