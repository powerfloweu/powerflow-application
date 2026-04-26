/**
 * Chat messages API
 * GET    /api/chat/messages?limit=50  — last N messages for user, oldest first
 * POST   /api/chat/messages           — body: { role, content } → inserts row
 * DELETE /api/chat/messages           — deletes all messages for the user
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbDelete } from "@/lib/supabaseAdmin";

type ChatMessageRow = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitParam = req.nextUrl.searchParams.get("limit") ?? "50";
  const limit = Math.min(Math.max(1, parseInt(limitParam, 10) || 50), 200);

  // Fetch last N messages, ordered newest first, then reverse for display
  const rows = await dbSelect<ChatMessageRow>("chat_messages", {
    user_id: `eq.${user.id}`,
    order: "created_at.desc",
    limit: String(limit),
    select: "id,user_id,role,content,created_at",
  });

  // Return oldest first
  return NextResponse.json([...rows].reverse());
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { role: string; content: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { role, content } = body;
  if (!role || !content) {
    return NextResponse.json({ error: "Missing role or content" }, { status: 400 });
  }
  if (role !== "user" && role !== "assistant") {
    return NextResponse.json({ error: "role must be user or assistant" }, { status: 400 });
  }

  const row = await dbInsert("chat_messages", {
    user_id: user.id,
    role,
    content: String(content).slice(0, 16000),
  });

  if (!row) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  return NextResponse.json(row, { status: 201 });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE() {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbDelete("chat_messages", { user_id: user.id });
  return NextResponse.json({ ok: true });
}
