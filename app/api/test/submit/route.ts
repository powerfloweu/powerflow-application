import { NextRequest, NextResponse } from "next/server";
import { isConfigured, dbInsert } from "../../../../lib/supabaseAdmin";
import { createClient } from "../../../../lib/supabase/server";
import type { ScoreReport } from "../../../../lib/tests/self-awareness/scoring";

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
  report: ScoreReport;
  resultRef: string;
};

const SUBFACTOR_COLUMN_MAP: Record<string, string> = {
  "Self-confirmation": "sf_self_confirmation",
  "Rational dominance": "sf_rational_dominance",
  "Aggressive nonconformity": "sf_aggressive_nonconformity",
  "Passive dependence": "sf_passive_dependence",
  Sociability: "sf_sociability",
  Agreeableness: "sf_agreeableness",
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

  // Map factor scores: key = score_<lowercasefactorname>
  const factorScores: Record<string, number> = {};
  for (const f of report.factors) {
    const col = `score_${f.factor.toLowerCase()}`;
    factorScores[col] = f.rawScore;
  }

  // Map subfactor scores using the explicit name→column map
  const subfactorScores: Record<string, number> = {};
  for (const sf of report.subfactors) {
    const col = SUBFACTOR_COLUMN_MAP[sf.subfactor];
    if (col) subfactorScores[col] = sf.score;
  }

  // Link to authenticated user if logged in
  let user_id: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) user_id = user.id;
  } catch { /* not logged in — fine */ }

  const row = {
    first_name: respondent.firstName,
    email: respondent.email.toLowerCase(),
    gender: respondent.gender,
    lang: respondent.lang,
    started_at: respondent.startedAt ?? null,
    submitted_at: respondent.submittedAt,
    result_ref: resultRef,
    ...factorScores,
    ...subfactorScores,
    sum_yes: report.validity.sumYes,
    total_score: report.validity.sumYes,   // alias used by coach dashboard
    validity_reliable: report.validity.reliable,
    ...(user_id ? { user_id } : {}),
  };

  const inserted = await dbInsert<typeof row>("sat_results", row);

  if (!inserted) {
    return NextResponse.json(
      { id: null, error: "Database insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: inserted.id, stored: true }, { status: 200 });
}
