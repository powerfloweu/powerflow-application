// PowerFlow — Self-Talk Log (Classic + Beta Voice work)
// Type definitions for the implementation.
// Copy into the shipped repo's types module; aliases match Postgres column names.

// ─────────────────────────────────────────────────────────────────────────
// Preferences — feature flag for the toggle in the You section
// ─────────────────────────────────────────────────────────────────────────

export type SelfTalkMode = 'classic' | 'beta_voice_work';

export interface UserPreferences {
  user_id: string;
  self_talk_mode: SelfTalkMode;          // default 'classic'
  // (other preferences live in this table — only the new key is shown)
}

// ─────────────────────────────────────────────────────────────────────────
// Voices — the new Beta primitive
// ─────────────────────────────────────────────────────────────────────────

export type VoiceShape =
  | 'cloud'
  | 'orb'
  | 'beam'
  | 'blade'
  | 'fog'
  | 'spike'
  | 'thread'
  | 'custom';

export type DistanceBucket = 'on' | 'close' | 'arm' | 'meters' | 'gone';
export type SideBucket     = 'front' | 'back' | 'left' | 'right';

// 12 named regions on the body silhouette. Stored as string[] so adding
// regions later is non-breaking.
export type BodyRegion =
  | 'head' | 'neck' | 'chest' | 'core' | 'back'
  | 'left_shoulder' | 'right_shoulder'
  | 'left_arm' | 'right_arm'
  | 'left_hand' | 'right_hand'
  | 'legs';

export interface Voice {
  id: string;
  user_id: string;

  name: string;                          // "The Cheater", "The Warrior"

  // Visual identity (Step 3)
  shape: VoiceShape;
  shape_custom_description: string | null; // when shape === 'custom'
  color: string;                         // hex, e.g. '#7DD3FC'
  size: 1 | 2 | 3 | 4 | 5;               // XS … XL

  // Somatic identity (Step 2)
  tone: number;                          // 0–100 (low → high)
  volume: number;                        // 0–100 (whisper → loud)
  body_locations: BodyRegion[];

  // Spatial placement (Step 4)
  current_distance: DistanceBucket;
  current_side: SideBucket;
  desired_distance: DistanceBucket;
  desired_side: SideBucket;

  // Purpose (Step 5)
  helps_when: string[];                  // tag list — see HELPS_WHEN_PRESETS below
  helps_note: string;                    // free-text

  // Stats (computed views, not stored)
  thought_count?: number;                // count(*) on linked thought_entries

  created_at: string;                    // ISO
  updated_at: string;
}

// Preset tags for the "This voice helps when…" checklist (Step 5).
// User can add custom tags too — store as free strings, no enum constraint.
export const HELPS_WHEN_PRESETS = [
  'Reviewing technique',
  'Preparing for a heavy single',
  'Catching mistakes mid-set',
  'Picking attempts',
  'After a missed lift',
  'When I\'m tired and want to skip',
  'Coaching others',
  'Recovery / rest days',
] as const;

// ─────────────────────────────────────────────────────────────────────────
// Voice draft — autosaved while user is in the wizard so refresh / nav-away
// doesn't lose progress. One row per (user_id, voice_id-or-null).
// ─────────────────────────────────────────────────────────────────────────

export interface VoiceDraft {
  id: string;
  user_id: string;
  editing_voice_id: string | null;       // null when creating new

  // Same shape as Voice but every field optional
  state: Partial<Voice> & { current_step: 1 | 2 | 3 | 4 | 5 };

  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Thought entries — extends the existing self-talk log row
// ─────────────────────────────────────────────────────────────────────────

export type Sentiment = 'pos' | 'neu' | 'neg';

export interface ThoughtEntry {
  id: string;
  user_id: string;

  text: string;
  sentiment: Sentiment;
  tag: string;                           // 'Pre-training' | 'Training' | 'General' | …

  // NEW — nullable. Classic users never set this.
  voice_id: string | null;

  // Reframe — also new, optional. Either the AI-suggested reframe (Beta)
  // or the user's own follow-up note (both modes can use this).
  reframe_text: string | null;

  // "Search for those clues" — coach's reframe-test pattern.
  // When set, app surfaces a notification on this date asking
  // "did the original thought turn out to be true?"
  reframe_test_due: string | null;       // ISO date
  reframe_test_resolved: 'true' | 'false' | null;

  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// API contracts — frontend <-> server
// ─────────────────────────────────────────────────────────────────────────

export interface ListVoicesResponse {
  voices: (Voice & { thought_count: number })[];
}

export interface CreateVoiceRequest {
  // All fields except id/user_id/timestamps — server fills those.
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
  voice_id: string | null;               // null clears the link
}
