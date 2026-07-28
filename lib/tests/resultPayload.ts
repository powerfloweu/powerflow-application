/**
 * Rebuilds the results-page payload ({ report, respondent }) from a stored
 * result row, for each test type. This is the single source of truth used by
 * coach/admin result-detail and the public result-by-ref endpoint, so a result
 * can be re-rendered from the database on any device (not just the browser that
 * happened to have it in localStorage).
 */
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

export type TestType = "acsi" | "csai" | "das" | "sat";

export const RESULT_TABLE: Record<TestType, string> = {
  acsi: "acsi_results",
  csai: "csai_results",
  das: "das_results",
  sat: "sat_results",
};

export const RESULT_SELECT: Record<TestType, string> = {
  acsi: "id,user_id,paid,result_ref,score_coping,score_peaking,score_goal_setting,score_concentration,score_freedom,score_confidence,score_coachability,total_score,first_name,email,gender,lang,submitted_at",
  csai: "id,user_id,paid,result_ref,score_cognitive,score_somatic,score_confidence,first_name,email,gender,lang,submitted_at",
  das:  "id,user_id,paid,result_ref,score_external_approval,score_lovability,score_achievement,score_perfectionism,score_entitlement,score_omnipotence,score_external_control,total_score,depression_prone,first_name,email,lang,submitted_at",
  sat:  "id,user_id,paid,result_ref,score_performance,score_affiliation,score_aggression,score_defensiveness,score_consciousness,score_dominance,score_exhibition,score_autonomy,score_caregiving,score_order,score_helplessness,sf_self_confirmation,sf_rational_dominance,sf_aggressive_nonconformity,sf_passive_dependence,sf_sociability,sf_agreeableness,sum_yes,validity_reliable,gender,first_name,email,lang,submitted_at",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export function buildAcsiPayload(row: Row) {
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

export function buildCsaiPayload(row: Row) {
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

export function buildDasPayload(row: Row) {
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

export function buildSatPayload(row: Row) {
  const gender = row.gender as "male" | "female";
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

export function buildResultPayload(type: TestType, row: Row) {
  switch (type) {
    case "acsi": return buildAcsiPayload(row);
    case "csai": return buildCsaiPayload(row);
    case "das":  return buildDasPayload(row);
    case "sat":  return buildSatPayload(row);
  }
}
