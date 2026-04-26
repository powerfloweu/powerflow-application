/**
 * Journal entries API
 * GET  /api/journal/entries        — list current user's entries
 * POST /api/journal/entries        — create a new entry
 * DELETE /api/journal/entries?id=  — delete an entry
 *
 * Auth: verified via Supabase session cookie (service-role bypass for RLS checks).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbInsert, dbSelect, dbDelete } from "@/lib/supabaseAdmin";

type EntryRow = {
  id: string;
  user_id: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  context: string;
  themes: string[];
  voice_id: string | null;
  created_at: string;
};

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json([], { status: 200 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<EntryRow>("journal_entries", {
    user_id: `eq.${user.id}`,
    order: "created_at.desc",
    limit: "500",
    select: "id,user_id,content,sentiment,context,themes,voice_id,created_at",
  });

  return NextResponse.json(rows);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { content, sentiment, context, themes } = body;

  if (!content || !sentiment) {
    return NextResponse.json({ error: "Missing content or sentiment" }, { status: 400 });
  }

  const row = await dbInsert("journal_entries", {
    user_id: user.id,
    content: String(content).slice(0, 4000),
    sentiment,
    context: context ?? "general",
    themes: themes ?? [],
  });

  if (!row) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  return NextResponse.json(row, { status: 201 });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Fetch the entry to verify ownership before deleting
  const rows = await dbSelect<EntryRow>("journal_entries", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: "id",
  });

  if (!rows.length) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });
  }

  await dbDelete("journal_entries", { id });
  return NextResponse.json({ ok: true });
}
