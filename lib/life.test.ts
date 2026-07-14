import { describe, it, expect } from "vitest";
import {
  computeDimStatuses, schemeForWeek, sumMealMacros,
  estimatedOneRepMax, bestSetE1rm, progressionSeries, detectPRs, loggedExercises,
  movingAverage, mondayOf, weeklyAggregates, findInsights,
  type LifeDimension, type CheckinRow, type WorkoutRow, type WorkoutEntry, type BodyLogRow,
} from "./life";

const car: LifeDimension = { id: "car", label: "Car tidiness", cadence: "weekly", threshold: 6 };
const train: LifeDimension = { id: "train", label: "Motivation to train", cadence: "daily" };

function checkin(date: string, scores: Record<string, number>): CheckinRow {
  return { checkin_date: date, scores };
}

describe("computeDimStatuses — adaptive cadence", () => {
  it("weekly dim with no history is due", () => {
    const [s] = computeDimStatuses([car], [], "2026-07-06");
    expect(s.mode).toBe("weekly");
    expect(s.due).toBe(true);
    expect(s.lastScore).toBeNull();
  });

  it("weekly dim answered 3 days ago is not due yet", () => {
    const [s] = computeDimStatuses([car], [checkin("2026-07-03", { car: 8 })], "2026-07-06");
    expect(s.mode).toBe("weekly");
    expect(s.due).toBe(false);
  });

  it("weekly dim answered 7 days ago is due", () => {
    const [s] = computeDimStatuses([car], [checkin("2026-06-29", { car: 8 })], "2026-07-06");
    expect(s.due).toBe(true);
  });

  it("two consecutive bad scores flip a weekly dim into focus mode (every 3 days)", () => {
    const history = [
      checkin("2026-06-22", { car: 4 }),
      checkin("2026-06-29", { car: 3 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-02");
    expect(s.mode).toBe("focus");
    expect(s.due).toBe(true); // 3 days since last answer
  });

  it("focus mode is not due only 2 days after the last answer", () => {
    const history = [
      checkin("2026-06-22", { car: 4 }),
      checkin("2026-06-29", { car: 3 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-01");
    expect(s.mode).toBe("focus");
    expect(s.due).toBe(false);
  });

  it("one good score exits focus mode back to weekly", () => {
    const history = [
      checkin("2026-06-22", { car: 4 }),
      checkin("2026-06-25", { car: 3 }),
      checkin("2026-06-28", { car: 8 }), // recovered
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-01");
    expect(s.mode).toBe("weekly");
    expect(s.due).toBe(false); // only 3 days since answer; weekly interval now applies
  });

  it("one bad score after a good one stays weekly (needs two in a row)", () => {
    const history = [
      checkin("2026-06-22", { car: 8 }),
      checkin("2026-06-29", { car: 3 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-01");
    expect(s.mode).toBe("weekly");
  });

  it("daily dim is due when not answered today and not due when answered today", () => {
    const [due] = computeDimStatuses([train], [checkin("2026-07-05", { train: 7 })], "2026-07-06");
    expect(due.mode).toBe("daily");
    expect(due.due).toBe(true);
    const [notDue] = computeDimStatuses([train], [checkin("2026-07-06", { train: 7 })], "2026-07-06");
    expect(notDue.due).toBe(false);
  });

  it("ignores check-in rows that don't contain the dimension", () => {
    const history = [
      checkin("2026-07-05", { train: 7 }),      // no car score
      checkin("2026-06-29", { car: 8 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-06");
    expect(s.lastDate).toBe("2026-06-29");
    expect(s.due).toBe(true);
  });
});

describe("schemeForWeek", () => {
  it("returns static scheme text as-is", () => {
    expect(schemeForWeek("4 x 8 @ RPE 7", 2)).toBe("4 x 8 @ RPE 7");
  });
  it("picks the week from a per-week map", () => {
    const wave = { "1": "7 / 5 / 3", "2": "6 / 4 / 2", "3": "5 / 3 / 1" };
    expect(schemeForWeek(wave, 2)).toBe("6 / 4 / 2");
  });
  it("falls back to the first defined week when the week is missing", () => {
    const wave = { "1": "7 / 5 / 3" };
    expect(schemeForWeek(wave, 9)).toBe("7 / 5 / 3");
  });
});

describe("sumMealMacros", () => {
  const meals = [
    { id: "m1", name: "Chicken rice", kcal: 650, protein: 45, carbs: 70, fat: 15 },
    { id: "m2", name: "Oats", kcal: 420, protein: 18, carbs: 60, fat: 12 },
  ];
  it("sums selected meals, counting duplicates", () => {
    expect(sumMealMacros(["m1", "m2", "m2"], meals)).toEqual({
      kcal: 1490, protein: 81, carbs: 190, fat: 39,
    });
  });
  it("ignores unknown meal ids", () => {
    expect(sumMealMacros(["nope"], meals)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

// ── Lift progression + PRs ──────────────────────────────────────────────────

function entry(id: string, sets: Array<[number | null, number | null]>): WorkoutEntry {
  return { exercise_id: id, name: id, prescription: "", done: true, sets: sets.map(([weight, reps]) => ({ weight, reps, rpe: null })) };
}
function workout(date: string, dayKey: string, entries: WorkoutEntry[], completed = true): WorkoutRow {
  return { id: `${date}-${dayKey}`, plan_id: null, log_date: date, day_key: dayKey, week_number: 1, entries, note: null, completed };
}

describe("estimatedOneRepMax (Epley)", () => {
  it("returns the weight itself for a single", () => {
    expect(estimatedOneRepMax(200, 1)).toBe(200);
  });
  it("applies the Epley multiplier for multi-rep sets", () => {
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(116.67, 1);
  });
  it("returns 0 for invalid sets", () => {
    expect(estimatedOneRepMax(null, 5)).toBe(0);
    expect(estimatedOneRepMax(100, null)).toBe(0);
    expect(estimatedOneRepMax(0, 5)).toBe(0);
  });
});

describe("bestSetE1rm", () => {
  it("picks the highest-e1RM set in an entry", () => {
    // 180x3 → 198, 200x1 → 200, 170x5 → ~198.3
    expect(bestSetE1rm(entry("sq", [[180, 3], [200, 1], [170, 5]]))).toBeCloseTo(200, 1);
  });
});

describe("progressionSeries", () => {
  it("returns oldest→newest best set per session, skipping empty ones", () => {
    const ws = [
      workout("2026-07-06", "A", [entry("sq", [[190, 1]])]),
      workout("2026-06-29", "A", [entry("sq", [[180, 1]])]),
      workout("2026-06-22", "A", [entry("sq", [[null, null]])]), // not loaded → skipped
    ];
    const series = progressionSeries(ws, "sq");
    expect(series.map((p) => p.e1rm)).toEqual([180, 190]);
    expect(series[1].topWeight).toBe(190);
  });
});

describe("detectPRs", () => {
  const history = [
    workout("2026-06-29", "A", [entry("sq", [[180, 1]])]),
    workout("2026-06-22", "A", [entry("sq", [[175, 1]])]),
  ];
  it("flags a set that beats the previous best", () => {
    const hits = detectPRs([entry("sq", [[185, 1]])], history, "2026-07-06", "A");
    expect(hits).toHaveLength(1);
    expect(hits[0].e1rm).toBe(185);
    expect(hits[0].prevBest).toBe(180);
  });
  it("does not flag a set that ties or loses", () => {
    expect(detectPRs([entry("sq", [[180, 1]])], history, "2026-07-06", "A")).toHaveLength(0);
  });
  it("excludes the session being logged from its own history", () => {
    const withToday = [...history, workout("2026-07-06", "A", [entry("sq", [[999, 1]])])];
    const hits = detectPRs([entry("sq", [[185, 1]])], withToday, "2026-07-06", "A");
    expect(hits).toHaveLength(1); // the 999 today-row is excluded, so 185 still a PR vs 180
  });
  it("treats a brand-new exercise as a PR with null prevBest", () => {
    const hits = detectPRs([entry("newlift", [[100, 5]])], history, "2026-07-06", "A");
    expect(hits[0].prevBest).toBeNull();
  });
});

describe("loggedExercises", () => {
  it("lists distinct loaded exercises", () => {
    const ws = [
      workout("2026-07-06", "A", [entry("sq", [[180, 1]]), entry("bench", [[null, null]])]),
      workout("2026-06-29", "A", [entry("sq", [[175, 1]])]),
    ];
    expect(loggedExercises(ws).map((e) => e.id)).toEqual(["sq"]); // bench never loaded
  });
});

describe("movingAverage", () => {
  it("computes a trailing average aligned to the input", () => {
    expect(movingAverage([2, 4, 6, 8], 2)).toEqual([2, 3, 5, 7]);
  });
  it("returns the input unchanged for window <= 1", () => {
    expect(movingAverage([1, 2, 3], 1)).toEqual([1, 2, 3]);
  });
});

describe("mondayOf", () => {
  it("maps any day to that week's Monday", () => {
    expect(mondayOf("2026-07-08")).toBe("2026-07-06"); // Wed → Mon
    expect(mondayOf("2026-07-06")).toBe("2026-07-06"); // Mon → Mon
    expect(mondayOf("2026-07-12")).toBe("2026-07-06"); // Sun → Mon
  });
});

describe("weeklyAggregates + findInsights", () => {
  const dims: LifeDimension[] = [
    { id: "guitar", label: "Guitar", cadence: "weekly", threshold: 6 },
    { id: "train", label: "Motivation to train", cadence: "daily" },
  ];
  // 4 weeks: guitar high → many sessions + high train; guitar low → few + low train.
  const checkins: CheckinRow[] = [
    { checkin_date: "2026-06-08", scores: { guitar: 8, train: 8 } },
    { checkin_date: "2026-06-15", scores: { guitar: 7, train: 9 } },
    { checkin_date: "2026-06-22", scores: { guitar: 3, train: 4 } },
    { checkin_date: "2026-06-29", scores: { guitar: 2, train: 5 } },
  ];
  const workouts: WorkoutRow[] = [
    workout("2026-06-09", "A", [entry("sq", [[180, 1]])]),
    workout("2026-06-10", "B", [entry("sq", [[180, 1]])]),
    workout("2026-06-16", "A", [entry("sq", [[180, 1]])]),
    workout("2026-06-17", "B", [entry("sq", [[180, 1]])]),
    workout("2026-06-23", "A", [entry("sq", [[180, 1]])]),
  ];
  const body: BodyLogRow[] = [];

  it("buckets by week", () => {
    const weeks = weeklyAggregates(checkins, workouts, body);
    expect(weeks).toHaveLength(4);
    expect(weeks[0].sessions).toBe(2);
    expect(weeks[0].dimAvg.guitar).toBe(8);
  });

  it("surfaces a plausible training association for the driver dimension", () => {
    const weeks = weeklyAggregates(checkins, workouts, body);
    const insights = findInsights(weeks, dims);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some((i) => /train (more|less).*Guitar/.test(i.text))).toBe(true);
  });

  it("returns nothing without enough weeks", () => {
    const weeks = weeklyAggregates(checkins.slice(0, 2), workouts, body);
    expect(findInsights(weeks, dims)).toEqual([]);
  });
});
