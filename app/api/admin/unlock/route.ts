import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbPatch, dbSelect } from "../../../../lib/supabaseAdmin";
import { sendResultEmail } from "@/lib/tests/resultEmail";
import type { TestType } from "@/lib/tests/resultPayload";

export const runtime = "nodejs";

const ALLOWED_TABLES = ["sat_results", "acsi_results", "csai_results", "das_results"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const TYPE_FROM_TABLE: Record<AllowedTable, TestType> = {
  sat_results: "sat", acsi_results: "acsi", csai_results: "csai", das_results: "das",
};

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

  // Email the person their now-unlocked report link.
  const rows = await dbSelect<{ first_name: string; email: string; result_ref: string; lang: string }>(
    targetTable, { id: `eq.${resultId}`, select: "first_name,email,result_ref,lang", limit: "1" },
  );
  const r = rows[0];
  if (r?.email && r.result_ref) {
    await sendResultEmail({
      to: r.email, firstName: r.first_name, type: TYPE_FROM_TABLE[targetTable],
      resultRef: r.result_ref, mode: "unlock", lang: r.lang,
    }).catch((err) => console.error("[admin/unlock] unlock email failed", err));
  }

  return NextResponse.json({ ok: true, emailed: !!r?.email });
}
