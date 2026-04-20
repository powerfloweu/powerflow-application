import { NextRequest, NextResponse } from "next/server";
import { dbPatch } from "../../../lib/supabaseAdmin";

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

  // Mark the result as paid in the database (best-effort, non-blocking)
  if (resultRef) {
    try {
      await dbPatch("sat_results", { result_ref: resultRef }, { paid: true });
    } catch {
      // Non-fatal — the client still gets unlocked locally
    }
  }

  return NextResponse.json({ valid: true });
}
