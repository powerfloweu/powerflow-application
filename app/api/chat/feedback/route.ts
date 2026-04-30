/**
 * POST /api/chat/feedback — Save a daily Coach AI quality rating.
 * Upserts so re-submitting the same day updates rather than errors.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type FeedbackBody = {
  length_rating?: "shorter" | "perfect" | "more_detail";
  style_rating?:  "direct"  | "good"    | "warmer";
  helpfulness?:   number;
  note?:          string;
};

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ ok: false }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: FeedbackBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { length_rating, style_rating, helpfulness, note } = body;

  // Upsert (on_conflict: user_id, rated_on) — update if already rated today
  const res = await fetch(`${SUPABASE_URL}/rest/v1/coach_ai_feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: user.id,
      length_rating: length_rating ?? null,
      style_rating:  style_rating  ?? null,
      helpfulness:   helpfulness   ?? null,
      note:          note?.trim()  || null,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[chat/feedback] upsert failed", res.status, txt);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** GET /api/chat/feedback?date=YYYY-MM-DD — did the user already rate today? */
export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ rated: false });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ rated: false });

  const date = new URL(req.url).searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const rows = await dbSelect<{ id: string }>("coach_ai_feedback", {
    user_id:  `eq.${user.id}`,
    rated_on: `eq.${date}`,
    select:   "id",
  });

  return NextResponse.json({ rated: rows.length > 0 });
}
