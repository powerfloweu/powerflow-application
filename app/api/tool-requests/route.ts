/**
 * POST /api/tool-requests — submit a tool suggestion from a member.
 * GET  /api/tool-requests — list the current user's own requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbInsert, dbSelect } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { text?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const text = (body.text ?? "").trim();
  if (!text)         return NextResponse.json({ error: "Text is required" }, { status: 400 });
  if (text.length > 500) return NextResponse.json({ error: "Max 500 characters" }, { status: 400 });

  await dbInsert("tool_requests", { user_id: user.id, text });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<{ id: string; text: string; created_at: string }>(
    "tool_requests",
    { user_id: `eq.${user.id}`, select: "id,text,created_at", order: "created_at.desc" },
  );

  return NextResponse.json(rows);
}
