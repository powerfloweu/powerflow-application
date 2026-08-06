import { describe, it, expect } from "vitest";
import { computeClient, type AthleteRaw, type EntryRow } from "./model";
import type { TrainingEntry } from "@/lib/training";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function journalEntry(overrides: Partial<EntryRow> & { created_at: string }): EntryRow {
  return {
    id: `e-${Math.random()}`,
    user_id: "athlete-1",
    content: "Session felt fine.",
    sentiment: "neutral",
    context: "general",
    themes: [],
    ...overrides,
  } as EntryRow;
}

function trainingLog(overrides: Partial<TrainingEntry> & { entry_date: string; updated_at: string }): TrainingEntry {
  return {
    id: `t-${Math.random()}`,
    user_id: "athlete-1",
    is_training_day: true,
    mood_rating: 7,
    thoughts_before: "Ready to work.",
    thoughts_after: null,
    what_went_well: null,
    frustrations: null,
    next_session: null,
    created_at: overrides.updated_at,
    ...overrides,
  } as TrainingEntry;
}

/** Minimal AthleteRaw — every field the model reads, nothing more. */
function athlete(overrides: Partial<AthleteRaw> = {}): AthleteRaw {
  return {
    id: "athlete-1",
    display_name: "Test Athlete",
    avatar_url: null,
    role: "athlete",
    created_at: daysAgo(100).toISOString(),
    meet_date: null,
    gender: null,
    bodyweight_kg: null,
    weight_category: null,
    squat_current_kg: null,
    squat_goal_kg: null,
    bench_current_kg: null,
    bench_goal_kg: null,
    deadlift_current_kg: null,
    deadlift_goal_kg: null,
    mental_goals: null,
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
    affirmations: null,
    viz_keywords: null,
    plan_tier: null,
    course_access: null,
    test_access: null,
    ai_access: null,
    entries: [],
    sat: [],
    acsi: [],
    csai: [],
    das: [],
    training_entries: [],
    all_training_entries: [],
    feedbackByEntryId: {},
    weekly_checkins: [],
    monthly_checkins: [],
    assigned_tests: [],
    ...overrides,
  };
}

// ── Flag semantics ────────────────────────────────────────────────────────────
// The flag is driven purely by activity recency. Sentiment must never colour it:
// before this rule, a whole 16-athlete roster rendered red because athletes with
// no entries scored 0% positive.

describe("computeClient — flag", () => {
  it("is stable when the athlete logged today, even if every entry is negative", () => {
    const c = computeClient(
      athlete({
        entries: [
          journalEntry({ created_at: daysAgo(0).toISOString(), sentiment: "negative" }),
          journalEntry({ created_at: daysAgo(1).toISOString(), sentiment: "negative" }),
        ],
      }),
    );
    expect(c.positiveRate).toBe(0);
    expect(c.flag).toBe("stable");
  });

  it("is monitor after 3 days of silence", () => {
    const c = computeClient(
      athlete({ entries: [journalEntry({ created_at: daysAgo(4).toISOString(), sentiment: "positive" })] }),
    );
    expect(c.flag).toBe("monitor");
  });

  it("is attention after 7 days of silence, however positive the last entries were", () => {
    const c = computeClient(
      athlete({ entries: [journalEntry({ created_at: daysAgo(9).toISOString(), sentiment: "positive" })] }),
    );
    expect(c.flag).toBe("attention");
  });

  it("is attention when the athlete has never logged anything", () => {
    const c = computeClient(athlete());
    expect(c.flag).toBe("attention");
    expect(c.neverActive).toBe(true);
    expect(c.daysSinceActivity).toBeNull();
  });

  it("counts training logs as activity, not just journal entries", () => {
    const today = ymd(daysAgo(0));
    const c = computeClient(
      athlete({
        all_training_entries: [
          trainingLog({ entry_date: today, updated_at: daysAgo(0).toISOString() }),
        ],
      }),
    );
    expect(c.flag).toBe("stable");
    expect(c.neverActive).toBe(false);
  });

  it("overrides to attention on meet day regardless of recent activity", () => {
    const c = computeClient(
      athlete({
        meet_date: ymd(new Date()),
        entries: [journalEntry({ created_at: daysAgo(0).toISOString(), sentiment: "positive" })],
      }),
    );
    expect(c.flag).toBe("attention");
  });
});

// ── No-data vs real zero ──────────────────────────────────────────────────────

describe("computeClient — hasSentimentData", () => {
  it("is false with no entries this week, so the view can render a dash not 0%", () => {
    const c = computeClient(athlete());
    expect(c.hasSentimentData).toBe(false);
    expect(c.entriesThisWeek).toBe(0);
  });

  it("is false when the only entries are older than the 7-day window", () => {
    const c = computeClient(
      athlete({ entries: [journalEntry({ created_at: daysAgo(20).toISOString(), sentiment: "positive" })] }),
    );
    expect(c.hasSentimentData).toBe(false);
  });

  it("is true when entries exist this week, including a genuine 0% positive", () => {
    const c = computeClient(
      athlete({ entries: [journalEntry({ created_at: daysAgo(1).toISOString(), sentiment: "negative" })] }),
    );
    expect(c.hasSentimentData).toBe(true);
    expect(c.positiveRate).toBe(0);
  });
});
