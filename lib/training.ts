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
