-- Post-competition reflection: one row per athlete per meet date.
-- Answers are stored as a JSONB object keyed by question id.
CREATE TABLE IF NOT EXISTS meet_reflections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meet_date   DATE        NOT NULL,
  answers     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, meet_date)
);

CREATE INDEX IF NOT EXISTS meet_reflections_athlete_idx
  ON meet_reflections (athlete_id, meet_date DESC);

-- RLS: athletes read/write their own rows; coaches can read their athletes' rows.
ALTER TABLE meet_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athlete own" ON meet_reflections
  FOR ALL USING (auth.uid() = athlete_id);

CREATE POLICY "coach read" ON meet_reflections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'coach'
        AND profiles.id IN (
          SELECT coach_id FROM profiles WHERE id = meet_reflections.athlete_id
        )
    )
  );
