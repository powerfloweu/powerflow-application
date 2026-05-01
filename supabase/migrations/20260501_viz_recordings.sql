-- Stores a mapping of viz tool ID → Supabase Storage path for user-uploaded voice notes.
-- E.g. { "viz-squat": "abc-uuid/viz-squat.m4a" }

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS viz_recordings jsonb DEFAULT '{}'::jsonb;
