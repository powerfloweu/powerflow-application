/**
 * Server-side helpers for Web Push.
 *
 * Lazy-imports `web-push` and configures it from VAPID env vars on first use.
 * Send failures with 404/410 are treated as "expired subscription" and the
 * caller is expected to delete those rows from push_subscriptions.
 */

import webpush from "web-push";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@power-flow.eu";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

export type SendResult = {
  endpoint: string;
  ok: boolean;
  expired: boolean;
  status?: number;
  error?: string;
};

export async function sendPush(
  sub: PushSubscriptionRow,
  payload: PushPayload,
): Promise<SendResult> {
  configure();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
    );
    return { endpoint: sub.endpoint, ok: true, expired: false };
  } catch (e) {
    const err = e as { statusCode?: number; body?: string; message?: string };
    const status = err.statusCode;
    const expired = status === 404 || status === 410;
    return {
      endpoint: sub.endpoint,
      ok: false,
      expired,
      status,
      error: err.body || err.message || String(e),
    };
  }
}
