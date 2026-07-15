/**
 * Shared types + prompt for the coach AI digest loop.
 *
 * A digest reads an athlete's recent journal entries and produces:
 *  - summary: a short read of the trend (what's actually going on)
 *  - draft_message: a message the coach could send, in the PowerFlow
 *    coaching-AI voice — inquiry-driven, warm, body-aware, choice-honouring.
 * The coach always reviews the draft; nothing is sent automatically.
 */

export interface DigestEntry {
  created_at: string;
  content: string;
  sentiment?: string | null;
  /** "journal" (free-form) or "training" (structured training-day log). */
  kind?: "journal" | "training";
}

/** Flatten a training-day log's filled fields into one reflective block. */
export function trainingLogText(fields: {
  thoughts_before?: string | null;
  thoughts_after?: string | null;
  what_went_well?: string | null;
  frustrations?: string | null;
  next_session?: string | null;
}): string {
  const parts: string[] = [];
  if (fields.thoughts_before?.trim()) parts.push(`Before top sets: ${fields.thoughts_before.trim()}`);
  if (fields.thoughts_after?.trim())  parts.push(`After top sets: ${fields.thoughts_after.trim()}`);
  if (fields.what_went_well?.trim())  parts.push(`Went well: ${fields.what_went_well.trim()}`);
  if (fields.frustrations?.trim())    parts.push(`Frustrated by: ${fields.frustrations.trim()}`);
  if (fields.next_session?.trim())    parts.push(`Next session focus: ${fields.next_session.trim()}`);
  return parts.join("\n");
}

export interface DigestOutput {
  summary: string;
  draft_message: string;
}

export const DIGEST_MODEL = "claude-sonnet-4-5";

export const DIGEST_SYSTEM = `You are the PowerFlow coaching AI, drafting on behalf of a human sports-psychology coach who works with competitive powerlifters. You think and write the way this coach does: inquiry-driven, body-aware, choice-honouring, long-game oriented, warm but never saccharine. You never go clinical — if serious mental-health signals appear (persistent hopelessness, disordered eating patterns, self-harm), you gently flag that it may need a therapist rather than a sports coach.

You are given an athlete's recent reflections, oldest first. These may be free-form journal entries and/or structured training-day logs (before/after top sets, what went well, frustrations, next-session focus). Read them as one picture. Your job has two parts:

1. "summary" — 2-4 sentences for the COACH's eyes only. Name the actual trend across the entries, not a restatement of each one. What's the throughline? What's shifting? What's the athlete circling but not quite naming? Be specific and honest; this is a briefing, not a pep talk.

2. "draft_message" — a message written TO the athlete, in the coach's voice, that the coach can review and send. Reference something concrete they wrote so it's clearly personal. Follow the coach's method: acknowledge where they are before any work, reflect the pattern you're noticing, and offer ONE question or one direction — not a list. Keep it to roughly 4-8 sentences. Do not invent facts they didn't share. Do not sign off with a name.

Return ONLY valid JSON: {"summary": "...", "draft_message": "..."}. No markdown, no code fences.`;

export function buildDigestUserPrompt(athleteName: string, entries: DigestEntry[]): string {
  const body = entries
    .map((e, i) => {
      const date = e.created_at.slice(0, 10);
      const label = e.kind === "training" ? "Training-day log" : "Journal entry";
      const sent = e.sentiment ? ` [${e.sentiment}]` : "";
      return `${label} ${i + 1} — ${date}${sent}:\n${e.content.trim()}`;
    })
    .join("\n\n");
  return `Athlete: ${athleteName}\nRecent reflections (${entries.length}), oldest first:\n\n${body}`;
}

/** Best-effort parse of the model's JSON (tolerates stray code fences). */
export function parseDigest(raw: string): DigestOutput | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as Partial<DigestOutput>;
    if (typeof obj.summary === "string" && typeof obj.draft_message === "string") {
      return { summary: obj.summary.trim(), draft_message: obj.draft_message.trim() };
    }
  } catch {
    return null;
  }
  return null;
}
