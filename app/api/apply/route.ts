import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL = "https://hook.eu1.make.com/afdi7p5rw9trr6242r4d52cllvzsmksm";
const REQUIRED_FIELDS = [
  "fullName",
  "email",
  "countryTimezone",
  "language",
  "mentalGoals",
  "expectations",
  "consentCase",
  "willingToPay",
];

export async function POST(req: NextRequest) {
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
