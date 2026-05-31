/**
 * POST /api/tools/track
 * Fire-and-forget: records that the current user opened a tool in the library.
 * Body: { tool_id: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbInsert } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const tool_id = typeof body.tool_id === "string" ? body.tool_id.trim() : "";
  if (!tool_id) return NextResponse.json({ error: "tool_id required" }, { status: 400 });

  await dbInsert("tool_usage", { user_id: user.id, tool_id });
  return NextResponse.json({ ok: true });
}
