import { NextRequest, NextResponse } from "next/server";
import { isConfigured, dbSelect } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Read password from Authorization header (Bearer token) — never from URL
  // params, which leak into server logs, browser history, and referrer headers.
  const authHeader = req.headers.get("authorization") ?? "";
  const password = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const [sat, acsi, csai, das] = await Promise.all([
    dbSelect("sat_results", { order: "submitted_at.desc", limit: "1000" }),
    dbSelect("acsi_results", { order: "submitted_at.desc", limit: "1000" }),
    dbSelect("csai_results", { order: "submitted_at.desc", limit: "1000" }),
    dbSelect("das_results", { order: "submitted_at.desc", limit: "1000" }),
  ]);

  return NextResponse.json({
    sat: sat ?? [],
    acsi: acsi ?? [],
    csai: csai ?? [],
    das: das ?? [],
  });
}
