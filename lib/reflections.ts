/**
 * Coach-authored reflection sets — shared types + pure validation/merge logic.
 *
 * A coach writes a bespoke set of open-ended questions for one athlete
 * (e.g. "Becoming a coach"). The athlete answers at their own pace — partial
 * answers are normal and expected, never gated on completeness. A note
 * thread accumulates alongside the set so either side can add a written or
 * voice note over time.
 *
 * Table shapes (see supabase/migrations/20260814_reflection_sets.sql):
 *   reflection_sets    — one row per authored set (coach → athlete)
 *   reflection_answers — one row per set, JSONB answers keyed by question id
 *   reflection_notes   — many rows per set, threaded, either side can author
 *
 * This file holds only pure, framework-free logic so it's unit-testable
 * without hitting the network — the actual allowlist enforcement (rejecting
 * unknown JSONB keys) lives here and is called by both the create and update
 * routes so validation can't drift between them.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type QuestionKind = "text" | "commitment";

export interface ReflectionQuestion {
  id: string;
  prompt: string;
  helper?: string;
  kind: QuestionKind;
}

export type ReflectionSetStatus = "draft" | "sent" | "archived";

export interface ReflectionSetRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  title: string;
  intro: string | null;
  questions: ReflectionQuestion[];
  status: ReflectionSetStatus;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export interface ReflectionAnswerRow {
  id: string;
  reflection_set_id: string;
  athlete_id: string;
  answers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ReflectionNoteRow {
  id: string;
  reflection_set_id: string;
  author_id: string;
  body: string | null;
  audio_url: string | null;
  created_at: string;
}

// ── Validation limits ─────────────────────────────────────────────────────────

export const MAX_QUESTIONS = 20;
export const MAX_TITLE_LEN = 200;
export const MAX_INTRO_LEN = 4000;
export const MAX_PROMPT_LEN = 2000;
export const MAX_HELPER_LEN = 1000;
export const MAX_ANSWER_LEN = 20000;
export const MAX_NOTE_BODY_LEN = 10000;

const VALID_KINDS = new Set<QuestionKind>(["text", "commitment"]);

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Validate + normalize a raw `questions` payload into a clean array of
 * ReflectionQuestion, discarding any unknown keys (allowlist pattern — see
 * app/api/me/meet-config/route.ts for the precedent). Never trust the shape
 * of arbitrary JSON before it reaches JSONB storage.
 */
export function validateQuestions(raw: unknown): ValidationResult<ReflectionQuestion[]> {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "questions must be an array" };
  }
  if (raw.length > MAX_QUESTIONS) {
    return { ok: false, error: `questions must have at most ${MAX_QUESTIONS} items` };
  }

  const seenIds = new Set<string>();
  const cleaned: ReflectionQuestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "each question must be an object" };
    }
    const q = item as Record<string, unknown>;

    const id = typeof q.id === "string" ? q.id.trim() : "";
    if (!id) return { ok: false, error: "each question needs a non-empty id" };
    if (seenIds.has(id)) return { ok: false, error: `duplicate question id: ${id}` };
    seenIds.add(id);

    const prompt = typeof q.prompt === "string" ? q.prompt.trim() : "";
    if (!prompt) return { ok: false, error: `question ${id} needs a non-empty prompt` };
    if (prompt.length > MAX_PROMPT_LEN) {
      return { ok: false, error: `question ${id} prompt exceeds ${MAX_PROMPT_LEN} chars` };
    }

    const kind = q.kind;
    if (typeof kind !== "string" || !VALID_KINDS.has(kind as QuestionKind)) {
      return { ok: false, error: `question ${id} kind must be "text" or "commitment"` };
    }

    let helper: string | undefined;
    if (q.helper !== undefined && q.helper !== null) {
      if (typeof q.helper !== "string") {
        return { ok: false, error: `question ${id} helper must be a string` };
      }
      const h = q.helper.trim();
      if (h.length > MAX_HELPER_LEN) {
        return { ok: false, error: `question ${id} helper exceeds ${MAX_HELPER_LEN} chars` };
      }
      helper = h || undefined;
    }

    // Explicit allowlist construction — unknown keys on the input are
    // silently dropped rather than persisted into JSONB.
    cleaned.push({ id, prompt, kind: kind as QuestionKind, ...(helper ? { helper } : {}) });
  }

  return { ok: true, value: cleaned };
}

/** Validate a set title. */
export function validateTitle(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: "title must be a string" };
  const title = raw.trim();
  if (!title) return { ok: false, error: "title is required" };
  if (title.length > MAX_TITLE_LEN) return { ok: false, error: `title exceeds ${MAX_TITLE_LEN} chars` };
  return { ok: true, value: title };
}

/** Validate an optional intro paragraph. Returns null for empty/omitted. */
export function validateIntro(raw: unknown): ValidationResult<string | null> {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false, error: "intro must be a string" };
  const intro = raw.trim();
  if (intro.length > MAX_INTRO_LEN) return { ok: false, error: `intro exceeds ${MAX_INTRO_LEN} chars` };
  return { ok: true, value: intro || null };
}

/**
 * Validate + normalize an `answers` payload for a per-question autosave.
 * Every value must be a string (empty string clears an answer). Keys are
 * not checked against the set's question ids here — the caller may allow
 * saving an answer for a question that was later removed from the set
 * without losing the athlete's text; the UI only ever sends keys for
 * questions it rendered.
 */
export function validateAnswersPatch(raw: unknown): ValidationResult<Record<string, string>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "answers must be an object" };
  }
  const input = raw as Record<string, unknown>;
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") {
      return { ok: false, error: `answer for "${key}" must be a string` };
    }
    if (value.length > MAX_ANSWER_LEN) {
      return { ok: false, error: `answer for "${key}" exceeds ${MAX_ANSWER_LEN} chars` };
    }
    cleaned[key] = value;
  }
  return { ok: true, value: cleaned };
}

/**
 * Merge a partial answers patch into the existing stored answers.
 * Exactly like /api/meet-reflections POST: incoming keys overwrite,
 * everything else is preserved. Pure function — the caller does the I/O.
 */
export function mergeAnswers(
  existing: Record<string, string>,
  patch: Record<string, string>,
): Record<string, string> {
  return { ...existing, ...patch };
}

/** Validate a note body/audio_url pair — at least one must be present. */
export function validateNoteInput(raw: unknown): ValidationResult<{ body: string | null; audio_url: string | null }> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "invalid note payload" };
  }
  const input = raw as Record<string, unknown>;

  let body: string | null = null;
  if (input.body !== undefined && input.body !== null) {
    if (typeof input.body !== "string") return { ok: false, error: "body must be a string" };
    const trimmed = input.body.trim();
    if (trimmed.length > MAX_NOTE_BODY_LEN) {
      return { ok: false, error: `body exceeds ${MAX_NOTE_BODY_LEN} chars` };
    }
    body = trimmed || null;
  }

  let audio_url: string | null = null;
  if (input.audio_url !== undefined && input.audio_url !== null) {
    if (typeof input.audio_url !== "string") return { ok: false, error: "audio_url must be a string" };
    const trimmed = input.audio_url.trim();
    if (trimmed) {
      // Storage URLs only — never let an athlete/coach point this at an
      // arbitrary origin (the resulting <audio> tag would fetch it directly).
      if (!/^https:\/\//.test(trimmed)) {
        return { ok: false, error: "audio_url must be an https URL" };
      }
      audio_url = trimmed;
    }
  }

  if (!body && !audio_url) {
    return { ok: false, error: "note needs a body or audio_url" };
  }

  return { ok: true, value: { body, audio_url } };
}

/**
 * A set may only be sent (draft → sent) once it has at least one question —
 * an empty set sent to an athlete would render a card that opens to nothing.
 */
export function canSend(questions: ReflectionQuestion[]): boolean {
  return questions.length > 0;
}
