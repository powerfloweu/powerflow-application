/**
 * POST /api/tts
 * body: { text: string, voiceId?: string }
 * Auth required. Streams audio back from ElevenLabs.
 * Uses ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID env vars.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit — ElevenLabs bills per character.
  const rl = await rateLimit(`tts:${user.id}`, { limit: 60, windowSec: 60 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: { text: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text: rawText, voiceId: bodyVoiceId } = body;
  if (!rawText || typeof rawText !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  // ElevenLabs streaming endpoint has a ~2500-char limit per request. Coach-AI
  // scripts routinely exceed this — reject explicitly instead of silently
  // truncating, which used to produce audio that just stopped mid-sentence
  // with no indication anything was cut.
  if (rawText.length > 2500) {
    return NextResponse.json(
      { error: "This script is too long to read aloud — please shorten it and try again." },
      { status: 413 },
    );
  }
  const text = rawText;

  const voiceId =
    bodyVoiceId ??
    process.env.ELEVENLABS_VOICE_ID ??
    "pMsXgVXv3BLzUgSXRplE"; // Adam (default)

  // ElevenLabs voice IDs are alphanumeric, ~20 chars. bodyVoiceId is
  // client-supplied (either one of the fixed Coach AI voices or a coach's
  // cloned voice ID stored in profiles.tts_voice_id) — validate it before
  // interpolating into the request URL rather than trusting it outright.
  if (!/^[a-zA-Z0-9]{16,32}$/.test(voiceId)) {
    return NextResponse.json({ error: "Invalid voice ID" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
          speed: 0.80, // Slower pace — guided imagery needs processing time
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("[tts] ElevenLabs error", response.status, errorText);
    return NextResponse.json({ error: "TTS service error" }, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
}
