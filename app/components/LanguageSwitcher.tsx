"use client";

import React from "react";
import { useT, LOCALES, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/i18n";

/**
 * Compact language picker for the Settings page.
 * Writes to both localStorage (immediate UI) and /api/me (persisted across devices).
 */
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useT();

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-card mb-4 px-5 py-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
            {t("you.languageRow")}
          </p>
          <p className="font-saira text-[11px] text-zinc-400 mt-0.5">
            {t("you.languageDesc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LOCALES.map((loc) => {
          const active = loc === locale;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc as Locale)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 transition ${
                active
                  ? "border-purple-500/40 bg-purple-500/10 text-purple-200"
                  : "border-white/5 bg-surface-panel text-zinc-400 hover:text-white hover:border-white/15"
              }`}
            >
              <span className="text-lg leading-none">{LOCALE_FLAGS[loc]}</span>
              <span className="font-saira text-[11px] font-semibold">
                {LOCALE_LABELS[loc]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
