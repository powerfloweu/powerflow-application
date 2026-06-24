/**
 * POST /api/mux/upload          — create a Mux direct upload URL (auth required)
 * GET  /api/mux/upload?upload_id — poll asset status, returns playbackId when ready
 */
import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

const mux = new Mux({
  tokenId:     process.env.MUX_TOKEN_ID     ?? "",
  tokenSecret: process.env.MUX_TOKEN_SECRET ?? "",
});

async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? "*",
    new_asset_settings: {
      playback_policy: ["public"],
    },
  });

  return NextResponse.json({ uploadId: upload.id, uploadUrl: upload.url });
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uploadId = new URL(req.url).searchParams.get("upload_id");
  if (!uploadId) return NextResponse.json({ error: "upload_id required" }, { status: 400 });

  const upload = await mux.video.uploads.retrieve(uploadId);

  if (upload.status === "errored" || upload.status === "cancelled" || upload.status === "timed_out") {
    return NextResponse.json({ status: "error" });
  }
  if (!upload.asset_id) {
    return NextResponse.json({ status: "waiting" });
  }

  const asset = await mux.video.assets.retrieve(upload.asset_id);
  if (asset.status === "errored") {
    return NextResponse.json({ status: "error" });
  }
  if (asset.status !== "ready") {
    return NextResponse.json({ status: "processing" });
  }

  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) return NextResponse.json({ status: "processing" });

  return NextResponse.json({ status: "ready", playbackId });
}
