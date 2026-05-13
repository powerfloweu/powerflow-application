-- Coach billing: per-athlete monthly subscription tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_coach_sub_id TEXT;
