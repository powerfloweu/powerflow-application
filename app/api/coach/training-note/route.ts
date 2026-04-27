/**
 * POST /api/coach/training-note
 *   body: { training_entry_id, athlete_id, content }
 *   → sets coach_note on the training entry (upsert-style PATCH)
 *
 * Only callable by authenticated coaches.
 * Filters by both training_entry_id AND athlete_id (user_id) to prevent
 * coaches from writing notes on entries that don't belong to their athletes.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify coach role
  const profiles = await dbSelect<{ id: string; role: string }>("profiles", {
    id: `eq.${user.id}`,
    role: "eq.coach",
    select: "id,role",
  });
  if (!profiles.length) return NextResponse.json({ error: "Not a coach" }, { status: 403 });

  let body: { training_entry_id: string; athlete_id: string; content: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.training_entry_id || !body.athlete_id || !body.content?.trim()) {
    return NextResponse.json(
      { error: "training_entry_id, athlete_id, and content are required" },
      { status: 400 },
    );
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_entries?id=eq.${body.training_entry_id}&user_id=eq.${body.athlete_id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ coach_note: body.content.trim() }),
    },
  );

  if (!res.ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, content: body.content.trim() });
}
