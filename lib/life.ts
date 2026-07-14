/**
 * Lifestyle guide (beta) — shared types + pure domain logic.
 *
 * The adaptive check-in cadence lives here so it can be unit-tested:
 * - "daily" dimensions are due when not answered today
 * - "weekly" dimensions are due every 7 days — but when the last two recorded
 *   scores are both below the dimension's threshold, the dimension enters
 *   "focus" mode and is asked every 3 days until a score meets the threshold
 *   again (then it drops back to weekly).
 */

// ── Check-in dimensions ───────────────────────────────────────────────────────

export type Cadence = "daily" | "weekly";

export interface LifeDimension {
  id: string;
  label: string;
  cadence: Cadence;
  /** Scores below this put a weekly dimension into focus mode (default 6). */
  threshold?: number;
}

export interface CheckinRow {
  checkin_date: string; // YYYY-MM-DD
  scores: Record<string, number>;
  note?: string | null;
}

export type DimMode = "daily" | "weekly" | "focus";

export interface DimStatus {
  dim: LifeDimension;
  mode: DimMode;
  due: boolean;
  lastScore: number | null;
  lastDate: string | null;
}

export const DEFAULT_THRESHOLD = 6;
export const FOCUS_INTERVAL_DAYS = 3;
const DAY_MS = 86_400_000;

function daysBetween(fromYmd: string, toYmd: string): number {
  return Math.round(
    (new Date(toYmd + "T00:00:00").getTime() - new Date(fromYmd + "T00:00:00").getTime()) / DAY_MS,
  );
}

export function computeDimStatuses(
  dims: LifeDimension[],
  checkins: CheckinRow[],
  todayYmd: string,
): DimStatus[] {
  const sorted = [...checkins].sort((a, b) => b.checkin_date.localeCompare(a.checkin_date));

  return dims.map((dim) => {
    const history = sorted.filter((c) => typeof c.scores?.[dim.id] === "number");
    const last = history[0] ?? null;
    const prev = history[1] ?? null;
    const lastScore = last ? last.scores[dim.id] : null;
    const lastDate = last ? last.checkin_date : null;

    let mode: DimMode;
    if (dim.cadence === "daily") {
      mode = "daily";
    } else {
      const t = dim.threshold ?? DEFAULT_THRESHOLD;
      mode =
        last && prev && last.scores[dim.id] < t && prev.scores[dim.id] < t
          ? "focus"
          : "weekly";
    }

    const interval = mode === "daily" ? 1 : mode === "focus" ? FOCUS_INTERVAL_DAYS : 7;
    const due = !lastDate || daysBetween(lastDate, todayYmd) >= interval;

    return { dim, mode, due, lastScore, lastDate };
  });
}

// ── Meals & macros ────────────────────────────────────────────────────────────

export interface Meal {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MacroTargets = Partial<Macros>;

export function sumMealMacros(mealIds: string[], meals: Meal[]): Macros {
  const byId = new Map(meals.map((m) => [m.id, m]));
  return mealIds.reduce<Macros>(
    (acc, id) => {
      const m = byId.get(id);
      if (!m) return acc;
      return {
        kcal: acc.kcal + (m.kcal || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// ── Training plan ─────────────────────────────────────────────────────────────

/** Static text ("4 x 8 @ RPE 7") or per-week map ({ "1": "7 / 5 / 3", ... }). */
export type Scheme = string | Record<string, string>;

export interface PlanExercise {
  id: string;
  name: string;
  type: "main" | "accessory";
  scheme: Scheme;
}

export interface PlanDay {
  key: string; // "A"
  name: string; // "Day A"
  exercises: PlanExercise[];
}

export interface PlanStructure {
  weeks: number;
  days: PlanDay[];
}

export interface LifePlan {
  id: string;
  name: string;
  structure: PlanStructure;
  current_week: number;
  active: boolean;
}

export function schemeForWeek(scheme: Scheme, week: number): string {
  if (typeof scheme === "string") return scheme;
  return scheme[String(week)] ?? Object.values(scheme)[0] ?? "";
}

// ── Workout logs ──────────────────────────────────────────────────────────────

export interface SetEntry {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

export interface WorkoutEntry {
  exercise_id: string;
  name: string;
  prescription: string;
  sets: SetEntry[];
  done: boolean;
}

export interface WorkoutRow {
  id: string;
  plan_id: string | null;
  log_date: string;
  day_key: string;
  week_number: number | null;
  entries: WorkoutEntry[];
  note: string | null;
  completed: boolean;
}

export interface BodyLogRow {
  id: string;
  log_date: string;
  weight_kg: number | null;
  meal_ids: string[];
  macros: Macros | null;
  note: string | null;
}

export interface LifeConfig {
  values_list: string[];
  dimensions: LifeDimension[];
  meals: Meal[];
  macro_targets: MacroTargets;
}

export function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Lift progression + PRs ────────────────────────────────────────────────────

/** Estimated 1-rep-max via the Epley formula. Returns 0 for invalid sets. */
export function estimatedOneRepMax(weight: number | null, reps: number | null): number {
  if (!weight || !reps || weight <= 0 || reps < 1) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Best (highest e1RM) set within one exercise entry. */
export function bestSetE1rm(entry: WorkoutEntry): number {
  return entry.sets.reduce((best, s) => Math.max(best, estimatedOneRepMax(s.weight, s.reps)), 0);
}

export interface ProgressionPoint {
  date: string;
  e1rm: number;
  topWeight: number;
  topReps: number;
}

/**
 * Time series of the best set per session for one exercise, oldest → newest.
 * Only sessions where the exercise was actually loaded (e1RM > 0) are included.
 */
export function progressionSeries(workouts: WorkoutRow[], exerciseId: string): ProgressionPoint[] {
  return [...workouts]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .flatMap((w) => {
      const entry = w.entries.find((e) => e.exercise_id === exerciseId);
      if (!entry) return [];
      let best = 0, topWeight = 0, topReps = 0;
      for (const s of entry.sets) {
        const e = estimatedOneRepMax(s.weight, s.reps);
        if (e > best) { best = e; topWeight = s.weight ?? 0; topReps = s.reps ?? 0; }
      }
      if (best <= 0) return [];
      return [{ date: w.log_date, e1rm: Math.round(best * 10) / 10, topWeight, topReps }];
    });
}

/** Distinct exercises that have at least one loaded set across all workouts. */
export function loggedExercises(workouts: WorkoutRow[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const w of workouts) {
    for (const e of w.entries) {
      if (!seen.has(e.exercise_id) && bestSetE1rm(e) > 0) seen.set(e.exercise_id, e.name);
    }
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
}

export interface PRHit {
  exercise_id: string;
  name: string;
  e1rm: number;
  prevBest: number | null;
}

/**
 * Which exercises in `currentEntries` beat their previous best e1RM.
 * History is all workouts EXCEPT the session being logged (matched by date+day).
 */
export function detectPRs(
  currentEntries: WorkoutEntry[],
  history: WorkoutRow[],
  currentDate: string,
  currentDayKey: string,
): PRHit[] {
  const prior = history.filter((w) => !(w.log_date === currentDate && w.day_key === currentDayKey));
  const hits: PRHit[] = [];
  for (const entry of currentEntries) {
    const cur = bestSetE1rm(entry);
    if (cur <= 0) continue;
    let prevBest = 0;
    for (const w of prior) {
      const e = w.entries.find((x) => x.exercise_id === entry.exercise_id);
      if (e) prevBest = Math.max(prevBest, bestSetE1rm(e));
    }
    if (cur > prevBest + 0.01) {
      hits.push({
        exercise_id: entry.exercise_id,
        name: entry.name,
        e1rm: Math.round(cur * 10) / 10,
        prevBest: prevBest > 0 ? Math.round(prevBest * 10) / 10 : null,
      });
    }
  }
  return hits;
}

// ── Series maths ──────────────────────────────────────────────────────────────

/** Trailing simple moving average; result aligns 1:1 with the input. */
export function movingAverage(points: number[], window: number): number[] {
  if (window <= 1) return [...points];
  return points.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = points.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// ── Weekly aggregates + correlation insights ──────────────────────────────────

/** Monday (YYYY-MM-DD) of the ISO-ish week containing `ymd` (Mon-start). */
export function mondayOf(ymd: string): string {
  const d = new Date(ymd + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface WeekAgg {
  weekStart: string;
  dimAvg: Record<string, number>;
  sessions: number;
  avgWeight: number | null;
}

export function weeklyAggregates(
  checkins: CheckinRow[],
  workouts: WorkoutRow[],
  body: BodyLogRow[],
): WeekAgg[] {
  const weeks = new Map<string, {
    dimSums: Record<string, number>; dimCounts: Record<string, number>;
    sessions: number; weightSum: number; weightCount: number;
  }>();
  const get = (ws: string) => {
    let w = weeks.get(ws);
    if (!w) { w = { dimSums: {}, dimCounts: {}, sessions: 0, weightSum: 0, weightCount: 0 }; weeks.set(ws, w); }
    return w;
  };

  for (const c of checkins) {
    const w = get(mondayOf(c.checkin_date));
    for (const [dimId, score] of Object.entries(c.scores ?? {})) {
      if (typeof score !== "number") continue;
      w.dimSums[dimId] = (w.dimSums[dimId] ?? 0) + score;
      w.dimCounts[dimId] = (w.dimCounts[dimId] ?? 0) + 1;
    }
  }
  for (const wk of workouts) {
    if (wk.completed) get(mondayOf(wk.log_date)).sessions += 1;
  }
  for (const b of body) {
    if (b.weight_kg !== null) {
      const w = get(mondayOf(b.log_date));
      w.weightSum += Number(b.weight_kg); w.weightCount += 1;
    }
  }

  return [...weeks.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, w]) => {
      const dimAvg: Record<string, number> = {};
      for (const id of Object.keys(w.dimSums)) dimAvg[id] = w.dimSums[id] / w.dimCounts[id];
      return {
        weekStart,
        dimAvg,
        sessions: w.sessions,
        avgWeight: w.weightCount ? w.weightSum / w.weightCount : null,
      };
    });
}

export interface Insight {
  text: string;
  strength: number; // absolute gap, used for ranking
}

const MIN_WEEKS_PER_GROUP = 2;

/**
 * Plain-language associations: for each weekly "driver" dimension, compare an
 * outcome (another dimension's score, or sessions/week) between weeks where the
 * driver was on-track (>= threshold) vs not. Exploratory, not causal.
 */
export function findInsights(weeks: WeekAgg[], dims: LifeDimension[]): Insight[] {
  if (weeks.length < MIN_WEEKS_PER_GROUP * 2) return [];
  const drivers = dims.filter((d) => d.cadence === "weekly");
  const out: Insight[] = [];

  const groupMeans = (pred: (w: WeekAgg) => boolean, val: (w: WeekAgg) => number | null) => {
    const hi: number[] = [], lo: number[] = [];
    for (const w of weeks) {
      const v = val(w);
      if (v === null) continue;
      (pred(w) ? hi : lo).push(v);
    }
    if (hi.length < MIN_WEEKS_PER_GROUP || lo.length < MIN_WEEKS_PER_GROUP) return null;
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    return { hi: mean(hi), lo: mean(lo) };
  };

  for (const d of drivers) {
    const t = d.threshold ?? DEFAULT_THRESHOLD;
    const onTrack = (w: WeekAgg) => (w.dimAvg[d.id] ?? -1) >= t;
    const hasDriver = (w: WeekAgg) => typeof w.dimAvg[d.id] === "number";

    // Outcome: sessions per week
    const s = groupMeans((w) => hasDriver(w) && onTrack(w), (w) => hasDriver(w) ? w.sessions : null);
    if (s && Math.abs(s.hi - s.lo) >= 0.75) {
      const more = s.hi > s.lo;
      out.push({
        strength: Math.abs(s.hi - s.lo),
        text: `You train ${more ? "more" : "less"} (${s.hi.toFixed(1)} vs ${s.lo.toFixed(1)} sessions/wk) in weeks your "${d.label}" is on track.`,
      });
    }

    // Outcome: each other dimension's weekly average
    for (const m of dims) {
      if (m.id === d.id) continue;
      const r = groupMeans(
        (w) => hasDriver(w) && onTrack(w) && typeof w.dimAvg[m.id] === "number",
        (w) => (hasDriver(w) && typeof w.dimAvg[m.id] === "number") ? w.dimAvg[m.id] : null,
      );
      if (r && Math.abs(r.hi - r.lo) >= 1.0) {
        const higher = r.hi > r.lo;
        out.push({
          strength: Math.abs(r.hi - r.lo),
          text: `You rate "${m.label}" ${higher ? "higher" : "lower"} (${r.hi.toFixed(1)} vs ${r.lo.toFixed(1)}) in weeks your "${d.label}" is on track.`,
        });
      }
    }
  }

  return out.sort((a, b) => b.strength - a.strength).slice(0, 4);
}
