-- Tool suggestions: coaches can recommend specific library tools to their athletes.

create table if not exists tool_suggestions (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  athlete_id  uuid not null references auth.users(id) on delete cascade,
  tool_id     text not null,
  message     text,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz
);

create index if not exists tool_suggestions_athlete_idx on tool_suggestions(athlete_id, seen_at);
create index if not exists tool_suggestions_coach_idx   on tool_suggestions(coach_id);

alter table tool_suggestions enable row level security;

-- Coaches can send suggestions
create policy "coaches insert tool suggestions"
  on tool_suggestions for insert
  with check (auth.uid() = coach_id);

-- Athletes can view suggestions addressed to them
create policy "athletes select own suggestions"
  on tool_suggestions for select
  using (auth.uid() = athlete_id);

-- Coaches can view suggestions they sent
create policy "coaches select sent suggestions"
  on tool_suggestions for select
  using (auth.uid() = coach_id);

-- Athletes can mark suggestions as seen
create policy "athletes update seen_at"
  on tool_suggestions for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);
