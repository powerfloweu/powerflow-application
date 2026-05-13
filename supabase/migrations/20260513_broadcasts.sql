-- broadcasts table
-- Stores admin-composed announcements shown to users in-app and via push.

create table if not exists public.broadcasts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  target_role text not null default 'all',   -- 'all' | 'athlete' | 'coach'
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.broadcasts enable row level security;

-- Only service-role can write; authenticated users can read active ones
create policy "service role full access" on public.broadcasts
  using (true)
  with check (true);

-- Column on profiles to track the last broadcast each user has seen
alter table public.profiles
  add column if not exists last_seen_broadcast_id uuid references public.broadcasts(id);
