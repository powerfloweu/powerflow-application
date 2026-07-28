import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbPatch } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

const ALLOWED_TABLES = ["sat_results", "acsi_results", "csai_results", "das_results"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { resultId, table } = (await req.json()) as {
    resultId?: string;
    table?: string;
  };

  if (!resultId) {
    return NextResponse.json({ error: "No resultId" }, { status: 400 });
  }

  // Reject unknown tables rather than silently defaulting to sat_results —
  // that default is what made DAS unlocks target the wrong table and fail.
  if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
    return NextResponse.json({ error: `Unsupported table: ${table}` }, { status: 400 });
  }
  const targetTable = table as AllowedTable;

  const ok = await dbPatch(targetTable, { id: resultId }, { paid: true });
  if (!ok) return NextResponse.json({ error: "Unlock failed — result not found" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
