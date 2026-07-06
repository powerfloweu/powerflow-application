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
