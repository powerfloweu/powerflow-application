import { ymdLocal, mondayOfWeek } from "./date";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MonthlyCheckin = {
  id: string;
  user_id: string;
  week_number: number;
  year: number;
  week_start: string;
  mood_rating: number;
  training_quality: number;
  readiness_rating: number;
  energy_rating: number;
  sleep_rating: number;
  biggest_win: string | null;
  biggest_challenge: string | null;
  focus_next_week: string | null;
  overall_progress: number;
  biggest_breakthrough: string | null;
  key_lesson: string | null;
  next_month_intention: string | null;
  created_at: string;
  updated_at: string;
};

export type WeeklyCheckin = {
  id: string;
  user_id: string;
  week_number: number;
  year: number;
  week_start: string; // YYYY-MM-DD (Monday of that ISO week)
  mood_rating: number;
  training_quality: number;
  readiness_rating: number;
  energy_rating: number;
  sleep_rating: number;
  biggest_win: string | null;
  biggest_challenge: string | null;
  focus_next_week: string | null;
  created_at: string;
  updated_at: string;
};

// ── Week calculation ──────────────────────────────────────────────────────────

/** ISO week number (1-53) and year for a given local date. */
export function isoWeekYear(d: Date): { week: number; year: number } {
  // Use UTC arithmetic to avoid DST edge-cases
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Move to Thursday of this ISO week
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: utc.getUTCFullYear() };
}

/**
 * Returns true when this ISO week number should show a monthly check-in
 * instead of the standard weekly one (every 4th week: 4, 8, 12 … 52).
 */
export function isMonthlyWeek(week: number): boolean {
  return week % 4 === 0;
}

/**
 * Which week is the check-in window targeting right now?
 *
 * - Sunday → the ISO week that ends today (check in before the week closes)
 * - Monday → the ISO week that ended yesterday (last chance)
 * - Any other day → null (window is closed)
 */
export function checkinTargetWeek(d: Date = new Date()): {
  week: number;
  year: number;
  weekStart: string; // YYYY-MM-DD of that week's Monday
} | null {
  const day = d.getDay(); // 0 = Sunday, 1 = Monday
  if (day === 0) {
    // Sunday: target is the current ISO week (ending today)
    const { week, year } = isoWeekYear(d);
    return { week, year, weekStart: mondayOfWeek(d) };
  }
  if (day === 1) {
    // Monday: target is the ISO week that ended yesterday
    const yesterday = new Date(d);
    yesterday.setDate(d.getDate() - 1);
    const { week, year } = isoWeekYear(yesterday);
    return { week, year, weekStart: mondayOfWeek(yesterday) };
  }
  return null;
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** "Week 18 — 27 April" or "Week 18 — 27 April 2025" if year differs from current. */
export function weekLabel(
  weekNumber: number,
  weekStart: string,
  nowYear: number = new Date().getFullYear(),
): string {
  const d = new Date(weekStart + "T12:00:00");
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const yearSuffix = d.getFullYear() !== nowYear ? ` ${d.getFullYear()}` : "";
  return `Week ${weekNumber} — ${day} ${month}${yearSuffix}`;
}

/** Average of the five numeric ratings, rounded to 1 decimal place. */
export function avgRating(c: WeeklyCheckin): number {
  return Math.round(
    ((c.mood_rating + c.training_quality + c.readiness_rating + c.energy_rating + c.sleep_rating) / 5) * 10,
  ) / 10;
}
