/**
 * GET   /api/life/config — the caller's lifestyle config (created with
 *       defaults on first access).
 * PATCH /api/life/config — merge any of: values_list, dimensions, meals,
 *       macro_targets.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLifeUser } from "@/lib/lifeAuth";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import type { LifeConfig } from "@/lib/life";

export const dynamic = "force-dynamic";

type ConfigRow = LifeConfig & { user_id: string };

const DEFAULTS: LifeConfig = {
  values_list: [],
  dimensions: [],
  meals: [],
  macro_targets: {},
};

export async function GET() {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await dbSelect<ConfigRow>("lifestyle_config", {
    user_id: `eq.${userId}`,
    select: "user_id,values_list,dimensions,meals,macro_targets",
  });
  if (rows.length) return NextResponse.json(rows[0]);

  const inserted = await dbInsert("lifestyle_config", { user_id: userId, ...DEFAULTS });
  if (!inserted) return NextResponse.json({ error: "Config init failed" }, { status: 500 });
  return NextResponse.json({ user_id: userId, ...DEFAULTS });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Partial<LifeConfig>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (Array.isArray(body.values_list)) patch.values_list = body.values_list;
  if (Array.isArray(body.dimensions))  patch.dimensions  = body.dimensions;
  if (Array.isArray(body.meals))       patch.meals       = body.meals;
  if (body.macro_targets && typeof body.macro_targets === "object") {
    patch.macro_targets = body.macro_targets;
  }
  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const ok = await dbPatch("lifestyle_config", { user_id: userId }, patch);
  if (!ok) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
