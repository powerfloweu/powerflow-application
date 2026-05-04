/**
 * PATCH  /api/ego-states/:id — update ego state fields (owner only)
 * DELETE /api/ego-states/:id — delete ego state (owner only)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch, dbDelete } from "@/lib/supabaseAdmin";
import type { UpdateEgoStateRequest } from "@/lib/egoStates";

type Params = { params: Promise<{ id: string }> };

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const existing = await dbSelect<{ id: string }>("ego_states", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: "id",
  });
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: UpdateEgoStateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const PATCHABLE: Array<keyof UpdateEgoStateRequest> = [
    "name", "color", "posture", "body_feeling", "voice_tone",
    "origin_story", "domain", "shadow_side", "activation_ritual",
  ];

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of PATCHABLE) {
    if (key in body) patch[key] = body[key] ?? null;
  }

  if (typeof patch.name === "string") {
    patch.name = (patch.name as string).trim().slice(0, 80);
    if (!patch.name) delete patch.name;
  }

  const ok = await dbPatch("ego_states", { id, user_id: user.id }, patch);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership before deleting
  const existing = await dbSelect<{ id: string }>("ego_states", {
    id: `eq.${id}`,
    user_id: `eq.${user.id}`,
    select: "id",
  });
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await dbDelete("ego_states", { id, user_id: user.id });
  return new NextResponse(null, { status: 204 });
}
