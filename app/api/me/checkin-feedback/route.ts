/**
 * GET /api/me/checkin-feedback
 *
 * The authenticated athlete's own coach feedback on their check-ins, keyed by
 * checkin_id. Mirrors /api/journal/entry-feedback, which does the same job for
 * journal entries.
 *
 * Coaches have been able to leave notes and voice memos on check-ins for a
 * while, and the save even pushes a notification about it — but until this
 * route existed there was no way for the athlete to read or hear any of it.
 *
 * Voice notes come back as short-lived signed URLs rather than bucket paths,
 * so the audio works whether or not the bucket is public.
 */
import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { signCoachAudio } from "@/lib/coachAudio";

export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string;
  coach_id: string;
  checkin_id: string;
  checkin_type: string;
  content: string | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
};

export interface AthleteCheckinFeedback {
  content: string | null;
  /** Signed, expiring URL — null when there is no voice note or signing failed. */
  audio_url: string | null;
  coach_name: string;
  created_at: string;
}

export async function GET() {
  if (!isConfigured) return NextResponse.json({});

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<FeedbackRow>("checkin_feedback", {
    athlete_id: `eq.${user.id}`,
    select: "id,coach_id,checkin_id,checkin_type,content,audio_url,created_at,updated_at",
    order: "created_at.asc",
  });

  // "Reviewed" with nothing written and nothing recorded is a coach's private
  // bookkeeping, not a message — surfacing it would promise the athlete
  // something to read that isn't there.
  const withContent = rows.filter((r) => (r.content && r.content.trim()) || r.audio_url);
  if (!withContent.length) return NextResponse.json({});

  const coachIds = [...new Set(withContent.map((r) => r.coach_id))];
  const coaches = await dbSelect<{ id: string; display_name: string }>("profiles", {
    id: `in.(${coachIds.join(",")})`,
    select: "id,display_name",
  });
  const coachNameById = new Map(coaches.map((c) => [c.id, c.display_name]));

  // Sign every voice note in one pass rather than per row sequentially.
  const signed = await Promise.all(withContent.map((r) => signCoachAudio(r.audio_url)));

  const result: Record<string, AthleteCheckinFeedback> = {};
  withContent.forEach((row, i) => {
    // Ordered oldest-first above, so a later revision overwrites an earlier one.
    result[row.checkin_id] = {
      content: row.content?.trim() || null,
      audio_url: signed[i],
      coach_name: coachNameById.get(row.coach_id) ?? "Your coach",
      created_at: row.created_at,
    };
  });

  return NextResponse.json(result);
}
