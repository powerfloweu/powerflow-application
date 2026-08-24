/**
 * Keeping Coach AI useful when the model is unavailable.
 *
 * The Anthropic account can run out of credit, get rate limited, or the API can
 * be briefly overloaded. Before this existed, any of those threw before the
 * response was constructed, Next returned a bare 500, and the athlete saw
 * "Sorry, something went wrong. Please try again." — which is both unhelpful
 * and untrue, since trying again changes nothing.
 *
 * The replacement is a deterministic, zero-token reply. Two rules govern it:
 *
 *   1. It never pretends to be the coach. It says plainly that the AI is
 *      unavailable and that what follows is a fixed suggestion. Athletes bring
 *      real distress here; a canned line dressed up as a considered response
 *      would be worse than an honest error.
 *   2. It only points at things that already exist — a library tool, their
 *      journal, their human coach. It does not attempt advice of its own.
 */

import { TOOL_MIN_TIER } from "./toolTiers";
import { hasAccess, type PlanTier } from "./plan";

// ── Detecting the condition ──────────────────────────────────────────────────

export type AiOutage =
  /** Out of credit, or over a spend cap. Retrying will not help. */
  | "quota"
  /** Rate limited or temporarily overloaded. Retrying later will help. */
  | "busy"
  /** Anything else — misconfigured key, network, unknown. */
  | "error";

/**
 * Classifies a thrown Anthropic SDK error.
 *
 * Deliberately reads the message text as well as the status: a credit
 * exhaustion arrives as a 400 `invalid_request_error`, which is otherwise
 * indistinguishable from a genuinely malformed request.
 */
export function classifyAiError(err: unknown): AiOutage {
  const e = err as { status?: number; message?: string; error?: { error?: { message?: string } } };
  const status = typeof e?.status === "number" ? e.status : undefined;
  const text = `${e?.message ?? ""} ${e?.error?.error?.message ?? ""}`.toLowerCase();

  if (text.includes("credit balance") || text.includes("billing") || text.includes("quota")) {
    return "quota";
  }
  if (status === 429 || status === 529 || text.includes("rate limit") || text.includes("overloaded")) {
    return "busy";
  }
  if (status === 400 && text.includes("insufficient")) return "quota";
  return "error";
}

/**
 * Whether trying again could plausibly work. Out of credit: no amount of
 * retrying helps, and telling someone to "try again" is simply false.
 */
export function isRetryable(outage: AiOutage): boolean {
  return outage !== "quota";
}

/**
 * One line for any AI-backed feature that is not the chat — voice parsing,
 * summaries, digests. Says what is actually true, including that retrying
 * will not help when the account is out of credit.
 */
export function outageMessage(outage: AiOutage): string {
  switch (outage) {
    case "quota":
      return "AI features are paused right now — the PowerFlow account is out of API credit. Everything else in the app still works, and nothing you entered has been lost.";
    case "busy":
      return "The AI is busy at the moment. Give it a minute and try again.";
    default:
      return "Couldn't reach the AI just now. Please try again shortly.";
  }
}

// ── Routing to something that still works ────────────────────────────────────

interface ToolSuggestion {
  /** Tool id, matching TOOL_MIN_TIER and the library route. */
  id: string;
  label: string;
  /** Why this tool, in one clause. */
  reason: string;
  /** Lowercase words that point at this tool. */
  cues: string[];
}

/**
 * Keyword → tool. Crude on purpose: a deterministic table an athlete can
 * predict beats a clever guess that is wrong under stress.
 */
const TOOL_ROUTES: readonly ToolSuggestion[] = [
  {
    id: "pmr",
    label: "Progressive muscle relaxation",
    reason: "for bringing physical tension down",
    cues: ["tense", "tension", "tight", "anxious", "anxiety", "nervous", "panic", "stressed", "stress", "shaking", "wound up"],
  },
  {
    id: "autogenic-training",
    label: "Autogenic training",
    reason: "for settling before sleep or between sessions",
    cues: ["sleep", "insomnia", "can't switch off", "cant switch off", "restless", "wired", "calm down", "recover"],
  },
  {
    id: "viz-squat",
    label: "Squat visualization",
    reason: "for rehearsing the lift before you do it",
    cues: ["squat", "squats"],
  },
  {
    id: "viz-bench",
    label: "Bench visualization",
    reason: "for rehearsing the lift before you do it",
    cues: ["bench", "press"],
  },
  {
    id: "viz-deadlift",
    label: "Deadlift visualization",
    reason: "for rehearsing the lift before you do it",
    cues: ["deadlift", "pull", "lockout"],
  },
  {
    id: "resource-activation",
    label: "Resource activation",
    reason: "for getting your energy up when you feel flat",
    cues: ["flat", "unmotivated", "no energy", "tired", "can't be bothered", "cant be bothered", "dread", "lazy"],
  },
  {
    id: "affirmations",
    label: "Affirmations",
    reason: "for the sessions where your head is not in it",
    cues: ["confidence", "confident", "doubt", "self talk", "self-talk", "imposter", "not good enough", "believe"],
  },
  {
    id: "comp-day-viz",
    label: "Competition day visualization",
    reason: "for walking through meet day in advance",
    cues: ["meet", "comp", "competition", "platform", "attempt", "openers", "nationals", "worlds"],
  },
];

/** The tool whose cues best match the message, if any, and that the athlete can open. */
export function suggestTool(message: string, tier: PlanTier): ToolSuggestion | null {
  const text = message.toLowerCase();
  let best: { tool: ToolSuggestion; hits: number } | null = null;

  for (const tool of TOOL_ROUTES) {
    // Never point at a tool their tier cannot open.
    if (!hasAccess(tier, TOOL_MIN_TIER[tool.id])) continue;
    const hits = tool.cues.filter((c) => text.includes(c)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { tool, hits };
  }
  return best?.tool ?? null;
}

// ── The reply ────────────────────────────────────────────────────────────────

export interface OfflineReplyOptions {
  /** The athlete's last message, used only for keyword routing. */
  message: string;
  tier: PlanTier;
  /** First name of their coach, when they have one. */
  coachName?: string | null;
}

/**
 * A fixed reply, assembled from templates. No model, no tokens.
 *
 * Written to be honest first and useful second — it opens by saying what is
 * actually going on, because an athlete who has just typed something difficult
 * deserves to know a person or a script is answering, not a coach.
 */
export function offlineReply({ message, tier, coachName }: OfflineReplyOptions): string {
  const parts: string[] = [
    "Coach AI is temporarily unavailable, so this is an automatic reply rather than a real one — I haven't read what you wrote.",
  ];

  const tool = suggestTool(message, tier);
  if (tool) {
    parts.push(
      `Based on a word in your message, one thing in the library that might fit: **${tool.label}** — ${tool.reason}. You'll find it under Tools.`,
    );
  } else {
    parts.push(
      "Everything else in the app still works — the guided tools under Tools, your journal, and your check-ins.",
    );
  }

  parts.push(
    coachName
      ? `If it's something you'd rather not sit on, write it in your journal and tag @${coachName} — they'll see it.`
      : "If it would help to get it out of your head now, write it in your journal — it'll be there when Coach AI is back.",
  );

  parts.push("Your message has been saved. Nothing you wrote is lost.");

  return parts.join("\n\n");
}
