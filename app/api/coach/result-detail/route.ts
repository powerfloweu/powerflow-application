import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { BAND_CUTOFFS } from "@/lib/tests/acsi/norms";
import { BAND_CUTOFFS as CSAI_BAND_CUTOFFS, getBandForSubscale } from "@/lib/tests/csai/norms";
import { SUBSCALE_NORMAL_MIN, SUBSCALE_NORMAL_MAX } from "@/lib/tests/das/norms";
import { FACTOR_NORMS, SUBFACTOR_NORMS, classify } from "@/lib/tests/self-awareness/norms";
import { FACTOR_NAMES } from "@/lib/tests/self-awareness/items";
import type { AcsiSubscaleKey, Band as AcsiBand } from "@/lib/tests/acsi/scoring";
import type { CsaiSubscaleKey } from "@/lib/tests/csai/scoring";
import type { DasSubscaleKey, DasBand } from "@/lib/tests/das/scoring";
import type { FactorName } from "@/lib/tests/self-awareness/items";
import type { SubfactorName } from "@/lib/tests/self-awareness/norms";

export const runtime = "nodejs";

// ── payload builders (identical to admin/result-detail) ───────────────────────

type AcsiDbRow = { id: string; score_coping: number; score_peaking: number; score_goal_setting: number; score_concentration: number; score_freedom: number; score_confidence: number; score_coachability: number; total_score: number; first_name: string; email: string; gender: "male" | "female"; lang: string; submitted_at: string; user_id: string | null };
type CsaiDbRow = { id: string; score_cognitive: number; score_somatic: number; score_confidence: number; first_name: string; email: string; gender: "male" | "female"; lang: string; submitted_at: string; user_id: string | null };
type DasDbRow  = { id: string; score_external_approval: number; score_lovability: number; score_achievement: number; score_perfectionism: number; score_entitlement: number; score_omnipotence: number; score_external_control: number; total_score: number; depression_prone: boolean; first_name: string; email: string; lang: string; submitted_at: string; user_id: string | null };
type SatDbRow  = { id: string; score_performance: number; score_affiliation: number; score_aggression: number; score_defensiveness: number; score_consciousness: number; score_dominance: number; score_exhibition: number; score_autonomy: number; score_caregiving: number; score_order: number; score_helplessness: number; sf_self_confirmation: number; sf_rational_dominance: number; sf_aggressive_nonconformity: number; sf_passive_dependence: number; sf_sociability: number; sf_agreeableness: number; sum_yes: number; validity_reliable: boolean; gender: "male" | "female"; first_name: string; email: string; lang: string; submitted_at: string; user_id: string | null };

function buildAcsiPayload(row: AcsiDbRow) {
  const order: AcsiSubscaleKey[] = ["coping","peaking","goalSetting","concentration","freedom","confidence","coachability"];
  const scores: Record<AcsiSubscaleKey, number> = { coping: row.score_coping, peaking: row.score_peaking, goalSetting: row.score_goal_setting, concentration: row.score_concentration, freedom: row.score_freedom, confidence: row.score_confidence, coachability: row.score_coachability };
  const subscales = order.map((key) => {
    const score = scores[key];
    let band: AcsiBand;
    if (score <= BAND_CUTOFFS.low.max) band = "low";
    else if (score <= BAND_CUTOFFS.average.max) band = "average";
    else band = "high";
    return { key, score, band, min: BAND_CUTOFFS.low.min, max: BAND_CUTOFFS.high.max };
  });
  return { report: { subscales, totalScore: row.total_score }, respondent: { firstName: row.first_name, email: row.email, gender: row.gender, lang: row.lang, startedAt: row.submitted_at, submittedAt: row.submitted_at } };
}

function buildCsaiPayload(row: CsaiDbRow) {
  const order: CsaiSubscaleKey[] = ["cognitive","somatic","confidence"];
  const scores: Record<CsaiSubscaleKey, number> = { cognitive: row.score_cognitive, somatic: row.score_somatic, confidence: row.score_confidence };
  const subscales = order.map((key) => {
    const score = scores[key];
    const band = getBandForSubscale(key, score);
    const cuts = CSAI_BAND_CUTOFFS[key];
    return { key, score, band, min: cuts.low.min, max: cuts.high.max };
  });
  return { report: { subscales }, respondent: { firstName: row.first_name, email: row.email, gender: row.gender, lang: row.lang, startedAt: row.submitted_at, submittedAt: row.submitted_at } };
}

function buildDasPayload(row: DasDbRow) {
  const order: DasSubscaleKey[] = ["externalApproval","lovability","achievement","perfectionism","entitlement","omnipotence","externalControl"];
  const scoreMap: Record<DasSubscaleKey, number> = { externalApproval: row.score_external_approval, lovability: row.score_lovability, achievement: row.score_achievement, perfectionism: row.score_perfectionism, entitlement: row.score_entitlement, omnipotence: row.score_omnipotence, externalControl: row.score_external_control };
  const subscales = order.map((key) => {
    const score = scoreMap[key];
    const band: DasBand = score >= SUBSCALE_NORMAL_MIN && score <= SUBSCALE_NORMAL_MAX ? "normal" : "dysfunctional";
    type S = { key: DasSubscaleKey; score: number; band: DasBand; direction?: "externalControl" | "autonomy" };
    const r: S = { key, score, band };
    if (key === "externalControl") r.direction = score > 0 ? "externalControl" : "autonomy";
    return r;
  });
  return { report: { subscales, totalScore: row.total_score, depressionProne: row.depression_prone }, respondent: { firstName: row.first_name, email: row.email, lang: row.lang, startedAt: row.submitted_at, submittedAt: row.submitted_at } };
}

function buildSatPayload(row: SatDbRow) {
  const gender = row.gender;
  const norms = FACTOR_NORMS[gender];
  const factorScoreMap: Record<FactorName, number> = { Performance: row.score_performance, Affiliation: row.score_affiliation, Aggression: row.score_aggression, Defensiveness: row.score_defensiveness, Consciousness: row.score_consciousness, Dominance: row.score_dominance, Exhibition: row.score_exhibition, Autonomy: row.score_autonomy, Caregiving: row.score_caregiving, Order: row.score_order, Helplessness: row.score_helplessness };
  const factors = FACTOR_NAMES.map((name) => { const raw = factorScoreMap[name]; const n = norms[name]; return { factor: name, rawScore: raw, max: 15, band: classify(raw, n.min, n.max), bandMin: n.min, bandMax: n.max, populationAverage: n.average }; });
  const sfNames: SubfactorName[] = ["Self-confirmation","Rational dominance","Aggressive nonconformity","Passive dependence","Sociability","Agreeableness"];
  const sfMap: Record<SubfactorName, number> = { "Self-confirmation": row.sf_self_confirmation, "Rational dominance": row.sf_rational_dominance, "Aggressive nonconformity": row.sf_aggressive_nonconformity, "Passive dependence": row.sf_passive_dependence, "Sociability": row.sf_sociability, "Agreeableness": row.sf_agreeableness };
  const subfactors = sfNames.map((name) => { const score = sfMap[name]; const n = SUBFACTOR_NORMS[name]; return { subfactor: name, score, band: classify(score, n.min, n.max), bandMin: n.min, bandMax: n.max }; });
  const vn = SUBFACTOR_NORMS["Agreeableness"];
  const validity = { sumYes: row.sum_yes, band: classify(row.sum_yes, vn.min, vn.max), bandMin: vn.min, bandMax: vn.max, reliable: row.validity_reliable };
  return { report: { gender, factors, subfactors, validity }, respondent: { firstName: row.first_name, email: row.email, gender, lang: row.lang, startedAt: row.submitted_at, submittedAt: row.submitted_at } };
}

// ── Auth: verify result belongs to one of this coach's athletes ───────────────

async function getCoachId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

async function athleteBelongsToCoach(athleteUserId: string, coachId: string): Promise<boolean> {
  const rows = await dbSelect<{ coach_id: string | null }>("profiles", {
    id: `eq.${athleteUserId}`,
    select: "coach_id",
  });
  return rows[0]?.coach_id === coachId;
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id   = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const tableMap: Record<string, string> = { acsi: "acsi_results", csai: "csai_results", das: "das_results", sat: "sat_results" };
  if (!type || !tableMap[type]) return NextResponse.json({ error: "unknown type" }, { status: 400 });

  const selectMap: Record<string, string> = {
    acsi: "id,user_id,score_coping,score_peaking,score_goal_setting,score_concentration,score_freedom,score_confidence,score_coachability,total_score,first_name,email,gender,lang,submitted_at",
    csai: "id,user_id,score_cognitive,score_somatic,score_confidence,first_name,email,gender,lang,submitted_at",
    das:  "id,user_id,score_external_approval,score_lovability,score_achievement,score_perfectionism,score_entitlement,score_omnipotence,score_external_control,total_score,depression_prone,first_name,email,lang,submitted_at",
    sat:  "id,user_id,score_performance,score_affiliation,score_aggression,score_defensiveness,score_consciousness,score_dominance,score_exhibition,score_autonomy,score_caregiving,score_order,score_helplessness,sf_self_confirmation,sf_rational_dominance,sf_aggressive_nonconformity,sf_passive_dependence,sf_sociability,sf_agreeableness,sum_yes,validity_reliable,gender,first_name,email,lang,submitted_at",
  };

  const rows = await dbSelect<AcsiDbRow & CsaiDbRow & DasDbRow & SatDbRow>(tableMap[type], { id: `eq.${id}`, select: selectMap[type] });
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });

  const row = rows[0];
  if (!row.user_id || !await athleteBelongsToCoach(row.user_id, coachId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (type === "acsi") return NextResponse.json(buildAcsiPayload(row as AcsiDbRow));
  if (type === "csai") return NextResponse.json(buildCsaiPayload(row as CsaiDbRow));
  if (type === "das")  return NextResponse.json(buildDasPayload(row as DasDbRow));
  return NextResponse.json(buildSatPayload(row as SatDbRow));
}
