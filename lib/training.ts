export type TrainingEntry = {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  is_training_day: boolean;
  mood_rating: number | null;
  thoughts_before: string | null;
  thoughts_after: string | null;
  what_went_well: string | null;
  frustrations: string | null;
  next_session: string | null;
  coach_note?: string | null;
  created_at: string;
  updated_at: string;
};

export const TRAINING_QUESTIONS = [
  { key: "thoughts_before" as const, label: "What were your primary thoughts BEFORE your top sets today?" },
  { key: "thoughts_after"  as const, label: "What were your primary thoughts AFTER your top sets today?" },
  { key: "what_went_well"  as const, label: "What went really well today?" },
  { key: "frustrations"    as const, label: "Is there anything you're frustrated with from today?" },
  { key: "next_session"    as const, label: "What would you like to work on in your next session?" },
];

export type TrainingKey = "thoughts_before" | "thoughts_after" | "what_went_well" | "frustrations" | "next_session";

/** Ordered list of the 5 TrainingKey column names — index matches prompt position. */
export const TRAINING_KEYS: TrainingKey[] = [
  "thoughts_before",
  "thoughts_after",
  "what_went_well",
  "frustrations",
  "next_session",
];

/** Maximum number of custom journal prompt labels allowed. */
export const MAX_JOURNAL_PROMPTS = 5;

/**
 * Resolve the effective prompt labels to display in the training journal form.
 *
 * Priority: coachLabels > ownLabels > defaults (from TRAINING_QUESTIONS).
 * Returns an array of 1–5 label strings.
 */
export function resolvePromptLabels(
  coachLabels: string[] | null | undefined,
  ownLabels:   string[] | null | undefined,
  defaults:    string[],
): string[] {
  const effective = (coachLabels?.filter(Boolean).length ? coachLabels
    : ownLabels?.filter(Boolean).length ? ownLabels
    : null);
  if (!effective) return defaults;
  // Take up to MAX_JOURNAL_PROMPTS non-empty labels
  return effective.filter(Boolean).slice(0, MAX_JOURNAL_PROMPTS);
}
