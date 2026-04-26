/**
 * Voice Work — types, constants, and helpers.
 * Adapted from handoff/types.ts for the PowerFlow repo conventions.
 * ThoughtEntry references map to journal_entries in the DB.
 * UserPreferences.self_talk_mode maps to profiles.self_talk_mode.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Preferences
// ─────────────────────────────────────────────────────────────────────────────

export type SelfTalkMode = 'classic' | 'beta_voice_work';

// ─────────────────────────────────────────────────────────────────────────────
// Voice — the new Beta primitive
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceShape =
  | 'cloud'
  | 'orb'
  | 'beam'
  | 'blade'
  | 'fog'
  | 'spike'
  | 'thread'
  | 'custom';

export const VOICE_SHAPES: VoiceShape[] = [
  'cloud', 'orb', 'beam', 'blade', 'fog', 'spike', 'thread', 'custom',
];

export type DistanceBucket = 'on' | 'close' | 'arm' | 'meters' | 'gone';
export type SideBucket = 'front' | 'back' | 'left' | 'right';

export const DISTANCE_LABELS: Record<DistanceBucket, string> = {
  on:     'On me',
  close:  'Close',
  arm:    "Arm's length",
  meters: 'Meters away',
  gone:   'Gone',
};

// 12 named regions on the body silhouette.
export type BodyRegion =
  | 'head'
  | 'neck'
  | 'chest'
  | 'core'
  | 'back'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_arm'
  | 'right_arm'
  | 'left_hand'
  | 'right_hand'
  | 'legs';

export interface Voice {
  id: string;
  user_id: string;

  name: string; // "The Cheater", "The Warrior"

  // Visual identity (Step 3)
  shape: VoiceShape;
  shape_custom_description: string | null; // when shape === 'custom'
  color: string; // hex, e.g. '#7DD3FC'
  size: 1 | 2 | 3 | 4 | 5; // XS … XL

  // Somatic identity (Step 2)
  tone: number; // 0–100 (low → high)
  volume: number; // 0–100 (whisper → loud)
  body_locations: BodyRegion[];

  // Spatial placement (Step 4)
  current_distance: DistanceBucket;
  current_side: SideBucket;
  desired_distance: DistanceBucket;
  desired_side: SideBucket;

  // Purpose (Step 5)
  helps_when: string[];
  helps_note: string;

  // Stats (computed, not stored)
  thought_count?: number;

  created_at: string;
  updated_at: string;
}

// Preset tags for the "This voice helps when…" checklist (Step 5).
export const HELPS_WHEN_PRESETS = [
  'Reviewing technique',
  'Preparing for a heavy single',
  'Catching mistakes mid-set',
  'Picking attempts',
  'After a missed lift',
  "When I'm tired and want to skip",
  'Coaching others',
  'Recovery / rest days',
] as const;

export type HelpsWhenPreset = (typeof HELPS_WHEN_PRESETS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Voice draft — autosaved wizard state
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceDraft {
  id: string;
  user_id: string;
  editing_voice_id: string | null;
  state: Partial<Voice> & { current_step?: 1 | 2 | 3 | 4 | 5 };
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Journal entry extension — nullable voice columns
// ─────────────────────────────────────────────────────────────────────────────

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface JournalEntryWithVoice {
  id: string;
  user_id: string;
  content: string;
  sentiment: Sentiment;
  context: string;
  themes: string[];
  voice_id: string | null;
  reframe_text: string | null;
  reframe_test_due: string | null;
  reframe_test_resolved: 'true' | 'false' | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface ListVoicesResponse {
  voices: (Voice & { thought_count: number })[];
}

export interface CreateVoiceRequest {
  name: string;
  shape: VoiceShape;
  shape_custom_description?: string;
  color: string;
  size: 1 | 2 | 3 | 4 | 5;
  tone: number;
  volume: number;
  body_locations: BodyRegion[];
  current_distance: DistanceBucket;
  current_side: SideBucket;
  desired_distance: DistanceBucket;
  desired_side: SideBucket;
  helps_when: string[];
  helps_note: string;
}

export type UpdateVoiceRequest = Partial<CreateVoiceRequest>;

export interface SaveDraftRequest {
  state: VoiceDraft['state'];
}

export interface LinkThoughtToVoiceRequest {
  thought_id: string;
  voice_id: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert 0–100 numeric level to low/medium/high label. */
export function levelLabel(value: number): string {
  if (value <= 33) return 'low';
  if (value <= 66) return 'medium';
  return 'high';
}
