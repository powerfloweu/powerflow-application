-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow — Phase 3 (Course) migration
--
-- Creates tables used by the 15-week mental performance course:
--   course_progress  — per-user per-week completion + notes
--   course_answers   — per-user per-question reflection (optionally mirrored to
--                      journal_entries via a journal_entry_id FK)
--
-- The week + question definitions themselves live in code (lib/course.ts) so
-- they can be edited without a DB migration. These tables only track USER state.
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── course_progress ──────────────────────────────────────────────────────────
create table if not exists course_progress (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  week_slug      text not null,
  completed      boolean not null default false,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  unique (user_id, week_slug)
);

alter table course_progress add column if not exists week_slug text;
alter table course_progress add column if not exists completed boolean not null default false;
alter table course_progress add column if not exists started_at timestamptz not null default now();
alter table course_progress add column if not exists completed_at timestamptz;

create index if not exists course_progress_user_idx on course_progress(user_id);

-- ── course_answers ───────────────────────────────────────────────────────────
create table if not exists course_answers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  week_slug           text not null,
  question_id         text not null,
  answer              text not null default '',
  journal_entry_id    uuid references journal_entries(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, week_slug, question_id)
);

alter table course_answers add column if not exists week_slug text;
alter table course_answers add column if not exists question_id text;
alter table course_answers add column if not exists answer text not null default '';
alter table course_answers add column if not exists journal_entry_id uuid references journal_entries(id) on delete set null;
alter table course_answers add column if not exists updated_at timestamptz not null default now();

create index if not exists course_answers_user_idx on course_answers(user_id);
create index if not exists course_answers_week_idx on course_answers(user_id, week_slug);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table course_progress enable row level security;
alter table course_answers  enable row level security;

-- course_progress: user can CRUD own rows; coaches can read athletes'.
drop policy if exists "course_progress_select_own"  on course_progress;
drop policy if exists "course_progress_insert_own"  on course_progress;
drop policy if exists "course_progress_update_own"  on course_progress;
drop policy if exists "course_progress_delete_own"  on course_progress;
drop policy if exists "course_progress_coach_read"  on course_progress;

create policy "course_progress_select_own" on course_progress
  for select using (auth.uid() = user_id);

create policy "course_progress_insert_own" on course_progress
  for insert with check (auth.uid() = user_id);

create policy "course_progress_update_own" on course_progress
  for update using (auth.uid() = user_id);

create policy "course_progress_delete_own" on course_progress
  for delete using (auth.uid() = user_id);

create policy "course_progress_coach_read" on course_progress
  for select using (
    exists (
      select 1 from profiles p
      where p.id = course_progress.user_id
        and p.coach_id = auth.uid()
    )
  );

-- course_answers: same pattern
drop policy if exists "course_answers_select_own"  on course_answers;
drop policy if exists "course_answers_insert_own"  on course_answers;
drop policy if exists "course_answers_update_own"  on course_answers;
drop policy if exists "course_answers_delete_own"  on course_answers;
drop policy if exists "course_answers_coach_read"  on course_answers;

create policy "course_answers_select_own" on course_answers
  for select using (auth.uid() = user_id);

create policy "course_answers_insert_own" on course_answers
  for insert with check (auth.uid() = user_id);

create policy "course_answers_update_own" on course_answers
  for update using (auth.uid() = user_id);

create policy "course_answers_delete_own" on course_answers
  for delete using (auth.uid() = user_id);

create policy "course_answers_coach_read" on course_answers
  for select using (
    exists (
      select 1 from profiles p
      where p.id = course_answers.user_id
        and p.coach_id = auth.uid()
    )
  );
