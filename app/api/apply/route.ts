import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

// Make.com webhook that receives coaching applications. Must be set in env —
// the literal URL that used to live here as a fallback is in git history and
// must be treated as compromised: the operator needs to rotate the Make.com
// scenario (regenerate its webhook URL) and set the new one as
// APPLY_WEBHOOK_URL before this route will accept submissions again.
const WEBHOOK_URL = process.env.APPLY_WEBHOOK_URL ?? "";
const REQUIRED_FIELDS = [
  "fullName",
  "email",
  "countryTimezone",
  "language",
  "mentalGoals",
  "expectations",
  "consentCase",
];

export async function POST(req: NextRequest) {
  if (!WEBHOOK_URL) {
    console.error("[apply] APPLY_WEBHOOK_URL is not set — rejecting submission");
    return NextResponse.json({ error: "Applications are temporarily unavailable." }, { status: 503 });
  }

  // Public, unauthenticated route — rate limit by IP.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`apply:${ip}`, { limit: 5, windowSec: 300 });
  if (!rl.ok) return rateLimitResponse(rl);

  let data;
  try {
    data = await req.json();
  } catch (err) {
    console.error("Invalid JSON", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate required fields
  for (const field of REQUIRED_FIELDS) {
    if (!data[field] || typeof data[field] !== "string" || !data[field].trim()) {
      return NextResponse.json({ error: `Missing or invalid field: ${field}` }, { status: 400 });
    }
  }

  // Add submittedAt
  data.submittedAt = new Date().toISOString();

  // Forward to Make webhook
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let webhookRes;
  try {
    webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.error("Webhook fetch failed", err);
    return NextResponse.json({ error: "Submission failed. Please try again later." }, { status: 502 });
  }

  if (!webhookRes.ok) {
    const text = await webhookRes.text().catch(() => "");
    console.error(`Webhook error ${webhookRes.status}: ${text}`);
    return NextResponse.json({ error: `Submission failed (${webhookRes.status}).` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
