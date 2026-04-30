import { NextRequest, NextResponse } from "next/server";
import { isConfigured, dbInsert } from "../../../../../lib/supabaseAdmin";
import { createClient } from "../../../../../lib/supabase/server";
import type { CsaiReport } from "../../../../../lib/tests/csai/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Respondent = {
  firstName: string;
  email: string;
  gender: "male" | "female";
  lang: string;
  startedAt?: string;
  submittedAt: string;
};

type SubmitBody = {
  respondent: Respondent;
  report: CsaiReport;
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

  // Graceful degradation: if Supabase is not configured, return success with no id
  if (!isConfigured()) {
    return NextResponse.json({ id: null, stored: false }, { status: 200 });
  }

  // Map subscale scores to DB columns
  const subscaleScores: Record<string, number> = {};
  for (const sub of report.subscales) {
    subscaleScores[`score_${sub.key}`] = sub.score;
  }

  // Link to authenticated user if logged in
  let user_id: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) user_id = user.id;
  } catch { /* not logged in — fine */ }

  const row = {
    result_ref: resultRef,
    first_name: respondent.firstName,
    email: respondent.email.toLowerCase(),
    gender: respondent.gender,
    lang: respondent.lang,
    submitted_at: respondent.submittedAt,
    paid: false,
    score_cognitive: subscaleScores.score_cognitive,
    score_somatic: subscaleScores.score_somatic,
    score_confidence: subscaleScores.score_confidence,
    ...(user_id ? { user_id } : {}),
  };

  const inserted = await dbInsert<typeof row>("csai_results", row);

  if (!inserted) {
    return NextResponse.json(
      { id: null, error: "Database insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: inserted.id, stored: true }, { status: 200 });
}
