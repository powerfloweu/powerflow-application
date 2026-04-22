-- ============================================================
-- PowerFlow — Auth & Journal Migration
-- Run this in your Supabase project: SQL Editor → Run
-- ============================================================

-- ── 1. profiles ──────────────────────────────────────────────

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('athlete', 'coach')) default 'athlete',
  display_name text,
  avatar_url   text,
  coach_code   text unique,                              -- coaches only; 8-char invite code
  coach_id     uuid references profiles(id),            -- athletes only; their linked coach
  created_at   timestamptz default now()
);

-- ── 2. journal_entries ────────────────────────────────────────

create table if not exists journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  sentiment  text not null check (sentiment in ('positive', 'neutral', 'negative')),
  context    text not null default 'general'
             check (context in ('pre-training','during-session','post-competition','rest-day','general')),
  themes     text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists journal_entries_user_id_idx   on journal_entries(user_id);
create index if not exists journal_entries_created_at_idx on journal_entries(created_at desc);

-- ── 3. Add user_id to existing test result tables ─────────────
--   (nullable so existing rows are unaffected)

alter table sat_results  add column if not exists user_id uuid references profiles(id);
alter table acsi_results add column if not exists user_id uuid references profiles(id);
alter table csai_results add column if not exists user_id uuid references profiles(id);
alter table das_results  add column if not exists user_id uuid references profiles(id);

create index if not exists sat_results_user_id_idx  on sat_results(user_id);
create index if not exists acsi_results_user_id_idx on acsi_results(user_id);
create index if not exists csai_results_user_id_idx on csai_results(user_id);
create index if not exists das_results_user_id_idx  on das_results(user_id);

-- ── 4. Row Level Security ─────────────────────────────────────

alter table profiles       enable row level security;
alter table journal_entries enable row level security;

-- profiles: users see their own row; coaches see their athletes
create policy "profiles: own row"
  on profiles for all
  using (auth.uid() = id);

create policy "profiles: coach sees athletes"
  on profiles for select
  using (
    auth.uid() = coach_id          -- athlete's coach can see this row
    or auth.uid() = id              -- own row (redundant but explicit)
  );

-- journal_entries: users see their own; coaches see athletes' entries
create policy "journal: own entries"
  on journal_entries for all
  using (auth.uid() = user_id);

create policy "journal: coach sees athlete entries"
  on journal_entries for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = journal_entries.user_id
        and profiles.coach_id = auth.uid()
    )
  );

-- ── 5. Enable Google OAuth in Supabase Dashboard ─────────────
--
--   Authentication → Providers → Google → Enable
--   Add your Google OAuth Client ID + Secret from:
--   https://console.cloud.google.com/apis/credentials
--
--   Authorized redirect URI to add in Google Console:
--   https://<your-project-ref>.supabase.co/auth/v1/callback
--
-- ── 6. Add env vars to Vercel ────────────────────────────────
--
--   NEXT_PUBLIC_SUPABASE_URL  = https://njpmnglhgteihslgslou.supabase.co
--   NEXT_PUBLIC_SUPABASE_ANON_KEY = <your anon key from Supabase → API settings>
--
--   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY already set)
--
-- ── Done ─────────────────────────────────────────────────────
