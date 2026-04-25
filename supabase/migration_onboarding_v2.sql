-- Migration: onboarding_v2
-- Adds all fields from the PowerFlow application form to the profiles table.
-- Run this ONCE against your Supabase project via the SQL editor.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instagram              TEXT,
  ADD COLUMN IF NOT EXISTS years_powerlifting     TEXT,
  ADD COLUMN IF NOT EXISTS federation             TEXT,
  ADD COLUMN IF NOT EXISTS main_barrier           TEXT,
  ADD COLUMN IF NOT EXISTS confidence_break       TEXT,
  ADD COLUMN IF NOT EXISTS overthinking_focus     TEXT,
  ADD COLUMN IF NOT EXISTS previous_mental_work   TEXT,
  ADD COLUMN IF NOT EXISTS self_confidence_reg    SMALLINT CHECK (self_confidence_reg    BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS self_focus_fatigue     SMALLINT CHECK (self_focus_fatigue     BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS self_handling_pressure SMALLINT CHECK (self_handling_pressure BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS self_competition_anxiety SMALLINT CHECK (self_competition_anxiety BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS self_emotional_recovery  SMALLINT CHECK (self_emotional_recovery  BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS expectations           TEXT,
  ADD COLUMN IF NOT EXISTS previous_tools         TEXT,
  ADD COLUMN IF NOT EXISTS anything_else          TEXT;
