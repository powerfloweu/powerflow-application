-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow baseline schema — reconstructed from the production database.
-- Generated 2026-07-02 via the Supabase Management API + pg_get_constraintdef.
-- This file is the full public schema so the database can be rebuilt from the
-- repo; later migrations layer on top of it.
--
-- Idempotent: CREATE ... IF NOT EXISTS and duplicate-safe DO blocks mean this
-- can be re-run against the live DB as a no-op. FKs to auth.users assume the
-- Supabase auth schema exists.
-- ─────────────────────────────────────────────────────────────────────────────

-- Supabase-managed roles referenced by policies below. These always exist on
-- Supabase; guarded here so the file also applies to a vanilla Postgres.
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS acsi_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  result_ref text NOT NULL,
  first_name text,
  email text,
  gender text,
  lang text,
  submitted_at timestamptz,
  paid boolean DEFAULT false NOT NULL,
  score_coping smallint,
  score_peaking smallint,
  score_goal_setting smallint,
  score_concentration smallint,
  score_freedom smallint,
  score_confidence smallint,
  score_coachability smallint,
  total_score smallint,
  user_id uuid,
  PRIMARY KEY (id),
  UNIQUE (result_ref)
);

CREATE TABLE IF NOT EXISTS assigned_tests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  test_slug text NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  PRIMARY KEY (id),
  UNIQUE (coach_id, athlete_id, test_slug),
  CHECK ((test_slug = ANY (ARRAY['sat'::text, 'acsi'::text, 'csai'::text, 'das'::text])))
);

CREATE TABLE IF NOT EXISTS athlete_scripts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_role text DEFAULT 'all'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS chat_message_ratings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (message_id, user_id),
  CHECK ((rating = ANY (ARRAY['good'::text, 'bad'::text])))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);

CREATE TABLE IF NOT EXISTS checkin_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  checkin_id uuid NOT NULL,
  checkin_type text NOT NULL,
  content text,
  audio_url text,
  reviewed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (coach_id, checkin_id, checkin_type),
  CHECK ((checkin_type = ANY (ARRAY['weekly'::text, 'monthly'::text])))
);

CREATE TABLE IF NOT EXISTS coach_ai_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  rated_on date DEFAULT CURRENT_DATE NOT NULL,
  length_rating text,
  style_rating text,
  helpfulness smallint,
  note text,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, rated_on),
  CHECK ((length_rating = ANY (ARRAY['shorter'::text, 'perfect'::text, 'more_detail'::text]))),
  CHECK (((helpfulness >= 1) AND (helpfulness <= 5))),
  CHECK ((style_rating = ANY (ARRAY['direct'::text, 'good'::text, 'warmer'::text])))
);

CREATE TABLE IF NOT EXISTS coach_athlete_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  journal_prompt_labels text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (coach_id, athlete_id)
);

CREATE TABLE IF NOT EXISTS coach_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  content text DEFAULT ''::text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (coach_id, athlete_id)
);

CREATE TABLE IF NOT EXISTS conversation_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  summary text NOT NULL,
  techniques_used text[] DEFAULT '{}'::text[],
  themes text[] DEFAULT '{}'::text[],
  resonated text,
  session_date date NOT NULL,
  message_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, session_date)
);

CREATE TABLE IF NOT EXISTS course_answers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  week_num integer NOT NULL,
  question_id text NOT NULL,
  text text,
  audio_url text,
  audio_duration_s integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  module_slug text,
  PRIMARY KEY (id),
  UNIQUE (user_id, week_num, question_id),
  CHECK (((week_num >= 1) AND (week_num <= 16)))
);

CREATE TABLE IF NOT EXISTS course_progress (
  user_id uuid NOT NULL,
  week_num integer NOT NULL,
  video_done_at timestamptz,
  exercise_done_at timestamptz,
  quiz_done_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL,
  module_slug text,
  practice_count integer DEFAULT 0 NOT NULL,
  PRIMARY KEY (user_id, week_num),
  CHECK (((week_num >= 1) AND (week_num <= 16)))
);

CREATE TABLE IF NOT EXISTS csai_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  result_ref text NOT NULL,
  first_name text,
  email text,
  gender text,
  lang text,
  submitted_at timestamptz,
  paid boolean DEFAULT false NOT NULL,
  score_cognitive smallint,
  score_somatic smallint,
  score_confidence smallint,
  user_id uuid,
  PRIMARY KEY (id),
  UNIQUE (result_ref)
);

CREATE TABLE IF NOT EXISTS das_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  result_ref text,
  first_name text,
  email text,
  lang text,
  submitted_at timestamptz DEFAULT now(),
  paid boolean DEFAULT false,
  score_external_approval smallint,
  score_lovability smallint,
  score_achievement smallint,
  score_perfectionism smallint,
  score_entitlement smallint,
  score_omnipotence smallint,
  score_external_control smallint,
  total_score integer,
  depression_prone boolean,
  user_id uuid,
  PRIMARY KEY (id),
  UNIQUE (result_ref)
);

CREATE TABLE IF NOT EXISTS ego_states (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#7C3AED'::text NOT NULL,
  posture text,
  body_feeling text,
  voice_tone text,
  origin_story text,
  domain text,
  shadow_side text,
  activation_ritual text,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS entry_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  coach_id uuid NOT NULL,
  entry_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  sentiment text NOT NULL,
  context text DEFAULT 'general'::text NOT NULL,
  themes text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  voice_id uuid,
  reframe_text text,
  reframe_test_due date,
  reframe_test_resolved text,
  PRIMARY KEY (id),
  CHECK ((reframe_test_resolved = ANY (ARRAY['true'::text, 'false'::text]))),
  CHECK ((context = ANY (ARRAY['pre-training'::text, 'during-session'::text, 'post-competition'::text, 'rest-day'::text, 'general'::text]))),
  CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])))
);

CREATE TABLE IF NOT EXISTS meet_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  athlete_id uuid NOT NULL,
  meet_date date NOT NULL,
  lift text NOT NULL,
  attempt_num integer NOT NULL,
  planned_kg numeric(6,2),
  actual_kg numeric(6,2),
  result text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (athlete_id, meet_date, lift, attempt_num),
  CHECK ((attempt_num = ANY (ARRAY[1, 2, 3]))),
  CHECK ((lift = ANY (ARRAY['squat'::text, 'bench'::text, 'deadlift'::text]))),
  CHECK ((result = ANY (ARRAY['made'::text, 'missed'::text, 'red_light'::text])))
);

CREATE TABLE IF NOT EXISTS meet_reflections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  athlete_id uuid NOT NULL,
  meet_date date NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (athlete_id, meet_date)
);

CREATE TABLE IF NOT EXISTS monthly_checkins (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  year integer NOT NULL,
  week_number integer NOT NULL,
  week_start date NOT NULL,
  mood_rating smallint NOT NULL,
  training_quality smallint NOT NULL,
  readiness_rating smallint NOT NULL,
  energy_rating smallint NOT NULL,
  sleep_rating smallint NOT NULL,
  biggest_win text,
  biggest_challenge text,
  focus_next_week text,
  overall_progress smallint NOT NULL,
  biggest_breakthrough text,
  key_lesson text,
  next_month_intention text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, year, week_number),
  CHECK (((training_quality >= 1) AND (training_quality <= 10))),
  CHECK (((energy_rating >= 1) AND (energy_rating <= 10))),
  CHECK (((readiness_rating >= 1) AND (readiness_rating <= 10))),
  CHECK (((sleep_rating >= 1) AND (sleep_rating <= 10))),
  CHECK (((overall_progress >= 1) AND (overall_progress <= 10))),
  CHECK (((mood_rating >= 1) AND (mood_rating <= 10)))
);

CREATE TABLE IF NOT EXISTS prep_lifts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  athlete_id uuid NOT NULL,
  lift text NOT NULL,
  weight_kg numeric(6,2),
  title text,
  video_url text,
  lift_date date,
  athlete_notes text,
  coach_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  mux_playback_id text,
  PRIMARY KEY (id),
  CHECK ((lift = ANY (ARRAY['squat'::text, 'bench'::text, 'deadlift'::text, 'general'::text])))
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid NOT NULL,
  role text DEFAULT 'athlete'::text NOT NULL,
  display_name text,
  avatar_url text,
  coach_code text,
  coach_id uuid,
  created_at timestamptz DEFAULT now(),
  meet_date date,
  gender text,
  bodyweight_kg numeric(5,2),
  weight_category text,
  squat_current_kg numeric(6,2),
  squat_goal_kg numeric(6,2),
  bench_current_kg numeric(6,2),
  bench_goal_kg numeric(6,2),
  deadlift_current_kg numeric(6,2),
  deadlift_goal_kg numeric(6,2),
  mental_goals text[] DEFAULT '{}'::text[],
  training_days_per_week integer,
  course_access boolean DEFAULT false NOT NULL,
  onboarding_complete boolean DEFAULT false NOT NULL,
  instagram text,
  years_powerlifting text,
  federation text,
  main_barrier text,
  confidence_break text,
  overthinking_focus text,
  previous_mental_work text,
  self_confidence_reg smallint,
  self_focus_fatigue smallint,
  self_handling_pressure smallint,
  self_competition_anxiety smallint,
  self_emotional_recovery smallint,
  expectations text,
  previous_tools text,
  anything_else text,
  affirmations text[] DEFAULT '{}'::text[],
  viz_keywords jsonb DEFAULT '{}'::jsonb,
  test_access boolean DEFAULT false,
  ai_access boolean DEFAULT false,
  self_talk_mode text DEFAULT 'classic'::text NOT NULL,
  course_plan jsonb,
  last_seen_broadcast_id uuid,
  last_seen_devlog_version text,
  plan_tier text DEFAULT 'opener'::text NOT NULL,
  language text DEFAULT 'en'::text NOT NULL,
  force_checkin boolean DEFAULT false,
  viz_recordings jsonb DEFAULT '{}'::jsonb,
  tts_voice_id text,
  journal_prompt_labels text[],
  translator_access boolean DEFAULT false NOT NULL,
  coach_status text,
  coach_application jsonb,
  coach_notes text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  stripe_coach_sub_id text,
  preferred_voice_id text,
  coach_ai_nudge_sent_at timestamptz,
  meet_config jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id),
  UNIQUE (coach_code),
  CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text]))),
  CHECK ((self_talk_mode = ANY (ARRAY['classic'::text, 'beta_voice_work'::text]))),
  CHECK (((self_emotional_recovery >= 1) AND (self_emotional_recovery <= 10))),
  CHECK (((self_competition_anxiety >= 1) AND (self_competition_anxiety <= 10))),
  CHECK (((self_handling_pressure >= 1) AND (self_handling_pressure <= 10))),
  CHECK (((self_focus_fatigue >= 1) AND (self_focus_fatigue <= 10))),
  CHECK (((self_confidence_reg >= 1) AND (self_confidence_reg <= 10))),
  CHECK ((plan_tier = ANY (ARRAY['opener'::text, 'second'::text, 'pr'::text]))),
  CHECK ((language = ANY (ARRAY['en'::text, 'de'::text, 'hu'::text]))),
  CHECK (((training_days_per_week >= 1) AND (training_days_per_week <= 7))),
  CHECK ((coach_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
  CHECK ((role = ANY (ARRAY['athlete'::text, 'coach'::text])))
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (endpoint)
);

CREATE TABLE IF NOT EXISTS sat_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  first_name text,
  email text,
  gender text,
  lang text,
  started_at timestamptz,
  submitted_at timestamptz,
  result_ref text,
  paid boolean DEFAULT false NOT NULL,
  stripe_session_id text,
  score_performance smallint,
  score_affiliation smallint,
  score_aggression smallint,
  score_defensiveness smallint,
  score_consciousness smallint,
  score_dominance smallint,
  score_exhibition smallint,
  score_autonomy smallint,
  score_caregiving smallint,
  score_order smallint,
  score_helplessness smallint,
  sf_self_confirmation smallint,
  sf_rational_dominance smallint,
  sf_aggressive_nonconformity smallint,
  sf_passive_dependence smallint,
  sf_sociability smallint,
  sf_agreeableness smallint,
  sum_yes smallint,
  validity_reliable boolean,
  user_id uuid,
  PRIMARY KEY (id),
  UNIQUE (result_ref)
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  round smallint NOT NULL,
  role text NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, round),
  CHECK (((round >= 1) AND (round <= 3)))
);

CREATE TABLE IF NOT EXISTS tool_suggestions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  tool_id text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  seen_at timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tool_usage (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  used_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS training_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  entry_date date DEFAULT CURRENT_DATE NOT NULL,
  is_training_day boolean DEFAULT true NOT NULL,
  mood_rating integer,
  thoughts_before text,
  thoughts_after text,
  what_went_well text,
  frustrations text,
  next_session text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  coach_note text,
  PRIMARY KEY (id),
  UNIQUE (user_id, entry_date),
  CHECK (((mood_rating >= 1) AND (mood_rating <= 10)))
);

CREATE TABLE IF NOT EXISTS translation_overrides (
  locale text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by text,
  PRIMARY KEY (locale, key),
  CHECK ((locale = ANY (ARRAY['de'::text, 'hu'::text, 'es'::text, 'fr'::text])))
);

CREATE TABLE IF NOT EXISTS voice_drafts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  editing_voice_id uuid,
  state jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, editing_voice_id)
);

CREATE TABLE IF NOT EXISTS voices (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  shape text DEFAULT 'cloud'::text NOT NULL,
  shape_custom_description text,
  color text DEFAULT '#7DD3FC'::text NOT NULL,
  size integer DEFAULT 3 NOT NULL,
  tone integer DEFAULT 50 NOT NULL,
  volume integer DEFAULT 50 NOT NULL,
  body_locations text[] DEFAULT '{}'::text[] NOT NULL,
  current_distance text DEFAULT 'close'::text NOT NULL,
  current_side text DEFAULT 'front'::text NOT NULL,
  desired_distance text DEFAULT 'arm'::text NOT NULL,
  desired_side text DEFAULT 'front'::text NOT NULL,
  helps_when text[] DEFAULT '{}'::text[] NOT NULL,
  helps_note text DEFAULT ''::text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CHECK (((tone >= 0) AND (tone <= 100))),
  CHECK (((volume >= 0) AND (volume <= 100))),
  CHECK (((size >= 1) AND (size <= 5)))
);

CREATE TABLE IF NOT EXISTS weekly_checkins (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  week_number smallint NOT NULL,
  year smallint NOT NULL,
  week_start date NOT NULL,
  mood_rating smallint DEFAULT 5 NOT NULL,
  training_quality smallint DEFAULT 5 NOT NULL,
  readiness_rating smallint DEFAULT 5 NOT NULL,
  energy_rating smallint DEFAULT 5 NOT NULL,
  sleep_rating smallint DEFAULT 5 NOT NULL,
  biggest_win text,
  biggest_challenge text,
  focus_next_week text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, year, week_number)
);

-- ── Foreign keys (added after all tables exist, order-independent) ────────────
DO $$ BEGIN
  ALTER TABLE acsi_results ADD CONSTRAINT acsi_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE assigned_tests ADD CONSTRAINT assigned_tests_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE assigned_tests ADD CONSTRAINT assigned_tests_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE athlete_scripts ADD CONSTRAINT athlete_scripts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE chat_message_ratings ADD CONSTRAINT chat_message_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE checkin_feedback ADD CONSTRAINT checkin_feedback_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE checkin_feedback ADD CONSTRAINT checkin_feedback_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE coach_ai_feedback ADD CONSTRAINT coach_ai_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE coach_athlete_settings ADD CONSTRAINT coach_athlete_settings_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE coach_athlete_settings ADD CONSTRAINT coach_athlete_settings_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE coach_notes ADD CONSTRAINT coach_notes_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE coach_notes ADD CONSTRAINT coach_notes_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE conversation_summaries ADD CONSTRAINT conversation_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE course_answers ADD CONSTRAINT course_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE course_progress ADD CONSTRAINT course_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE csai_results ADD CONSTRAINT csai_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE das_results ADD CONSTRAINT das_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ego_states ADD CONSTRAINT ego_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE entry_feedback ADD CONSTRAINT entry_feedback_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE entry_feedback ADD CONSTRAINT entry_feedback_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE entry_feedback ADD CONSTRAINT entry_feedback_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_voice_id_fkey FOREIGN KEY (voice_id) REFERENCES voices(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE meet_attempts ADD CONSTRAINT meet_attempts_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE meet_reflections ADD CONSTRAINT meet_reflections_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE monthly_checkins ADD CONSTRAINT monthly_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE prep_lifts ADD CONSTRAINT prep_lifts_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE sat_results ADD CONSTRAINT sat_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE survey_responses ADD CONSTRAINT survey_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE tool_suggestions ADD CONSTRAINT tool_suggestions_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE tool_suggestions ADD CONSTRAINT tool_suggestions_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE tool_usage ADD CONSTRAINT tool_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE training_entries ADD CONSTRAINT training_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE voice_drafts ADD CONSTRAINT voice_drafts_editing_voice_id_fkey FOREIGN KEY (editing_voice_id) REFERENCES voices(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE voice_drafts ADD CONSTRAINT voice_drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE voices ADD CONSTRAINT voices_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE weekly_checkins ADD CONSTRAINT weekly_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS acsi_results_ref_idx ON public.acsi_results USING btree (result_ref);
CREATE INDEX IF NOT EXISTS acsi_results_user_id_idx ON public.acsi_results USING btree (user_id);
CREATE INDEX IF NOT EXISTS assigned_tests_athlete_idx ON public.assigned_tests USING btree (athlete_id);
CREATE INDEX IF NOT EXISTS assigned_tests_coach_idx ON public.assigned_tests USING btree (coach_id);
CREATE INDEX IF NOT EXISTS athlete_scripts_user ON public.athlete_scripts USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_message_ratings_user_id ON public.chat_message_ratings USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON public.chat_messages USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS checkin_feedback_athlete_idx ON public.checkin_feedback USING btree (athlete_id);
CREATE INDEX IF NOT EXISTS checkin_feedback_checkin_idx ON public.checkin_feedback USING btree (checkin_id, checkin_type);
CREATE INDEX IF NOT EXISTS course_answers_user_idx ON public.course_answers USING btree (user_id);
CREATE INDEX IF NOT EXISTS course_answers_week_idx ON public.course_answers USING btree (user_id, week_num);
CREATE INDEX IF NOT EXISTS course_progress_user_idx ON public.course_progress USING btree (user_id);
CREATE INDEX IF NOT EXISTS csai_results_ref_idx ON public.csai_results USING btree (result_ref);
CREATE INDEX IF NOT EXISTS csai_results_user_id_idx ON public.csai_results USING btree (user_id);
CREATE INDEX IF NOT EXISTS das_results_ref_idx ON public.das_results USING btree (result_ref);
CREATE INDEX IF NOT EXISTS das_results_user_id_idx ON public.das_results USING btree (user_id);
CREATE INDEX IF NOT EXISTS ego_states_user_id_idx ON public.ego_states USING btree (user_id);
CREATE INDEX IF NOT EXISTS journal_entries_created_at_idx ON public.journal_entries USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS journal_entries_user_id_idx ON public.journal_entries USING btree (user_id);
CREATE INDEX IF NOT EXISTS meet_attempts_athlete_idx ON public.meet_attempts USING btree (athlete_id, meet_date);
CREATE INDEX IF NOT EXISTS meet_reflections_athlete_idx ON public.meet_reflections USING btree (athlete_id, meet_date DESC);
CREATE INDEX IF NOT EXISTS prep_lifts_athlete_idx ON public.prep_lifts USING btree (athlete_id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key ON public.profiles USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions USING btree (user_id);
CREATE INDEX IF NOT EXISTS sat_results_ref_idx ON public.sat_results USING btree (result_ref);
CREATE INDEX IF NOT EXISTS sat_results_user_id_idx ON public.sat_results USING btree (user_id);
CREATE INDEX IF NOT EXISTS survey_responses_user_idx ON public.survey_responses USING btree (user_id);
CREATE INDEX IF NOT EXISTS tool_suggestions_athlete_idx ON public.tool_suggestions USING btree (athlete_id, seen_at);
CREATE INDEX IF NOT EXISTS tool_suggestions_coach_idx ON public.tool_suggestions USING btree (coach_id);
CREATE INDEX IF NOT EXISTS tool_usage_tool_id_idx ON public.tool_usage USING btree (tool_id);
CREATE INDEX IF NOT EXISTS tool_usage_used_at_idx ON public.tool_usage USING btree (used_at DESC);
CREATE INDEX IF NOT EXISTS tool_usage_user_id_idx ON public.tool_usage USING btree (user_id);
CREATE INDEX IF NOT EXISTS translation_overrides_locale_idx ON public.translation_overrides USING btree (locale);
CREATE INDEX IF NOT EXISTS voices_user_updated ON public.voices USING btree (user_id, updated_at DESC);

-- ── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE acsi_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athlete_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE csai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE das_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ego_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_lifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sat_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- ── Policies ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "acsi_results_coach_read" ON acsi_results
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (((user_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = acsi_results.user_id) AND (p.coach_id = auth.uid()))))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "acsi_results_own" ON acsi_results
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "assigned_tests_athlete_read" ON assigned_tests
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "assigned_tests_coach_all" ON assigned_tests
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service role only" ON athlete_scripts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "broadcasts_authenticated_read" ON broadcasts
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "chat_message_ratings_self" ON chat_message_ratings
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "chat_messages_self" ON chat_messages
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "checkin_feedback_athlete_read" ON checkin_feedback
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "checkin_feedback_coach_all" ON checkin_feedback
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coach_ai_feedback_own" ON coach_ai_feedback
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Athlete reads their own settings" ON coach_athlete_settings
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((athlete_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Coach manages own athlete settings" ON coach_athlete_settings
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((coach_id = auth.uid()))
      WITH CHECK ((coach_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coach_athlete_settings_athlete_read" ON coach_athlete_settings
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coach_athlete_settings_coach_all" ON coach_athlete_settings
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coach_notes_own" ON coach_notes
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service role only" ON coach_notes
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "conversation_summaries_self" ON conversation_summaries
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coach reads answers" ON course_answers
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = course_answers.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "course_answers_coach_read" ON course_answers
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = course_answers.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "course_answers_own" ON course_answers
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own answers" ON course_answers
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coach reads progress" ON course_progress
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = course_progress.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "course_progress_coach_read" ON course_progress
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = course_progress.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "course_progress_own" ON course_progress
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own progress" ON course_progress
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "csai_results_coach_read" ON csai_results
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (((user_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = csai_results.user_id) AND (p.coach_id = auth.uid()))))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "csai_results_own" ON csai_results
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "das_results_coach_read" ON das_results
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (((user_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = das_results.user_id) AND (p.coach_id = auth.uid()))))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "das_results_own" ON das_results
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ego_states_own" ON ego_states
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "entry_feedback_athlete_read" ON entry_feedback
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "entry_feedback_coach_all" ON entry_feedback
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service role only" ON entry_feedback
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "journal: coach sees athlete entries" ON journal_entries
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = journal_entries.user_id) AND (profiles.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "journal: own entries" ON journal_entries
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "journal_entries_coach_read" ON journal_entries
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = journal_entries.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "journal_entries_own" ON journal_entries
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "meet_attempts_coach_read" ON meet_attempts
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = meet_attempts.athlete_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "meet_attempts_own" ON meet_attempts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "meet_reflections_coach_read" ON meet_reflections
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = meet_reflections.athlete_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "meet_reflections_own" ON meet_reflections
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "monthly_checkins_coach_read" ON monthly_checkins
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = monthly_checkins.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "monthly_checkins_own" ON monthly_checkins
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "prep_lifts_coach_all" ON prep_lifts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = prep_lifts.athlete_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "prep_lifts_own" ON prep_lifts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "profiles: any auth reads coaches" ON profiles
      AS PERMISSIVE
      FOR SELECT
      TO authenticated
      USING ((role = 'coach'::text));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "profiles: coach sees athletes" ON profiles
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (((auth.uid() = coach_id) OR (auth.uid() = id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "profiles: own row" ON profiles
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "profiles_coach_read" ON profiles
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((coach_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "profiles_own" ON profiles
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "push_subscriptions_own" ON push_subscriptions
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "survey_responses_own" ON survey_responses
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "users insert own survey response" ON survey_responses
      AS PERMISSIVE
      FOR INSERT
      TO public
      WITH CHECK ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "users select own survey responses" ON survey_responses
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "athletes select own suggestions" ON tool_suggestions
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "athletes update seen_at" ON tool_suggestions
      AS PERMISSIVE
      FOR UPDATE
      TO public
      USING ((auth.uid() = athlete_id))
      WITH CHECK ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coaches insert tool suggestions" ON tool_suggestions
      AS PERMISSIVE
      FOR INSERT
      TO public
      WITH CHECK ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coaches select sent suggestions" ON tool_suggestions
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "tool_suggestions_athlete_read" ON tool_suggestions
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((auth.uid() = athlete_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "tool_suggestions_coach_all" ON tool_suggestions
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = coach_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "tool_usage: insert own rows" ON tool_usage
      AS PERMISSIVE
      FOR INSERT
      TO public
      WITH CHECK ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "tool_usage_own" ON tool_usage
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "coach read" ON training_entries
      AS PERMISSIVE
      FOR SELECT
      TO authenticated
      USING (((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.coach_id = auth.uid()))) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'coach'::text))))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own entries" ON training_entries
      AS PERMISSIVE
      FOR ALL
      TO authenticated
      USING ((user_id = auth.uid()))
      WITH CHECK ((user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "training_entries_coach_read" ON training_entries
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = training_entries.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "training_entries_own" ON training_entries
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "translation_overrides_public_read" ON translation_overrides
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service role only" ON voice_drafts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "voice_drafts_own" ON voice_drafts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service role only" ON voices
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage their own check-ins" ON weekly_checkins
      AS PERMISSIVE
      FOR ALL
      TO authenticated
      USING ((auth.uid() = user_id))
      WITH CHECK ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "weekly_checkins_coach_read" ON weekly_checkins
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = weekly_checkins.user_id) AND (p.coach_id = auth.uid())))));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "weekly_checkins_own" ON weekly_checkins
      AS PERMISSIVE
      FOR ALL
      TO public
      USING ((auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
