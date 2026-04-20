import { NextRequest, NextResponse } from "next/server";
import { dbSelect } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ paid: false });

  const rows = await dbSelect<{ paid: boolean }>("sat_results", {
    result_ref: `eq.${ref}`,
    select: "paid",
    limit: "1",
  });

  const paid = rows.length > 0 && rows[0].paid === true;
  return NextResponse.json({ paid });
}
