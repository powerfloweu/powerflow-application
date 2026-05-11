/**
 * POST /api/push/subscribe — upsert a PushSubscription for the current user.
 * Body: { endpoint, keys: { p256dh, auth } }
 *
 * Uses the service role to upsert by endpoint (so re-subscribing on the same
 * device doesn't create duplicates).
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(req: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json() as Body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "missing endpoint/keys" }, { status: 400 });
  }

  const SUPABASE_URL =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "service role not configured" }, { status: 500 });
  }

  const userAgent = req.headers.get("user-agent") ?? null;

  // Upsert on endpoint (unique).
  const res = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
      last_seen_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `upsert failed: ${res.status} ${text}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
