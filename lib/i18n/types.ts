/**
 * Supported app languages.
 *
 * Add new locales here. Each locale must provide a complete dictionary
 * matching `Dict` in dict.ts.
 */
export type Locale = "en" | "de" | "hu";

export const LOCALES: Locale[] = ["en", "de", "hu"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  hu: "Magyar",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  hu: "🇭🇺",
};

/** Default locale used when nothing else is specified. */
export const DEFAULT_LOCALE: Locale = "en";

/** Pick a locale from a possibly-undefined string with safe fallback. */
export function normaliseLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("hu")) return "hu";
  return "en";
}
