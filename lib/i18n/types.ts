/**
 * Supported app languages.
 *
 * Add new locales here. Each locale must provide a complete dictionary
 * matching `Dict` in dict.ts.
 */
export type Locale = "en" | "de" | "hu" | "es" | "fr";

export const LOCALES: Locale[] = ["en", "de", "hu", "es", "fr"];

/** Locales that can be selected by end-users in the app */
export const APP_LOCALES: Locale[] = ["en", "de", "hu", "es", "fr"];

/**
 * Locales with complete translations — shown in the language switcher.
 * Add a locale here only when its dictionary matches EN in coverage.
 * ES and FR are currently stubs (~12 keys vs ~1000 for EN/DE/HU).
 */
export const READY_LOCALES: Locale[] = ["en", "de", "hu"];

/** Locales available for translation (all non-English) */
export const TRANSLATABLE_LOCALES: Locale[] = ["de", "hu", "es", "fr"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  hu: "Magyar",
  es: "Español",
  fr: "Français",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  hu: "🇭🇺",
  es: "🇪🇸",
  fr: "🇫🇷",
};

/** Default locale used when nothing else is specified. */
export const DEFAULT_LOCALE: Locale = "en";

/** Pick a locale from a possibly-undefined string with safe fallback. */
export function normaliseLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("hu")) return "hu";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("fr")) return "fr";
  return "en";
}
