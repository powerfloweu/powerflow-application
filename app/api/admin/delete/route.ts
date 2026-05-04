import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbDelete } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

const ALLOWED_TABLES = ["sat_results", "acsi_results", "csai_results"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

async function isAdmin(): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && (user.email ?? "").toLowerCase() === adminEmail;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { resultId, table } = (await req.json()) as {
    resultId?: string;
    table?: string;
  };

  if (!resultId) {
    return NextResponse.json({ error: "No resultId" }, { status: 400 });
  }

  const targetTable: AllowedTable = ALLOWED_TABLES.includes(table as AllowedTable)
    ? (table as AllowedTable)
    : "sat_results";

  await dbDelete(targetTable, { id: resultId });
  return NextResponse.json({ ok: true });
}
