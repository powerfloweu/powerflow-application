/**
 * Single source of truth for the "Mental Performance for Coaches" seminar.
 *
 * The public page (`app/seminar/page.tsx`), the manage page, the sign-up API
 * and the admin tab all read the config, the topics, the host list and the
 * validator from here, so the form, the stored rows and the admin summary can
 * never drift apart.
 */

import { COUNTRY_IDS, timeIn, dateIn } from "./countries";

// ── Config ───────────────────────────────────────────────────────────────────

export const SEMINAR = {
  slug: "mental-performance-coaches-2026-10",
  title: "Mental Performance for Coaches",
  /**
   * 3 October 2026, 10:00 Europe/Budapest. Budapest is on CEST (UTC+2) on that
   * date, so 08:00Z. Stored as an absolute instant so every surface can render
   * it in the reader's own timezone — most registrants are not in Hungary.
   */
  startsAt: "2026-10-03T08:00:00.000Z",
  /** What the hosts see on their own wall clock. */
  hostTimeLabel: "10:00 CEST · Budapest",
  durationLabel: "60–90 minutes",
  /** Settled: it is a seminar with a Q&A, not a workshop. */
  format: "Seminar with Q&A",
  formatNote: "A session from the three of us, then open questions.",
  /** Below this the seminar does not run. Owner-facing only — never shown publicly. */
  minParticipants: 10,
  /** Sign-ups past this land on the waitlist. */
  maxParticipants: 20,
} as const;

// ── Topics ───────────────────────────────────────────────────────────────────

export interface SeminarTopic {
  id: string;
  label: string;
  blurb: string;
}

/** Order is the order shown on the form. Ids are stored — never renumber them. */
export const SEMINAR_TOPICS: readonly SeminarTopic[] = [
  {
    id: "arousal",
    label: "Managing arousal — theirs and your own",
    blurb: "Reading activation level in the warm-up room, and what to do when it is too high or too flat. Includes your own state, since athletes borrow it.",
  },
  {
    id: "communication",
    label: "Communication around the platform",
    blurb: "What to say in the last sixty seconds before a lift, between attempts, and after a miss — and what is better left unsaid.",
  },
  {
    id: "personalities",
    label: "Understanding different athlete types",
    blurb: "Why the same cue lands for one athlete and shuts another down, and how to work out which kind you are standing next to.",
  },
  {
    id: "energy-matching",
    label: "Hype and energy-level matching",
    blurb: "Matching your intensity to what the athlete actually needs rather than what the room expects. When hype helps, and when it costs a lift.",
  },
  {
    id: "setbacks",
    label: "Negative emotions, setbacks and injuries",
    blurb: "Holding a bad meet, a long rehab or a lost season without either minimising it or being pulled under with them.",
  },
  {
    id: "burnout",
    label: "Self-care as an investment — burnout prevention",
    blurb: "Coaching load is emotional labour. Treating your own recovery as part of the job rather than what is left over after it.",
  },
  {
    id: "empathy-objectivity",
    label: "Empathy vs. objectivity — is it either/or?",
    blurb: "Whether caring about an athlete costs you your judgement, and how experienced coaches hold both at once.",
  },
] as const;

export const TOPIC_IDS: readonly string[] = SEMINAR_TOPICS.map((t) => t.id);

// ── Hosts ────────────────────────────────────────────────────────────────────

export interface SeminarHost {
  slug: string;
  name: string;
  /** Fallback when there is no photo — see `photo`. */
  initials: string;
  title: string;
  /** Why this person is worth an hour of a coach's Saturday morning. */
  intro: string;
  /** Path under /public, or null to render initials instead. */
  photo: string | null;
  instagram: string | null;
}

/**
 * Facts here mirror app/coaches/page.tsx — same people, same credentials, said
 * in the register of "who is teaching this" rather than "hire me 1:1". If a
 * coach's bio changes there, change it here too.
 */
export const SEMINAR_HOSTS: readonly SeminarHost[] = [
  {
    slug: "david",
    name: "David Sipos",
    initials: "DS",
    title: "Sport Psychologist (MSc) · PowerFlow founder",
    intro: "Built PowerFlow out of 600+ hours of practice with powerlifters, turning sport psychology into things coaches can actually use on the day — pre-meet routines, competition anxiety, attention under load. Works with athletes across IPF, USAPL and EPF.",
    photo: "/coaches/david.jpg",
    instagram: "powerfloweu",
  },
  {
    slug: "jay",
    name: "Jacqueline Ulrich",
    initials: "JU",
    title: "Mental Performance Coach",
    intro: "Competed internationally in powerlifting and coaches it, which is how she found the ceiling: past a point, development stops being about the training plan. She works on what athletes believe about themselves, and on the coach's side of that conversation.",
    photo: "/coaches/jay.jpg",
    instagram: "omgitsjacqueline",
  },
  {
    slug: "clarice",
    name: "Clarice Tighe",
    initials: "CT",
    title: "Sport Psychologist (MSc) · Odyssey Strength",
    intro: "Full-time performance mentality coach in Ireland and a competing powerlifter who has kept coming back to the platform through genuinely hard conditions. Her specialism is self-talk — the habits that hold an athlete together when the day is going badly.",
    photo: "/coaches/clarice.jpg",
    instagram: "clarice_odyssey",
  },
] as const;

/** "David, Jay and Clarice" — for running text and email sign-offs. */
export function hostNamesSentence(): string {
  const firsts = SEMINAR_HOSTS.map((h) => (h.slug === "jay" ? "Jay" : h.name.split(" ")[0]));
  return `${firsts.slice(0, -1).join(", ")} and ${firsts[firsts.length - 1]}`;
}

// ── Coaching context ─────────────────────────────────────────────────────────

export const COACHING_CONTEXTS = [
  { id: "powerlifting",  label: "Powerlifting / strength coach" },
  { id: "other-sport",   label: "Coach in another sport" },
  { id: "sc",            label: "Strength & conditioning" },
  { id: "practitioner",  label: "Sport psychologist / mental performance" },
  { id: "athlete",       label: "Athlete, not (yet) coaching" },
  { id: "student",       label: "Student" },
  { id: "other",         label: "Something else" },
] as const;

const CONTEXT_IDS = COACHING_CONTEXTS.map((c) => c.id) as readonly string[];

// ── Countries → local start time ─────────────────────────────────────────────

export {
  COUNTRIES, countryLabel, zoneForCountry, countryForZone,
  type SeminarCountry,
} from "./countries";

/** The seminar's start time on `tz`'s wall clock, e.g. "09:00". */
export function startTimeIn(tz: string | null): string | null {
  return timeIn(tz, SEMINAR.startsAt);
}

/** Same instant, same zone — but the date, which can differ across the line. */
export function startDateIn(tz: string | null): string | null {
  return dateIn(tz, SEMINAR.startsAt);
}

// ── Capacity ─────────────────────────────────────────────────────────────────

export type SignupStatus = "registered" | "waitlist" | "cancelled";

/** Spots left before the waitlist starts. Never negative. */
export function spotsLeft(registeredCount: number): number {
  return Math.max(0, SEMINAR.maxParticipants - registeredCount);
}

/** What status the next sign-up should get, given how many seats are taken. */
export function statusForNextSignup(registeredCount: number): SignupStatus {
  return registeredCount >= SEMINAR.maxParticipants ? "waitlist" : "registered";
}

/** Owner-facing only: has the seminar cleared its go/no-go threshold? */
export function meetsMinimum(registeredCount: number): boolean {
  return registeredCount >= SEMINAR.minParticipants;
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface SeminarSignup {
  fullName: string;
  email: string;
  country: string | null;
  context: string | null;
  topics: string[];
  question: string | null;
}

export type ValidationResult =
  | { ok: true;  value: SeminarSignup }
  | { ok: false; error: string };

/**
 * Deliberately permissive — this rejects things that are definitely not
 * addresses (no @, no dot in the domain, whitespace) rather than trying to
 * encode RFC 5322. A real typo is caught by the confirmation email, not here.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

const MAX = { name: 120, email: 200, question: 2000 };

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Keeps only known ids, de-duplicated, in the canonical display order. */
function pickIds(v: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set(v.filter((x): x is string => typeof x === "string"));
  return allowed.filter((id) => seen.has(id));
}

export function validateSignup(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid submission." };
  const r = raw as Record<string, unknown>;

  const fullName = str(r.fullName);
  if (!fullName)                  return { ok: false, error: "Please enter your name." };
  if (fullName.length > MAX.name) return { ok: false, error: "That name is too long." };

  const email = str(r.email).toLowerCase();
  if (!email)                   return { ok: false, error: "Please enter your email address." };
  if (email.length > MAX.email) return { ok: false, error: "That email address is too long." };
  if (!EMAIL_RE.test(email))    return { ok: false, error: "That email address doesn't look right." };

  const topics = pickIds(r.topics, TOPIC_IDS);
  if (topics.length === 0) {
    return { ok: false, error: "Pick at least one topic you'd like covered." };
  }

  if (r.consent !== true) {
    return { ok: false, error: "Please confirm we can email you about the seminar." };
  }

  const rawCountry = str(r.country);
  const rawContext = str(r.context);

  return {
    ok: true,
    value: {
      fullName,
      email,
      country:  COUNTRY_IDS.includes(rawCountry) ? rawCountry : null,
      context:  CONTEXT_IDS.includes(rawContext) ? rawContext : null,
      topics,
      question: str(r.question).slice(0, MAX.question) || null,
    },
  };
}

/** The subset a registrant may change later from the manage page. */
export type SeminarSelections = Pick<SeminarSignup, "topics" | "question">;

/**
 * Validates an edit from the manage page. Name and email are deliberately not
 * editable there: the link is emailed to one address, so allowing the address
 * to be changed would turn a leaked link into account takeover.
 */
export function validateSelections(raw: unknown):
  | { ok: true; value: SeminarSelections }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid submission." };
  const r = raw as Record<string, unknown>;

  const topics = pickIds(r.topics, TOPIC_IDS);
  if (topics.length === 0) {
    return { ok: false, error: "Keep at least one topic selected." };
  }

  return {
    ok: true,
    value: { topics, question: str(r.question).slice(0, MAX.question) || null },
  };
}

// ── Self-service management link ─────────────────────────────────────────────

/**
 * Absolute URL of the manage page for one sign-up. Absolute because it goes in
 * an email, where a relative path is meaningless.
 */
export function manageUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://app.power-flow.eu").replace(/\/+$/, "");
  return `${base}/seminar/manage/${token}`;
}

// ── Display helpers (shared by the public page and the admin tab) ────────────

export function topicLabel(id: string): string {
  return SEMINAR_TOPICS.find((t) => t.id === id)?.label ?? id;
}

export function contextLabel(id: string | null): string {
  if (!id) return "—";
  return COACHING_CONTEXTS.find((c) => c.id === id)?.label ?? id;
}

/** Topic ids ranked by how many people picked them. Ties keep display order. */
export function tallyTopics(rows: { topics: string[] }[]): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>(TOPIC_IDS.map((id) => [id, 0]));
  for (const row of rows) {
    for (const id of row.topics ?? []) {
      if (counts.has(id)) counts.set(id, counts.get(id)! + 1);
    }
  }
  return TOPIC_IDS
    .map((id) => ({ id, label: topicLabel(id), count: counts.get(id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}
