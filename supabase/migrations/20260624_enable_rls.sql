-- Enable RLS on all tables that hold user data.
-- Server-side routes use the service-role key (bypasses RLS), so this only
-- prevents direct anon-key access to the Supabase REST/PostgREST API.
--
-- Coach-check helper used in several policies:
--   EXISTS (SELECT 1 FROM profiles p WHERE p.id = <table>.user_id AND p.coach_id = auth.uid())
-- This reads: "the athlete who owns this row has me as their coach."

-- ── profiles ──────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own"         ON profiles;
DROP POLICY IF EXISTS "profiles_coach_read"  ON profiles;
CREATE POLICY "profiles_own"        ON profiles FOR ALL   USING (auth.uid() = id);
CREATE POLICY "profiles_coach_read" ON profiles FOR SELECT USING (coach_id = auth.uid());

-- ── weekly_checkins ───────────────────────────────────────────────────────────
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_checkins_own"        ON weekly_checkins;
DROP POLICY IF EXISTS "weekly_checkins_coach_read" ON weekly_checkins;
CREATE POLICY "weekly_checkins_own" ON weekly_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "weekly_checkins_coach_read" ON weekly_checkins FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = weekly_checkins.user_id AND p.coach_id = auth.uid())
);

-- ── monthly_checkins ──────────────────────────────────────────────────────────
ALTER TABLE monthly_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "monthly_checkins_own"        ON monthly_checkins;
DROP POLICY IF EXISTS "monthly_checkins_coach_read" ON monthly_checkins;
CREATE POLICY "monthly_checkins_own" ON monthly_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "monthly_checkins_coach_read" ON monthly_checkins FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = monthly_checkins.user_id AND p.coach_id = auth.uid())
);

-- ── journal_entries ───────────────────────────────────────────────────────────
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_entries_own"        ON journal_entries;
DROP POLICY IF EXISTS "journal_entries_coach_read" ON journal_entries;
CREATE POLICY "journal_entries_own" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "journal_entries_coach_read" ON journal_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = journal_entries.user_id AND p.coach_id = auth.uid())
);

-- ── training_entries ──────────────────────────────────────────────────────────
ALTER TABLE training_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "training_entries_own"        ON training_entries;
DROP POLICY IF EXISTS "training_entries_coach_read" ON training_entries;
CREATE POLICY "training_entries_own" ON training_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "training_entries_coach_read" ON training_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = training_entries.user_id AND p.coach_id = auth.uid())
);

-- ── acsi_results ──────────────────────────────────────────────────────────────
-- user_id is nullable (anonymous test submissions).
ALTER TABLE acsi_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acsi_results_own"        ON acsi_results;
DROP POLICY IF EXISTS "acsi_results_coach_read" ON acsi_results;
CREATE POLICY "acsi_results_own" ON acsi_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "acsi_results_coach_read" ON acsi_results FOR SELECT USING (
  user_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = acsi_results.user_id AND p.coach_id = auth.uid())
);

-- ── csai_results ──────────────────────────────────────────────────────────────
ALTER TABLE csai_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "csai_results_own"        ON csai_results;
DROP POLICY IF EXISTS "csai_results_coach_read" ON csai_results;
CREATE POLICY "csai_results_own" ON csai_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "csai_results_coach_read" ON csai_results FOR SELECT USING (
  user_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = csai_results.user_id AND p.coach_id = auth.uid())
);

-- ── coach_ai_feedback ─────────────────────────────────────────────────────────
ALTER TABLE coach_ai_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_ai_feedback_own" ON coach_ai_feedback;
CREATE POLICY "coach_ai_feedback_own" ON coach_ai_feedback FOR ALL USING (auth.uid() = user_id);

-- ── coach_notes ───────────────────────────────────────────────────────────────
-- Private to the coach — athletes cannot read these.
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_notes_own" ON coach_notes;
CREATE POLICY "coach_notes_own" ON coach_notes FOR ALL USING (auth.uid() = coach_id);

-- ── entry_feedback ────────────────────────────────────────────────────────────
ALTER TABLE entry_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entry_feedback_coach_all"    ON entry_feedback;
DROP POLICY IF EXISTS "entry_feedback_athlete_read" ON entry_feedback;
CREATE POLICY "entry_feedback_coach_all"    ON entry_feedback FOR ALL    USING (auth.uid() = coach_id);
CREATE POLICY "entry_feedback_athlete_read" ON entry_feedback FOR SELECT USING (auth.uid() = athlete_id);

-- ── checkin_feedback ──────────────────────────────────────────────────────────
ALTER TABLE checkin_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_feedback_coach_all"    ON checkin_feedback;
DROP POLICY IF EXISTS "checkin_feedback_athlete_read" ON checkin_feedback;
CREATE POLICY "checkin_feedback_coach_all"    ON checkin_feedback FOR ALL    USING (auth.uid() = coach_id);
CREATE POLICY "checkin_feedback_athlete_read" ON checkin_feedback FOR SELECT USING (auth.uid() = athlete_id);

-- ── assigned_tests ────────────────────────────────────────────────────────────
ALTER TABLE assigned_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assigned_tests_coach_all"    ON assigned_tests;
DROP POLICY IF EXISTS "assigned_tests_athlete_read" ON assigned_tests;
CREATE POLICY "assigned_tests_coach_all"    ON assigned_tests FOR ALL    USING (auth.uid() = coach_id);
CREATE POLICY "assigned_tests_athlete_read" ON assigned_tests FOR SELECT USING (auth.uid() = athlete_id);

-- ── coach_athlete_settings ────────────────────────────────────────────────────
ALTER TABLE coach_athlete_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_athlete_settings_coach_all"    ON coach_athlete_settings;
DROP POLICY IF EXISTS "coach_athlete_settings_athlete_read" ON coach_athlete_settings;
CREATE POLICY "coach_athlete_settings_coach_all"    ON coach_athlete_settings FOR ALL    USING (auth.uid() = coach_id);
CREATE POLICY "coach_athlete_settings_athlete_read" ON coach_athlete_settings FOR SELECT USING (auth.uid() = athlete_id);

-- ── tool_suggestions ──────────────────────────────────────────────────────────
ALTER TABLE tool_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_suggestions_coach_all"    ON tool_suggestions;
DROP POLICY IF EXISTS "tool_suggestions_athlete_read" ON tool_suggestions;
CREATE POLICY "tool_suggestions_coach_all"    ON tool_suggestions FOR ALL    USING (auth.uid() = coach_id);
CREATE POLICY "tool_suggestions_athlete_read" ON tool_suggestions FOR SELECT USING (auth.uid() = athlete_id);

-- ── tool_usage ────────────────────────────────────────────────────────────────
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_usage_own" ON tool_usage;
CREATE POLICY "tool_usage_own" ON tool_usage FOR ALL USING (auth.uid() = user_id);

-- ── survey_responses ──────────────────────────────────────────────────────────
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "survey_responses_own" ON survey_responses;
CREATE POLICY "survey_responses_own" ON survey_responses FOR ALL USING (auth.uid() = user_id);

-- ── voice_drafts ──────────────────────────────────────────────────────────────
ALTER TABLE voice_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "voice_drafts_own" ON voice_drafts;
CREATE POLICY "voice_drafts_own" ON voice_drafts FOR ALL USING (auth.uid() = user_id);

-- ── course_answers ────────────────────────────────────────────────────────────
ALTER TABLE course_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "course_answers_own"        ON course_answers;
DROP POLICY IF EXISTS "course_answers_coach_read" ON course_answers;
CREATE POLICY "course_answers_own" ON course_answers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "course_answers_coach_read" ON course_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = course_answers.user_id AND p.coach_id = auth.uid())
);

-- ── course_progress ───────────────────────────────────────────────────────────
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "course_progress_own"        ON course_progress;
DROP POLICY IF EXISTS "course_progress_coach_read" ON course_progress;
CREATE POLICY "course_progress_own" ON course_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "course_progress_coach_read" ON course_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = course_progress.user_id AND p.coach_id = auth.uid())
);

-- ── broadcasts ────────────────────────────────────────────────────────────────
-- Admin/coach create via service role; any authenticated user can read.
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "broadcasts_authenticated_read" ON broadcasts;
CREATE POLICY "broadcasts_authenticated_read" ON broadcasts FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── meet_attempts ─────────────────────────────────────────────────────────────
ALTER TABLE meet_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meet_attempts_own"        ON meet_attempts;
DROP POLICY IF EXISTS "meet_attempts_coach_read" ON meet_attempts;
CREATE POLICY "meet_attempts_own" ON meet_attempts FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "meet_attempts_coach_read" ON meet_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = meet_attempts.athlete_id AND p.coach_id = auth.uid())
);

-- ── prep_lifts ────────────────────────────────────────────────────────────────
ALTER TABLE prep_lifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prep_lifts_own"       ON prep_lifts;
DROP POLICY IF EXISTS "prep_lifts_coach_all" ON prep_lifts;
CREATE POLICY "prep_lifts_own" ON prep_lifts FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "prep_lifts_coach_all" ON prep_lifts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = prep_lifts.athlete_id AND p.coach_id = auth.uid())
);

-- ── meet_reflections ──────────────────────────────────────────────────────────
ALTER TABLE meet_reflections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "athlete own"  ON meet_reflections;
DROP POLICY IF EXISTS "coach read"   ON meet_reflections;
CREATE POLICY "meet_reflections_own" ON meet_reflections FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "meet_reflections_coach_read" ON meet_reflections FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = meet_reflections.athlete_id AND p.coach_id = auth.uid())
);

-- ── chat_messages ─────────────────────────────────────────────────────────────
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_messages_self" ON chat_messages;
CREATE POLICY "chat_messages_self" ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- ── conversation_summaries ────────────────────────────────────────────────────
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversation_summaries_self" ON conversation_summaries;
CREATE POLICY "conversation_summaries_self" ON conversation_summaries FOR ALL USING (auth.uid() = user_id);

-- ── chat_message_ratings ──────────────────────────────────────────────────────
ALTER TABLE chat_message_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_message_ratings_self" ON chat_message_ratings;
CREATE POLICY "chat_message_ratings_self" ON chat_message_ratings FOR ALL USING (auth.uid() = user_id);

-- ── ego_states ────────────────────────────────────────────────────────────────
ALTER TABLE ego_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users manage own ego states" ON ego_states;
CREATE POLICY "ego_states_own" ON ego_states FOR ALL USING (auth.uid() = user_id);

-- ── push_subscriptions ────────────────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "push_subscriptions_own" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- ── translation_overrides ─────────────────────────────────────────────────────
-- Public read (used for UI labels); only service role writes.
ALTER TABLE translation_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_overrides" ON translation_overrides;
CREATE POLICY "translation_overrides_public_read" ON translation_overrides FOR SELECT USING (true);

-- ── das_results ───────────────────────────────────────────────────────────────
ALTER TABLE das_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "das_results_own"        ON das_results;
DROP POLICY IF EXISTS "das_results_coach_read" ON das_results;
CREATE POLICY "das_results_own" ON das_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "das_results_coach_read" ON das_results FOR SELECT USING (
  user_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = das_results.user_id AND p.coach_id = auth.uid())
);
