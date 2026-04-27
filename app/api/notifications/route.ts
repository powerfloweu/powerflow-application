/**
 * Notifications API
 *
 * GET  /api/notifications
 *   → { broadcast: BroadcastRow | null, devlogNew: boolean }
 *   Returns the latest active broadcast the user hasn't seen yet,
 *   plus whether there's a new devlog entry since they last checked.
 *
 * POST /api/notifications
 *   body: { type: "broadcast"; id: string } | { type: "devlog" }
 *   → Marks the broadcast or devlog as seen on the user's profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { CURRENT_DEVLOG_VERSION } from "@/lib/devlog";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export type BroadcastRow = {
  id: string;
  title: string;
  body: string;
  target_role: string;
  active: boolean;
  created_at: string;
};

type ProfileRow = {
  role: string;
  last_seen_broadcast_id: string | null;
  last_seen_devlog_version: string | null;
};

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!isConfigured) return NextResponse.json({ broadcast: null, devlogNew: false });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: "role,last_seen_broadcast_id,last_seen_devlog_version",
    limit: "1",
  });

  if (!profiles.length) return NextResponse.json({ broadcast: null, devlogNew: false });
  const profile = profiles[0];

  // ── Latest active broadcast for this role ────────────────────────────────
  const roleFilter = `in.(all,${profile.role})`;
  const broadcasts = await dbSelect<BroadcastRow>("broadcasts", {
    active: "eq.true",
    target_role: roleFilter,
    order: "created_at.desc",
    limit: "1",
    select: "id,title,body,target_role,active,created_at",
  });

  const latestBroadcast = broadcasts[0] ?? null;
  const broadcastUnseen =
    latestBroadcast !== null &&
    latestBroadcast.id !== profile.last_seen_broadcast_id;

  // ── Dev log ───────────────────────────────────────────────────────────────
  const devlogNew = profile.last_seen_devlog_version !== CURRENT_DEVLOG_VERSION;

  return NextResponse.json({
    broadcast: broadcastUnseen ? latestBroadcast : null,
    devlogNew,
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { type: "broadcast" | "devlog"; id?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const patch: Record<string, string> = {};
  if (body.type === "broadcast" && body.id) {
    patch.last_seen_broadcast_id = body.id;
  } else if (body.type === "devlog") {
    patch.last_seen_devlog_version = CURRENT_DEVLOG_VERSION;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });

  return NextResponse.json({ ok: true });
}
