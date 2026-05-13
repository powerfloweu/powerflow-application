/**
 * GET  /api/me — Returns the current user's full profile.
 * PATCH /api/me — Updates any patchable profile field.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch, dbInsert } from "@/lib/supabaseAdmin";
import type { AthleteProfile } from "@/lib/athlete";

const SELECT_COLS = [
  "id", "display_name", "avatar_url", "role", "coach_id", "coach_code", "coach_status", "coach_application", "meet_date",
  "course_access", "test_access", "onboarding_complete",
  "gender", "bodyweight_kg", "weight_category",
  "squat_current_kg", "squat_goal_kg",
  "bench_current_kg", "bench_goal_kg",
  "deadlift_current_kg", "deadlift_goal_kg",
  "mental_goals",
  "training_days_per_week",
  // v3 — application-form fields
  "instagram", "years_powerlifting", "federation",
  "main_barrier", "confidence_break", "overthinking_focus", "previous_mental_work",
  "self_confidence_reg", "self_focus_fatigue", "self_handling_pressure",
  "self_competition_anxiety", "self_emotional_recovery",
  "expectations", "previous_tools", "anything_else",
  // v4 — tools
  "affirmations", "viz_keywords", "viz_recordings",
  // v5 — voice work
  "ai_access", "self_talk_mode",
  // v6 — adaptive course
  "course_plan",
  // v7 — plan tier
  "plan_tier",
  // v8 — i18n
  "language",
  // v10 — custom journal prompts
  "journal_prompt_labels",
  // v11 — stripe billing
  "stripe_customer_id",
  "stripe_subscription_id",
].join(",");

export async function GET() {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<AthleteProfile>("profiles", {
    id: `eq.${user.id}`,
    select: SELECT_COLS,
  });

  if (!rows.length) {
    return NextResponse.json({
      id: user.id,
      coach_tts_voice_id: null,
      display_name: user.user_metadata?.full_name ?? user.email ?? "User",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "athlete" as const,
      coach_id: null,
      coach_code: null,
      meet_date: null,
      course_access: false,
      test_access: false,
      onboarding_complete: false,
      gender: null,
      bodyweight_kg: null,
      weight_category: null,
      squat_current_kg: null,
      squat_goal_kg: null,
      bench_current_kg: null,
      bench_goal_kg: null,
      deadlift_current_kg: null,
      deadlift_goal_kg: null,
      mental_goals: [],
      training_days_per_week: null,
      instagram: null,
      years_powerlifting: null,
      federation: null,
      main_barrier: null,
      confidence_break: null,
      overthinking_focus: null,
      previous_mental_work: null,
      self_confidence_reg: null,
      self_focus_fatigue: null,
      self_handling_pressure: null,
      self_competition_anxiety: null,
      self_emotional_recovery: null,
      expectations: null,
      previous_tools: null,
      anything_else: null,
      affirmations: [],
      viz_keywords: {},
      viz_recordings: {},
      ai_access: false,
      self_talk_mode: 'classic',
      course_plan: null,
      plan_tier: 'opener',
      language: 'en',
      journal_prompt_labels: null,
      coach_journal_prompt_labels: null,
      coach_status: null,
      coach_application: null,
      coach_notes: null,
    } satisfies AthleteProfile);
  }

  const row = rows[0];
  // plan_tier may be absent if PostgREST schema cache hasn't picked up the new
  // column yet. Fall back to inferring from legacy access flags so the UI works
  // immediately; once the cache refreshes (project pause/resume) the real DB
  // value takes over automatically.
  const rawTier = (row as Record<string, unknown>).plan_tier as string | undefined;
  const planTier: string = rawTier ?? (row.course_access || row.ai_access ? "pr" : "opener");

  // If athlete has a coach, look up:
  //   1. The coach's cloned TTS voice ID (cheap indexed PK lookup)
  //   2. Any per-athlete journal prompt labels the coach has set
  let coach_tts_voice_id: string | null = null;
  let coach_journal_prompt_labels: string[] | null = null;
  if (row.role === "athlete" && row.coach_id) {
    const [coachRows, settingsRows] = await Promise.all([
      dbSelect<{ tts_voice_id: string | null }>("profiles", {
        id: `eq.${row.coach_id}`,
        select: "tts_voice_id",
      }),
      dbSelect<{ journal_prompt_labels: string[] | null }>("coach_athlete_settings", {
        coach_id: `eq.${row.coach_id}`,
        athlete_id: `eq.${user.id}`,
        select: "journal_prompt_labels",
      }),
    ]);
    coach_tts_voice_id = coachRows[0]?.tts_voice_id ?? null;
    coach_journal_prompt_labels = settingsRows[0]?.journal_prompt_labels ?? null;
  }

  // Normalise: mental_goals may come back as null from DB
  return NextResponse.json({
    ...row,
    email: user.email ?? null,
    mental_goals: row.mental_goals ?? [],
    plan_tier: planTier,
    coach_tts_voice_id,
    coach_journal_prompt_labels,
  });
}

export async function PATCH(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<AthleteProfile>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Allowlist — only these keys may be patched
  const PATCHABLE: Array<keyof AthleteProfile> = [
    "meet_date", "display_name",
    "gender", "bodyweight_kg", "weight_category",
    "squat_current_kg", "squat_goal_kg",
    "bench_current_kg", "bench_goal_kg",
    "deadlift_current_kg", "deadlift_goal_kg",
    "mental_goals",
    "training_days_per_week",
    "onboarding_complete",
    "coach_id",
    // v3 — application-form fields
    "instagram", "years_powerlifting", "federation",
    "main_barrier", "confidence_break", "overthinking_focus", "previous_mental_work",
    "self_confidence_reg", "self_focus_fatigue", "self_handling_pressure",
    "self_competition_anxiety", "self_emotional_recovery",
    "expectations", "previous_tools", "anything_else",
    // v4 — tools
    "affirmations", "viz_keywords", "viz_recordings",
    // v5 — voice work
    "self_talk_mode",
    // v8 — i18n
    "language",
    // v10 — custom journal prompts (gated to PR tier below)
    "journal_prompt_labels",
    // v11 — coach application
    "coach_application",
  ];

  const patch: Record<string, unknown> = {};
  for (const key of PATCHABLE) {
    if (key in body) {
      const val = body[key];
      // Null out empty strings for nullable numeric/text fields
      if (val === "") patch[key] = null;
      else patch[key] = val ?? null;
    }
  }

  // Guard: journal_prompt_labels only for PR-tier athletes
  if ("journal_prompt_labels" in patch) {
    const profileRows = await dbSelect<{ plan_tier: string | null }>("profiles", {
      id: `eq.${user.id}`,
      select: "plan_tier",
    });
    const tier = profileRows[0]?.plan_tier ?? "opener";
    if (tier !== "pr") {
      delete patch.journal_prompt_labels;
    } else {
      // Sanitise: must be an array, max 5 non-empty strings
      const raw = patch.journal_prompt_labels;
      if (!Array.isArray(raw)) {
        delete patch.journal_prompt_labels;
      } else {
        const cleaned = (raw as unknown[])
          .map((v) => (typeof v === "string" ? v.trim() : ""))
          .slice(0, 5);
        patch.journal_prompt_labels = cleaned.length ? cleaned : null;
      }
    }
  }

  // Guard: onboarding_complete may only be set to true, never to false/null
  if ("onboarding_complete" in patch && !patch.onboarding_complete) {
    delete patch.onboarding_complete;
  }

  // Guard: coach_id must refer to an actual coach (or be null = "no coach").
  // Also reject self-links (coach picking themselves as their own coach).
  if ("coach_id" in patch && patch.coach_id !== null) {
    const cid = patch.coach_id as string;
    if (cid === user.id) {
      return NextResponse.json(
        { error: "Cannot set yourself as your coach." },
        { status: 400 },
      );
    }
    const coachRows = await dbSelect<{ id: string }>("profiles", {
      id: `eq.${cid}`,
      role: "eq.coach",
      select: "id",
    });
    if (!coachRows.length) {
      return NextResponse.json(
        { error: "Selected coach does not exist." },
        { status: 400 },
      );
    }
  }

  // Special: trim display_name
  if (typeof patch.display_name === "string") {
    patch.display_name = (patch.display_name as string).trim();
    if (!patch.display_name) delete patch.display_name;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Check whether a profile row exists first
  const existing = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "id",
  });

  let ok: boolean;
  if (existing.length > 0) {
    ok = await dbPatch("profiles", { id: user.id }, patch);
  } else {
    // Row was never created (ensureProfile may have failed during OAuth).
    // Insert now with required defaults + the patch data.
    const inserted = await dbInsert("profiles", {
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? "User",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "athlete",
      ...patch,
    });
    ok = !!inserted;
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Database write failed — check server logs or run missing migrations." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
