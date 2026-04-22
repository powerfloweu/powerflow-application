import { NextRequest, NextResponse } from "next/server";
import { dbSelect } from "@/lib/supabaseAdmin";

type ProfileRow = { id: string; display_name: string; coach_code: string };

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ valid: false }, { status: 400 });

  const rows = await dbSelect<ProfileRow>("profiles", {
    coach_code: `eq.${code.toUpperCase()}`,
    role: "eq.coach",
    select: "id,display_name,coach_code",
  });

  if (!rows.length) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, coachName: rows[0].display_name });
}
