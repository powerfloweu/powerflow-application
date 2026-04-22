/**
 * GET /api/me
 * Returns the current user's profile (or 401 if unauthenticated).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  coach_code: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: "id,display_name,avatar_url,role,coach_id,coach_code",
  });

  if (!rows.length) {
    // Profile might not exist yet (first-time edge case) — return minimal info
    return NextResponse.json({
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? "User",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "athlete" as const,
      coach_id: null,
      coach_code: null,
    });
  }

  return NextResponse.json(rows[0]);
}
