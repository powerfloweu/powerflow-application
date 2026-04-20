import { NextRequest, NextResponse } from "next/server";
import { dbPatch } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { resultId, password } = (await req.json()) as {
    resultId?: string;
    password?: string;
  };

  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resultId) {
    return NextResponse.json({ error: "No resultId" }, { status: 400 });
  }

  await dbPatch("sat_results", { id: resultId }, { paid: true });
  return NextResponse.json({ ok: true });
}
