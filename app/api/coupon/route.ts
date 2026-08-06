import { NextRequest, NextResponse } from "next/server";
import { dbPatch, dbSelect } from "../../../lib/supabaseAdmin";
import { sendResultEmail } from "@/lib/tests/resultEmail";
import type { TestType } from "@/lib/tests/resultPayload";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

/** Which result table + test type a result_ref belongs to, by prefix. */
function refTarget(ref: string): { table: string; type: TestType } {
  if (ref.startsWith("pfac_"))  return { table: "acsi_results", type: "acsi" };
  if (ref.startsWith("pfcs_"))  return { table: "csai_results", type: "csai" };
  if (ref.startsWith("pfdas_")) return { table: "das_results", type: "das" };
  return { table: "sat_results", type: "sat" };
}

// One identical response for every code/ownership failure mode — distinct
// messages ("no code" vs "invalid code" vs "not yours") would make this
// endpoint a brute-force oracle.
function invalidCodeResponse(): NextResponse {
  return NextResponse.json({ valid: false, error: "Invalid code" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  // Auth required — this endpoint unlocks paid results, it must not be
  // reachable anonymously.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // IP-keyed rate limit — a paywall-bypass code must not be brute-forceable.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`coupon:${ip}`, { limit: 5, windowSec: 300 });
  if (!rl.ok) return rateLimitResponse(rl);

  const { code, resultRef } = (await req.json().catch(() => ({}))) as {
    code?: string;
    resultRef?: string;
  };

  if (!code) {
    return invalidCodeResponse();
  }

  const validCodes = (process.env.COUPON_CODES ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (!validCodes.includes(code.trim().toUpperCase())) {
    return invalidCodeResponse();
  }

  // Mark the result as paid — if this fails the unlock would be lost on
  // reload, so surface the error instead of pretending it worked.
  if (resultRef) {
    const { table, type } = refTarget(resultRef);

    // Ownership check — the row must belong to the signed-in caller (by
    // user_id when the test was taken while logged in, or by email
    // otherwise). Without this, ANY valid coupon code unlocks ANY result
    // across all four tables, regardless of who submitted it.
    const ownerRows = await dbSelect<{ user_id: string | null; email: string | null }>(
      table, { result_ref: `eq.${resultRef}`, select: "user_id,email", limit: "1" },
    );
    const ownerRow = ownerRows[0];
    const callerEmail = (user.email ?? "").toLowerCase().trim();
    const ownsRow =
      !!ownerRow &&
      ((!!ownerRow.user_id && ownerRow.user_id === user.id) ||
        (!!ownerRow.email && ownerRow.email.toLowerCase().trim() === callerEmail));

    if (!ownsRow) {
      return invalidCodeResponse();
    }

    const ok = await dbPatch(table, { result_ref: resultRef }, { paid: true });
    if (!ok) {
      return NextResponse.json(
        { valid: false, error: "Could not apply coupon — please try again" },
        { status: 500 },
      );
    }

    // Email the now-unlocked report link.
    const rows = await dbSelect<{ first_name: string; email: string; lang: string }>(
      table, { result_ref: `eq.${resultRef}`, select: "first_name,email,lang", limit: "1" },
    );
    if (rows[0]?.email) {
      await sendResultEmail({
        to: rows[0].email, firstName: rows[0].first_name, type,
        resultRef, mode: "unlock", lang: rows[0].lang,
      }).catch((err) => console.error("[coupon] unlock email failed", err));
    }
  }

  return NextResponse.json({ valid: true });
}
