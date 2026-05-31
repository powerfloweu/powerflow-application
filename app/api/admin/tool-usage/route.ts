/**
 * GET /api/admin/tool-usage
 * Returns aggregated tool open counts for the admin Tools tab.
 * Response: { rows: Array<{ tool_id, total, last30d, last_used }> }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Human-readable names for tool IDs defined in the library page
const TOOL_NAMES: Record<string, string> = {
  "pmr":                   "Progressive Muscle Relaxation",
  "autogenic-training":    "Autogenic Training",
  "viz-squat":             "Visualization — Squat",
  "viz-bench":             "Visualization — Bench",
  "viz-deadlift":          "Visualization — Deadlift",
  "resource-activation":   "Resource Activation",
  "affirmations":          "Affirmations",
  "barrier":               "Barrier Breaker",
  "hibajavitas":           "Barrier Breaker (HU)",
  "comp-day-viz":          "Competition Day Visualization",
};

export async function GET(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await dbSelect<{ tool_id: string; used_at: string }>("tool_usage", {
    select: "tool_id,used_at",
    order: "used_at.desc",
    limit: "100000",
  });

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Aggregate by tool_id
  const map = new Map<string, { total: number; last30d: number; last_used: string }>();
  for (const row of rows) {
    const entry = map.get(row.tool_id) ?? { total: 0, last30d: 0, last_used: row.used_at };
    entry.total++;
    if (new Date(row.used_at).getTime() >= thirtyDaysAgo) entry.last30d++;
    // used_at is already desc-sorted so first seen = most recent
    map.set(row.tool_id, entry);
  }

  const result = Array.from(map.entries())
    .map(([tool_id, stats]) => ({
      tool_id,
      name: TOOL_NAMES[tool_id] ?? tool_id,
      total: stats.total,
      last30d: stats.last30d,
      last_used: stats.last_used,
    }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({ rows: result, total_events: rows.length });
}
