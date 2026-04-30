/**
 * GET /api/admin/conversations
 *   → list of all athletes with conversation stats + session summaries
 *
 * GET /api/admin/conversations?athlete_id=<uuid>
 *   → full message thread for that athlete
 *
 * Accessible to coaches and the admin email.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "trainer.pod@gmail.com";

type MessageRow = { id: string; user_id: string; role: string; content: string; created_at: string };
type ProfileRow = { id: string; display_name: string; role: string };
type SummaryRow = {
  id: string;
  user_id: string;
  summary: string;
  session_date: string;
  techniques_used: string[];
  themes: string[];
  resonated: string | null;
  message_count: number;
};

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify coach or admin — email lives in auth.users, not profiles
  const isAdmin = (user.email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const me = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: "id,role",
    limit: "1",
  });
  const myProfile = me[0];
  if (!myProfile || (!isAdmin && myProfile.role !== "coach")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const athleteId = req.nextUrl.searchParams.get("athlete_id");

  // ── Full thread for one athlete ────────────────────────────────────────────
  if (athleteId) {
    const messages = await dbSelect<MessageRow>("chat_messages", {
      user_id: `eq.${athleteId}`,
      select: "id,role,content,created_at",
      order: "created_at.asc",
    });
    return NextResponse.json(messages);
  }

  // ── Aggregate stats for all athletes ──────────────────────────────────────
  const [messages, summaries] = await Promise.all([
    dbSelect<MessageRow>("chat_messages", {
      select: "user_id,role,created_at",
      order: "created_at.desc",
    }),
    dbSelect<SummaryRow>("conversation_summaries", {
      select: "user_id,summary,session_date,techniques_used,themes,resonated,message_count",
      order: "session_date.desc",
    }),
  ]);

  if (!messages.length) return NextResponse.json([]);

  const userIds = [...new Set(messages.map((m) => m.user_id))];
  const idList = `(${userIds.map((id) => `"${id}"`).join(",")})`;

  const profiles = await dbSelect<ProfileRow>("profiles", {
    id: `in.${idList}`,
    select: "id,display_name,role",
  });
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // Group by user
  const byUser: Record<string, {
    userId: string;
    displayName: string;
    role: string;
    messageCount: number;
    sessionDates: Set<string>;
    lastMessageAt: string;
    summaries: SummaryRow[];
  }> = {};

  for (const msg of messages) {
    if (!byUser[msg.user_id]) {
      const p = profileById.get(msg.user_id);
      byUser[msg.user_id] = {
        userId: msg.user_id,
        displayName: p?.display_name ?? "Unknown",
        role: p?.role ?? "athlete",
        messageCount: 0,
        sessionDates: new Set(),
        lastMessageAt: msg.created_at,
        summaries: summaries.filter((s) => s.user_id === msg.user_id),
      };
    }
    byUser[msg.user_id].messageCount++;
    byUser[msg.user_id].sessionDates.add(msg.created_at.split("T")[0]);
  }

  const result = Object.values(byUser)
    .map((s) => ({
      userId: s.userId,
      displayName: s.displayName,
      role: s.role,
      messageCount: s.messageCount,
      sessionCount: s.sessionDates.size,
      lastMessageAt: s.lastMessageAt,
      summaries: s.summaries,
    }))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

  return NextResponse.json(result);
}
