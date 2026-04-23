-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow — Profile v2 migration
--
-- Adds athlete performance tracking columns to the profiles table:
--   gender, bodyweight, weight_category (for GL calculation + meet)
--   squat / bench / deadlift current + goal (kg)
--   mental_goals (up to 3 text goals, stored as text[])
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

alter table profiles
  add column if not exists gender            text     check (gender in ('male', 'female')),
  add column if not exists bodyweight_kg     numeric(5, 2),
  add column if not exists weight_category   text,
  add column if not exists squat_current_kg  numeric(6, 2),
  add column if not exists squat_goal_kg     numeric(6, 2),
  add column if not exists bench_current_kg  numeric(6, 2),
  add column if not exists bench_goal_kg     numeric(6, 2),
  add column if not exists deadlift_current_kg numeric(6, 2),
  add column if not exists deadlift_goal_kg  numeric(6, 2),
  add column if not exists mental_goals      text[]   default '{}';
