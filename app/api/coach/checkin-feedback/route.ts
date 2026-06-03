/**
 * GET  /api/coach/checkin-feedback?athlete_id=<uuid>
 *   Returns all checkin_feedback rows for a given athlete belonging to this coach.
 *
 * POST /api/coach/checkin-feedback
 *   Upsert feedback for a check-in.
 *   Body: { checkin_id, checkin_type, athlete_id, content?, audio_url?, reviewed? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

type FeedbackRow = {
  id: string;
  coach_id: string;
  athlete_id: string;
  checkin_id: string;
  checkin_type: string;
  content: string | null;
  audio_url: string | null;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
};

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
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get("athlete_id");
  if (!athleteId) return NextResponse.json({ error: "missing athlete_id" }, { status: 400 });

  if (!await coachOwnsAthlete(coachId, athleteId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await dbSelect<FeedbackRow>("checkin_feedback", {
    coach_id:   `eq.${coachId}`,
    athlete_id: `eq.${athleteId}`,
    select: "id,coach_id,athlete_id,checkin_id,checkin_type,content,audio_url,reviewed,created_at,updated_at",
    order: "created_at.desc",
  });

  return NextResponse.json(rows);
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    checkin_id: string;
    checkin_type: "weekly" | "monthly";
    athlete_id: string;
    content?: string;
    audio_url?: string;
    reviewed?: boolean;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { checkin_id, checkin_type, athlete_id, content, audio_url, reviewed } = body;
  if (!checkin_id || !checkin_type || !athlete_id) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  if (!await coachOwnsAthlete(coachId, athlete_id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Upsert: check if feedback already exists for this coach + checkin
  const existing = await dbSelect<{ id: string }>("checkin_feedback", {
    coach_id:     `eq.${coachId}`,
    checkin_id:   `eq.${checkin_id}`,
    checkin_type: `eq.${checkin_type}`,
    select: "id",
  });

  const data: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (content   !== undefined) data.content   = content.trim() || null;
  if (audio_url !== undefined) data.audio_url = audio_url;
  if (reviewed  !== undefined) data.reviewed  = reviewed;

  let feedbackId: string;
  if (existing.length > 0) {
    await dbPatch("checkin_feedback", { id: existing[0].id }, data);
    feedbackId = existing[0].id;
  } else {
    const inserted = await dbInsert<typeof data>("checkin_feedback", {
      ...data,
      coach_id:     coachId,
      athlete_id,
      checkin_id,
      checkin_type,
      reviewed:     reviewed ?? false,
    });
    if (!inserted) return NextResponse.json({ error: "insert failed" }, { status: 500 });
    feedbackId = inserted.id;
  }

  // Notify athlete if there's actual content (don't ping for reviewed-only)
  const hasContent = (content && content.trim()) || audio_url;
  if (hasContent) {
    const coachProfiles = await dbSelect<{ display_name: string }>("profiles", {
      id: `eq.${coachId}`, select: "display_name",
    });
    const coachName = coachProfiles[0]?.display_name ?? "Your coach";
    sendPushToUser(athlete_id, {
      title: "Coach feedback",
      body: `${coachName} left feedback on your check-in`,
      url: "/today",
      tag: `coach-feedback-${checkin_id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: feedbackId });
}
