/**
 * GET  /api/me/tool-suggestions — Returns unseen tool suggestions for the current athlete.
 * PATCH /api/me/tool-suggestions — Marks a suggestion as seen. Body: { id: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SuggestionRow = {
  id: string;
  coach_id: string;
  athlete_id: string;
  tool_id: string;
  message: string | null;
  created_at: string;
  seen_at: string | null;
};

export async function GET() {
  if (!isConfigured) return NextResponse.json([], { status: 200 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await dbSelect<SuggestionRow>("tool_suggestions", {
    athlete_id: `eq.${user.id}`,
    seen_at:    "is.null",
    select:     "id,coach_id,tool_id,message,created_at",
    order:      "created_at.desc",
    limit:      "20",
  });

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ ok: false }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({})) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await dbPatch("tool_suggestions", { id, athlete_id: user.id }, { seen_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
