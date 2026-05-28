/**
 * Demo data seed / cleanup endpoint.
 *
 * POST   /api/admin/seed-demo  — ensures a dedicated demo coach account exists,
 *                                creates 4 roster athletes + 1 demo athlete account,
 *                                and removes any previous demo data first.
 * DELETE /api/admin/seed-demo  — removes all demo athletes + the demo coach account.
 *
 * Demo coach:   demo.coach@powerflow.training   (sign in via admin "Sign in as Demo Coach")
 * Demo athlete: demo.athlete@powerflow.training (sign in via admin "Sign in as Demo Athlete")
 * Demo athletes identified by: coach_notes = "DEMO_ATHLETE"
 * Demo coach identified by:    coach_notes = "DEMO_COACH"
 *
 * Deleting the auth user cascades to profile → journal/training/checkin/test rows.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbInsert, dbSelect, deleteAuthUser } from "@/lib/supabaseAdmin";

const SB_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DEMO_ATHLETE_TAG = "DEMO_ATHLETE";
const DEMO_COACH_TAG   = "DEMO_COACH";

export const DEMO_COACH_EMAIL   = "demo.coach@powerflow.training";
export const DEMO_ATHLETE_EMAIL = "demo.athlete@powerflow.training";

// ─── GoTrue helpers ────────────────────────────────────────────────────────

async function createAuthUser(email: string, password?: string): Promise<string | null> {
  const res = await fetch(`${SB_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
    body: JSON.stringify({
      email,
      password: password ?? crypto.randomUUID(),
      email_confirm: true,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("[seed-demo] createAuthUser failed", res.status, t);
    return null;
  }
  const user = (await res.json()) as { id: string };
  return user.id;
}

// ─── Demo coach ────────────────────────────────────────────────────────────

/** Finds or creates the shared demo coach account. Returns its user_id. */
async function ensureDemoCoach(): Promise<string | null> {
  type Row = { id: string };

  // Reuse existing demo coach if already seeded
  const existing = await dbSelect<Row>("profiles", {
    coach_notes: `eq.${DEMO_COACH_TAG}`,
    select: "id",
  });
  if (existing.length > 0) return existing[0].id;

  // Create auth user with known credentials
  const uid = await createAuthUser(DEMO_COACH_EMAIL);
  if (!uid) return null;

  const profile = await dbInsert("profiles", {
    id: uid,
    display_name: "Demo Coach",
    role: "coach",
    coach_status: "approved",
    coach_code: "DEMOSHOW",
    onboarding_complete: true,
    plan_tier: "pr",
    language: "en",
    ai_access: true,
    test_access: true,
    preferred_voice_id: "Jacqueline",
    coach_notes: DEMO_COACH_TAG,
  });

  if (!profile) {
    await deleteAuthUser(uid);
    return null;
  }

  return uid;
}

// ─── Date / week helpers ───────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function isoTs(daysBack: number, hour = 20): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoWeekData(daysBack: number): {
  year: number;
  week_number: number;
  week_start: string;
} {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  // ISO week via Thursday rule
  const thu = new Date(mon);
  thu.setDate(mon.getDate() + 3);
  const jan1 = new Date(thu.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((thu.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return {
    year: mon.getFullYear(),
    week_number: week,
    week_start: mon.toISOString().split("T")[0],
  };
}

// ─── Demo athlete definitions ──────────────────────────────────────────────

function buildAthletes(coachId: string) {
  return [
    // ── Marcus Webb  ·  93 kg  ·  IPF  ·  6 weeks out ─────────────────────
    {
      email: "demo.marcus.webb@powerflow.training",
      profile: {
        display_name: "Marcus Webb",
        role: "athlete",
        coach_id: coachId,
        gender: "male",
        federation: "IPF",
        bodyweight_kg: 92.8,
        squat_current_kg: 240,   squat_goal_kg: 262.5,
        bench_current_kg: 165,   bench_goal_kg: 182.5,
        deadlift_current_kg: 295, deadlift_goal_kg: 320,
        meet_date: daysFromNow(42),
        plan_tier: "pr",
        language: "en",
        onboarding_complete: true,
        ai_access: true,
        test_access: true,
        years_powerlifting: "7",
        coach_notes: DEMO_ATHLETE_TAG,
        self_confidence_reg: 6,
        self_focus_fatigue: 7,
        self_handling_pressure: 5,
        self_competition_anxiety: 4,
        self_emotional_recovery: 6,
      },
      journals: [
        { created_at: isoTs(3), sentiment: "negative", context: "post-training",
          themes: ["competition prep", "focus", "anxiety"],
          content: "Squat session was heavy mentally today. Hit 232.5 for 3 but I couldn't switch off the noise between sets. Kept replaying the red light from my last competition. Need to get out of my own head before the meet." },
        { created_at: isoTs(1), sentiment: "positive", context: "post-training",
          themes: ["visualization", "deadlift", "breakthrough"],
          content: "Did the visualization script before deadlifts today. 10 minutes, full focus on the pull. Pulled 285 for 5 and it felt like nothing. The mental prep actually made a tangible difference — this is what I want to feel like at the meet." },
        { created_at: isoTs(0, 9), sentiment: "neutral", context: "general",
          themes: ["competition prep", "mindset"],
          content: "6 weeks feels close. Started fixating on the openers again. Reminded myself I've hit these numbers a hundred times in training. Trying to focus on the process, not the outcome. It's a work in progress." },
      ],
      training: [
        { entry_date: daysAgo(13), is_training_day: true,  mood_rating: 6, thoughts_before: "Felt heavy going in.", thoughts_after: "Worked through it. Numbers hit.", what_went_well: "Stayed calm on heavy attempts", frustrations: "Setup took too long between sets" },
        { entry_date: daysAgo(11), is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(10), is_training_day: true,  mood_rating: 7, thoughts_before: "Good night's sleep. Focused.", thoughts_after: "Bench felt solid. Hit all marks.", what_went_well: "Arch was consistent", frustrations: null },
        { entry_date: daysAgo(8),  is_training_day: true,  mood_rating: 5, thoughts_before: "Mind was elsewhere.", thoughts_after: "Got through it but felt disconnected from the bar.", what_went_well: null, frustrations: "Couldn't quiet the competition thoughts" },
        { entry_date: daysAgo(6),  is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(5),  is_training_day: true,  mood_rating: 8, thoughts_before: "Ran through the visualization script. Ready.", thoughts_after: "Best squat session in weeks. Everything clicked.", what_went_well: "Bar path was perfect", frustrations: null },
        { entry_date: daysAgo(3),  is_training_day: true,  mood_rating: 5, thoughts_before: "Anxious. Competition getting close.", thoughts_after: "Hit the numbers but it felt harder than it should.", what_went_well: "Stayed consistent with technique", frustrations: "Mental noise between sets" },
        { entry_date: daysAgo(1),  is_training_day: true,  mood_rating: 9, thoughts_before: "Visualization done. Feeling sharp.", thoughts_after: "Deadlift PR in training. 285×5 easy. Ready.", what_went_well: "Full focus. Everything.", frustrations: null },
      ],
      checkins: [
        { ...isoWeekData(21), mood_rating: 6, training_quality: 7, readiness_rating: 6, energy_rating: 7, sleep_rating: 6,
          biggest_win: "Stayed consistent with 4 sessions despite fatigue",
          biggest_challenge: "Mental distraction during competition simulation",
          focus_next_week: "Lock in pre-set routine" },
        { ...isoWeekData(14), mood_rating: 6, training_quality: 6, readiness_rating: 5, energy_rating: 6, sleep_rating: 5,
          biggest_win: "Bench technique finally clicked",
          biggest_challenge: "Sleep quality dropped — too much thinking about the meet",
          focus_next_week: "Evening relaxation protocol every night" },
        { ...isoWeekData(7), mood_rating: 8, training_quality: 9, readiness_rating: 8, energy_rating: 8, sleep_rating: 7,
          biggest_win: "Best deadlift session of prep. Visualization is working.",
          biggest_challenge: "Still replaying past competition mistakes",
          focus_next_week: "Stay present. Trust the training." },
      ],
      tests: {
        csai: { score_cognitive: 24, score_somatic: 16, score_confidence: 26 },
        acsi: { score_coping: 10, score_peaking: 11, score_goal_setting: 12, score_concentration: 9, score_freedom: 11, score_confidence: 12, score_coachability: 13, total_score: 78 },
        das:  { score_external_approval: 8, score_lovability: 5, score_achievement: 12, score_perfectionism: 14, score_entitlement: 4, score_omnipotence: 6, score_external_control: 5, total_score: 54, depression_prone: false },
      },
    },

    // ── Kayla Ström  ·  76 kg  ·  USAPL  ·  10 weeks out ─────────────────
    {
      email: "demo.kayla.strom@powerflow.training",
      profile: {
        display_name: "Kayla Ström",
        role: "athlete",
        coach_id: coachId,
        gender: "female",
        federation: "USAPL",
        bodyweight_kg: 74.6,
        squat_current_kg: 148,  squat_goal_kg: 165,
        bench_current_kg: 82.5, bench_goal_kg: 92.5,
        deadlift_current_kg: 185, deadlift_goal_kg: 205,
        meet_date: daysFromNow(70),
        plan_tier: "pr",
        language: "en",
        onboarding_complete: true,
        ai_access: true,
        test_access: true,
        years_powerlifting: "4",
        coach_notes: DEMO_ATHLETE_TAG,
        self_confidence_reg: 5,
        self_focus_fatigue: 6,
        self_handling_pressure: 4,
        self_competition_anxiety: 3,
        self_emotional_recovery: 5,
      },
      journals: [
        { created_at: isoTs(4), sentiment: "negative", context: "post-training",
          themes: ["bench press", "confidence", "mental block"],
          content: "Missed the 82.5 bench in today's session. Setup was right, technique was there — I could feel it. My brain just went blank the moment the bar started moving. I know it's mental but knowing that doesn't fix it under the bar." },
        { created_at: isoTs(1), sentiment: "positive", context: "post-training",
          themes: ["confidence", "squat", "breakthrough"],
          content: "Coach had me do the confidence anchoring exercise before the heavy squat set. Something shifted. Hit 145 for a clean triple — best in a long time. This is what it's supposed to feel like. I need to bottle that and bring it every session." },
      ],
      training: [
        { entry_date: daysAgo(13), is_training_day: true,  mood_rating: 5, thoughts_before: "Nervous about the bench work.", thoughts_after: "Got through it. Weight felt heavy.", what_went_well: "Setup consistency", frustrations: "Confidence under the bar shaky" },
        { entry_date: daysAgo(11), is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(10), is_training_day: true,  mood_rating: 6, thoughts_before: "Trying to go in with less expectation.", thoughts_after: "Squat moved better when I stopped overthinking it.", what_went_well: "Depth consistent", frustrations: "Bench still the weak point mentally" },
        { entry_date: daysAgo(7),  is_training_day: true,  mood_rating: 4, thoughts_before: "Tired and not feeling it.", thoughts_after: "Missed the 82.5 bench. Frustrating.", what_went_well: "Stayed in the gym", frustrations: "Mental block on bench is getting worse" },
        { entry_date: daysAgo(5),  is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(4),  is_training_day: true,  mood_rating: 7, thoughts_before: "Did the anchoring exercise. Feeling different.", thoughts_after: "Best squat session in months. 145×3. Mind quiet.", what_went_well: "Confidence anchoring worked. Mental shift visible.", frustrations: null },
        { entry_date: daysAgo(2),  is_training_day: true,  mood_rating: 6, thoughts_before: "Building on last session.", thoughts_after: "Solid. Bench still needs work but squats trending right.", what_went_well: "Deadlift felt strong", frustrations: null },
      ],
      checkins: [
        { ...isoWeekData(21), mood_rating: 5, training_quality: 6, readiness_rating: 5, energy_rating: 6, sleep_rating: 7,
          biggest_win: "Maintained training frequency despite confidence dip",
          biggest_challenge: "Confidence flagging on bench",
          focus_next_week: "Focus on process, not outcome" },
        { ...isoWeekData(14), mood_rating: 4, training_quality: 5, readiness_rating: 4, energy_rating: 5, sleep_rating: 6,
          biggest_win: "Got through a tough week",
          biggest_challenge: "Missed bench attempts — mental block confirmed",
          focus_next_week: "Work with coach on confidence anchoring technique" },
        { ...isoWeekData(7), mood_rating: 7, training_quality: 7, readiness_rating: 7, energy_rating: 7, sleep_rating: 7,
          biggest_win: "145 squat triple — best in months. The anchoring exercise worked.",
          biggest_challenge: "Bench confidence still a work in progress",
          focus_next_week: "Apply anchoring to bench sessions too" },
      ],
      tests: {
        acsi: { score_coping: 9, score_peaking: 10, score_goal_setting: 11, score_concentration: 10, score_freedom: 9, score_confidence: 7, score_coachability: 13, total_score: 69 },
        csai: { score_cognitive: 20, score_somatic: 18, score_confidence: 22 },
      },
    },

    // ── Jake Hartley  ·  83 kg  ·  IPF  ·  no meet date ──────────────────
    {
      email: "demo.jake.hartley@powerflow.training",
      profile: {
        display_name: "Jake Hartley",
        role: "athlete",
        coach_id: coachId,
        gender: "male",
        federation: "IPF",
        bodyweight_kg: 82.4,
        squat_current_kg: 210,   squat_goal_kg: 232.5,
        bench_current_kg: 140,   bench_goal_kg: 155,
        deadlift_current_kg: 252.5, deadlift_goal_kg: 275,
        meet_date: null,
        plan_tier: "pr",
        language: "en",
        onboarding_complete: true,
        ai_access: true,
        test_access: true,
        years_powerlifting: "3",
        coach_notes: DEMO_ATHLETE_TAG,
        self_confidence_reg: 6,
        self_focus_fatigue: 5,
        self_handling_pressure: 6,
        self_competition_anxiety: 7,
        self_emotional_recovery: 5,
      },
      journals: [
        { created_at: isoTs(5), sentiment: "neutral", context: "post-training",
          themes: ["consistency", "process"],
          content: "Decent session. Hit all my numbers. Nothing exceptional but consistent and solid. Maybe that's actually the point — boring and consistent beats exciting and inconsistent every time." },
        { created_at: isoTs(2), sentiment: "negative", context: "rest-day",
          themes: ["recovery", "sleep", "self-awareness"],
          content: "Sleep was rough. Could feel it in the warmups. Cut the session short — not because I'm soft but because grinding through junk volume builds nothing. Took the evening relaxation script instead. Woke up feeling better." },
        { created_at: isoTs(0, 18), sentiment: "positive", context: "post-training",
          themes: ["squat", "breakthrough", "confidence"],
          content: "227.5 squat for 2. Never done that before in training. Whatever the mental routine is doing, it's working. Starting to actually believe the goal total is within reach. Big day." },
      ],
      training: [
        { entry_date: daysAgo(14), is_training_day: true,  mood_rating: 7, thoughts_before: "Feeling good. Ready to work.", thoughts_after: "Solid session. All numbers hit.", what_went_well: "Squat depth consistent", frustrations: null },
        { entry_date: daysAgo(12), is_training_day: true,  mood_rating: 6, thoughts_before: "Neutral going in.", thoughts_after: "Bench moved well.", what_went_well: "Controlled descent", frustrations: null },
        { entry_date: daysAgo(9),  is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(8),  is_training_day: true,  mood_rating: 7, thoughts_before: "Slept well. Ready.", thoughts_after: "Deadlifts heavy but hit all reps.", what_went_well: "Stayed mentally tough on hard reps", frustrations: "Energy dipped in second half" },
        { entry_date: daysAgo(5),  is_training_day: true,  mood_rating: 6, thoughts_before: "Just going to get the work done.", thoughts_after: "Consistent. Not flashy.", what_went_well: "All programmed work completed", frustrations: null },
        { entry_date: daysAgo(3),  is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(2),  is_training_day: true,  mood_rating: 4, thoughts_before: "Tired. Bad night.", thoughts_after: "Cut short. Right call.", what_went_well: "Self-awareness — didn't force a bad session", frustrations: "Sleep is the weak link" },
        { entry_date: daysAgo(0),  is_training_day: true,  mood_rating: 9, thoughts_before: "Feeling strong. Ran through the pre-session script.", thoughts_after: "227.5 squat for 2. New training PR. Everything clicked.", what_went_well: "Mental prep was on point.", frustrations: null },
      ],
      checkins: [
        { ...isoWeekData(21), mood_rating: 6, training_quality: 7, readiness_rating: 6, energy_rating: 6, sleep_rating: 5,
          biggest_win: "Consistent training week",
          biggest_challenge: "Sleep quality affecting energy",
          focus_next_week: "Sleep protocol" },
        { ...isoWeekData(14), mood_rating: 7, training_quality: 7, readiness_rating: 7, energy_rating: 6, sleep_rating: 6,
          biggest_win: "Hit all programmed lifts",
          biggest_challenge: "Managing perfectionism — need to accept good-enough sessions",
          focus_next_week: "Process focus over outcome" },
        { ...isoWeekData(7), mood_rating: 8, training_quality: 8, readiness_rating: 8, energy_rating: 7, sleep_rating: 7,
          biggest_win: "227.5 squat training PR. Mental routine is paying off.",
          biggest_challenge: "Bad sleep mid-week but managed it well",
          focus_next_week: "Set a meet date — time to compete" },
      ],
      tests: {
        das: { score_external_approval: 11, score_lovability: 6, score_achievement: 15, score_perfectionism: 17, score_entitlement: 5, score_omnipotence: 7, score_external_control: 8, total_score: 69, depression_prone: false },
        sat: { score_performance: 14, score_affiliation: 9, score_aggression: 8, score_defensiveness: 11, score_consciousness: 13, score_dominance: 10, score_exhibition: 7, score_autonomy: 12, score_caregiving: 8, score_order: 14, score_helplessness: 6, sf_self_confirmation: 24, sf_rational_dominance: 21, sf_aggressive_nonconformity: 15, sf_passive_dependence: 13, sf_sociability: 16, sf_agreeableness: 20, sum_yes: 112, total_score: 112, validity_reliable: true },
      },
    },

    // ── Sofia Mäkinen  ·  63 kg  ·  IPF  ·  3 weeks out  ─────────────────
    {
      email: "demo.sofia.makinen@powerflow.training",
      profile: {
        display_name: "Sofia Mäkinen",
        role: "athlete",
        coach_id: coachId,
        gender: "female",
        federation: "IPF",
        bodyweight_kg: 62.8,
        squat_current_kg: 165,  squat_goal_kg: 182.5,
        bench_current_kg: 90,   bench_goal_kg: 102.5,
        deadlift_current_kg: 200, deadlift_goal_kg: 222.5,
        meet_date: daysFromNow(21),
        plan_tier: "pr",
        language: "en",
        onboarding_complete: true,
        ai_access: true,
        test_access: true,
        years_powerlifting: "6",
        coach_notes: DEMO_ATHLETE_TAG,
        self_confidence_reg: 8,
        self_focus_fatigue: 7,
        self_handling_pressure: 8,
        self_competition_anxiety: 7,
        self_emotional_recovery: 8,
      },
      journals: [
        { created_at: isoTs(3), sentiment: "positive", context: "pre-training",
          themes: ["competition prep", "openers", "confidence"],
          content: "Opener selection session. Locked in 160 / 87.5 / 195 — all conservative but all very makeable. Confident openers set the tone. 3 weeks feels short and exactly right at the same time." },
        { created_at: isoTs(0, 8), sentiment: "positive", context: "general",
          themes: ["visualization", "competition prep", "mental rehearsal"],
          content: "Visualization this morning — bench arch script twice, then 20 minutes of mental competition walkthrough. I've been to that platform a hundred times in my head already. When I step out there it will feel like home." },
      ],
      training: [
        { entry_date: daysAgo(13), is_training_day: true,  mood_rating: 8, thoughts_before: "3 weeks out. Every rep matters.", thoughts_after: "Squats felt controlled. Right where I want to be.", what_went_well: "Depth and consistency", frustrations: null },
        { entry_date: daysAgo(11), is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(10), is_training_day: true,  mood_rating: 9, thoughts_before: "Pre-session script done. Sharp and ready.", thoughts_after: "Best bench session of the whole prep. Clean and strong.", what_went_well: "Arch held on every rep. Zero breakdown.", frustrations: null },
        { entry_date: daysAgo(8),  is_training_day: true,  mood_rating: 7, thoughts_before: "Tired but focused.", thoughts_after: "Deadlift numbers are there. Pulled smooth.", what_went_well: "Patience at the floor", frustrations: "A bit flat — expected at this point in prep" },
        { entry_date: daysAgo(6),  is_training_day: false, mood_rating: null },
        { entry_date: daysAgo(5),  is_training_day: true,  mood_rating: 8, thoughts_before: "Opener day. Confident.", thoughts_after: "All three openers hit. Easy. This is going to go well.", what_went_well: "Opener selection was spot on", frustrations: null },
        { entry_date: daysAgo(3),  is_training_day: true,  mood_rating: 8, thoughts_before: "Light day. Staying sharp.", thoughts_after: "Everything moved fast and clean. Taper is working.", what_went_well: "Bar speed is excellent", frustrations: null },
        { entry_date: daysAgo(1),  is_training_day: false, mood_rating: null },
      ],
      checkins: [
        { ...isoWeekData(21), mood_rating: 8, training_quality: 8, readiness_rating: 8, energy_rating: 8, sleep_rating: 9,
          biggest_win: "Visualization routine is now automatic — doing it without thinking",
          biggest_challenge: "Managing excitement — staying in the process",
          focus_next_week: "Stay controlled. Trust the taper." },
        { ...isoWeekData(14), mood_rating: 8, training_quality: 9, readiness_rating: 8, energy_rating: 8, sleep_rating: 8,
          biggest_win: "Best bench session of the full prep",
          biggest_challenge: "Patience — want to push harder but trusting the plan",
          focus_next_week: "Opener selection and mental rehearsal" },
        { ...isoWeekData(7), mood_rating: 9, training_quality: 9, readiness_rating: 9, energy_rating: 8, sleep_rating: 9,
          biggest_win: "All three openers felt easy. Ready to compete.",
          biggest_challenge: "Nothing significant — mind is calm and clear",
          focus_next_week: "Platform visualization every morning. Arrive ready." },
      ],
      tests: {
        csai: { score_cognitive: 14, score_somatic: 12, score_confidence: 32 },
        acsi: { score_coping: 12, score_peaking: 13, score_goal_setting: 14, score_concentration: 13, score_freedom: 12, score_confidence: 14, score_coachability: 14, total_score: 92 },
        das:  { score_external_approval: 6, score_lovability: 4, score_achievement: 8, score_perfectionism: 7, score_entitlement: 3, score_omnipotence: 4, score_external_control: 4, total_score: 36, depression_prone: false },
        sat:  { score_performance: 13, score_affiliation: 12, score_aggression: 6, score_defensiveness: 9, score_consciousness: 14, score_dominance: 8, score_exhibition: 10, score_autonomy: 13, score_caregiving: 13, score_order: 15, score_helplessness: 4, sf_self_confirmation: 21, sf_rational_dominance: 20, sf_aggressive_nonconformity: 12, sf_passive_dependence: 17, sf_sociability: 22, sf_agreeableness: 23, sum_yes: 117, total_score: 117, validity_reliable: true },
      },
    },
  ];
}

// ─── Demo athlete (for showing the athlete UX) ─────────────────────────────
// Alex Morrison is the athlete account the presenter can sign into to show
// the full athlete experience: /today, /journal, /chat, /scripts, /you, etc.
// Linked to the demo coach so the coach dashboard also shows 5 athletes.

function buildDemoAthlete(coachId: string) {
  return {
    email: DEMO_ATHLETE_EMAIL,
    profile: {
      display_name: "Alex Morrison",
      role: "athlete",
      coach_id: coachId,
      gender: "male",
      federation: "IPF",
      bodyweight_kg: 82.6,
      squat_current_kg: 220,    squat_goal_kg: 247.5,
      bench_current_kg: 152.5,  bench_goal_kg: 170,
      deadlift_current_kg: 272.5, deadlift_goal_kg: 300,
      meet_date: daysFromNow(56),
      plan_tier: "pr",
      language: "en",
      onboarding_complete: true,
      ai_access: true,
      test_access: true,
      years_powerlifting: "5",
      coach_notes: DEMO_ATHLETE_TAG,
      self_confidence_reg: 7,
      self_focus_fatigue: 6,
      self_handling_pressure: 7,
      self_competition_anxiety: 6,
      self_emotional_recovery: 7,
      // Pre-set affirmations + keywords so coach panel shows them
      affirmations: ["I am strong and prepared.", "I trust my training.", "The platform is where I belong."],
      viz_keywords: {
        "viz-squat":    ["strong", "explosive", "locked in"],
        "viz-bench":    ["smooth", "confident"],
        "viz-deadlift": ["strong", "explosive", "patient"],
      },
    },
    journals: [
      { created_at: isoTs(14), sentiment: "neutral", context: "post-training",
        themes: ["squat", "technique", "focus"],
        content: "Heavy squat day. 215 for 4×3 — all felt within myself. Bar path was clean, depth was automatic. Nothing flashy but everything where it needed to be. This is what consistent prep looks like." },
      { created_at: isoTs(11), sentiment: "positive", context: "post-training",
        themes: ["bench press", "confidence", "breakthrough"],
        content: "147.5 bench for a paused triple. Cleanest set of the block. The cue Coach gave me about leg drive actually clicked today — felt like a completely different movement. Confidence is building." },
      { created_at: isoTs(9), sentiment: "negative", context: "rest-day",
        themes: ["recovery", "mental fatigue", "sleep"],
        content: "Rest day but mind wouldn't switch off. Kept running numbers, thinking about the meet, calculating totals. Ended up journaling for 30 minutes to get it out of my head. Tomorrow I need to train, not simulate competitions in my head." },
      { created_at: isoTs(7), sentiment: "positive", context: "post-training",
        themes: ["deadlift", "visualization", "breakthrough"],
        content: "Ran through the deadlift visualization script before the session. Something about hearing the cues in Coach's voice before I even touch the bar changes my state. Pulled 267.5 for 5 — never done that before. Visualization works. Full stop." },
      { created_at: isoTs(5), sentiment: "neutral", context: "post-training",
        themes: ["competition prep", "process", "mindset"],
        content: "8 weeks out. Today was about accumulation — volume, not intensity. Felt flat but that's expected mid-block. Coach reminded me that feeling good in training and performing well at the meet are two different things. Trust the process." },
      { created_at: isoTs(3), sentiment: "positive", context: "post-training",
        themes: ["squat", "confidence", "mental rehearsal"],
        content: "PR attempt day. 237.5 squat — called the depth, felt the lockout, heard the rack command. Exactly what I trained for. 8 weeks and I'm already where I need to be. Now maintain and peak." },
      { created_at: isoTs(1), sentiment: "positive", context: "general",
        themes: ["competition prep", "readiness", "mental rehearsal"],
        content: "Did the full competition day visualization this morning. Walked out, set up, hit every lift. By the time I was done I'd already competed at this meet once in my head. That's 8 weeks of prep wrapped up in 20 minutes. Ready." },
    ],
    training: [
      { entry_date: daysAgo(13), is_training_day: true,  mood_rating: 7, thoughts_before: "Energized. Ready to squat.", thoughts_after: "215×3×4. Everything clicked.", what_went_well: "Bar path perfectly vertical", frustrations: null },
      { entry_date: daysAgo(12), is_training_day: false, mood_rating: null },
      { entry_date: daysAgo(11), is_training_day: true,  mood_rating: 8, thoughts_before: "Bench day — going in with the new cue.", thoughts_after: "147.5 paused triple. Best bench in months.", what_went_well: "Leg drive locked in", frustrations: null },
      { entry_date: daysAgo(10), is_training_day: false, mood_rating: null },
      { entry_date: daysAgo(9),  is_training_day: false, mood_rating: null },
      { entry_date: daysAgo(8),  is_training_day: true,  mood_rating: 6, thoughts_before: "Tired from bad sleep.", thoughts_after: "Got through it. Deadlifts moved okay.", what_went_well: "Technique held up despite fatigue", frustrations: "Flat. Not a great session." },
      { entry_date: daysAgo(7),  is_training_day: false, mood_rating: null },
      { entry_date: daysAgo(6),  is_training_day: true,  mood_rating: 9, thoughts_before: "Did the deadlift visualization script. Dialed in.", thoughts_after: "267.5×5. New training PR. Visualization made the difference.", what_went_well: "Lat engagement, setup, everything.", frustrations: null },
      { entry_date: daysAgo(5),  is_training_day: false, mood_rating: null },
      { entry_date: daysAgo(4),  is_training_day: true,  mood_rating: 7, thoughts_before: "Volume day. Just accumulate.", thoughts_after: "Done. Not exciting but necessary.", what_went_well: "Consistency", frustrations: "Felt flat mid-session" },
      { entry_date: daysAgo(3),  is_training_day: false, mood_rating: null },
      { entry_date: daysAgo(2),  is_training_day: true,  mood_rating: 9, thoughts_before: "PR attempt day. Everything prepared.", thoughts_after: "237.5 squat. Done. 8 weeks early.", what_went_well: "Depth, lockout, mental focus — everything.", frustrations: null },
      { entry_date: daysAgo(1),  is_training_day: false, mood_rating: null },
      { entry_date: daysAgo(0),  is_training_day: true,  mood_rating: 8, thoughts_before: "Peaking block starts today.", thoughts_after: "Opener hits. Light and fast. Taper is on.", what_went_well: "Bar speed excellent", frustrations: null },
    ],
    checkins: [
      { ...isoWeekData(21), mood_rating: 7, training_quality: 7, readiness_rating: 7, energy_rating: 7, sleep_rating: 6,
        biggest_win: "Squat technique has been consistent all week",
        biggest_challenge: "Sleep quality still not where it should be",
        focus_next_week: "Evening wind-down protocol — no screens after 10pm" },
      { ...isoWeekData(14), mood_rating: 7, training_quality: 8, readiness_rating: 7, energy_rating: 7, sleep_rating: 7,
        biggest_win: "Bench leg drive cue finally clicked — new PB in training",
        biggest_challenge: "Mid-week mental fatigue — overthinking the meet",
        focus_next_week: "Stay in the process. One session at a time." },
      { ...isoWeekData(7), mood_rating: 9, training_quality: 9, readiness_rating: 9, energy_rating: 8, sleep_rating: 8,
        biggest_win: "237.5 squat. Visualization script working. Feeling ready.",
        biggest_challenge: "Managing excitement — want to go heavier but trusting the plan",
        focus_next_week: "Opener day. Keep everything controlled." },
    ],
    tests: {
      csai: { score_cognitive: 18, score_somatic: 14, score_confidence: 29 },
      acsi: { score_coping: 11, score_peaking: 12, score_goal_setting: 13, score_concentration: 12, score_freedom: 11, score_confidence: 13, score_coachability: 14, total_score: 86 },
      das:  { score_external_approval: 7, score_lovability: 4, score_achievement: 10, score_perfectionism: 11, score_entitlement: 3, score_omnipotence: 5, score_external_control: 4, total_score: 44, depression_prone: false },
      sat:  { score_performance: 14, score_affiliation: 10, score_aggression: 7, score_defensiveness: 10, score_consciousness: 13, score_dominance: 9, score_exhibition: 8, score_autonomy: 13, score_caregiving: 9, score_order: 12, score_helplessness: 5, sf_self_confirmation: 23, sf_rational_dominance: 19, sf_aggressive_nonconformity: 14, sf_passive_dependence: 14, sf_sociability: 18, sf_agreeableness: 21, sum_yes: 113, total_score: 113, validity_reliable: true },
    },
  };
}

// ─── Cleanup helpers ───────────────────────────────────────────────────────

async function removeDemoAthletes(coachId: string): Promise<number> {
  type ProfileRow = { id: string };
  const rows = await dbSelect<ProfileRow>("profiles", {
    coach_id: `eq.${coachId}`,
    coach_notes: `eq.${DEMO_ATHLETE_TAG}`,
    select: "id",
  });
  for (const row of rows) {
    await deleteAuthUser(row.id);
  }
  return rows.length;
}

async function removeDemoCoach(): Promise<void> {
  type ProfileRow = { id: string };
  const rows = await dbSelect<ProfileRow>("profiles", {
    coach_notes: `eq.${DEMO_COACH_TAG}`,
    select: "id",
  });
  for (const row of rows) {
    await deleteAuthUser(row.id);
  }
}

// ─── POST — seed ───────────────────────────────────────────────────────────

export async function POST() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Ensure demo coach exists (creates if needed)
  const coachId = await ensureDemoCoach();
  if (!coachId) return NextResponse.json({ error: "failed to create demo coach" }, { status: 500 });

  // Always start with a clean slate for athletes
  await removeDemoAthletes(coachId);

  const allAthletes = [...buildAthletes(coachId), buildDemoAthlete(coachId)];
  const created: string[] = [];

  for (const def of allAthletes) {
    // 1. Auth user
    const uid = await createAuthUser(def.email);
    if (!uid) continue;

    // 2. Profile
    const profile = await dbInsert("profiles", { id: uid, ...def.profile });
    if (!profile) { await deleteAuthUser(uid); continue; }

    const ref = (name: string) => `demo-${name}-${uid.slice(0, 8)}`;

    // 3. Journal entries
    for (const j of def.journals) {
      await dbInsert("journal_entries", { user_id: uid, ...j });
    }

    // 4. Training entries
    for (const t of def.training) {
      await dbInsert("training_entries", { user_id: uid, ...t });
    }

    // 5. Weekly check-ins
    for (const c of def.checkins) {
      await dbInsert("weekly_checkins", { user_id: uid, ...c });
    }

    // 6. Test scores
    const { tests } = def;
    const firstName = def.profile.display_name.split(" ")[0];
    const commonTest = { first_name: firstName, email: def.email, gender: def.profile.gender, lang: "en", paid: true, submitted_at: isoTs(10) };

    if (tests.csai) {
      await dbInsert("csai_results", { ...commonTest, user_id: uid, result_ref: ref("csai"), ...tests.csai });
    }
    if (tests.acsi) {
      await dbInsert("acsi_results", { ...commonTest, user_id: uid, result_ref: ref("acsi"), ...tests.acsi });
    }
    if (tests.das) {
      await dbInsert("das_results", { ...commonTest, user_id: uid, result_ref: ref("das"), ...tests.das });
    }
    if (tests.sat) {
      await dbInsert("sat_results", { ...commonTest, user_id: uid, result_ref: ref("sat"), ...tests.sat });
    }

    created.push(def.profile.display_name);
  }

  return NextResponse.json({ created });
}

// ─── DELETE — cleanup ──────────────────────────────────────────────────────

export async function DELETE() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Find demo coach first (need their ID to delete their athletes)
  type Row = { id: string };
  const coaches = await dbSelect<Row>("profiles", {
    coach_notes: `eq.${DEMO_COACH_TAG}`,
    select: "id",
  });

  let athleteCount = 0;
  for (const coach of coaches) {
    athleteCount += await removeDemoAthletes(coach.id);
  }

  // Then delete the coach account(s)
  await removeDemoCoach();

  return NextResponse.json({ removed: athleteCount });
}
