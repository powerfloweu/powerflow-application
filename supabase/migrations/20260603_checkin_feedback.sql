-- checkin_feedback: coach written + audio responses to weekly / monthly check-ins,
-- plus a per-record "reviewed" flag so coaches can tick off completed feedback.

CREATE TABLE IF NOT EXISTS checkin_feedback (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id   UUID        NOT NULL,
  checkin_type TEXT        NOT NULL CHECK (checkin_type IN ('weekly', 'monthly')),
  content      TEXT,                       -- written message (nullable)
  audio_url    TEXT,                       -- Supabase storage path (nullable)
  reviewed     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, checkin_id, checkin_type)
);

-- Index for fast look-ups by coach's athletes
CREATE INDEX IF NOT EXISTS checkin_feedback_athlete_idx ON checkin_feedback(athlete_id);
CREATE INDEX IF NOT EXISTS checkin_feedback_checkin_idx ON checkin_feedback(checkin_id, checkin_type);
