/**
 * GET /api/tools/audio?file=<filename>
 * Returns a short-lived signed URL for the requested tool audio file.
 * Requires an authenticated session. File must be in the allowlist.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Only these files may be requested — prevents path traversal
const ALLOWED_FILES = new Set([
  "Visualization_Squat_EN_fin.m4a",
  "Visualization_Bench_EN_fin.m4a",
  "Visualization_Deadlift_EN_fin.m4a",
  "SikerPillanata_EN_fin.m4a",
  "ProgRelax_EN_final.m4a",
  "AT_Base.m4a",
]);

export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = new URL(req.url).searchParams.get("file") ?? "";
  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  // Ask Supabase Storage to sign the URL (works for both public & private buckets)
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/tools/${encodeURIComponent(file)}`,
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

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[tools/audio] sign failed", res.status, txt);
    return NextResponse.json({ error: "Could not sign URL" }, { status: 502 });
  }

  const { signedURL } = (await res.json()) as { signedURL: string };
  // signedURL is a path like /storage/v1/object/sign/tools/...?token=...
  return NextResponse.json({ url: `${SUPABASE_URL}${signedURL}` });
}
