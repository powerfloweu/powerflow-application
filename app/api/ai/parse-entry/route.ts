/**
 * POST /api/ai/parse-entry
 *
 * Two input modes:
 *
 *   A) JSON body  { text: string, mode: "journal" | "training" }
 *      → Voice path: transcript already captured by browser Web Speech API.
 *        Skips transcription, goes straight to Claude field-parsing.
 *
 *   B) FormData   { file: Blob, fileType: "image", mode: "journal" | "training" }
 *      → Photo path: Claude Vision OCRs the image, then Claude parses the fields.
 *
 * Response:
 *   { type: "journal",  content: string, rawText: string }
 *   { type: "training", rawText: string, thoughts_before?, thoughts_after?,
 *                       what_went_well?, frustrations?, next_session? }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ─── Claude Vision OCR ───────────────────────────────────────────────────────

type ClaudeImageType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const SUPPORTED_IMAGE_TYPES: ClaudeImageType[] = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
];

function toClaudeImageType(mimeType: string): ClaudeImageType {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as ClaudeImageType)
    ? (mimeType as ClaudeImageType)
    : "image/jpeg"; // default for HEIC etc.
}

async function ocrImage(file: File): Promise<string> {
  const buffer    = await file.arrayBuffer();
  const base64    = Buffer.from(buffer).toString("base64");
  const mediaType = toClaudeImageType(file.type || "image/jpeg");

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
        {
          type: "text",
          text: `Extract all handwritten text from this image exactly as written.
Preserve section labels (like "Before Topset:", "After Topset:", "What went well:", "What to improve:", "Next session:"), exercise names, weights, reps, and any other notes.
Output only the extracted text, nothing else.`,
        },
      ],
    }],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

// ─── Claude field parsing ─────────────────────────────────────────────────────

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
    messages: [{
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

Exercise names, sets, reps, and weights can be included in thoughts_after or what_went_well if relevant.

Respond with valid JSON only, no markdown, no explanation.
Example: {"thoughts_before":"Pretty nonchalant","thoughts_after":"Happy","what_went_well":"Confidence","frustrations":"Control"}`,
    }],
  });

  const raw   = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
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
    messages: [{
      role: "user",
      content: `The following is an athlete's spoken or handwritten journal note. Clean it up into a well-formed first-person journal entry. Fix obvious transcription errors and filler words, but keep the tone, emotion, and meaning. Do not add anything not present in the original. Output only the cleaned text.

Raw:
${rawText}`,
    }],
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

  const contentType = req.headers.get("content-type") ?? "";

  // ── Path A: JSON body (voice transcript from Web Speech API) ────────────────
  if (contentType.includes("application/json")) {
    let body: { text?: string; mode?: string };
    try {
      body = await req.json() as { text?: string; mode?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, mode } = body;
    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (!mode || !["journal", "training"].includes(mode)) {
      return NextResponse.json({ error: "mode must be 'journal' or 'training'" }, { status: 400 });
    }

    try {
      if (mode === "journal") {
        const parsed = await parseForJournal(text);
        return NextResponse.json({ type: "journal", ...parsed, rawText: text });
      } else {
        const parsed = await parseForTraining(text);
        return NextResponse.json({ type: "training", ...parsed, rawText: text });
      }
    } catch (err) {
      console.error("[parse-entry] Parse error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Parsing failed" },
        { status: 500 },
      );
    }
  }

  // ── Path B: FormData (photo OCR) ────────────────────────────────────────────
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
  if (fileType !== "image") {
    return NextResponse.json({ error: "fileType must be 'image'" }, { status: 400 });
  }

  let rawText: string;
  try {
    rawText = await ocrImage(file);
  } catch (err) {
    console.error("[parse-entry] OCR error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OCR failed" },
      { status: 500 },
    );
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: "No text could be extracted from the photo" }, { status: 422 });
  }

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
