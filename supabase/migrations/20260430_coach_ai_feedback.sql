-- ── coach_ai_feedback ─────────────────────────────────────────────────────────
-- Stores daily quick-check ratings for Coach AI quality.
-- One row per user per day (unique constraint on user_id + rated_on).

create table if not exists coach_ai_feedback (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references profiles(id) on delete cascade,
  rated_on        date        not null default current_date,
  length_rating   text        check (length_rating in ('shorter', 'perfect', 'more_detail')),
  style_rating    text        check (style_rating in ('direct', 'good', 'warmer')),
  helpfulness     smallint    check (helpfulness between 1 and 5),
  note            text,
  created_at      timestamptz not null default now(),
  unique (user_id, rated_on)
);

create index if not exists coach_ai_feedback_user_idx on coach_ai_feedback(user_id);
