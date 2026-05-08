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
  compiled: string | null; // value from compiled TS dictionary (null = not in dict yet)
  value: string | null;    // DB override saved via this editor (null = no override)
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
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(new Set());
  const [jumpSection, setJumpSection] = React.useState<string>("");
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  function toggleSection(section: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });
  }

  function collapseAll() { setCollapsedSections(new Set(grouped.keys())); }
  function expandAll()   { setCollapsedSections(new Set()); }

  // ── Auth check ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      if (!email) {
        // Not signed in — redirect to sign-in and come back here after
        window.location.href = "/auth/sign-in?next=" + encodeURIComponent("/translate");
        return;
      }
      setSessionEmail(email);
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
      // Pre-fill with DB override → compiled translation → empty
      // This makes existing translations show as white text, not dim placeholder
      for (const { key, value, compiled } of data) init[key] = value ?? compiled ?? "";
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
  // "translated" = has a compiled dict entry OR a DB override
  const translated = rows.filter((r) => (r.compiled !== null) || (r.value !== null && r.value !== "")).length;
  // "overridden" = has a DB override specifically
  const overridden = rows.filter((r) => r.value !== null && r.value !== "").length;
  const pct = total ? Math.round((translated / total) * 100) : 0;

  // ── Filter + search ────────────────────────────────────────────────────────
  const filteredRows = React.useMemo(() => {
    let r = rows;
    // "missing" = no compiled dict entry AND no DB override (truly untranslated)
    if (filter === "missing") r = r.filter((x) => !x.compiled && !x.value);
    // "done" = has either a compiled translation or a DB override
    if (filter === "done")    r = r.filter((x) => !!x.compiled || !!x.value);
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
      <div className="sticky top-[57px] z-20 border-b border-white/5 bg-[#050608]/90 backdrop-blur-sm px-6 py-2 flex items-center gap-3 flex-wrap">
        {/* Progress */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-saira text-xs text-zinc-400 flex-shrink-0 whitespace-nowrap">
            {translated}/{total} ({pct}%)
            {overridden > 0 && <span className="ml-1.5 text-purple-400/70">· {overridden} overridden</span>}
          </span>
        </div>

        {/* Section jump */}
        <select
          value={jumpSection}
          onChange={(e) => {
            const sec = e.target.value;
            setJumpSection(sec);
            if (sec && sectionRefs.current[sec]) {
              sectionRefs.current[sec]!.scrollIntoView({ behavior: "smooth", block: "start" });
              // auto-expand if collapsed
              setCollapsedSections((prev) => { const next = new Set(prev); next.delete(sec); return next; });
            }
          }}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-saira text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
        >
          <option value="">Jump to section…</option>
          {Array.from(grouped.keys()).map((sec) => (
            <option key={sec} value={sec}>{sectionLabel(sec)} ({grouped.get(sec)!.length})</option>
          ))}
        </select>

        {/* Collapse/expand all */}
        <div className="flex gap-1">
          <button onClick={expandAll}  className="px-2 py-1 rounded font-saira text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition">Expand all</button>
          <button onClick={collapseAll} className="px-2 py-1 rounded font-saira text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition">Collapse all</button>
        </div>

        {/* Filter */}
        <div className="flex gap-1 ml-auto">
          {(["all", "missing", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded font-saira text-[10px] uppercase tracking-[0.14em] transition ${
                filter === f ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
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
          placeholder="Search…"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 w-44"
        />
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
          </div>
        ) : grouped.size === 0 ? (
          <p className="text-center font-saira text-sm text-zinc-500 py-24">No strings match your filter.</p>
        ) : (
          Array.from(grouped.entries()).map(([section, sectionRows]) => {
            const isCollapsed = collapsedSections.has(section);
            const missingCount = sectionRows.filter((r) => !r.compiled && !r.value).length;
            return (
              <div
                key={section}
                className="mb-6"
                ref={(el) => { sectionRefs.current[section] = el; }}
              >
                {/* Section heading — clickable to collapse */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center gap-3 mb-3 group text-left"
                >
                  {/* Chevron */}
                  <span className={`text-zinc-500 text-xs transition-transform duration-150 ${isCollapsed ? "-rotate-90" : ""}`}>▼</span>
                  <h2 className="font-saira text-sm font-bold uppercase tracking-[0.25em] text-purple-300 group-hover:text-purple-200 transition-colors">
                    {sectionLabel(section)}
                  </h2>
                  <div className="flex-1 h-px bg-white/8" />
                  {missingCount > 0 && (
                    <span className="font-saira text-[10px] text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-full">{missingCount} missing</span>
                  )}
                  <span className="font-saira text-[10px] text-zinc-600">{sectionRows.length} strings</span>
                </button>

                {!isCollapsed && (
                  <>
                    {/* Column headers */}
                    <div className="grid grid-cols-2 gap-4 mb-1 px-4">
                      <span className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-500">🇬🇧 English</span>
                      <span className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        {LOCALE_FLAGS[locale]} {LOCALE_LABELS[locale]}
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/8 overflow-hidden divide-y divide-white/5">
                      {sectionRows.map((row) => {
                        const state = saveState[row.key] ?? "idle";
                        const isOverride = row.value !== null && row.value !== "";
                        const hasCompiled = row.compiled !== null && row.compiled !== "";
                        const dotColor = isOverride ? "bg-purple-400" : hasCompiled ? "bg-emerald-500/70" : "bg-red-500/60";
                        const dotTitle = isOverride ? "Custom override saved" : hasCompiled ? "Using compiled translation" : "Missing — not yet translated";
                        // Estimate rows needed: ~80 chars per line in the textarea column (~half of 7xl)
                        const longestText = Math.max(row.en.length, (localValues[row.key] ?? row.compiled ?? "").length);
                        const textareaRows = longestText > 160 ? 4 : longestText > 80 ? 2 : 1;
                        return (
                          <div
                            key={row.key}
                            className={`grid grid-cols-2 gap-4 px-4 py-3 items-start transition-colors ${
                              state === "error"   ? "bg-red-500/8" :
                              state === "saved"   ? "bg-emerald-500/8" :
                              isOverride         ? "bg-purple-500/5" :
                              !hasCompiled       ? "bg-red-500/5" :
                              "hover:bg-white/3"
                            }`}
                          >
                            {/* EN source + key label */}
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span title={dotTitle} className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                              <div className="min-w-0">
                                <p className="font-saira text-sm text-white leading-snug">{row.en}</p>
                                <p className="font-mono text-[10px] text-zinc-600 mt-0.5 truncate">{row.key.split(".").slice(1).join(".")}</p>
                              </div>
                            </div>

                            {/* Editable translation */}
                            <div className="relative">
                              <textarea
                                rows={textareaRows}
                                value={localValues[row.key] ?? ""}
                                onChange={(e) =>
                                  setLocalValues((p) => ({ ...p, [row.key]: e.target.value }))
                                }
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val === (row.value ?? "")) return;
                                  if (!row.value && val === (row.compiled ?? "")) return;
                                  saveKey(row.key, val);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    (e.target as HTMLTextAreaElement).blur();
                                  }
                                }}
                                placeholder={!hasCompiled ? row.en : ""}
                                className={`w-full resize-y rounded-lg border px-3 py-2.5 font-saira text-sm leading-relaxed focus:outline-none transition ${
                                  isOverride
                                    ? "border-purple-500/50 bg-purple-500/10 text-white focus:border-purple-400/80"
                                    : hasCompiled
                                    ? "border-white/12 bg-white/5 text-zinc-100 focus:border-purple-500/50 focus:bg-white/8"
                                    : "border-red-500/20 bg-red-500/5 text-zinc-300 placeholder-zinc-600 focus:border-purple-500/40"
                                }`}
                              />
                              {state === "saving" && <span className="absolute right-3 top-3 text-[10px] text-zinc-500">saving…</span>}
                              {state === "saved"  && <span className="absolute right-3 top-3 text-[10px] text-emerald-400">✓ saved</span>}
                              {state === "error"  && <span className="absolute right-3 top-3 text-[10px] text-red-400">error!</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 pt-6 pb-4 border-t border-white/5">
          <span className="font-saira text-[10px] uppercase tracking-widest text-zinc-600">Legend</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
            <span className="font-saira text-[11px] text-zinc-400">Custom override</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500/70 flex-shrink-0" />
            <span className="font-saira text-[11px] text-zinc-400">Compiled translation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/60 flex-shrink-0" />
            <span className="font-saira text-[11px] text-zinc-400">Missing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
