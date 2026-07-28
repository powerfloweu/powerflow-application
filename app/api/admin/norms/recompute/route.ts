/**
 * POST /api/admin/norms/recompute   (admin only)
 *   Body (optional): { activate?: boolean }
 *
 * Snapshots the current distribution of every metric for every test into a new
 * `test_norms` version — per cohort (all + gender where the instrument is
 * gender-normed). Read-only with respect to live scoring: it never changes how
 * results are scored, it just records what your sample looks like right now.
 * Pass { activate: true } to also mark the new version active for its cohorts.
 *
 * GET /api/admin/norms/recompute  → returns the latest snapshot summary.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";
import { describeDistribution } from "@/lib/tests/norms/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type TestType = "acsi" | "csai" | "das" | "sat";

const TABLE: Record<TestType, string> = {
  acsi: "acsi_results", csai: "csai_results", das: "das_results", sat: "sat_results",
};

const METRICS: Record<TestType, string[]> = {
  acsi: ["score_coping","score_peaking","score_goal_setting","score_concentration","score_freedom","score_confidence","score_coachability","total_score"],
  csai: ["score_cognitive","score_somatic","score_confidence"],
  das:  ["score_external_approval","score_lovability","score_achievement","score_perfectionism","score_entitlement","score_omnipotence","score_external_control","total_score"],
  sat:  ["score_performance","score_affiliation","score_aggression","score_defensiveness","score_consciousness","score_dominance","score_exhibition","score_autonomy","score_caregiving","score_order","score_helplessness","sf_self_confirmation","sf_rational_dominance","sf_aggressive_nonconformity","sf_passive_dependence","sf_sociability","sf_agreeableness","sum_yes"],
};

// Cohorts to compute. Gender-normed instruments get per-gender cohorts too.
const COHORTS: Record<TestType, string[]> = {
  acsi: ["all", "gender:male", "gender:female"],
  csai: ["all", "gender:male", "gender:female"],
  sat:  ["all", "gender:male", "gender:female"],
  das:  ["all"],
};

type Row = Record<string, number | string | null>;

function cohortRows(rows: Row[], cohort: string): Row[] {
  if (cohort === "all") return rows;
  const [, gender] = cohort.split(":");
  return rows.filter((r) => r.gender === gender);
}

async function bulkInsert(table: string, rows: unknown[]): Promise<boolean> {
  if (!rows.length) return true;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error("[norms/recompute] insert failed", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let activate = false;
  try { activate = (await req.json())?.activate === true; } catch { /* no body */ }

  const summary: Array<{ test_type: TestType; version: number; rows: number; totalN: number }> = [];
  const normRows: Record<string, unknown>[] = [];

  for (const type of Object.keys(TABLE) as TestType[]) {
    const select = ["gender", "source", ...METRICS[type]].join(",");
    const rows = await dbSelect<Row>(TABLE[type], { select, limit: "100000" }).catch(() => [] as Row[]);

    // Next version = 1 + current max for this test type.
    const existing = await dbSelect<{ version: number }>("test_norms", {
      test_type: `eq.${type}`, select: "version", order: "version.desc", limit: "1",
    }).catch(() => []);
    const version = (existing[0]?.version ?? 0) + 1;

    const hasImport = rows.some((r) => r.source === "import");
    const source = rows.length === 0 ? "powerflow" : hasImport ? "mixed" : "powerflow";

    let rowsForType = 0;
    for (const cohort of COHORTS[type]) {
      const sub = cohortRows(rows, cohort);
      for (const metric of METRICS[type]) {
        const values = sub
          .map((r) => r[metric])
          .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
        const d = describeDistribution(values);
        if (d.n === 0) continue; // don't record empty cells
        normRows.push({
          test_type: type, metric_key: metric, cohort_key: cohort, version,
          n: d.n, mean: d.mean, sd: d.sd, min: d.min, max: d.max,
          percentiles: d.percentiles, source, active: activate,
        });
        rowsForType++;
      }
    }
    summary.push({ test_type: type, version, rows: rowsForType, totalN: rows.length });
  }

  const ok = await bulkInsert("test_norms", normRows);
  if (!ok) return NextResponse.json({ error: "Failed to write norms" }, { status: 500 });

  // Optionally deactivate older versions for the cohorts we just activated.
  if (activate) {
    for (const s of summary) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/test_norms?test_type=eq.${s.test_type}&version=neq.${s.version}`,
        { method: "PATCH", headers: { "Content-Type": "application/json", apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "return=minimal" }, body: JSON.stringify({ active: false }) },
      ).catch((err) => console.error("[norms/recompute] deactivate failed", err));
    }
  }

  return NextResponse.json({ ok: true, activated: activate, snapshot: summary });
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await dbSelect<Record<string, unknown>>("test_norms", {
    select: "test_type,metric_key,cohort_key,version,n,mean,sd,percentiles,source,active,computed_at",
    order: "test_type.asc,cohort_key.asc,metric_key.asc",
    limit: "100000",
  });
  return NextResponse.json(rows);
}
