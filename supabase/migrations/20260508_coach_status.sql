-- Coach waiting-list gate
-- Adds coach_status (pending | approved) to profiles.
-- Existing coaches are grandfathered as approved.
-- New coach sign-ups land as 'pending' until manually approved.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coach_status text
  CHECK (coach_status IN ('pending', 'approved'));

-- Grandfather every existing coach as approved
UPDATE profiles
  SET coach_status = 'approved'
  WHERE role = 'coach' AND coach_status IS NULL;
