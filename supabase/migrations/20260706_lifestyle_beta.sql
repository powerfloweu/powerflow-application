-- Lifestyle guide (beta) — personal operating system: values, programming with
-- tick-off + progress, weight & macros via a meal library, and an adaptive
-- life check-in. Gated per-user by profiles.lifestyle_beta (default false).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifestyle_beta boolean NOT NULL DEFAULT false;

-- One row per user: values, check-in dimensions, meal library, macro targets.
CREATE TABLE IF NOT EXISTS lifestyle_config (
  user_id       uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  values_list   text[]      NOT NULL DEFAULT '{}',
  dimensions    jsonb       NOT NULL DEFAULT '[]',
  meals         jsonb       NOT NULL DEFAULT '[]',
  macro_targets jsonb       NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Training blocks. structure = { weeks, days: [{ key, name, exercises: [...] }] }
CREATE TABLE IF NOT EXISTS lifestyle_plans (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  structure    jsonb       NOT NULL DEFAULT '{}',
  current_week int         NOT NULL DEFAULT 1,
  active       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lifestyle_plans_user_idx ON lifestyle_plans(user_id, active);

-- One row per logged session. entries = [{ exercise_id, name, prescription,
-- sets: [{weight, reps, rpe}], done }]
CREATE TABLE IF NOT EXISTS lifestyle_workouts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id     uuid        REFERENCES lifestyle_plans(id) ON DELETE SET NULL,
  log_date    date        NOT NULL,
  day_key     text        NOT NULL,
  week_number int,
  entries     jsonb       NOT NULL DEFAULT '[]',
  note        text,
  completed   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date, day_key)
);
CREATE INDEX IF NOT EXISTS lifestyle_workouts_user_idx ON lifestyle_workouts(user_id, log_date DESC);

-- One row per day; partial check-ins merge into it (daily quick-taps + weekly
-- dims can land on the same date).
CREATE TABLE IF NOT EXISTS lifestyle_checkins (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date date        NOT NULL,
  scores       jsonb       NOT NULL DEFAULT '{}',
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

-- One row per day: weight + meals eaten (macros derived from the meal library,
-- with optional manual macros override).
CREATE TABLE IF NOT EXISTS lifestyle_body_log (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date   date          NOT NULL,
  weight_kg  numeric(5,2),
  meal_ids   text[]        NOT NULL DEFAULT '{}',
  macros     jsonb,
  note       text,
  updated_at timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

-- RLS: strictly owner-only on every table.
ALTER TABLE lifestyle_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_body_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "lifestyle_config_own"   ON lifestyle_config   FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lifestyle_plans_own"    ON lifestyle_plans    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lifestyle_workouts_own" ON lifestyle_workouts FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lifestyle_checkins_own" ON lifestyle_checkins FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lifestyle_body_log_own" ON lifestyle_body_log FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
