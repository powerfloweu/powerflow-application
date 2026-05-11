/**
 * Thin Resend wrapper used across the app.
 *
 * Required env vars:
 *   RESEND_API_KEY   — your Resend API key
 *   RESEND_FROM      — verified sender address, e.g. "PowerFlow <noreply@power-flow.eu>"
 *                      Falls back to the Resend sandbox address for local dev.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM    = process.env.RESEND_FROM ?? "PowerFlow <onboarding@resend.dev>";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text fallback (auto-stripped from html if omitted) */
  text?: string;
}

/**
 * Sends a transactional email via Resend.
 * Returns true on success, false on any error (never throws).
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email:", payload.subject);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    RESEND_FROM,
        to:      Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html:    payload.html,
        text:    payload.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend error", res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] sendEmail threw:", err);
    return false;
  }
}
