import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbDelete } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

const ALLOWED_TABLES = ["sat_results", "acsi_results", "csai_results"] as const;
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

  const targetTable: AllowedTable = ALLOWED_TABLES.includes(table as AllowedTable)
    ? (table as AllowedTable)
    : "sat_results";

  await dbDelete(targetTable, { id: resultId });
  return NextResponse.json({ ok: true });
}
