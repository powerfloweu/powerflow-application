/**
 * GET /api/reflections
 *   List the reflection sets this athlete has been sent (status "sent" or
 *   "archived" — drafts are never visible to the athlete). Newest first.
 *   Response: ReflectionSetRow[]
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import type { ReflectionSetRow } from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SET_SELECT = "id,coach_id,athlete_id,title,intro,questions,status,created_at,updated_at,sent_at";

export async function GET() {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await dbSelect<ReflectionSetRow>("reflection_sets", {
    select: SET_SELECT,
    athlete_id: `eq.${user.id}`,
    status: "in.(sent,archived)",
    order: "sent_at.desc",
  });

  return NextResponse.json(rows);
}
