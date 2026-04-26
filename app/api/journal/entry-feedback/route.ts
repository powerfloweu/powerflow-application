/**
 * GET /api/journal/entry-feedback
 * Returns feedback for the authenticated athlete's entries.
 * Result: { [entry_id]: { content, created_at, coach_name } }
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

type FeedbackRow = {
  id: string;
  coach_id: string;
  entry_id: string;
  athlete_id: string;
  content: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
};

export async function GET() {
  if (!isConfigured) return NextResponse.json({}, { status: 200 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all feedback where this user is the athlete
  const rows = await dbSelect<FeedbackRow>("entry_feedback", {
    athlete_id: `eq.${user.id}`,
    select: "id,entry_id,coach_id,content,created_at",
    order: "created_at.asc",
  });

  if (!rows.length) return NextResponse.json({});

  // Get unique coach IDs and fetch their display names
  const coachIds = [...new Set(rows.map((r) => r.coach_id))];
  const idList = `(${coachIds.map((id) => `"${id}"`).join(",")})`;
  const coaches = await dbSelect<ProfileRow>("profiles", {
    id: `in.${idList}`,
    select: "id,display_name",
  });

  const coachNameById = new Map(coaches.map((c) => [c.id, c.display_name]));

  // Key by entry_id — latest feedback wins if multiple exist per entry
  const result: Record<string, { content: string; created_at: string; coach_name: string }> = {};
  for (const row of rows) {
    result[row.entry_id] = {
      content: row.content,
      created_at: row.created_at,
      coach_name: coachNameById.get(row.coach_id) ?? "Coach",
    };
  }

  return NextResponse.json(result);
}
