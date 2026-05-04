-- Ego States table
-- Replaces the old voices/voice-work concept.
-- Each row is one psychological persona mapped by an athlete.

CREATE TABLE IF NOT EXISTS ego_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  posture TEXT,
  body_feeling TEXT,
  voice_tone TEXT,
  origin_story TEXT,
  domain TEXT,
  shadow_side TEXT,
  activation_ritual TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ego_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own ego states"
  ON ego_states
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ego_states_user_id_idx ON ego_states (user_id);
