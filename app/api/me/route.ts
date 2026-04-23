/**
 * GET  /api/me — Returns the current user's profile.
 * PATCH /api/me — Updates meet_date and/or display_name.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  coach_code: string | null;
  meet_date: string | null;
};

export async function GET() {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: "id,display_name,avatar_url,role,coach_id,coach_code,meet_date",
  });

  if (!rows.length) {
    return NextResponse.json({
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? "User",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "athlete" as const,
      coach_id: null,
      coach_code: null,
      meet_date: null,
    });
  }

  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { meet_date?: string | null; display_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  if ("meet_date" in body) allowed.meet_date = body.meet_date ?? null;
  if ("display_name" in body && body.display_name?.trim()) {
    allowed.display_name = body.display_name.trim();
  }

  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await dbPatch("profiles", { id: user.id }, allowed);
  return NextResponse.json({ ok: true });
}
