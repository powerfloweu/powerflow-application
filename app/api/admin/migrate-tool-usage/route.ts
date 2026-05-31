import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

const SQL = `
create table if not exists tool_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tool_id    text not null,
  used_at    timestamptz not null default now()
);
create index if not exists tool_usage_user_id_idx on tool_usage(user_id);
create index if not exists tool_usage_tool_id_idx  on tool_usage(tool_id);
create index if not exists tool_usage_used_at_idx  on tool_usage(used_at desc);
alter table tool_usage enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tool_usage' and policyname = 'tool_usage: insert own rows'
  ) then
    create policy "tool_usage: insert own rows"
      on tool_usage for insert with check (auth.uid() = user_id);
  end if;
end $$;
alter table profiles
  add column if not exists coach_ai_nudge_sent_at timestamptz default null;
`;

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (!res.ok) {
    // Supabase doesn't expose exec_sql by default — fall back to pg_query via the
    // management API if available, or prompt the user to run the migration manually.
    const text = await res.text().catch(() => "");
    return NextResponse.json({
      note: "Auto-migration not available via REST. Run the SQL in your Supabase SQL editor:",
      sql: SQL,
      supabaseError: text,
    }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
