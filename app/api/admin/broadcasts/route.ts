/**
 * Admin broadcasts API (requires coach role or admin email)
 *
 * GET  /api/admin/broadcasts           → list all broadcasts
 * POST /api/admin/broadcasts           → create a new broadcast
 *   body: { title, body, target_role }
 * PATCH /api/admin/broadcasts?id=<id>  → toggle active on/off
 *   body: { active: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import type { BroadcastRow } from "@/app/api/notifications/route";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL ?? "";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (ADMIN_EMAIL && user.email === ADMIN_EMAIL) return true;
  // Also allow coaches to manage broadcasts
  const profiles = await dbSelect<{ role: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "role",
    limit: "1",
  });
  return profiles[0]?.role === "coach";
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json([]);
  const supabase = await createClient();
  if (!await isAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await dbSelect<BroadcastRow>("broadcasts", {
    order: "created_at.desc",
    select: "id,title,body,target_role,active,created_at",
  });
  return NextResponse.json(rows);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  if (!await isAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { title?: string; body?: string; target_role?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const title = (body.title ?? "").trim();
  const text  = (body.body  ?? "").trim();
  const role  = body.target_role ?? "all";

  if (!title || !text) return NextResponse.json({ error: "title and body required" }, { status: 400 });
  if (!["all", "athlete", "coach"].includes(role)) {
    return NextResponse.json({ error: "target_role must be all | athlete | coach" }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/broadcasts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ title, body: text, target_role: role }),
  });

  if (!res.ok) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  const rows = await res.json();
  return NextResponse.json(rows[0], { status: 201 });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createClient();
  if (!await isAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: { active?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  await fetch(`${SUPABASE_URL}/rest/v1/broadcasts?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ active: body.active }),
  });

  return NextResponse.json({ ok: true });
}
