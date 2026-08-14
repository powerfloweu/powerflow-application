/**
 * POST /api/reflections/:setId/audio
 *   Upload a voice note for a reflection set's note thread. Multipart form
 *   data, field "audio" (audio/webm or audio/mp4, max 10 MB). Caller must be
 *   either the coach or the athlete on this set. Mirrors
 *   /api/coach/checkin-audio's upload path (same storage bucket), generalized
 *   so either side of a reflection thread can record a voice note — the
 *   coach's existing recorder component posts here just as it does there.
 *   Response: { url: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import type { ReflectionSetRow } from "@/lib/reflections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ setId: string }> };

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = "coach-audio";

export async function POST(req: NextRequest, { params }: Params) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { setId } = await params;

  const sets = await dbSelect<Pick<ReflectionSetRow, "id" | "coach_id" | "athlete_id" | "status">>("reflection_sets", {
    select: "id,coach_id,athlete_id,status",
    id: `eq.${setId}`,
    limit: "1",
  });
  const set = sets[0];
  if (!set) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isCoach = set.coach_id === user.id;
  const isAthlete = set.athlete_id === user.id && set.status !== "draft";
  if (!isCoach && !isAthlete) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "invalid form data" }, { status: 400 }); }

  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    return NextResponse.json({ error: "no audio file" }, { status: 400 });
  }
  if (audioFile.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "audio file too large (max 10 MB)" }, { status: 413 });
  }

  const ext = audioFile.type.includes("mp4") ? "mp4" : "webm";
  const path = `reflections/${setId}/${user.id}-${Date.now()}.${ext}`;

  const upload = async () => fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": audioFile.type || "audio/webm",
    },
    body: audioFile,
  });

  let uploadRes = await upload();
  if (!uploadRes.ok && (uploadRes.status === 404 || uploadRes.status === 400)) {
    // Bucket may not exist yet — create it (idempotent) and retry once.
    await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
    uploadRes = await upload();
  }

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "");
    console.error("[api/reflections/:setId/audio] upload failed", uploadRes.status, text);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  return NextResponse.json({ url: publicUrl });
}
