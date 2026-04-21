import { NextRequest, NextResponse } from "next/server";
import { isConfigured, dbInsert } from "../../../../../lib/supabaseAdmin";
import type { DasReport } from "../../../../../lib/tests/das/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Respondent = {
  firstName: string;
  email: string;
  lang: string;
  startedAt?: string;
  submittedAt: string;
};

type SubmitBody = {
  respondent: Respondent;
  report: DasReport;
  resultRef: string;
};

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ id: null, error: "Invalid JSON" }, { status: 400 });
  }

  const { respondent, report, resultRef } = body;

  if (!isConfigured()) {
    return NextResponse.json({ id: null, stored: false }, { status: 200 });
  }

  const byKey = Object.fromEntries(report.subscales.map((s) => [s.key, s.score]));

  const row = {
    result_ref: resultRef,
    first_name: respondent.firstName,
    email: respondent.email.toLowerCase(),
    lang: respondent.lang,
    submitted_at: respondent.submittedAt,
    paid: false,
    score_external_approval: byKey.externalApproval ?? 0,
    score_lovability:         byKey.lovability ?? 0,
    score_achievement:        byKey.achievement ?? 0,
    score_perfectionism:      byKey.perfectionism ?? 0,
    score_entitlement:        byKey.entitlement ?? 0,
    score_omnipotence:        byKey.omnipotence ?? 0,
    score_external_control:   byKey.externalControl ?? 0,
    total_score:              report.totalScore,
    depression_prone:         report.depressionProne,
  };

  const inserted = await dbInsert<typeof row>("das_results", row);

  if (!inserted) {
    return NextResponse.json({ id: null, error: "Database insert failed" }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id, stored: true }, { status: 200 });
}
