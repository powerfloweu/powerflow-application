/**
 * GET /api/push/coach-ai-nudge
 *
 * Vercel Cron — runs daily at 10:00 UTC.
 * Finds PR-tier athletes who:
 *   1. Registered 7+ days ago
 *   2. Have never sent a Coach AI message
 *   3. Have a push subscription
 *   4. Haven't been nudged yet (coach_ai_nudge_sent_at IS NULL)
 *
 * Sends a push notification and marks coach_ai_nudge_sent_at so it fires once only.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbSelect, dbDelete, dbPatch } from "@/lib/supabaseAdmin";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. PR-tier athletes registered 7+ days ago, not yet nudged
  const candidates = await dbSelect<{ id: string }>("profiles", {
    select: "id",
    role: "eq.athlete",
    plan_tier: "eq.pr",
    coach_ai_nudge_sent_at: "is.null",
    created_at: `lte.${sevenDaysAgo}`,
    limit: "1000",
  }).catch(() => [] as { id: string }[]);

  if (candidates.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, reason: "no candidates" });
  }

  // 2. Find which candidates have sent at least one chat message (user role)
  const chatUsers = await dbSelect<{ user_id: string }>("chat_messages", {
    select: "user_id",
    role: "eq.user",
    limit: "50000",
  }).catch(() => [] as { user_id: string }[]);
  const chatUserIds = new Set(chatUsers.map((r) => r.user_id));

  // Keep only those who have NEVER used Coach AI
  const neverUsedAI = candidates.filter((c) => !chatUserIds.has(c.id));

  if (neverUsedAI.length === 0) {
    return NextResponse.json({ sent: 0, skipped: candidates.length, reason: "all have used AI" });
  }

  // 3. Load all push subscriptions, index by user_id
  type SubRow = PushSubscriptionRow & { user_id: string };
  const allSubs = await dbSelect<SubRow>("push_subscriptions", {
    select: "endpoint,p256dh,auth,user_id",
    limit: "10000",
  }).catch(() => [] as SubRow[]);

  const subsByUser = new Map<string, SubRow[]>();
  for (const sub of allSubs) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  // 4. Send push + mark as nudged for those with subscriptions
  let sent = 0;
  let skipped = 0;
  const expiredEndpoints: string[] = [];

  await Promise.all(
    neverUsedAI.map(async (candidate) => {
      const subs = subsByUser.get(candidate.id);
      if (!subs?.length) { skipped++; return; }

      const results = await Promise.all(
        subs.map((s) =>
          sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, {
            title: "PowerFlow · Meet your AI coach",
            body: "You're on the PR plan — your personal AI mental coach is ready. Tap to start.",
            url: "/chat",
            tag: "coach-ai-nudge",
          }),
        ),
      );

      const anyOk = results.some((r) => r.ok);
      results.filter((r) => r.expired).forEach((r) => expiredEndpoints.push(r.endpoint));

      if (anyOk) {
        sent++;
        // Mark as nudged so this never fires again for this user
        await dbPatch("profiles", { id: candidate.id }, {
          coach_ai_nudge_sent_at: new Date().toISOString(),
        });
      } else {
        skipped++;
      }
    }),
  );

  // Clean up expired subscriptions
  await Promise.all(
    expiredEndpoints.map((endpoint) => dbDelete("push_subscriptions", { endpoint })),
  );

  return NextResponse.json({
    sent,
    skipped,
    expired: expiredEndpoints.length,
    candidates: candidates.length,
    never_used_ai: neverUsedAI.length,
  });
}
