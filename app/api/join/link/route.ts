import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import { syncCoachQuantity } from "@/lib/coachBilling";

type ProfileRow = { id: string; coach_code: string };

export async function POST(request: NextRequest) {
  // Resolve the caller's identity server-side — never trust the body's userId.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const body = await request.json();
  const { code } = body;
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Find coach by code
  const coaches = await dbSelect<ProfileRow>("profiles", {
    coach_code: `eq.${String(code).toUpperCase()}`,
    role: "eq.coach",
    select: "id,coach_code",
  });

  if (!coaches.length) {
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  }

  const coachId = coaches[0].id;

  // Check if athlete profile exists
  const existing = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${userId}`,
    select: "id",
  });

  if (existing.length > 0) {
    // Update coach_id on existing profile
    const ok = await dbPatch("profiles", { id: userId }, { coach_id: coachId });
    if (!ok) return NextResponse.json({ error: "Linking failed" }, { status: 500 });
  } else {
    // Create athlete profile linked to coach
    const inserted = await dbInsert("profiles", {
      id: userId,
      role: "athlete",
      coach_id: coachId,
    });
    if (!inserted) return NextResponse.json({ error: "Linking failed" }, { status: 500 });
  }

  // Sync coach subscription quantity (fire-and-forget)
  syncCoachQuantity(coachId).catch(() => {});

  return NextResponse.json({ ok: true });
}
