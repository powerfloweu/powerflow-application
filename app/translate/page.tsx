"use client";

/**
 * /translate — PowerFlow Translation Editor
 *
 * Access-controlled by ADMIN_EMAIL + EDITOR_EMAILS env vars.
 * Shows all EN strings side-by-side with the selected locale's overrides.
 * Changes auto-save on blur (or Enter). Empty = revert to compiled fallback.
 */

import React from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { TRANSLATABLE_LOCALES, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/i18n/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type TranslationRow = {
  key: string;
  en: string;
  value: string | null; // null = not yet translated (falls back to EN)
};

type SaveState = "idle" | "saving" | "saved" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Group flat keys by their top-level section (e.g. "nav.home" → "nav")
function groupBySection(rows: TranslationRow[]): Map<string, TranslationRow[]> {
  const map = new Map<string, TranslationRow[]>();
  for (const row of rows) {
    const section = row.key.split(".")[0];
    if (!map.has(section)) map.set(section, []);
    map.get(section)!.push(row);
  }
  return map;
}

function sectionLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TranslatePage() {
  const [sessionEmail, setSessionEmail] = React.useState<string | null>(null);
  const [accessDenied, setAccessDenied] = React.useState(false);
  const [locale, setLocale] = React.useState<Locale>("de");
  const [rows, setRows] = React.useState<TranslationRow[]>([]);
  const [localValues, setLocalValues] = React.useState<Record<string, string>>({});
  const [saveState, setSaveState] = React.useState<Record<string, SaveState>>({});
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "missing" | "done">("all");
  const [search, setSearch] = React.useState("");

  // ── Auth check ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.auth.getUser().then(({ data }) => {
      setSessionEmail(data.user?.email ?? null);
    });
  }, []);

  // ── Load translations for selected locale ──────────────────────────────────
  const loadLocale = React.useCallback(async (loc: Locale) => {
    setLoading(true);
    setRows([]);
    setLocalValues({});
    setSaveState({});
    try {
      const res = await fetch(`/api/admin/translations?locale=${loc}`);
      if (res.status === 403) { setAccessDenied(true); return; }
      if (!res.ok) return;
      const data: TranslationRow[] = await res.json();
      setRows(data);
      const init: Record<string, string> = {};
      for (const { key, value } of data) init[key] = value ?? "";
      setLocalValues(init);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (sessionEmail !== null) loadLocale(locale);
  }, [sessionEmail, locale, loadLocale]);

  // ── Save a single key ──────────────────────────────────────────────────────
  const saveKey = React.useCallback(async (key: string, value: string) => {
    setSaveState((p) => ({ ...p, [key]: "saving" }));
    try {
      const res = await fetch("/api/admin/translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, key, value }),
      });
      if (!res.ok) throw new Error();
      // Update the rows state to reflect the new override status
      setRows((prev) =>
        prev.map((r) => r.key === key ? { ...r, value: value || null } : r),
      );
      setSaveState((p) => ({ ...p, [key]: "saved" }));
      setTimeout(() => setSaveState((p) => ({ ...p, [key]: "idle" })), 1500);
    } catch {
      setSaveState((p) => ({ ...p, [key]: "error" }));
    }
  }, [locale]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = rows.length;
  const translated = rows.filter((r) => r.value !== null && r.value !== "").length;
  const pct = total ? Math.round((translated / total) * 100) : 0;

  // ── Filter + search ────────────────────────────────────────────────────────
  const filteredRows = React.useMemo(() => {
    let r = rows;
    if (filter === "missing") r = r.filter((x) => !x.value);
    if (filter === "done")    r = r.filter((x) => !!x.value);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) =>
        x.key.toLowerCase().includes(q) ||
        x.en.toLowerCase().includes(q) ||
        (x.value ?? "").toLowerCase().includes(q),
      );
    }
    return r;
  }, [rows, filter, search]);

  const grouped = React.useMemo(() => groupBySection(filteredRows), [filteredRows]);

  // ── Render: not yet authed ─────────────────────────────────────────────────
  if (sessionEmail === null) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#050608] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-saira text-sm text-zinc-400">
          You don't have access to the translation editor.
        </p>
        <p className="font-saira text-xs text-zinc-600">{sessionEmail}</p>
        <a href="/auth/sign-in" className="font-saira text-xs text-purple-400 underline">Sign in with a different account</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050608]/95 backdrop-blur-md px-6 py-3 flex items-center gap-4">
        <Image
          src="/fm_powerflow_logo_verziok_01_negative.png"
          alt="PowerFlow"
          width={36} height={36}
          className="opacity-80"
        />
        <div className="flex-1 min-w-0">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400">
            PowerFlow · Translation Editor
          </p>
        </div>

        {/* Locale tabs */}
        <div className="flex gap-1">
          {TRANSLATABLE_LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`px-3 py-1.5 rounded-lg font-saira text-xs font-semibold uppercase tracking-[0.14em] transition ${
                locale === loc
                  ? "bg-purple-600 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {LOCALE_FLAGS[loc]} {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>

        <a
          href="/auth/sign-out"
          onClick={async (e) => {
            e.preventDefault();
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            );
            await supabase.auth.signOut();
            window.location.href = "/auth/sign-in";
          }}
          className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition ml-2"
        >
          Sign out
        </a>
      </header>

      {/* ── Sub-header: stats + filters ── */}
      <div className="sticky top-[57px] z-20 border-b border-white/5 bg-[#050608]/90 backdrop-blur-sm px-6 py-2 flex items-center gap-4 flex-wrap">
        {/* Progress */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-saira text-xs text-zinc-400 flex-shrink-0">
            {translated}/{total} translated ({pct}%)
          </span>
        </div>

        {/* Filter */}
        <div className="flex gap-1 ml-auto">
          {(["all", "missing", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded font-saira text-[10px] uppercase tracking-[0.14em] transition ${
                filter === f
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "missing" ? `Missing (${total - translated})` : f === "done" ? `Done (${translated})` : `All (${total})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keys or strings…"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 w-52"
        />
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
          </div>
        ) : grouped.size === 0 ? (
          <p className="text-center font-saira text-sm text-zinc-500 py-24">No strings match your filter.</p>
        ) : (
          Array.from(grouped.entries()).map(([section, sectionRows]) => (
            <div key={section} className="mb-10">
              {/* Section heading */}
              <h2 className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400/80 mb-3 border-b border-white/5 pb-2">
                {sectionLabel(section)}
              </h2>

              {/* Column headers */}
              <div className="grid grid-cols-[220px_1fr_1fr] gap-3 mb-1 px-1">
                <span className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-600">Key</span>
                <span className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-600">🇬🇧 English (source)</span>
                <span className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                  {LOCALE_FLAGS[locale]} {LOCALE_LABELS[locale]}
                </span>
              </div>

              <div className="space-y-1">
                {sectionRows.map((row) => {
                  const state = saveState[row.key] ?? "idle";
                  const isOverride = row.value !== null && row.value !== "";
                  return (
                    <div
                      key={row.key}
                      className={`grid grid-cols-[220px_1fr_1fr] gap-3 rounded-lg px-2 py-1.5 items-start transition ${
                        state === "error"
                          ? "bg-red-500/5 border border-red-500/20"
                          : state === "saved"
                          ? "bg-emerald-500/5"
                          : "hover:bg-white/3"
                      }`}
                    >
                      {/* Key */}
                      <div className="flex items-start gap-1.5 pt-1 min-w-0">
                        <span
                          title={isOverride ? "Override active" : "Falling back to EN"}
                          className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            isOverride ? "bg-purple-400" : "bg-zinc-700"
                          }`}
                        />
                        <span className="font-mono text-[10px] text-zinc-500 truncate leading-5">
                          {row.key.split(".").slice(1).join(".")}
                        </span>
                      </div>

                      {/* EN source */}
                      <p className="font-saira text-xs text-zinc-400 leading-relaxed pt-1 select-none">
                        {row.en}
                      </p>

                      {/* Editable translation */}
                      <div className="relative">
                        <textarea
                          rows={row.en.length > 60 ? 2 : 1}
                          value={localValues[row.key] ?? ""}
                          onChange={(e) =>
                            setLocalValues((p) => ({ ...p, [row.key]: e.target.value }))
                          }
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            const prev = row.value ?? "";
                            if (val !== prev) saveKey(row.key, val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              (e.target as HTMLTextAreaElement).blur();
                            }
                          }}
                          placeholder={row.en}
                          className={`w-full resize-none rounded-lg border px-2.5 py-1.5 font-saira text-xs text-white placeholder-zinc-700 focus:outline-none transition ${
                            isOverride
                              ? "border-purple-500/30 bg-purple-500/5 focus:border-purple-500/60"
                              : "border-white/8 bg-white/3 focus:border-purple-500/40"
                          }`}
                        />
                        {state === "saving" && (
                          <span className="absolute right-2 top-1.5 text-[9px] text-zinc-500">saving…</span>
                        )}
                        {state === "saved" && (
                          <span className="absolute right-2 top-1.5 text-[9px] text-emerald-400">✓</span>
                        )}
                        {state === "error" && (
                          <span className="absolute right-2 top-1.5 text-[9px] text-red-400">!</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
