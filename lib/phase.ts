import type { TrainingPhase } from "@/app/components/PhaseBadge";

export type PhaseInfo = {
  phase: TrainingPhase;
  daysUntil: number;
  /** Human-readable countdown label */
  label: string;
};

/**
 * Derive the current training phase from a meet date string (YYYY-MM-DD).
 * Returns null if no date is provided or the meet is already in the past.
 *
 * Phase boundaries:
 *   Meet day   → 0 days
 *   Meet week  → 1–6 days
 *   Peak       → 7–21 days
 *   Build      → 22–56 days
 *   Foundation → 57+ days
 */
export function computePhase(meetDateStr: string | null | undefined): PhaseInfo | null {
  if (!meetDateStr) return null;

  const meet = new Date(meetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  meet.setHours(0, 0, 0, 0);

  const daysUntil = Math.round((meet.getTime() - today.getTime()) / 86_400_000);

  if (daysUntil < 0) return null; // meet is in the past

  let phase: TrainingPhase;
  if (daysUntil === 0) {
    phase = "Meet day";
  } else if (daysUntil <= 6) {
    phase = "Meet week";
  } else if (daysUntil <= 21) {
    phase = "Peak";
  } else if (daysUntil <= 56) {
    phase = "Build";
  } else {
    phase = "Foundation";
  }

  const label =
    daysUntil === 0
      ? "Compete well today!"
      : daysUntil === 1
      ? "1 day until your meet"
      : `${daysUntil} days until your meet`;

  return { phase, daysUntil, label };
}
