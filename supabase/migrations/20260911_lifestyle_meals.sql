-- Lifestyle meals — full food log entries with AI/barcode/text source.
-- Each meal has an items JSONB array (individual foods with macros) and
-- aggregated macro totals. The existing lifestyle_body_log.meal_ids column
-- continues to work; it can reference these rows by id.

create table if not exists lifestyle_meals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  meal_date    date not null,
  description  text not null default '',
  items        jsonb not null default '[]'::jsonb,
  kcal         integer not null default 0,
  protein      real not null default 0,
  carbs        real not null default 0,
  fat          real not null default 0,
  source       text not null default 'text',  -- 'photo', 'photo+text', 'text', 'barcode'
  created_at   timestamptz not null default now()
);

create index if not exists idx_lifestyle_meals_user_date
  on lifestyle_meals(user_id, meal_date desc);

-- RLS: owner-only access (service role for API routes).
alter table lifestyle_meals enable row level security;

create policy "Owner can read own meals"
  on lifestyle_meals for select
  using (auth.uid() = user_id);

create policy "Owner can insert own meals"
  on lifestyle_meals for insert
  with check (auth.uid() = user_id);

create policy "Owner can delete own meals"
  on lifestyle_meals for delete
  using (auth.uid() = user_id);

-- Add nutrition config to lifestyle_config (height, birth year, goals, hand
-- measurements for AI portion estimation, plate size, activity level).
-- Kept as a single JSONB column so the schema doesn't need a migration for
-- every new field.
alter table lifestyle_config
  add column if not exists nutrition_config jsonb not null default '{}'::jsonb;
