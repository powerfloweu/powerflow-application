/**
 * POST /api/chat/rate
 *   body: { message_id: string, rating: "good" | "bad" }
 *   → upserts a rating for an AI message (one per user per message)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { message_id: string; rating: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.message_id || !["good", "bad"].includes(body.rating)) {
    return NextResponse.json({ error: "message_id and rating (good|bad) required" }, { status: 400 });
  }

  // Upsert — UNIQUE(message_id, user_id) ensures one rating per message per user
  const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_message_ratings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      message_id: body.message_id,
      user_id: user.id,
      rating: body.rating,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
