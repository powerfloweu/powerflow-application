import { NextRequest, NextResponse } from "next/server";
import { isConfigured, dbSelect } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const resultRef = url.searchParams.get("result_ref");

  if (!resultRef || !resultRef.startsWith("pfdas_")) {
    return NextResponse.json({ paid: false, error: "Invalid result_ref" }, { status: 400 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ paid: false }, { status: 200 });
  }

  const rows = await dbSelect<{ paid: boolean }>("das_results", {
    filter: `result_ref=eq.${encodeURIComponent(resultRef)}`,
    limit: "1",
  });

  if (!rows || rows.length === 0) {
    return NextResponse.json({ paid: false, error: "Result not found" }, { status: 404 });
  }

  return NextResponse.json({ paid: rows[0].paid === true });
}
