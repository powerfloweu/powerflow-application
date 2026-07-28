import { NextRequest, NextResponse } from "next/server";
import { dbPatch, dbSelect } from "../../../lib/supabaseAdmin";
import { sendResultEmail } from "@/lib/tests/resultEmail";
import type { TestType } from "@/lib/tests/resultPayload";

/** Which result table + test type a result_ref belongs to, by prefix. */
function refTarget(ref: string): { table: string; type: TestType } {
  if (ref.startsWith("pfac_"))  return { table: "acsi_results", type: "acsi" };
  if (ref.startsWith("pfcs_"))  return { table: "csai_results", type: "csai" };
  if (ref.startsWith("pfdas_")) return { table: "das_results", type: "das" };
  return { table: "sat_results", type: "sat" };
}

export async function POST(req: NextRequest) {
  const { code, resultRef } = (await req.json()) as {
    code?: string;
    resultRef?: string;
  };

  if (!code) {
    return NextResponse.json({ valid: false, error: "No code provided" }, { status: 400 });
  }

  const validCodes = (process.env.COUPON_CODES ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (!validCodes.includes(code.trim().toUpperCase())) {
    return NextResponse.json({ valid: false, error: "Invalid code" }, { status: 400 });
  }

  // Mark the result as paid — if this fails the unlock would be lost on
  // reload, so surface the error instead of pretending it worked.
  if (resultRef) {
    const { table, type } = refTarget(resultRef);
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
