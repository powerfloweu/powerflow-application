"use client";

import React from "react";
import Link from "next/link";

interface Digest {
  id: string;
  athlete_id: string;
  athlete_name: string;
  period_start: string;
  period_end: string;
  entry_count: number;
  summary: string;
  draft_message: string;
  created_at: string;
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default function CoachDigests() {
  const [digests, setDigests] = React.useState<Digest[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/coach/digests")
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => { if (Array.isArray(rows)) setDigests(rows); setLoaded(true); })
      .catch((err) => { console.error("[CoachDigests] load failed", err); setLoaded(true); });
  }, []);

  const setStatus = async (id: string, status: "used" | "dismissed") => {
    setBusyId(id);
    const res = await fetch("/api/coach/digests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => null);
    setBusyId(null);
    if (res?.ok) setDigests((prev) => prev.filter((d) => d.id !== id));
  };

  const copy = async (d: Digest) => {
    const text = drafts[d.id] ?? d.draft_message;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(d.id);
      setTimeout(() => setCopiedId((c) => (c === d.id ? null : c)), 2000);
    } catch (err) {
      console.error("[CoachDigests] copy failed", err);
    }
  };

  if (!loaded || digests.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
          AI drafts · {digests.length}
        </p>
        <p className="font-saira text-[10px] text-zinc-500">from recent journals</p>
      </div>

      <div className="space-y-3">
        {digests.map((d) => {
          const open = openId === d.id;
          const draft = drafts[d.id] ?? d.draft_message;
          return (
            <div key={d.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : d.id)}
                className="w-full flex items-start gap-3 p-4 text-left"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center font-saira text-[9px] font-bold text-emerald-300 flex-shrink-0 mt-0.5">
                  {initials(d.athlete_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-saira text-sm font-semibold text-zinc-100 truncate">{d.athlete_name}</span>
                    <span className="font-saira text-[10px] text-zinc-500 flex-shrink-0">{d.entry_count} entries</span>
                  </div>
                  <p className={`font-saira text-xs text-zinc-400 mt-0.5 ${open ? "" : "line-clamp-2"}`}>
                    {d.summary}
                  </p>
                </div>
                <span className="text-zinc-500 font-saira text-sm flex-shrink-0">{open ? "▲" : "▼"}</span>
              </button>

              {open && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80 mb-1.5">
                    Suggested reply — review before sending
                  </p>
                  <textarea
                    value={draft}
                    onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: e.target.value }))}
                    rows={7}
                    className="w-full rounded-xl border border-zinc-700/60 bg-surface-input px-3 py-2.5 font-saira text-sm text-zinc-100 outline-none focus:border-emerald-500/50 resize-y leading-relaxed"
                  />
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copy(d)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-saira text-xs font-semibold text-white transition"
                    >
                      {copiedId === d.id ? "Copied ✓" : "Copy draft"}
                    </button>
                    <Link
                      href={`/coach/athletes?open=${d.athlete_id}`}
                      className="rounded-xl border border-white/10 hover:border-white/25 px-3 py-2 font-saira text-xs text-zinc-300 transition"
                    >
                      Open athlete
                    </Link>
                    <button
                      type="button"
                      onClick={() => setStatus(d.id, "used")}
                      disabled={busyId === d.id}
                      className="rounded-xl border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 px-3 py-2 font-saira text-xs transition disabled:opacity-50"
                    >
                      Mark done
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(d.id, "dismissed")}
                      disabled={busyId === d.id}
                      className="ml-auto font-saira text-xs text-zinc-500 hover:text-zinc-300 transition disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
