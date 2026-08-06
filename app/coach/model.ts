// ── Coach data model ──────────────────────────────────────────────────────────
// Types, per-athlete metric computation, and flag/trend visual constants.
// Extracted from page.tsx so the view layer imports the model instead of
// redefining it inline. Pure — no JSX, no React.

import { THEME_DEFS, detectSentiment, type Sentiment, type Context } from "@/lib/journal";
import type { TrainingEntry } from "@/lib/training";
import { type WeeklyCheckin, type MonthlyCheckin } from "@/lib/weeklyCheckin";
import { ymdLocal } from "@/lib/date";
import { effectiveTier, type PlanTier } from "@/lib/plan";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Flag = "attention" | "monitor" | "stable";
export type Trend     = "up" | "down" | "stable";

export type EntryRow = {
  id: string;
  user_id: string;
  content: string;
  sentiment: Sentiment;
  context: Context;
  themes: string[];
  created_at: string;
};

export type SatRow  = { id: string; total_score: number; submitted_at: string; paid: boolean };
export type AcsiRow = { id: string; score_coping: number; score_concentration: number; score_confidence: number; score_goal_setting: number; total_score: number; submitted_at: string; paid: boolean };
export type CsaiRow = { id: string; score_cognitive: number; score_somatic: number; score_confidence: number; submitted_at: string; paid: boolean };
export type DasRow  = { id: string; total_score: number; depression_prone: boolean; submitted_at: string; paid: boolean };

export type AthleteRaw = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  created_at: string;
  // onboarding profile fields
  meet_date: string | null;
  gender: string | null;
  bodyweight_kg: number | null;
  weight_category: string | null;
  squat_current_kg: number | null;
  squat_goal_kg: number | null;
  bench_current_kg: number | null;
  bench_goal_kg: number | null;
  deadlift_current_kg: number | null;
  deadlift_goal_kg: number | null;
  mental_goals: string[] | null;
  training_days_per_week: number | null;
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
  affirmations: string[] | null;
  viz_keywords: Record<string, string[]> | null;
  // Plan tier + admin-granted override flags. Used to work out which library
  // tools this athlete can open, so the coach is not offered ones the server
  // will reject.
  plan_tier: PlanTier | null;
  course_access: boolean | null;
  test_access: boolean | null;
  ai_access: boolean | null;
  // activity data
  entries: EntryRow[];
  sat: SatRow[];
  acsi: AcsiRow[];
  csai: CsaiRow[];
  das: DasRow[];
  training_entries: TrainingEntry[];
  all_training_entries: TrainingEntry[];
  feedbackByEntryId: Record<string, { id: string; content: string; created_at: string }>;
  weekly_checkins: WeeklyCheckin[];
  monthly_checkins: MonthlyCheckin[];
  assigned_tests: { id: string; test_slug: string; assigned_at: string }[];
};

export type CoachProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_code: string | null;
  stripe_coach_sub_id?: string | null;
};

// ── Data computation ───────────────────────────────────────────────────────────

export function weekAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d;
}

export function computeClient(a: AthleteRaw) {
  const now = new Date();
  const cutWeek = weekAgo(7);
  const cutPrev = weekAgo(14);

  const weekEntries = a.entries.filter((e) => new Date(e.created_at) >= cutWeek);
  const prevEntries = a.entries.filter((e) => new Date(e.created_at) >= cutPrev && new Date(e.created_at) < cutWeek);

  // Flatten all text from a training log entry into a single searchable string.
  // Defined early so both sentiment detection and theme detection can use it.
  const trainingText = (e: { thoughts_before?: string | null; thoughts_after?: string | null; what_went_well?: string | null; frustrations?: string | null; next_session?: string | null }) =>
    [e.thoughts_before, e.thoughts_after, e.what_went_well, e.frustrations, e.next_session]
      .filter(Boolean).join(" ").toLowerCase();

  // Training logs with at least one content field filled in
  const trainingLogsWithContent = a.all_training_entries.filter((e) =>
    e.thoughts_before || e.thoughts_after || e.what_went_well || e.frustrations || e.next_session,
  );
  const weekTrainingLogs = trainingLogsWithContent.filter(
    (e) => new Date(e.entry_date + "T12:00:00") >= cutWeek,
  );

  // Training logs carry no stored sentiment — auto-detect from their text so they
  // contribute to the positiveRate. Without this, athletes who only log training
  // days (never the free-form journal) always show 0% even with upbeat entries.
  const prevTrainingLogsRaw = trainingLogsWithContent.filter(
    (e) => new Date(e.entry_date + "T12:00:00") >= cutPrev && new Date(e.entry_date + "T12:00:00") < cutWeek,
  );

  const weekAllSentiments: Sentiment[] = [
    ...weekEntries.map((e) => e.sentiment),
    ...weekTrainingLogs.map((e) => detectSentiment(trainingText(e))),
  ];
  const prevAllSentiments: Sentiment[] = [
    ...prevEntries.map((e) => e.sentiment),
    ...prevTrainingLogsRaw.map((e) => detectSentiment(trainingText(e))),
  ];

  const positiveRate = weekAllSentiments.length
    ? Math.round(weekAllSentiments.filter((s) => s === "positive").length / weekAllSentiments.length * 100)
    : 0;

  const prevPositiveRate = prevAllSentiments.length
    ? Math.round(prevAllSentiments.filter((s) => s === "positive").length / prevAllSentiments.length * 100)
    : positiveRate;

  const trend: Trend = positiveRate > prevPositiveRate + 10 ? "up"
    : positiveRate < prevPositiveRate - 10 ? "down"
    : "stable";

  // ── Activity recency ────────────────────────────────────────────────────────
  // Computed before the flag because the flag is driven by recency, not sentiment.
  const lastJournalTime  = a.entries[0] ? new Date(a.entries[0].created_at).getTime() : 0;
  const lastTrainingTime = trainingLogsWithContent.length
    ? Math.max(...trainingLogsWithContent.map((e) => new Date(e.updated_at).getTime()))
    : 0;
  const lastActivityTime = Math.max(lastJournalTime, lastTrainingTime);
  const neverActive = lastActivityTime === 0;
  const daysSinceActivity: number | null = neverActive
    ? null
    : Math.floor((now.getTime() - lastActivityTime) / 86400000);

  // Whether there is any sentiment to report at all. Without this the UI cannot
  // distinguish "0% positive" (real, and bad) from "no entries yet" (no signal),
  // and every inactive athlete renders as an alarming red 0%.
  const hasSentimentData = weekAllSentiments.length > 0;

  // ── Flag ────────────────────────────────────────────────────────────────────
  // Driven purely by how recently the athlete engaged. Sentiment is shown as
  // information but never colours the roster: an athlete writing honestly about
  // a hard week is engaged, not a problem, and an athlete with no entries has
  // no sentiment to judge. Meet day still overrides — that is a "look at this
  // athlete today" signal rather than a health judgement.
  const isMeetDay = a.meet_date === ymdLocal();
  const flag: Flag = isMeetDay ? "attention"
    : daysSinceActivity === null || daysSinceActivity >= 7 ? "attention"
    : daysSinceActivity >= 3 ? "monitor"
    : "stable";

  // 7-day daily positive % — journal entries + training logs combined
  const sentimentWeek = Array.from({ length: 7 }, (_, i) => {
    const dayStart = weekAgo(6 - i);
    const dayEnd   = weekAgo(6 - i - 1);
    const dayJ = a.entries.filter((e) => {
      const d = new Date(e.created_at);
      return d >= dayStart && d < (i === 6 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : dayEnd);
    });
    const dayT = trainingLogsWithContent.filter((e) => {
      const d = new Date(e.entry_date + "T12:00:00");
      return d >= dayStart && d < (i === 6 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : dayEnd);
    });
    const allDay: Sentiment[] = [
      ...dayJ.map((e) => e.sentiment),
      ...dayT.map((e) => detectSentiment(trainingText(e))),
    ];
    if (!allDay.length) return 0;
    return Math.round(allDay.filter((s) => s === "positive").length / allDay.length * 100);
  });

  // Themes — journal entries + training logs both contribute
  const themes = THEME_DEFS.map((def) => {
    const weekCount =
      weekEntries.filter((e) => def.keywords.some((kw) => e.content.toLowerCase().includes(kw))).length +
      weekTrainingLogs.filter((e) => def.keywords.some((kw) => trainingText(e).includes(kw))).length;
    const prevTrainingLogs = trainingLogsWithContent.filter(
      (e) => new Date(e.entry_date + "T12:00:00") >= cutPrev && new Date(e.entry_date + "T12:00:00") < cutWeek,
    );
    const prevCount =
      prevEntries.filter((e) => def.keywords.some((kw) => e.content.toLowerCase().includes(kw))).length +
      prevTrainingLogs.filter((e) => def.keywords.some((kw) => trainingText(e).includes(kw))).length;
    return {
      label: def.label,
      count: weekCount,
      trend: (weekCount > prevCount + 1 ? "up" : weekCount < prevCount - 1 ? "down" : "stable") as Trend,
      color: def.color,
    };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  // All-time themes — journal + all training logs with content
  const allThemes = THEME_DEFS.map((def) => {
    const count =
      a.entries.filter((e) => def.keywords.some((kw) => e.content.toLowerCase().includes(kw))).length +
      trainingLogsWithContent.filter((e) => def.keywords.some((kw) => trainingText(e).includes(kw))).length;
    return { label: def.label, count };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  // Last active — formatted from the recency computed above.
  // Return a structured code instead of a hardcoded English string so it can be translated in JSX
  let lastActive: { key: "never" } | { key: "justNow" } | { key: "hoursAgo"; h: number } | { key: "yesterday" } | { key: "daysAgo"; d: number } = { key: "never" };
  if (lastActivityTime > 0) {
    const diffMs = now.getTime() - lastActivityTime;
    const diffH  = Math.floor(diffMs / 3600000);
    const diffD  = Math.floor(diffMs / 86400000);
    lastActive = diffH < 1 ? { key: "justNow" }
      : diffH < 24 ? { key: "hoursAgo", h: diffH }
      : diffD === 1 ? { key: "yesterday" }
      : { key: "daysAgo", d: diffD };
  }

  return {
    id: a.id,
    name: a.display_name,
    displayName: a.display_name,
    initials: a.display_name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2),
    avatarUrl: a.avatar_url,
    flag,
    positiveRate,
    // True only when the athlete actually produced entries this week. The UI must
    // render "—" rather than "0%" when this is false.
    hasSentimentData,
    neverActive,
    daysSinceActivity,
    trend,
    entriesThisWeek: weekEntries.length + weekTrainingLogs.length,
    entries7d: weekEntries.length + weekTrainingLogs.length,
    sentimentWeek,
    themes,
    allThemes,
    allEntries: a.entries,
    allTrainingWithContent: trainingLogsWithContent,
    allContentCount: a.entries.length + trainingLogsWithContent.length,
    recentEntries: a.entries.slice(0, 5),
    testScores: { sat: a.sat, acsi: a.acsi, csai: a.csai, das: a.das },
    lastActive,
    joinedAt: a.created_at,
    trainingThisWeek: a.training_entries,
    allTrainingEntries: a.all_training_entries,
    feedbackByEntryId: a.feedbackByEntryId,
    weeklyCheckins: a.weekly_checkins,
    monthlyCheckins: a.monthly_checkins ?? [],
    assignedTestSlugs: (a.assigned_tests ?? []).map((t) => t.test_slug),
    isCoach: a.role === "coach",
    // Folded tier (plan + admin override flags) so the view can gate tool
    // suggestions without repeating the override logic.
    effectiveTier: effectiveTier({
      plan_tier: a.plan_tier,
      course_access: a.course_access,
      test_access: a.test_access,
      ai_access: a.ai_access,
    }),
    // full onboarding profile — passed through for Profile tab
    profile: {
      meet_date: a.meet_date,
      gender: a.gender,
      bodyweight_kg: a.bodyweight_kg,
      weight_category: a.weight_category,
      squat_current_kg: a.squat_current_kg,
      squat_goal_kg: a.squat_goal_kg,
      bench_current_kg: a.bench_current_kg,
      bench_goal_kg: a.bench_goal_kg,
      deadlift_current_kg: a.deadlift_current_kg,
      deadlift_goal_kg: a.deadlift_goal_kg,
      mental_goals: a.mental_goals ?? [],
      training_days_per_week: a.training_days_per_week,
      instagram: a.instagram,
      years_powerlifting: a.years_powerlifting,
      federation: a.federation,
      main_barrier: a.main_barrier,
      confidence_break: a.confidence_break,
      overthinking_focus: a.overthinking_focus,
      previous_mental_work: a.previous_mental_work,
      self_confidence_reg: a.self_confidence_reg,
      self_focus_fatigue: a.self_focus_fatigue,
      self_handling_pressure: a.self_handling_pressure,
      self_competition_anxiety: a.self_competition_anxiety,
      self_emotional_recovery: a.self_emotional_recovery,
      expectations: a.expectations,
      previous_tools: a.previous_tools,
      anything_else: a.anything_else,
      affirmations: a.affirmations ?? [],
      viz_keywords: a.viz_keywords ?? {},
      athleteId: a.id,
      // Folded tier (plan + admin override flags), so the Profile tab can offer
      // only the library tools this athlete is actually able to open.
      effectiveTier: effectiveTier({
        plan_tier: a.plan_tier,
        course_access: a.course_access,
        test_access: a.test_access,
        ai_access: a.ai_access,
      }),
    },
  };
}

export type Client = ReturnType<typeof computeClient>;

// ── Visual helpers ─────────────────────────────────────────────────────────────

export const FLAG_CONFIG: Record<Flag, { labelKey: string; dot: string; text: string; bg: string; border: string }> = {
  attention: { labelKey: "coach.flagAttention", dot: "bg-rose-400",    text: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/30"    },
  monitor:   { labelKey: "coach.flagMonitor",   dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  stable:    { labelKey: "coach.flagStable",    dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};


export const TREND_ICON:  Record<Trend, string> = { up: "↑", down: "↓", stable: "→" };
export const TREND_COLOR: Record<Trend, string> = { up: "text-emerald-400", down: "text-rose-400", stable: "text-zinc-300" };
