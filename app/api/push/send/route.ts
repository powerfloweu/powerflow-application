/**
 * POST /api/push/send — admin-triggered push notification.
 * Body: {
 *   title: string,
 *   body: string,
 *   url?: string,
 *   userIds?: string[],   // omit to broadcast to all subscriptions
 *   role?: "athlete" | "coach",   // optional filter
 * }
 *
 * Expired subscriptions (404/410) are cleaned up automatically.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbDelete } from "@/lib/supabaseAdmin";
import { sendPush, type PushPayload, type PushSubscriptionRow } from "@/lib/push";

export const runtime = "nodejs";

type Body = PushPayload & {
  userIds?: string[];
  role?: "athlete" | "coach";
};

async function requireAdmin(): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (user?.email ?? "").toLowerCase().trim() === adminEmail;
}

export async function POST(req: Request) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json() as Body;
    if (!body.title || !body.body) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    // Resolve target user_ids
    let targetUserIds: string[] | null = body.userIds ?? null;
    if (!targetUserIds && body.role) {
      const profiles = await dbSelect<{ id: string }>("profiles", {
        select: "id",
        role: `eq.${body.role}`,
      });
      targetUserIds = profiles.map((p) => p.id);
    }

    // Fetch matching subscriptions
    const params: Record<string, string> = {
      select: "endpoint,p256dh,auth,user_id",
    };
    if (targetUserIds) {
      if (targetUserIds.length === 0) {
        return NextResponse.json({ sent: 0, failed: 0, expired: 0 });
      }
      params.user_id = `in.(${targetUserIds.join(",")})`;
    }

    type Row = PushSubscriptionRow & { user_id: string };
    const subs = await dbSelect<Row>("push_subscriptions", params);

    const payload: PushPayload = {
      title: body.title,
      body: body.body,
      url: body.url,
      tag: body.tag,
      icon: body.icon,
      badge: body.badge,
    };

    const results = await Promise.all(
      subs.map((s) => sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload)),
    );

    // Clean up expired subscriptions
    const expiredEndpoints = results.filter((r) => r.expired).map((r) => r.endpoint);
    await Promise.all(
      expiredEndpoints.map((endpoint) => dbDelete("push_subscriptions", { endpoint })),
    );

    return NextResponse.json({
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok && !r.expired).length,
      expired: expiredEndpoints.length,
      total: subs.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
