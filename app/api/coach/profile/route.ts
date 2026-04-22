/**
 * GET /api/coach/profile
 * Returns the authenticated coach's profile including their invite code.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  coach_code: string | null;
  created_at: string;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: "id,display_name,avatar_url,role,coach_code,created_at",
  });

  if (!rows.length) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json(rows[0]);
}
