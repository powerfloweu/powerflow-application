/**
 * Manages user-uploaded viz voice notes in Supabase Storage (bucket: viz-recordings).
 *
 * POST   — creates a signed upload URL so the client can PUT the file directly
 *          to Supabase Storage (bypassing the Vercel body-size limit).
 *          Body: { toolId: string, filename: string }
 *          Returns: { signedUrl: string, storagePath: string }
 *
 * GET    — returns a short-lived signed read URL for the user's existing recording.
 *          ?toolId=viz-squat
 *          Returns: { url: string } | { error: "not_found" }
 *
 * DELETE — removes the file from storage and clears the path in the profile.
 *          ?toolId=viz-squat
 *          Returns: { ok: true }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

const SUPABASE_URL  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET        = "viz-recordings";
const ALLOWED_TOOLS = new Set(["viz-squat", "viz-bench", "viz-deadlift"]);

// Allowed audio MIME types / extensions
const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
  "audio/aac", "audio/ogg", "audio/wav", "audio/webm", "audio/flac",
  "audio/quicktime",
]);

function extFromFilename(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : "";
}

async function getVizRecordings(userId: string): Promise<Record<string, string>> {
  const rows = await dbSelect<{ viz_recordings: Record<string, string> | null }>("profiles", {
    id: `eq.${userId}`,
    select: "viz_recordings",
  });
  return rows[0]?.viz_recordings ?? {};
}

// ── POST — create signed upload URL ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { toolId?: string; filename?: string; mimeType?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { toolId, filename = "recording", mimeType } = body;

  if (!toolId || !ALLOWED_TOOLS.has(toolId)) {
    return NextResponse.json({ error: "Invalid toolId" }, { status: 400 });
  }
  if (mimeType && !AUDIO_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: "File must be an audio recording" }, { status: 400 });
  }

  const ext = extFromFilename(filename) || ".m4a";
  const storagePath = `${user.id}/${toolId}${ext}`;

  // Delete existing file for this slot (if any) before creating a new signed URL
  const existing = await getVizRecordings(user.id);
  if (existing[toolId]) {
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(existing[toolId])}`,
      { method: "DELETE", headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    ).catch(() => {}); // non-fatal
  }

  // Ask Supabase Storage for a signed upload URL
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );

  if (!signRes.ok) {
    const txt = await signRes.text().catch(() => "");
    console.error("[viz-recording] sign upload failed", signRes.status, txt);
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 502 });
  }

  const { signedURL } = (await signRes.json()) as { signedURL: string };
  // signedURL is a path like /storage/v1/object/upload/sign/viz-recordings/...?token=...
  const signedUrl = `${SUPABASE_URL}${signedURL}`;

  return NextResponse.json({ signedUrl, storagePath });
}

// ── GET — signed read URL for existing recording ──────────────────────────────

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const toolId = new URL(req.url).searchParams.get("toolId") ?? "";
  if (!ALLOWED_TOOLS.has(toolId)) return NextResponse.json({ error: "Invalid toolId" }, { status: 400 });

  const recordings = await getVizRecordings(user.id);
  const path = recordings[toolId];
  if (!path) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Create a short-lived signed read URL
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${encodeURIComponent(path)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ expiresIn: 7200 }), // 2 h
    },
  );

  if (!signRes.ok) return NextResponse.json({ error: "Could not sign URL" }, { status: 502 });

  const { signedURL } = (await signRes.json()) as { signedURL: string };
  return NextResponse.json({ url: `${SUPABASE_URL}${signedURL}` });
}

// ── DELETE — remove recording ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const toolId = new URL(req.url).searchParams.get("toolId") ?? "";
  if (!ALLOWED_TOOLS.has(toolId)) return NextResponse.json({ error: "Invalid toolId" }, { status: 400 });

  const recordings = await getVizRecordings(user.id);
  const path = recordings[toolId];

  if (path) {
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(path)}`,
      { method: "DELETE", headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    ).catch(() => {});
  }

  const next = { ...recordings };
  delete next[toolId];
  await dbPatch("profiles", { id: user.id }, { viz_recordings: next });

  return NextResponse.json({ ok: true });
}
