/**
 * Ego States — types, constants, and helpers.
 * Replaces the old Voice Work (lib/voices.ts) concept.
 * An ego state is a fully embodied psychological persona the athlete
 * designs, names, and learns to intentionally access.
 */

export interface EgoState {
  id: string;
  user_id: string;
  name: string;                  // "The Machine", "The Builder", "The Recoverer"
  color: string;                 // hex colour e.g. "#CC2200"
  posture: string | null;        // how the body holds itself in this state
  body_feeling: string | null;   // where + what the athlete feels in their body
  voice_tone: string | null;     // how this state speaks internally (qualitative)
  origin_story: string | null;   // when / what created this state
  domain: string | null;         // what situations this state serves
  shadow_side: string | null;    // what it looks like when dysregulated / misapplied
  activation_ritual: string | null; // concrete steps to switch into this state
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CreateEgoStateRequest = Omit<EgoState, 'id' | 'user_id' | 'sort_order' | 'created_at' | 'updated_at'>;
export type UpdateEgoStateRequest = Partial<CreateEgoStateRequest>;

// Preset colour palette for state creation
export const EGO_STATE_COLORS = [
  { label: "Crimson",   hex: "#DC2626" },
  { label: "Amber",     hex: "#D97706" },
  { label: "Emerald",   hex: "#059669" },
  { label: "Sky",       hex: "#0284C7" },
  { label: "Violet",    hex: "#7C3AED" },
  { label: "Rose",      hex: "#DB2777" },
  { label: "Slate",     hex: "#475569" },
  { label: "White",     hex: "#E2E8F0" },
] as const;

// Domain preset suggestions
export const DOMAIN_PRESETS = [
  "Competition day — max attempts",
  "Heavy training — top sets",
  "Technical work — form focus",
  "Recovery & rest days",
  "Strategy & planning",
  "Dealing with setbacks",
  "When I need to stay calm under pressure",
] as const;
