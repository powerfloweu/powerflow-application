/**
 * GET /api/test/result?type=<acsi|csai|das|sat>&ref=<result_ref>
 *
 * Loads a test result by its result_ref — the unguessable token minted at
 * submit time and emailed to the taker. This lets someone re-open their result
 * (and their unlocked report) from any device, instead of it living only in the
 * browser's localStorage. The ref acts as a capability token: whoever has the
 * link can view that result, which is fine because it's only ever emailed to
 * the person who took the test.
 *
 * Returns { report, respondent, paid }.
 */
import { NextRequest, NextResponse } from "next/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { buildResultPayload, RESULT_TABLE, RESULT_SELECT, type TestType } from "@/lib/tests/resultPayload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: TestType[] = ["acsi", "csai", "das", "sat"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as TestType | null;
  const ref = (searchParams.get("ref") ?? "").trim();

  if (!type || !VALID.includes(type)) {
    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  }
  if (!ref) return NextResponse.json({ error: "missing ref" }, { status: 400 });

  // Light rate limit by IP to blunt any enumeration of refs.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`test-result:${ip}`, { limit: 60, windowSec: 60 });
  if (!rl.ok) return rateLimitResponse(rl);

  const rows = await dbSelect<Record<string, unknown> & { paid: boolean }>(
    RESULT_TABLE[type],
    { result_ref: `eq.${ref}`, select: RESULT_SELECT[type], limit: "1" },
  );
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });

  const row = rows[0];
  const payload = buildResultPayload(type, row);
  return NextResponse.json({ ...payload, paid: row.paid === true });
}
