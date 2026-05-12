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
  gender: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  user_id: string | null;
  total_score: number;
  depression_prone: boolean;
};

// ── Column selects ─────────────────────────────────────────────────────────────

const COMMON = "id,result_ref,first_name,email,gender,lang,submitted_at,paid,user_id";

const SAT_SELECT = `${COMMON},sum_yes,validity_reliable`;
const ACSI_SELECT = `${COMMON},total_score,score_coping,score_peaking,score_goal_setting,score_concentration,score_freedom,score_confidence,score_coachability`;
const CSAI_SELECT = `${COMMON},score_cognitive,score_somatic,score_confidence`;
const DAS_SELECT = `${COMMON},total_score,depression_prone`;

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
