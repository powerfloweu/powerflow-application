-- tool_usage: one row per time an athlete opens a tool in the library.
-- Lightweight event log — used to surface "most-used tools" in admin.
create table if not exists tool_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tool_id    text not null,
  used_at    timestamptz not null default now()
);

create index if not exists tool_usage_user_id_idx on tool_usage(user_id);
create index if not exists tool_usage_tool_id_idx  on tool_usage(tool_id);
create index if not exists tool_usage_used_at_idx  on tool_usage(used_at desc);

-- Row-level security: athletes can only insert their own rows; no reads needed
-- (admin queries via service role bypass RLS).
alter table tool_usage enable row level security;
create policy "tool_usage: insert own rows"
  on tool_usage for insert
  with check (auth.uid() = user_id);

-- coach_ai_nudge_sent_at: set once a "try Coach AI" push has been sent so the
-- cron never double-notifies.
alter table profiles
  add column if not exists coach_ai_nudge_sent_at timestamptz default null;
