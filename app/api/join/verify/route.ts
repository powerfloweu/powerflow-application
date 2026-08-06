import { NextRequest, NextResponse } from "next/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

type ProfileRow = { id: string; display_name: string; coach_code: string };

export async function GET(request: NextRequest) {
  // IP-keyed rate limit — unauthenticated, and a hit leaks a coach's display
  // name, so the small coach-code space must not be sweepable.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`join-verify:${ip}`, { limit: 20, windowSec: 60 });
  if (!rl.ok) return rateLimitResponse(rl);

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
