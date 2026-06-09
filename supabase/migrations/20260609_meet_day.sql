-- meet_config: openers (kg) + flight_size stored as JSONB on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meet_config JSONB DEFAULT '{}';

-- meet_attempts: tracks each attempt on the day of the competition
CREATE TABLE IF NOT EXISTS meet_attempts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meet_date   DATE        NOT NULL,
  lift        TEXT        NOT NULL CHECK (lift IN ('squat', 'bench', 'deadlift')),
  attempt_num INT         NOT NULL CHECK (attempt_num IN (1, 2, 3)),
  planned_kg  NUMERIC(6,2),
  actual_kg   NUMERIC(6,2),
  result      TEXT        CHECK (result IN ('made', 'missed', 'red_light')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, meet_date, lift, attempt_num)
);
CREATE INDEX IF NOT EXISTS meet_attempts_athlete_idx ON meet_attempts(athlete_id, meet_date);

-- prep_lifts: best lifts from comp prep — video URL, weight, coach notes
CREATE TABLE IF NOT EXISTS prep_lifts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lift           TEXT        NOT NULL CHECK (lift IN ('squat', 'bench', 'deadlift', 'general')),
  weight_kg      NUMERIC(6,2),
  title          TEXT,
  video_url      TEXT,
  lift_date      DATE,
  athlete_notes  TEXT,
  coach_notes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prep_lifts_athlete_idx ON prep_lifts(athlete_id);

NOTIFY pgrst, 'reload schema';
