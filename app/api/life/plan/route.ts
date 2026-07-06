/**
 * GET   /api/life/plan — the caller's active plan (or null).
 * POST  /api/life/plan — create a new plan (deactivates any existing active one).
 * PATCH /api/life/plan — update { id, name?, structure?, current_week? }.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLifeUser } from "@/lib/lifeAuth";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import type { PlanStructure } from "@/lib/life";

export const dynamic = "force-dynamic";

type PlanRow = {
  id: string; name: string; structure: PlanStructure;
  current_week: number; active: boolean; created_at: string;
};

export async function GET() {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await dbSelect<PlanRow>("lifestyle_plans", {
    user_id: `eq.${userId}`,
    active: "eq.true",
    select: "id,name,structure,current_week,active,created_at",
    order: "created_at.desc",
    limit: "1",
  });
  return NextResponse.json(rows[0] ?? null);
}

export async function POST(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { name?: string; structure?: PlanStructure };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.name?.trim() || !body.structure) {
    return NextResponse.json({ error: "name and structure required" }, { status: 400 });
  }

  // Deactivate current active plan(s) — a failed deactivate is tolerable
  // (worst case two actives; GET picks the newest), so don't block on it.
  await dbPatch("lifestyle_plans", { user_id: userId, active: "true" }, { active: false });

  const inserted = await dbInsert("lifestyle_plans", {
    user_id: userId,
    name: body.name.trim(),
    structure: body.structure,
    current_week: 1,
    active: true,
  });
  if (!inserted) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { id?: string; name?: string; structure?: PlanStructure; current_week?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name?.trim()) patch.name = body.name.trim();
  if (body.structure) patch.structure = body.structure;
  if (typeof body.current_week === "number" && body.current_week >= 1) {
    patch.current_week = Math.floor(body.current_week);
  }
  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Match includes user_id so nobody can patch another user's plan.
  const ok = await dbPatch("lifestyle_plans", { id: body.id, user_id: userId }, patch);
  if (!ok) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
