/**
 * GET /api/chat/summaries?limit=5
 * Returns recent conversation summaries for the authenticated user.
 * Used server-side in /api/chat to inject memory into the system prompt.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

type SummaryRow = {
  id: string;
  summary: string;
  techniques_used: string[];
  themes: string[];
  resonated: string | null;
  session_date: string;
  message_count: number;
  created_at: string;
};

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json([]);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitParam = req.nextUrl.searchParams.get("limit") ?? "5";
  const limit = Math.min(parseInt(limitParam, 10) || 5, 10);

  const rows = await dbSelect<SummaryRow>("conversation_summaries", {
    user_id: `eq.${user.id}`,
    select: "id,summary,techniques_used,themes,resonated,session_date,message_count,created_at",
    order: "session_date.desc",
    limit: String(limit),
  });

  return NextResponse.json(rows);
}
