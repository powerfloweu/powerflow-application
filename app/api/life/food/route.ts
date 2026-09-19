/**
 * POST /api/life/food — AI food recognition.
 *
 * Accepts a photo (base64) and/or text description, returns structured
 * items with estimated macros. Uses Claude with Zod structured output
 * for guaranteed machine-readable JSON.
 *
 * Ported from tamas60/api/food.js — adapted to Next.js + TypeScript.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import { requireLifeUser } from "@/lib/lifeAuth";
import { foodSystemPrompt, type HandMeasurements } from "@/lib/nutrition";
import { classifyAiError } from "@/lib/aiFallback";

export const dynamic = "force-dynamic";

const FoodItem = z.object({
  name: z.string().describe("Short name of the food item (e.g. 'grilled chicken breast', 'rice')"),
  grams: z.number().describe("Estimated quantity in grams"),
  kcal: z.number(),
  protein: z.number().describe("grams"),
  carbs: z.number().describe("grams"),
  fat: z.number().describe("grams"),
});

const FoodResult = z.object({
  items: z.array(FoodItem).describe("One entry per recognized food item"),
  confidence: z
    .enum(["low", "medium", "good"])
    .describe("How reliable is the quantity estimate"),
  note: z
    .string()
    .describe(
      "A short note to the user: what's uncertain, or what might be missing " +
        '(e.g. "If there was butter on the bread, add ~100 kcal."). Empty if nothing to say.',
    ),
});

export async function POST(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Food recognition is not configured (ANTHROPIC_API_KEY missing)." },
      { status: 503 },
    );
  }

  let body: {
    image?: string;
    media_type?: string;
    text?: string;
    ate?: string;
    plateCm?: number;
    hand?: HandMeasurements;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const description = String(body.text ?? "").trim().slice(0, 500);
  if (!body.image && !description) {
    return NextResponse.json({ error: "A photo or a short description is required." }, { status: 400 });
  }

  // Build the user message: image (if any) + text
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
  if (body.image) {
    const mt = (["image/jpeg", "image/png", "image/webp"] as string[]).includes(body.media_type ?? "")
      ? (body.media_type as "image/jpeg" | "image/png" | "image/webp")
      : "image/jpeg";
    content.push({
      type: "image",
      source: { type: "base64", media_type: mt, data: body.image },
    });
  }

  const ateMap: Record<string, string> = {
    all: "I ate all of it.",
    half: "I ate about half.",
    little: "I only had a little bit.",
  };
  const parts: string[] = [];
  if (description) parts.push(`Description: ${description}`);
  parts.push(ateMap[body.ate ?? "all"] ?? ateMap.all);
  if (!body.image) parts.push("No photo — estimate from the description and a typical serving.");
  content.push({ type: "text", text: parts.join("\n") });

  const apiKey = String(process.env.ANTHROPIC_API_KEY).trim().replace(/^["']|["']$/g, "");
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      // Short structured extraction — medium effort is enough, and response
      // time matters to someone holding a phone over a plate.
      output_config: { effort: "medium", format: zodOutputFormat(FoodResult) },
      system: foodSystemPrompt({
        plateCm: Number(body.plateCm) || 26,
        hand: body.hand,
      }),
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Could not process this image." }, { status: 422 });
    }
    const out = response.parsed_output;
    if (!out) return NextResponse.json({ error: "No usable response." }, { status: 502 });

    // Round + filter empty items
    const items = out.items
      .filter((i) => i && String(i.name ?? "").trim() && Number(i.grams) > 0)
      .map((i) => ({
        name: String(i.name).trim(),
        grams: Math.round(i.grams),
        kcal: Math.round(i.kcal),
        protein: Math.round(i.protein),
        carbs: Math.round(i.carbs),
        fat: Math.round(i.fat),
      }));

    const sum = (k: "kcal" | "protein" | "carbs" | "fat") => items.reduce((a, i) => a + i[k], 0);
    return NextResponse.json({
      ok: true,
      items,
      confidence: out.confidence,
      note: out.note,
      totals: { kcal: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") },
      usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
    });
  } catch (e: unknown) {
    const kind = classifyAiError(e);
    if (kind === "quota") {
      return NextResponse.json({ error: "AI credits are currently exhausted. Try again later or log manually." }, { status: 503 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Too many requests — try again in a minute." }, { status: 429 });
    }
    if (e instanceof Anthropic.BadRequestError) {
      console.error("[food] 400:", (e as Error).message);
      return NextResponse.json({ error: "Could not process the image (too large or invalid format?)." }, { status: 400 });
    }
    if (e instanceof Anthropic.APIError) {
      console.error("[food] API", (e as InstanceType<typeof Anthropic.APIError>).status, (e as Error).message);
      return NextResponse.json({ error: "Recognition service is not responding." }, { status: 502 });
    }
    console.error("[food]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
