/**
 * GET    /api/scripts          → returns user's saved scripts, newest first
 * POST   /api/scripts          → body: { title, content } → saves script
 * DELETE /api/scripts?id=...   → deletes a script by id
 *
 * SQL (run manually in Supabase SQL editor):
 *
 * CREATE TABLE IF NOT EXISTS athlete_scripts (
 *   id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 *   title      text NOT NULL,
 *   content    text NOT NULL,
 *   created_at timestamptz NOT NULL DEFAULT now()
 * );
 * CREATE INDEX IF NOT EXISTS athlete_scripts_user ON athlete_scripts (user_id, created_at DESC);
 * ALTER TABLE athlete_scripts ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role only" ON athlete_scripts USING (true) WITH CHECK (true);
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbDelete } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type AthleteScript = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
};

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scripts = await dbSelect<AthleteScript>("athlete_scripts", {
    user_id: `eq.${user.id}`,
    select: "id,title,content,created_at",
    order: "created_at.desc",
  });

  return NextResponse.json(scripts);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title: string; content: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, content } = body;
  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const row = await dbInsert<{ user_id: string; title: string; content: string }>(
    "athlete_scripts",
    { user_id: user.id, title, content }
  );

  if (!row) {
    return NextResponse.json({ error: "Failed to save script" }, { status: 500 });
  }

  return NextResponse.json(row, { status: 201 });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Match on both id and user_id to prevent cross-user deletion
  await dbDelete("athlete_scripts", { id, user_id: user.id });

  return new NextResponse(null, { status: 204 });
}
