-- ============================================================
-- PowerFlow — Full Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
--
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS throughout.
-- ============================================================

-- ── 1. profiles ──────────────────────────────────────────────

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('athlete', 'coach')) default 'athlete',
  display_name text,
  avatar_url   text,
  coach_code   text unique,          -- coaches only; 8-char invite code
  coach_id     uuid references profiles(id),  -- athletes only; their linked coach
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

create index if not exists journal_entries_user_id_idx    on journal_entries(user_id);
create index if not exists journal_entries_created_at_idx on journal_entries(created_at desc);

-- ── 3. sat_results ────────────────────────────────────────────
--   Self-Awareness Test (ÖIT) — 165 yes/no items, 11 factors

create table if not exists sat_results (
  id                         uuid primary key default gen_random_uuid(),
  result_ref                 text unique,
  first_name                 text,
  email                      text,
  gender                     text check (gender in ('male', 'female')),
  lang                       text,
  started_at                 timestamptz,
  submitted_at               timestamptz default now(),
  -- Factor scores (0–15 each)
  score_performance          smallint,
  score_affiliation          smallint,
  score_aggression           smallint,
  score_defensiveness        smallint,
  score_consciousness        smallint,
  score_dominance            smallint,
  score_exhibition           smallint,
  score_autonomy             smallint,
  score_caregiving           smallint,
  score_order                smallint,
  score_helplessness         smallint,
  -- Subfactor scores
  sf_self_confirmation       smallint,
  sf_rational_dominance      smallint,
  sf_aggressive_nonconformity smallint,
  sf_passive_dependence      smallint,
  sf_sociability             smallint,
  sf_agreeableness           smallint,
  -- Validity
  sum_yes                    smallint,   -- total "yes" answers (0–165)
  total_score                smallint,   -- same value, used for coach display
  validity_reliable          boolean,
  paid                       boolean default false,
  user_id                    uuid references profiles(id)
);

-- For tables that already existed without user_id, add it safely
alter table sat_results add column if not exists user_id uuid references profiles(id);

-- ── 4. acsi_results ───────────────────────────────────────────
--   Athletic Coping Skills Inventory — 28 items, 7 subscales

create table if not exists acsi_results (
  id                uuid primary key default gen_random_uuid(),
  result_ref        text unique,
  first_name        text,
  email             text,
  gender            text check (gender in ('male', 'female')),
  lang              text,
  submitted_at      timestamptz default now(),
  paid              boolean default false,
  -- Subscale scores (each 0–28)
  score_coping      smallint,
  score_peaking     smallint,
  score_goal_setting smallint,
  score_concentration smallint,
  score_freedom     smallint,
  score_confidence  smallint,
  score_coachability smallint,
  total_score       smallint,
  user_id           uuid references profiles(id)
);

alter table acsi_results add column if not exists user_id uuid references profiles(id);

-- ── 5. csai_results ───────────────────────────────────────────
--   Competitive State Anxiety Inventory-2 — 27 items, 3 subscales

create table if not exists csai_results (
  id               uuid primary key default gen_random_uuid(),
  result_ref       text unique,
  first_name       text,
  email            text,
  gender           text check (gender in ('male', 'female')),
  lang             text,
  submitted_at     timestamptz default now(),
  paid             boolean default false,
  -- Subscale scores (each 9–36)
  score_cognitive  smallint,
  score_somatic    smallint,
  score_confidence smallint,
  user_id          uuid references profiles(id)
);

alter table csai_results add column if not exists user_id uuid references profiles(id);

-- ── 6. das_results ────────────────────────────────────────────
--   Dysfunctional Attitude Scale — 40 items

create table if not exists das_results (
  id                      uuid primary key default gen_random_uuid(),
  result_ref              text unique,
  first_name              text,
  email                   text,
  lang                    text,
  submitted_at            timestamptz default now(),
  paid                    boolean default false,
  -- Subscale scores
  score_external_approval smallint,
  score_lovability        smallint,
  score_achievement       smallint,
  score_perfectionism     smallint,
  score_entitlement       smallint,
  score_omnipotence       smallint,
  score_external_control  smallint,
  total_score             integer,
  depression_prone        boolean,
  user_id                 uuid references profiles(id)
);

alter table das_results add column if not exists user_id uuid references profiles(id);

-- ── 7. Indexes ────────────────────────────────────────────────

create index if not exists sat_results_user_id_idx   on sat_results(user_id);
create index if not exists sat_results_ref_idx        on sat_results(result_ref);
create index if not exists acsi_results_user_id_idx  on acsi_results(user_id);
create index if not exists acsi_results_ref_idx       on acsi_results(result_ref);
create index if not exists csai_results_user_id_idx  on csai_results(user_id);
create index if not exists csai_results_ref_idx       on csai_results(result_ref);
create index if not exists das_results_user_id_idx   on das_results(user_id);
create index if not exists das_results_ref_idx        on das_results(result_ref);

-- ── 8. Row Level Security ─────────────────────────────────────

alter table profiles        enable row level security;
alter table journal_entries enable row level security;

-- Drop policies before recreating (safe re-run)
drop policy if exists "profiles: own row"              on profiles;
drop policy if exists "profiles: coach sees athletes"  on profiles;
drop policy if exists "journal: own entries"           on journal_entries;
drop policy if exists "journal: coach sees athlete entries" on journal_entries;

-- profiles: own row
create policy "profiles: own row"
  on profiles for all
  using (auth.uid() = id);

-- profiles: coach can see their athletes
create policy "profiles: coach sees athletes"
  on profiles for select
  using (
    auth.uid() = coach_id
    or auth.uid() = id
  );

-- journal_entries: own entries (read/write/delete)
create policy "journal: own entries"
  on journal_entries for all
  using (auth.uid() = user_id);

-- journal_entries: coach can read their athletes' entries
create policy "journal: coach sees athlete entries"
  on journal_entries for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = journal_entries.user_id
        and profiles.coach_id = auth.uid()
    )
  );

-- ── Done ─────────────────────────────────────────────────────
-- Next steps:
--   1. Authentication → Providers → Google → Enable
--   2. Add your Google OAuth Client ID + Secret
--   3. Authorized redirect URI in Google Console:
--      https://<your-project-ref>.supabase.co/auth/v1/callback
--   4. Vercel env vars:
--      NEXT_PUBLIC_SUPABASE_URL
--      NEXT_PUBLIC_SUPABASE_ANON_KEY
--      SUPABASE_SERVICE_ROLE_KEY
