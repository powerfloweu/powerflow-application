/**
 * POST /api/coach/checkin-audio
 * Accepts a multipart/form-data upload with field "audio" (audio/webm or audio/mp4).
 * Uploads to Supabase Storage bucket "coach-audio" and returns the public URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET       = "coach-audio";

async function getCoachId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
  }

  // Max 10 MB
  if (audioFile.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio file too large (max 10 MB)" }, { status: 413 });
  }

  const ext = audioFile.type.includes("mp4") ? "mp4" : "webm";
  const path = `${coachId}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": audioFile.type || "audio/webm",
    },
    body: audioFile,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text().catch(() => "");
    // Bucket may not exist yet — try to create it first
    if (uploadRes.status === 404 || uploadRes.status === 400) {
      await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
      });
      // Retry upload
      const retry = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": audioFile.type || "audio/webm",
        },
        body: audioFile,
      });
      if (!retry.ok) {
        return NextResponse.json({ error: "Upload failed after bucket creation" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: `Upload failed: ${err}` }, { status: 500 });
    }
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  return NextResponse.json({ url: publicUrl });
}
