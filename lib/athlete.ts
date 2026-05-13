/**
 * Athlete performance helpers — GL Points, weight categories, lift utilities.
 */

// ── GL (Goodlift) Points ──────────────────────────────────────────────────────
//
// Formula: GL = 100 × Total / (a − b × e^(−c × bodyweight))
// Constants from the IPF Goodlift 2020 formula.
//
// https://www.powerlifting.sport/fileadmin/ipf/data/ipf-formula/IPF_GL_Coefficients-2020.pdf

const GL_COEFF = {
  male:   { a: 1199.72839, b: 1025.18162, c: 0.00921 },
  female: { a:  610.32796, b: 1045.59282, c: 0.03048 },
};

/**
 * Compute IPF GL Points.
 * Returns null if inputs are invalid or bodyweight < 30 kg.
 */
export function computeGLPoints(
  total: number,
  bodyweight: number,
  gender: "male" | "female",
): number | null {
  if (total <= 0 || bodyweight < 30) return null;
  const { a, b, c } = GL_COEFF[gender];
  const denom = a - b * Math.exp(-c * bodyweight);
  if (denom <= 0) return null;
  return Math.round((100 * total / denom) * 10) / 10; // 1 decimal place
}

// ── Weight categories ─────────────────────────────────────────────────────────

export const WEIGHT_CATEGORIES = {
  male:   ["59kg", "66kg", "74kg", "83kg", "93kg", "105kg", "120kg", "120kg+"],
  female: ["47kg", "52kg", "57kg", "63kg", "69kg", "76kg",  "84kg",  "84kg+"],
} as const;

// ── Coach application questionnaire ──────────────────────────────────────────

export type CoachApplication = {
  athletes_count: string;
  instagram: string;
  sports: string;
  background: string;
  why_powerflow: string;
};

// ── Full profile type (all fields including v2 additions) ─────────────────────

export type AthleteProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  coach_code: string | null;
  coach_status: "pending" | "approved" | "rejected" | null;
  coach_application: CoachApplication | null;
  /** Free-text notes written by the coach/admin. Injected into the AI system prompt. */
  coach_notes: string | null;
  meet_date: string | null;
  /** Whether the 16-week course is unlocked for this athlete. Granted by coach/admin. */
  course_access: boolean;
  /** Whether all psychological test reports are unlocked for this athlete. Granted by admin. */
  test_access: boolean;
  onboarding_complete: boolean;
  // v2 additions
  gender: "male" | "female" | null;
  bodyweight_kg: number | null;
  weight_category: string | null;
  squat_current_kg: number | null;
  squat_goal_kg: number | null;
  bench_current_kg: number | null;
  bench_goal_kg: number | null;
  deadlift_current_kg: number | null;
  deadlift_goal_kg: number | null;
  mental_goals: string[];
  training_days_per_week: number | null;
  // v3 — application-form fields
  instagram: string | null;
  years_powerlifting: string | null;
  federation: string | null;
  main_barrier: string | null;
  confidence_break: string | null;
  overthinking_focus: string | null;
  previous_mental_work: string | null;
  self_confidence_reg: number | null;
  self_focus_fatigue: number | null;
  self_handling_pressure: number | null;
  self_competition_anxiety: number | null;
  self_emotional_recovery: number | null;
  expectations: string | null;
  previous_tools: string | null;
  anything_else: string | null;
  // v4 — tools
  affirmations: string[];
  viz_keywords: Record<string, string[]>;
  /** User-uploaded voice note paths in Supabase Storage. toolId → storage path. */
  viz_recordings: Record<string, string>;
  // v5 — voice work
  /** Whether AI-powered features (Voice Work beta) are unlocked for this user. */
  ai_access: boolean;
  /** Whether to use classic journal mode or the beta voice-work mode. */
  self_talk_mode: 'classic' | 'beta_voice_work';
  // v6 — adaptive course
  /** Personalised course plan (stored as JSONB). Null = not yet generated. */
  course_plan: import("@/lib/course").CoursePlan | null;
  // v7 — plan tiers
  /** Subscription tier: opener (free) | second (tools) | pr (all-access). */
  plan_tier: import("@/lib/plan").PlanTier;
  // v8 — i18n
  /** UI language preference. Falls back to 'en' if unset. */
  language: import("@/lib/i18n").Locale;
  // v9 — coach TTS voice
  /**
   * ElevenLabs voice ID of the athlete's coach.
   * Not stored on the athlete's own profile row — joined in by /api/me at read time
   * from the coach's tts_voice_id column. Null if coach has no cloned voice.
   */
  coach_tts_voice_id: string | null;
  // v10 — custom journal prompts
  /**
   * Custom label text for the 5 training-journal questions (PR tier only).
   * Stored as a text[] column on profiles. Null = use defaults.
   * Max 5 entries; each maps in order to the 5 TrainingKey columns.
   */
  journal_prompt_labels: string[] | null;
  /**
   * Coach-set prompt labels for this athlete.
   * Not stored on the athlete row — joined in by /api/me from coach_athlete_settings.
   * When present, overrides the athlete's own journal_prompt_labels.
   */
  coach_journal_prompt_labels: string[] | null;
  // v12 — AI Coach voice preference
  /**
   * ElevenLabs voice ID the athlete has chosen for their AI Coach.
   * Null = use the server default (ELEVENLABS_VOICE_ID env var).
   * Coach's cloned voice (coach_tts_voice_id) still takes priority over this.
   */
  preferred_voice_id: string | null;
};

/** Compute current total from profile fields. Returns null if no lifts set. */
export function currentTotal(p: Pick<AthleteProfile,
  "squat_current_kg" | "bench_current_kg" | "deadlift_current_kg">
): number | null {
  const { squat_current_kg: s, bench_current_kg: b, deadlift_current_kg: d } = p;
  if (!s && !b && !d) return null;
  return (s ?? 0) + (b ?? 0) + (d ?? 0);
}

/** Compute goal total from profile fields. Returns null if no goals set. */
export function goalTotal(p: Pick<AthleteProfile,
  "squat_goal_kg" | "bench_goal_kg" | "deadlift_goal_kg">
): number | null {
  const { squat_goal_kg: s, bench_goal_kg: b, deadlift_goal_kg: d } = p;
  if (!s && !b && !d) return null;
  return (s ?? 0) + (b ?? 0) + (d ?? 0);
}
