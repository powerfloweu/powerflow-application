/**
 * Applications to become a PowerFlow affiliated coach.
 *
 * The public form at /coaches/apply, the POST route and the admin tab all read
 * the option lists and the validator from here.
 *
 * The question set is a first pass — enough to tell a serious applicant from a
 * speculative one — and is expected to change once the affiliate criteria are
 * settled. Adding or removing a field means: this file, the migration, the
 * form, and the admin detail panel.
 */

import { COUNTRY_IDS } from "./countries";

export const QUALIFICATIONS = [
  { id: "sport-psych-phd", label: "Sport psychologist (PhD)" },
  { id: "sport-psych-msc", label: "Sport psychologist (MSc)" },
  { id: "psych-other",     label: "Psychology degree, other field" },
  { id: "mental-cert",     label: "Mental performance certification" },
  { id: "strength-coach",  label: "Strength / powerlifting coach" },
  { id: "studying",        label: "Currently studying" },
  { id: "other",           label: "Something else" },
] as const;

export const EXPERIENCE_BANDS = [
  { id: "lt1",   label: "Less than a year" },
  { id: "1to3",  label: "1–3 years" },
  { id: "3to5",  label: "3–5 years" },
  { id: "5to10", label: "5–10 years" },
  { id: "gt10",  label: "More than 10 years" },
] as const;

/**
 * Languages a coach can work in. Matches the app's own locales plus an escape
 * hatch — an athlete's language decides who can actually take them on.
 */
export const COACH_LANGUAGES = [
  { id: "en",    label: "English" },
  { id: "de",    label: "German" },
  { id: "hu",    label: "Hungarian" },
  { id: "other", label: "Another language" },
] as const;

export type ApplicationStatus = "new" | "reviewing" | "accepted" | "declined";

export const APPLICATION_STATUSES: readonly ApplicationStatus[] =
  ["new", "reviewing", "accepted", "declined"];

const QUALIFICATION_IDS = QUALIFICATIONS.map((q) => q.id) as readonly string[];
const EXPERIENCE_IDS    = EXPERIENCE_BANDS.map((e) => e.id) as readonly string[];
const LANGUAGE_IDS      = COACH_LANGUAGES.map((l) => l.id) as readonly string[];

// ── Validation ───────────────────────────────────────────────────────────────

export interface CoachApplication {
  fullName: string;
  email: string;
  country: string | null;
  instagram: string | null;
  website: string | null;
  qualification: string | null;
  experience: string | null;
  languages: string[];
  athletes: string | null;
  motivation: string;
}

export type ApplyValidation =
  | { ok: true;  value: CoachApplication }
  | { ok: false; error: string };

/** Same permissive rule as the seminar form — a real typo is caught by the
 *  confirmation email, not by a regex pretending to implement RFC 5322. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

const MAX = { name: 120, email: 200, handle: 80, url: 300, athletes: 1000, motivation: 3000 };

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function pickIds(v: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set(v.filter((x): x is string => typeof x === "string"));
  return allowed.filter((id) => seen.has(id));
}

/** Strips a leading @ and any profile URL people paste instead of a handle. */
export function normaliseHandle(raw: string): string {
  return raw
    // The scheme is optional — people paste "instagram.com/handle" as often
    // as they paste the full URL.
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "")
    .replace(/^@/, "")
    .trim();
}

/** Adds a scheme so the stored value is a usable href, and rejects junk. */
export function normaliseUrl(raw: string): string | null {
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    // A bare word like "portfolio" parses as a host — insist on a dot.
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function validateApplication(raw: unknown): ApplyValidation {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid submission." };
  const r = raw as Record<string, unknown>;

  const fullName = str(r.fullName);
  if (!fullName)                  return { ok: false, error: "Please enter your name." };
  if (fullName.length > MAX.name) return { ok: false, error: "That name is too long." };

  const email = str(r.email).toLowerCase();
  if (!email)                   return { ok: false, error: "Please enter your email address." };
  if (email.length > MAX.email) return { ok: false, error: "That email address is too long." };
  if (!EMAIL_RE.test(email))    return { ok: false, error: "That email address doesn't look right." };

  const motivation = str(r.motivation);
  if (motivation.length < 40) {
    return { ok: false, error: "Tell us a little more about why you want to coach with PowerFlow." };
  }

  if (r.consent !== true) {
    return { ok: false, error: "Please confirm we can contact you about your application." };
  }

  const rawCountry = str(r.country);
  const rawQual    = str(r.qualification);
  const rawExp     = str(r.experience);

  return {
    ok: true,
    value: {
      fullName,
      email,
      country:       COUNTRY_IDS.includes(rawCountry)     ? rawCountry : null,
      instagram:     normaliseHandle(str(r.instagram)).slice(0, MAX.handle) || null,
      website:       normaliseUrl(str(r.website).slice(0, MAX.url)),
      qualification: QUALIFICATION_IDS.includes(rawQual)  ? rawQual : null,
      experience:    EXPERIENCE_IDS.includes(rawExp)      ? rawExp  : null,
      languages:     pickIds(r.languages, LANGUAGE_IDS),
      athletes:      str(r.athletes).slice(0, MAX.athletes) || null,
      motivation:    motivation.slice(0, MAX.motivation),
    },
  };
}

// ── Display helpers ──────────────────────────────────────────────────────────

export function qualificationLabel(id: string | null): string {
  if (!id) return "—";
  return QUALIFICATIONS.find((q) => q.id === id)?.label ?? id;
}

export function experienceLabel(id: string | null): string {
  if (!id) return "—";
  return EXPERIENCE_BANDS.find((e) => e.id === id)?.label ?? id;
}

export function languageLabels(ids: string[] | null | undefined): string {
  if (!ids?.length) return "—";
  return ids.map((id) => COACH_LANGUAGES.find((l) => l.id === id)?.label ?? id).join(", ");
}
