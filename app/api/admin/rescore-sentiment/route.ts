/**
 * POST /api/admin/rescore-sentiment
 *
 * Re-runs detectSentiment on every journal_entries row and patches rows
 * where the stored sentiment differs from the newly computed value.
 *
 * Security: requires the Supabase session email to match ADMIN_EMAIL env var.
 * Call once after updating the POSITIVE_SIGNALS / NEGATIVE_SIGNALS lists.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { detectSentiment } from "@/lib/journal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes for large datasets
export const maxDuration = 300;

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  // Fetch all journal entries (content + current sentiment)
  const fetchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/journal_entries?select=id,content,sentiment&order=created_at.asc`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
    }
  );

  if (!fetchRes.ok) {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }

  const entries: { id: string; content: string; sentiment: string }[] = await fetchRes.json();

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    const newSentiment = detectSentiment(entry.content);
    if (newSentiment === entry.sentiment) {
      skipped++;
      continue;
    }

    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/journal_entries?id=eq.${entry.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ sentiment: newSentiment }),
      }
    );

    if (patchRes.ok) {
      updated++;
    } else {
      errors.push(entry.id);
    }
  }

  return NextResponse.json({
    total: entries.length,
    updated,
    skipped,
    errors: errors.length,
  });
}
