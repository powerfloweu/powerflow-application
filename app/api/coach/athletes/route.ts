/**
 * GET /api/coach/athletes
 * Returns all athletes linked to the authenticated coach, including their
 * journal entries (last 50) and test scores from all four tests.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  coach_id: string | null;
  created_at: string;
};

type EntryRow = {
  id: string;
  user_id: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  context: string;
  themes: string[];
  created_at: string;
};

type SatRow = { id: string; user_id?: string; athlete_name?: string; total_score: number; submitted_at: string; paid: boolean };
type AcsiRow = { id: string; user_id?: string; athlete_name?: string; coping: number; concentration: number; confidence: number; goal_setting: number; submitted_at: string; paid: boolean };
type CsaiRow = { id: string; user_id?: string; athlete_name?: string; somatic_anxiety: number; cognitive_anxiety: number; self_confidence: number; submitted_at: string; paid: boolean };
type DasRow  = { id: string; user_id?: string; athlete_name?: string; total_score: number; depression_prone: boolean; submitted_at: string; paid: boolean };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify this user is a coach
  const profiles = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    role: "eq.coach",
    select: "id,role",
  });
  if (!profiles.length) {
    return NextResponse.json({ error: "Not a coach" }, { status: 403 });
  }

  // Fetch athletes linked to this coach
  const athletes = await dbSelect<ProfileRow>("profiles", {
    coach_id: `eq.${user.id}`,
    role: "eq.athlete",
    select: "id,display_name,avatar_url,created_at",
    order: "created_at.asc",
  });

  if (!athletes.length) return NextResponse.json([]);

  const athleteIds = athletes.map((a) => a.id);
  const idList = `(${athleteIds.map((id) => `"${id}"`).join(",")})`;

  // Fetch entries, test results for all athletes in parallel
  const [entries, sat, acsi, csai, das] = await Promise.all([
    dbSelect<EntryRow>("journal_entries", {
      user_id: `in.${idList}`,
      order: "created_at.desc",
      limit: "200",
      select: "id,user_id,content,sentiment,context,themes,created_at",
    }),
    dbSelect<SatRow>("sat_results", {
      user_id: `in.${idList}`,
      order: "submitted_at.desc",
      select: "id,user_id,total_score,submitted_at,paid",
    }),
    dbSelect<AcsiRow>("acsi_results", {
      user_id: `in.${idList}`,
      order: "submitted_at.desc",
      select: "id,user_id,coping,concentration,confidence,goal_setting,submitted_at,paid",
    }),
    dbSelect<CsaiRow>("csai_results", {
      user_id: `in.${idList}`,
      order: "submitted_at.desc",
      select: "id,user_id,somatic_anxiety,cognitive_anxiety,self_confidence,submitted_at,paid",
    }),
    dbSelect<DasRow>("das_results", {
      user_id: `in.${idList}`,
      order: "submitted_at.desc",
      select: "id,user_id,total_score,depression_prone,submitted_at,paid",
    }),
  ]);

  // Group by athlete
  const result = athletes.map((athlete) => ({
    ...athlete,
    entries: entries.filter((e) => e.user_id === athlete.id),
    sat: sat.filter((r) => r.user_id === athlete.id),
    acsi: acsi.filter((r) => r.user_id === athlete.id),
    csai: csai.filter((r) => r.user_id === athlete.id),
    das: das.filter((r) => r.user_id === athlete.id),
  }));

  return NextResponse.json(result);
}
