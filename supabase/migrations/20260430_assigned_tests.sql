-- ── assigned_tests ────────────────────────────────────────────────────────────
-- Coach can push a test to one of their athletes.
-- When the athlete completes it, completed_at is set.
-- UNIQUE (coach_id, athlete_id, test_slug) — one pending assignment per test.
-- Deleting the row withdraws the assignment.

create table if not exists assigned_tests (
  id           uuid        primary key default gen_random_uuid(),
  coach_id     uuid        not null references profiles(id) on delete cascade,
  athlete_id   uuid        not null references profiles(id) on delete cascade,
  test_slug    text        not null check (test_slug in ('sat', 'acsi', 'csai', 'das')),
  assigned_at  timestamptz not null default now(),
  completed_at timestamptz,
  unique (coach_id, athlete_id, test_slug)
);

create index if not exists assigned_tests_athlete_idx on assigned_tests(athlete_id);
create index if not exists assigned_tests_coach_idx   on assigned_tests(coach_id);
