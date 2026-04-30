-- Monthly check-in — fired every 4th ISO week (week % 4 = 0).
-- Contains the same five ratings + three reflection fields as the weekly
-- check-in, plus four monthly-specific deeper fields.

CREATE TABLE IF NOT EXISTS monthly_checkins (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year                int         NOT NULL,
  week_number         int         NOT NULL,   -- ISO week that triggered the monthly check-in
  week_start          date        NOT NULL,   -- Monday of that week
  -- Weekly ratings (same as weekly_checkins)
  mood_rating         smallint    NOT NULL CHECK (mood_rating         BETWEEN 1 AND 10),
  training_quality    smallint    NOT NULL CHECK (training_quality    BETWEEN 1 AND 10),
  readiness_rating    smallint    NOT NULL CHECK (readiness_rating    BETWEEN 1 AND 10),
  energy_rating       smallint    NOT NULL CHECK (energy_rating       BETWEEN 1 AND 10),
  sleep_rating        smallint    NOT NULL CHECK (sleep_rating        BETWEEN 1 AND 10),
  -- Weekly reflection (same as weekly_checkins)
  biggest_win         text,
  biggest_challenge   text,
  focus_next_week     text,
  -- Monthly-specific deeper reflection
  overall_progress    smallint    NOT NULL CHECK (overall_progress    BETWEEN 1 AND 10),
  biggest_breakthrough text,
  key_lesson          text,
  next_month_intention text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, week_number)
);
