/**
 * GET /api/push/checkin-reminder
 *
 * Vercel Cron job — runs daily at 17:00 UTC (19:00 CEST / 18:00 CET).
 * Sends a web-push check-in reminder to every user with an active push
 * subscription.  Expired subscriptions (410/404) are cleaned up automatically.
 *
 * Protected by the CRON_SECRET env var.  Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` on each scheduled invocation.
 * The same header can be added manually for ad-hoc testing.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbSelect, dbDelete } from "@/lib/supabaseAdmin";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  type Row = PushSubscriptionRow & { user_id: string };
  const subs = await dbSelect<Row>("push_subscriptions", {
    select: "endpoint,p256dh,auth,user_id",
    limit: "10000",
  }).catch(() => [] as Row[]);

  if (subs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, expired: 0, total: 0 });
  }

  const results = await Promise.all(
    subs.map((s) =>
      sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, {
        title: "PowerFlow · Daily check-in",
        body: "Time to log your training or rest day 💪",
        url: "/today",
        tag: "daily-checkin",
      }),
    ),
  );

  // Remove expired subscriptions so the table stays clean
  const expired = results.filter((r) => r.expired).map((r) => r.endpoint);
  await Promise.all(
    expired.map((endpoint) => dbDelete("push_subscriptions", { endpoint })),
  );

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok && !r.expired).length,
    expired: expired.length,
    total: subs.length,
  });
}
