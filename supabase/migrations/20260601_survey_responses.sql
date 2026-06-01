-- In-app feedback surveys: shown at day 30, 60, and 90 for each user.

create table if not exists survey_responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  round       smallint not null check (round between 1 and 3),
  role        text not null,
  answers     jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  unique (user_id, round)
);

create index if not exists survey_responses_user_idx on survey_responses(user_id);

alter table survey_responses enable row level security;

create policy "users insert own survey response"
  on survey_responses for insert
  with check (auth.uid() = user_id);

create policy "users select own survey responses"
  on survey_responses for select
  using (auth.uid() = user_id);

-- Admins can read all responses (service role bypasses RLS)
