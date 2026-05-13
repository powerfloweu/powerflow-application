/**
 * GET /api/admin/migrate-stripe
 *
 * One-time migration: adds stripe_customer_id, stripe_subscription_id, and
 * stripe_price_id columns to the profiles table.
 *
 * Requires admin Supabase session + TOTP verification.
 * Run once, then this endpoint can safely be left in place (it's idempotent).
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const SQL = `
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id        TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
`;

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  // Use Supabase's rpc(exec_sql) via the management-style endpoint.
  // The service role key can call pg_catalog functions through PostgREST RPCs
  // only if they're defined in the public schema. Instead we use the Supabase
  // management API which accepts raw SQL via the project's DB URL.
  // Since we can't always reach the management API without a user access token,
  // we fall back to attempting a SELECT that would fail if columns are missing.

  // First: check if columns already exist
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?limit=1&select=id,stripe_customer_id`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );

  if (checkRes.ok) {
    return NextResponse.json({
      ok: true,
      message: "Stripe columns already exist — migration not needed.",
    });
  }

  // Columns are missing: try to apply via Supabase management REST API
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const mgmtToken = process.env.SUPABASE_ACCESS_TOKEN ?? "";

  if (!mgmtToken) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Columns are missing. Set SUPABASE_ACCESS_TOKEN env var (from supabase.com/dashboard → account → access tokens), then call this endpoint again. Or run the SQL manually in the Supabase SQL editor.",
        sql: SQL.trim(),
      },
      { status: 503 },
    );
  }

  const mgmtRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: SQL }),
    },
  );

  if (!mgmtRes.ok) {
    const text = await mgmtRes.text();
    return NextResponse.json(
      { ok: false, message: "Migration failed", error: text },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Stripe columns added successfully.",
  });
}
