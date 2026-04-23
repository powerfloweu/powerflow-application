-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow — Course schema v2
--
-- Drops the phase-3-v1 tables (week_slug text) and replaces them with the
-- proper schema: week_num int, granular step tracking, audio answer support.
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Drop v1 ──────────────────────────────────────────────────────────────────
drop table if exists course_answers  cascade;
drop table if exists course_progress cascade;

-- ── course_progress ──────────────────────────────────────────────────────────
create table public.course_progress (
  user_id          uuid        not null references auth.users(id) on delete cascade,
  week_num         int         not null check (week_num between 1 and 16),
  video_done_at    timestamptz,
  exercise_done_at timestamptz,
  quiz_done_at     timestamptz,
  completed_at     timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (user_id, week_num)
);

create index if not exists course_progress_user_idx on course_progress(user_id);

-- ── course_answers ───────────────────────────────────────────────────────────
create table public.course_answers (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  week_num         int         not null check (week_num between 1 and 16),
  question_id      text        not null,
  text             text,
  audio_url        text,
  audio_duration_s int,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, week_num, question_id)
);

create index if not exists course_answers_user_idx on course_answers(user_id);
create index if not exists course_answers_week_idx on course_answers(user_id, week_num);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table course_progress enable row level security;
alter table course_answers  enable row level security;

-- progress: athlete owns, coach reads
drop policy if exists "own progress"          on course_progress;
drop policy if exists "coach reads progress"  on course_progress;

create policy "own progress" on course_progress
  for all using (auth.uid() = user_id);

create policy "coach reads progress" on course_progress
  for select using (
    exists (
      select 1 from profiles p
      where p.id = course_progress.user_id and p.coach_id = auth.uid()
    )
  );

-- answers: athlete owns, coach reads
drop policy if exists "own answers"          on course_answers;
drop policy if exists "coach reads answers"  on course_answers;

create policy "own answers" on course_answers
  for all using (auth.uid() = user_id);

create policy "coach reads answers" on course_answers
  for select using (
    exists (
      select 1 from profiles p
      where p.id = course_answers.user_id and p.coach_id = auth.uid()
    )
  );
