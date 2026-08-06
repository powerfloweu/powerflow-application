import { NextResponse } from "next/server";
import { isConfigured, dbSelect } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const results = await dbSelect("sat_results", {
    order: "submitted_at.desc",
    limit: "1000",
  });

  return NextResponse.json({ results });
}
