-- Backfill access flags to match plan_tier for all existing profiles.
-- Going forward the admin tier selector sets both simultaneously;
-- this one-time update aligns the rows that were set before that logic existed.

UPDATE profiles
SET
  course_access = (plan_tier = 'pr'),
  test_access   = (plan_tier IN ('second', 'pr')),
  ai_access     = (plan_tier = 'pr')
WHERE role = 'athlete';
