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
import { es } from "./es";
import { fr } from "./fr";
import type { Dict } from "./en";
import { DEFAULT_LOCALE, type Locale, normaliseLocale } from "./types";

// Compiled TS dictionaries — always available, used as fallback
const COMPILED: Record<Locale, Partial<Dict>> = { en, de, hu, es, fr };

const LOCAL_STORAGE_KEY = "powerflow.locale";

// ── Flat override map ─────────────────────────────────────────────────────────
// DB overrides are stored as flat dot-separated keys → value.
// e.g. { "nav.home": "Inicio", "today.greetingMorning": "Buenos días" }
type OverrideMap = Record<string, string>;

// ── Translator ───────────────────────────────────────────────────────────────

/**
 * Walk a nested dictionary using a dot-separated path.
 * DB overrides (flat key → value) take precedence over the compiled dict.
 * Falls back to EN if the key is missing in the target locale.
 *
 * Supports `{name}` interpolation via the second argument.
 */
function translate(
  dict: Partial<Dict>,
  path: string,
  vars?: Record<string, string | number>,
  overrides?: OverrideMap,
): string {
  // 1. Check DB overrides first (flat map, highest priority)
  let cur: unknown = overrides?.[path];

  // 2. Walk the compiled dict
  if (typeof cur !== "string") {
    const parts = path.split(".");
    let node: unknown = dict;
    for (const p of parts) {
      if (node && typeof node === "object" && p in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[p];
      } else {
        node = undefined;
        break;
      }
    }
    if (typeof node === "string") cur = node;
  }

  // 3. Fallback to EN compiled dict
  if (typeof cur !== "string") {
    const parts = path.split(".");
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

// Cache of DB overrides per locale — avoids re-fetching within a session
const overrideCache: Partial<Record<Locale, OverrideMap>> = {};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);
  const [overrides, setOverrides] = React.useState<OverrideMap>({});

  // Fetch DB overrides for a locale, using the in-memory cache
  const loadOverrides = React.useCallback(async (loc: Locale) => {
    if (loc === "en") { setOverrides({}); return; } // EN has no overrides
    if (overrideCache[loc]) { setOverrides(overrideCache[loc]!); return; }
    try {
      const res = await fetch(`/api/translations?locale=${loc}`);
      if (!res.ok) return;
      const map: OverrideMap = await res.json();
      overrideCache[loc] = map;
      setOverrides(map);
    } catch { /* network error — compiled dict is the fallback */ }
  }, []);

  // Hydrate from localStorage / browser locale on mount, then sync from
  // /api/me once that returns (profile language is the source of truth across
  // devices).
  React.useEffect(() => {
    let initialLocale = DEFAULT_LOCALE;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        initialLocale = normaliseLocale(stored);
      } else if (typeof navigator !== "undefined") {
        initialLocale = normaliseLocale(navigator.language);
      }
      setLocaleState(initialLocale);
    } catch {
      // localStorage may be blocked; continue with default
    }
    loadOverrides(initialLocale);

    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.language) {
          const loc = normaliseLocale(p.language);
          setLocaleState(loc);
          try { localStorage.setItem(LOCAL_STORAGE_KEY, loc); } catch {}
          loadOverrides(loc);
        }
      })
      .catch(() => {});
  }, [loadOverrides]);

  const setLocale = React.useCallback((loc: Locale) => {
    setLocaleState(loc);
    try { localStorage.setItem(LOCAL_STORAGE_KEY, loc); } catch {}
    loadOverrides(loc);
    // Persist to profile (fire and forget — UI already reflects the change)
    fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: loc }),
    }).catch(() => {});
  }, [loadOverrides]);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(COMPILED[locale], key, vars, overrides),
    [locale, overrides],
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
