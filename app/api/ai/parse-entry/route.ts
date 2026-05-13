/**
 * POST /api/ai/parse-entry
 *
 * Transcribes a voice recording or OCRs a handwritten photo, then uses Claude
 * to map the raw text to structured journal / training-log fields.
 *
 * Request: multipart/form-data
 *   file     — audio or image Blob
 *   fileType — "audio" | "image"
 *   mode     — "journal" | "training"
 *
 * Response:
 *   { type: "journal", content: string, rawText: string }
 *   { type: "training", rawText: string, thoughts_before?, thoughts_after?,
 *     what_went_well?, frustrations?, next_session? }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ─── ElevenLabs Scribe STT ───────────────────────────────────────────────────

async function transcribeAudio(file: File): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

  const fd = new FormData();
  fd.append("audio", file, file.name);
  fd.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: fd,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Transcription failed (${res.status}): ${msg}`);
  }

  const data = await res.json() as { text?: string };
  return (data.text ?? "").trim();
}

// ─── Claude Vision OCR ───────────────────────────────────────────────────────

type ClaudeImageType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const SUPPORTED_IMAGE_TYPES: ClaudeImageType[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

function toClaudeImageType(mimeType: string): ClaudeImageType {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType as ClaudeImageType)) {
    return mimeType as ClaudeImageType;
  }
  // Default to jpeg for unknown formats (HEIC, etc.)
  return "image/jpeg";
}

async function ocrImage(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mediaType = toClaudeImageType(file.type || "image/jpeg");

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Extract all handwritten text from this image exactly as written.
Preserve the structure — section labels (like "Before Topset:", "After Topset:", "What went well:", "What to improve:", "Next session:"), exercise names, weights, reps, and any other notes.
Output only the extracted text, nothing else.`,
          },
        ],
      },
    ],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

// ─── Claude parsing ──────────────────────────────────────────────────────────

type TrainingFields = {
  thoughts_before?: string;
  thoughts_after?: string;
  what_went_well?: string;
  frustrations?: string;
  next_session?: string;
};

async function parseForTraining(rawText: string): Promise<TrainingFields> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are parsing an athlete's handwritten or spoken powerlifting training log.

Raw text:
---
${rawText}
---

Map the content to these 5 fields. Use only what is present — do not invent. Omit fields with no matching content.

Fields:
- thoughts_before: Mental state / feelings BEFORE the main set (e.g. "Before Topset", "Before:")
- thoughts_after: How they felt AFTER the main set (e.g. "After Topset", "After:")
- what_went_well: Positives, wins, confidence, what worked
- frustrations: Issues, what to improve, concerns (e.g. "What to improve", "Frustrated by")
- next_session: Plans, goals, or focus for the next session (e.g. "Next session focus")

Exercise names, sets, reps, and weights can be included in thoughts_after or what_went_well if relevant to how the session felt.

Respond with valid JSON only, no markdown, no explanation.
Example: {"thoughts_before":"Pretty nonchalant but tweaked my pec Sunday","thoughts_after":"Happy","what_went_well":"Confidence","frustrations":"Control"}`,
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
  // Strip any markdown code fences Claude might add
  const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    return JSON.parse(clean) as TrainingFields;
  } catch {
    console.error("[parse-entry] JSON parse failed:", clean);
    return {};
  }
}

async function parseForJournal(rawText: string): Promise<{ content: string }> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `The following is an athlete's spoken or handwritten journal note. Clean it up into a well-formed, first-person journal entry. Fix obvious transcription errors and filler words, but keep the tone, emotion, and meaning intact. Do not add anything not present in the original. Output only the cleaned text.

Raw:
${rawText}`,
      },
    ],
  });

  const content = msg.content[0].type === "text" ? msg.content[0].text.trim() : rawText;
  return { content };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const mode     = formData.get("mode")     as string | null;
  const fileType = formData.get("fileType") as string | null;
  const file     = formData.get("file")     as File | null;

  if (!file || !mode || !fileType) {
    return NextResponse.json({ error: "Missing required fields: file, mode, fileType" }, { status: 400 });
  }
  if (!["journal", "training"].includes(mode)) {
    return NextResponse.json({ error: "mode must be 'journal' or 'training'" }, { status: 400 });
  }
  if (!["audio", "image"].includes(fileType)) {
    return NextResponse.json({ error: "fileType must be 'audio' or 'image'" }, { status: 400 });
  }

  // Step 1 — extract raw text
  let rawText: string;
  try {
    if (fileType === "audio") {
      rawText = await transcribeAudio(file);
    } else {
      rawText = await ocrImage(file);
    }
  } catch (err) {
    console.error("[parse-entry] Extraction error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 },
    );
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: "No text could be extracted from the recording or photo" }, { status: 422 });
  }

  // Step 2 — parse into structured fields
  try {
    if (mode === "journal") {
      const parsed = await parseForJournal(rawText);
      return NextResponse.json({ type: "journal", ...parsed, rawText });
    } else {
      const parsed = await parseForTraining(rawText);
      return NextResponse.json({ type: "training", ...parsed, rawText });
    }
  } catch (err) {
    console.error("[parse-entry] Parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parsing failed" },
      { status: 500 },
    );
  }
}
