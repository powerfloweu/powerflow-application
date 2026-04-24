-- Add training days per week to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_days_per_week int CHECK (training_days_per_week BETWEEN 1 AND 7);

-- Daily training/rest log
CREATE TABLE IF NOT EXISTS training_entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date      date        NOT NULL DEFAULT CURRENT_DATE,
  is_training_day boolean     NOT NULL DEFAULT true,
  mood_rating     int         CHECK (mood_rating BETWEEN 1 AND 10),
  thoughts_before text,
  thoughts_after  text,
  what_went_well  text,
  frustrations    text,
  next_session    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

ALTER TABLE training_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entries"  ON training_entries FOR ALL     TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "coach read"   ON training_entries FOR SELECT  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE coach_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'));
