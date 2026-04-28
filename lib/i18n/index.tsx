/**
 * i18n public surface — import from "@/lib/i18n".
 *
 * - useT() in client components → { t, locale, setLocale }
 * - getDict(locale) in server components / utilities
 */
"use client";

import React from "react";
import { en } from "./en";
import { de } from "./de";
import { hu } from "./hu";
import type { Dict } from "./en";
import { DEFAULT_LOCALE, type Locale, normaliseLocale } from "./types";

const DICTS: Record<Locale, Dict> = { en, de, hu };

const LOCAL_STORAGE_KEY = "powerflow.locale";

// ── Translator ───────────────────────────────────────────────────────────────

/**
 * Walk a nested dictionary using a dot-separated path.
 * Returns the EN value if the key is missing in the target locale.
 *
 * Supports `{name}` interpolation via the second argument.
 */
function translate(
  dict: Dict,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      cur = undefined;
      break;
    }
  }
  if (typeof cur !== "string") {
    // Fallback: try EN
    let fb: unknown = en;
    for (const p of parts) {
      if (fb && typeof fb === "object" && p in (fb as Record<string, unknown>)) {
        fb = (fb as Record<string, unknown>)[p];
      } else {
        fb = undefined;
        break;
      }
    }
    cur = typeof fb === "string" ? fb : path; // last resort: surface the key
  }
  let out = cur as string;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return out;
}

// ── Context ──────────────────────────────────────────────────────────────────

interface I18nContextValue {
  locale: Locale;
  /** Translate a dot-separated key with optional `{var}` interpolation. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /**
   * Change the active locale. Persists to localStorage immediately and (if a
   * profile is loaded) PATCHes /api/me asynchronously.
   */
  setLocale: (loc: Locale) => void;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from localStorage / browser locale on mount, then sync from
  // /api/me once that returns (profile language is the source of truth across
  // devices).
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setLocaleState(normaliseLocale(stored));
      } else if (typeof navigator !== "undefined") {
        setLocaleState(normaliseLocale(navigator.language));
      }
    } catch {
      // localStorage may be blocked; continue with default
    }

    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.language) {
          const loc = normaliseLocale(p.language);
          setLocaleState(loc);
          try { localStorage.setItem(LOCAL_STORAGE_KEY, loc); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = React.useCallback((loc: Locale) => {
    setLocaleState(loc);
    try { localStorage.setItem(LOCAL_STORAGE_KEY, loc); } catch {}
    // Persist to profile (fire and forget — UI already reflects the change)
    fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: loc }),
    }).catch(() => {});
  }, []);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(DICTS[locale], key, vars),
    [locale],
  );

  const value = React.useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access translations + current locale.
 *
 * Falls back to default locale if used outside an <I18nProvider> — useful
 * during isolated component tests but should never happen in app code.
 */
export function useT(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (ctx) return ctx;
  return {
    locale: DEFAULT_LOCALE,
    t: (key, vars) => translate(en, key, vars),
    setLocale: () => {},
  };
}

// Re-export types for convenience
export { LOCALES, LOCALE_LABELS, LOCALE_FLAGS, DEFAULT_LOCALE, normaliseLocale } from "./types";
export type { Locale } from "./types";
export type { Dict } from "./en";
