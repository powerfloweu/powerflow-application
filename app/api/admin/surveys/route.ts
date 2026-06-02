/**
 * GET /api/admin/surveys
 * Returns all survey responses with basic user info, sorted newest first.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type ResponseRow = {
  id: string;
  user_id: string;
  round: number;
  role: string;
  answers: Record<string, unknown>;
  submitted_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export async function GET(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const responses = await dbSelect<ResponseRow>("survey_responses", {
    select: "id,user_id,round,role,answers,submitted_at",
    order:  "submitted_at.desc",
    limit:  "500",
  });

  if (responses.length === 0) return NextResponse.json({ responses: [], profiles: {} });

  // Fetch matching profiles for display names
  const userIds = [...new Set(responses.map((r) => r.user_id))];
  const profiles = await dbSelect<ProfileRow>("profiles", {
    select: "id,display_name,email",
    id:     `in.(${userIds.join(",")})`,
    limit:  "500",
  }).catch(() => [] as ProfileRow[]);

  const profileMap: Record<string, ProfileRow> = {};
  for (const p of profiles) profileMap[p.id] = p;

  return NextResponse.json({ responses, profiles: profileMap });
}
