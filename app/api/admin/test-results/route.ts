/**
 * GET /api/admin/test-results
 * Returns { sat, acsi, csai, das } — all test result rows, newest first, limit 500 each.
 * Auth: session email must match ADMIN_EMAIL env var.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SatRow = {
  id: string;
  result_ref: string;
  first_name: string;
  email: string;
  gender: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  user_id: string | null;
  sum_yes: number;
  validity_reliable: boolean;
  // 11 primary factors (0–15)
  score_performance: number;
  score_affiliation: number;
  score_aggression: number;
  score_defensiveness: number;
  score_consciousness: number;
  score_dominance: number;
  score_exhibition: number;
  score_autonomy: number;
  score_caregiving: number;
  score_order: number;
  score_helplessness: number;
  // 6 subfactors (composite weighted scores)
  sf_self_confirmation: number;
  sf_rational_dominance: number;
  sf_aggressive_nonconformity: number;
  sf_passive_dependence: number;
  sf_sociability: number;
  sf_agreeableness: number;
};

export type AcsiRow = {
  id: string;
  result_ref: string;
  first_name: string;
  email: string;
  gender: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  user_id: string | null;
  total_score: number;
  score_coping: number;
  score_peaking: number;
  score_goal_setting: number;
  score_concentration: number;
  score_freedom: number;
  score_confidence: number;
  score_coachability: number;
};

export type CsaiRow = {
  id: string;
  result_ref: string;
  first_name: string;
  email: string;
  gender: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  user_id: string | null;
  score_cognitive: number;
  score_somatic: number;
  score_confidence: number;
};

export type DasRow = {
  id: string;
  result_ref: string;
  first_name: string;
  email: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  user_id: string | null;
  total_score: number;
  depression_prone: boolean;
  score_external_approval: number;
  score_lovability: number;
  score_achievement: number;
  score_perfectionism: number;
  score_entitlement: number;
  score_omnipotence: number;
  score_external_control: number;
};

// ── Column selects ─────────────────────────────────────────────────────────────

const COMMON        = "id,result_ref,first_name,email,gender,lang,submitted_at,paid,user_id";
const COMMON_NO_GENDER = "id,result_ref,first_name,email,lang,submitted_at,paid,user_id";

const SAT_SELECT  = `${COMMON},sum_yes,validity_reliable,score_performance,score_affiliation,score_aggression,score_defensiveness,score_consciousness,score_dominance,score_exhibition,score_autonomy,score_caregiving,score_order,score_helplessness,sf_self_confirmation,sf_rational_dominance,sf_aggressive_nonconformity,sf_passive_dependence,sf_sociability,sf_agreeableness`;
const ACSI_SELECT = `${COMMON},total_score,score_coping,score_peaking,score_goal_setting,score_concentration,score_freedom,score_confidence,score_coachability`;
const CSAI_SELECT = `${COMMON},score_cognitive,score_somatic,score_confidence`;
const DAS_SELECT  = `${COMMON_NO_GENDER},total_score,depression_prone,score_external_approval,score_lovability,score_achievement,score_perfectionism,score_entitlement,score_omnipotence,score_external_control`;

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sat, acsi, csai, das] = await Promise.all([
    dbSelect<SatRow>("sat_results", {
      select: SAT_SELECT,
      order: "submitted_at.desc",
      limit: "500",
    }),
    dbSelect<AcsiRow>("acsi_results", {
      select: ACSI_SELECT,
      order: "submitted_at.desc",
      limit: "500",
    }),
    dbSelect<CsaiRow>("csai_results", {
      select: CSAI_SELECT,
      order: "submitted_at.desc",
      limit: "500",
    }),
    dbSelect<DasRow>("das_results", {
      select: DAS_SELECT,
      order: "submitted_at.desc",
      limit: "500",
    }),
  ]);

  return NextResponse.json({ sat, acsi, csai, das });
}
