/**
 * GET  /api/coach/athletes — returns all athletes for this coach
 * PATCH /api/coach/athletes — coach updates affirmations or viz_keywords for one athlete
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import type { TrainingEntry } from "@/lib/training";
import { mondayOfWeek, sundayOfWeek } from "@/lib/date";

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
  avatar_url: string | null;
  role: string;
  coach_id: string | null;
  created_at: string;
  // competition / physical
  meet_date: string | null;
  gender: string | null;
  bodyweight_kg: number | null;
  weight_category: string | null;
  // lifts
  squat_current_kg: number | null;
  squat_goal_kg: number | null;
  bench_current_kg: number | null;
  bench_goal_kg: number | null;
  deadlift_current_kg: number | null;
  deadlift_goal_kg: number | null;
  // training
  mental_goals: string[] | null;
  training_days_per_week: number | null;
  instagram: string | null;
  years_powerlifting: string | null;
  federation: string | null;
  // mindset
  main_barrier: string | null;
  confidence_break: string | null;
  overthinking_focus: string | null;
  previous_mental_work: string | null;
  self_confidence_reg: number | null;
  self_focus_fatigue: number | null;
  self_handling_pressure: number | null;
  self_competition_anxiety: number | null;
  self_emotional_recovery: number | null;
  // goals
  expectations: string | null;
  previous_tools: string | null;
  anything_else: string | null;
  affirmations: string[] | null;
  viz_keywords: Record<string, string[]> | null;
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

type SatRow  = { id: string; user_id?: string; total_score: number; submitted_at: string; paid: boolean };
type AcsiRow = { id: string; user_id?: string; score_coping: number; score_concentration: number; score_confidence: number; score_goal_setting: number; total_score: number; submitted_at: string; paid: boolean };
type CsaiRow = { id: string; user_id?: string; score_cognitive: number; score_somatic: number; score_confidence: number; submitted_at: string; paid: boolean };
type DasRow  = { id: string; user_id?: string; total_score: number; depression_prone: boolean; submitted_at: string; paid: boolean };

const getMondayOfWeek = (d: Date): string => mondayOfWeek(d);
const getSundayOfWeek = (d: Date): string => sundayOfWeek(d);

function daysAgoYmd(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
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

  // Fetch athletes linked to this coach (full profile including onboarding fields)
  const athletes = await dbSelect<ProfileRow>("profiles", {
    coach_id: `eq.${user.id}`,
    role: "eq.athlete",
    select: [
      "id,display_name,avatar_url,created_at",
      "meet_date,gender,bodyweight_kg,weight_category",
      "squat_current_kg,squat_goal_kg,bench_current_kg,bench_goal_kg,deadlift_current_kg,deadlift_goal_kg",
      "mental_goals,training_days_per_week,instagram,years_powerlifting,federation",
      "main_barrier,confidence_break,overthinking_focus,previous_mental_work",
      "self_confidence_reg,self_focus_fatigue,self_handling_pressure,self_competition_anxiety,self_emotional_recovery",
      "expectations,previous_tools,anything_else",
      "affirmations,viz_keywords",
    ].join(","),
    order: "created_at.asc",
  });

  if (!athletes.length) return NextResponse.json([]);

  const athleteIds = athletes.map((a) => a.id);
  const idList = `(${athleteIds.map((id) => `"${id}"`).join(",")})`;

  const monday = getMondayOfWeek(new Date());
  const sunday = getSundayOfWeek(new Date());
  const twentyEightDaysAgo  = daysAgoYmd(28);
  const oneEightyDaysAgo    = daysAgoYmd(180);

  // Fetch entries, test results and training entries for all athletes in parallel
  const [entries, sat, acsi, csai, das, trainingEntriesRaw, allFeedback] = await Promise.all([
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
      select: "id,user_id,score_coping,score_concentration,score_confidence,score_goal_setting,total_score,submitted_at,paid",
    }),
    dbSelect<CsaiRow>("csai_results", {
      user_id: `in.${idList}`,
      order: "submitted_at.desc",
      select: "id,user_id,score_cognitive,score_somatic,score_confidence,submitted_at,paid",
    }),
    dbSelect<DasRow>("das_results", {
      user_id: `in.${idList}`,
      order: "submitted_at.desc",
      select: "id,user_id,total_score,depression_prone,submitted_at,paid",
    }),
    // Extended to last 180 days: 28 days for week navigation + full activity feed
    dbSelect<TrainingEntry>("training_entries", {
      user_id: `in.${idList}`,
      entry_date: `gte.${oneEightyDaysAgo}`,
      order: "entry_date.asc",
      select: "id,user_id,entry_date,is_training_day,mood_rating,thoughts_before,thoughts_after,what_went_well,frustrations,next_session,coach_note,created_at,updated_at",
    }),
    // Coach entry feedback for all athletes
    dbSelect<FeedbackRow>("entry_feedback", {
      coach_id: `eq.${user.id}`,
      athlete_id: `in.${idList}`,
      select: "id,entry_id,athlete_id,content,created_at",
      order: "created_at.asc",
    }),
  ]);

  // Filter training to current week for the primary trainingThisWeek field
  const trainingEntries = trainingEntriesRaw.filter((e) => e.entry_date >= monday && e.entry_date <= sunday);

  // Group by athlete
  const result = athletes.map((athlete) => {
    // Build feedbackByEntryId for this athlete
    const athleteFeedback = allFeedback.filter((f) => f.athlete_id === athlete.id);
    const feedbackByEntryId: Record<string, { id: string; content: string; created_at: string }> = {};
    for (const f of athleteFeedback) {
      feedbackByEntryId[f.entry_id] = { id: f.id, content: f.content, created_at: f.created_at };
    }

    return {
      ...athlete,
      entries: entries.filter((e) => e.user_id === athlete.id),
      sat: sat.filter((r) => r.user_id === athlete.id),
      acsi: acsi.filter((r) => r.user_id === athlete.id),
      csai: csai.filter((r) => r.user_id === athlete.id),
      das: das.filter((r) => r.user_id === athlete.id),
      training_entries: trainingEntries.filter((e) => e.user_id === athlete.id),
      all_training_entries: trainingEntriesRaw.filter((e) => e.user_id === athlete.id),
      feedbackByEntryId,
    };
  });

  return NextResponse.json(result);
}

// ── PATCH — coach edits athlete affirmations or viz_keywords ─────────────────

export async function PATCH(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify caller is a coach
  const coaches = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${user.id}`,
    role: "eq.coach",
    select: "id",
  });
  if (!coaches.length) return NextResponse.json({ error: "Not a coach" }, { status: 403 });

  let body: { athleteId: string; affirmations?: string[]; viz_keywords?: Record<string, string[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { athleteId, affirmations, viz_keywords } = body;
  if (!athleteId) return NextResponse.json({ error: "athleteId required" }, { status: 400 });

  // Verify this athlete belongs to this coach
  const athletes = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${athleteId}`,
    coach_id: `eq.${user.id}`,
    role: "eq.athlete",
    select: "id",
  });
  if (!athletes.length) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (affirmations !== undefined) patch.affirmations = affirmations;
  if (viz_keywords  !== undefined) patch.viz_keywords  = viz_keywords;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  await dbPatch("profiles", { id: athleteId }, patch);
  return NextResponse.json({ ok: true });
}
