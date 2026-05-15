"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import BottomSheet from "@/app/components/BottomSheet";
import type { Sentiment } from "@/lib/journal";
import type { TrainingEntry } from "@/lib/training";
import type { WeeklyCheckin } from "@/lib/weeklyCheckin";

// Minimal type — mirrors what /api/coach/athletes returns
type AthleteRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  entries: { id: string; content: string; sentiment: Sentiment; created_at: string }[];
  training_entries: TrainingEntry[];
  all_training_entries: TrainingEntry[];
  weekly_checkins: WeeklyCheckin[];
  squat_current_kg: number | null;
  bench_current_kg: number | null;
  deadlift_current_kg: number | null;
  meet_date: string | null;
};

type FlagLevel = "attention" | "monitor" | "stable";
type SortKey = "flag" | "positive" | "name" | "entries";

function computeAthleteStats(a: AthleteRow) {
  const cutWeek = new Date(); cutWeek.setDate(cutWeek.getDate() - 7);
  const weekEntries = a.entries.filter((e) => new Date(e.created_at) >= cutWeek);
  const positiveCount = weekEntries.filter((e) => e.sentiment === "positive").length;
  const positiveRate = weekEntries.length ? Math.round(positiveCount / weekEntries.length * 100) : 0;
  const flag: FlagLevel = positiveRate < 30 ? "attention" : positiveRate < 55 ? "monitor" : "stable";
  const initials = a.display_name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const lastEntryTime = a.entries[0] ? new Date(a.entries[0].created_at).getTime() : 0;
  const diffD = Math.floor((Date.now() - lastEntryTime) / 86400000);
  const lastActive = lastEntryTime === 0 ? "Never" : diffD === 0 ? "Today" : diffD === 1 ? "Yesterday" : `${diffD}d ago`;

  return { ...a, positiveRate, flag, initials, entriesThisWeek: weekEntries.length, lastActive };
}

type Athlete = ReturnType<typeof computeAthleteStats>;

const FLAG_BAR: Record<FlagLevel, string> = {
  attention: "bg-rose-500",
  monitor: "bg-amber-500",
  stable: "bg-emerald-500",
};
const FLAG_TEXT: Record<FlagLevel, string> = {
  attention: "text-rose-300",
  monitor: "text-amber-300",
  stable: "text-emerald-300",
};

function AthleteListRow({ athlete, onClick }: { athlete: Athlete; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-0 hover:bg-white/[0.03] active:bg-white/5 transition"
    >
      <div className={`flex-shrink-0 w-1 self-stretch ${FLAG_BAR[athlete.flag]} opacity-70`} />
      <div className="flex-shrink-0 ml-3 mr-3">
        {athlete.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={athlete.avatar_url} alt={athlete.display_name} className="w-9 h-9 rounded-full border border-white/10" />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-saira text-xs font-bold ${
            athlete.flag === "attention" ? "bg-rose-500/20 text-rose-300" :
            athlete.flag === "monitor" ? "bg-amber-500/20 text-amber-300" :
            "bg-emerald-500/15 text-emerald-300"
          }`}>
            {athlete.initials}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-3.5">
        <p className="font-saira text-sm font-semibold text-zinc-100 truncate">{athlete.display_name}</p>
        <p className="font-saira text-[11px] text-zinc-400 mt-0.5">
          {athlete.entriesThisWeek > 0 ? `${athlete.entriesThisWeek} entries this week` : athlete.lastActive}
        </p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5 pr-4 py-3">
        <span className={`font-saira text-sm font-bold tabular-nums ${
          athlete.positiveRate >= 60 ? "text-emerald-400" :
          athlete.positiveRate >= 40 ? "text-amber-400" : "text-rose-400"
        }`}>{athlete.positiveRate}%</span>
        <span className={`font-saira text-[9px] uppercase tracking-[0.14em] ${FLAG_TEXT[athlete.flag]}`}>
          {athlete.flag}
        </span>
      </div>
    </button>
  );
}

function AthleteQuickSheet({ athlete }: { athlete: Athlete }) {
  const [tab, setTab] = React.useState<"overview" | "activity">("overview");

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
  const recentEntries = athlete.entries
    .filter((e) => new Date(e.created_at) >= cutoff)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`font-saira text-sm font-bold ${
          athlete.positiveRate >= 60 ? "text-emerald-400" :
          athlete.positiveRate >= 40 ? "text-amber-400" : "text-rose-400"
        }`}>{athlete.positiveRate}% positive</span>
        <span className={`rounded-full border px-2.5 py-0.5 font-saira text-[9px] uppercase tracking-[0.16em] ${
          athlete.flag === "attention" ? "border-rose-500/30 text-rose-300 bg-rose-500/10" :
          athlete.flag === "monitor" ? "border-amber-500/30 text-amber-300 bg-amber-500/10" :
          "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
        }`}>{athlete.flag}</span>
        <span className="font-saira text-xs text-zinc-400 ml-auto">{athlete.lastActive}</span>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-white/8 overflow-hidden">
        {(["overview", "activity"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`flex-1 py-2 font-saira text-[10px] uppercase tracking-[0.16em] transition ${
              tab === k ? "bg-purple-500/20 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >{k}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          {athlete.meet_date && (
            <div className="flex justify-between rounded-xl border border-white/6 bg-surface-alt px-4 py-3">
              <span className="font-saira text-xs text-zinc-400">Meet date</span>
              <span className="font-saira text-xs text-zinc-200">{new Date(athlete.meet_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          )}
          {(athlete.squat_current_kg || athlete.bench_current_kg || athlete.deadlift_current_kg) && (
            <div className="rounded-xl border border-white/6 bg-surface-alt p-4 space-y-2">
              <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Current lifts</p>
              {[
                { l: "SQ", v: athlete.squat_current_kg },
                { l: "BP", v: athlete.bench_current_kg },
                { l: "DL", v: athlete.deadlift_current_kg },
              ].filter((x) => x.v).map((x) => (
                <div key={x.l} className="flex justify-between">
                  <span className="font-saira text-xs font-bold text-zinc-400">{x.l}</span>
                  <span className="font-saira text-xs text-zinc-200 tabular-nums">{x.v}kg</span>
                </div>
              ))}
            </div>
          )}
          {recentEntries.length === 0 && (
            <p className="font-saira text-sm text-zinc-400 text-center py-4">No entries this week</p>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-2">
          {recentEntries.length === 0 && (
            <p className="font-saira text-sm text-zinc-400 text-center py-4">No journal entries in 14 days</p>
          )}
          {recentEntries.map((e) => (
            <div key={e.id} className="rounded-xl border border-white/6 bg-surface-alt p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-saira text-[9px] uppercase tracking-[0.14em] text-purple-300 border border-purple-500/20 rounded-full px-2 py-0.5 bg-purple-500/10">Journal</span>
                <span className="font-saira text-[10px] text-zinc-400">{new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                {e.sentiment === "positive" && <span className="ml-auto text-emerald-400 text-xs">+</span>}
                {e.sentiment === "negative" && <span className="ml-auto text-rose-400 text-xs">–</span>}
              </div>
              <p className="font-saira text-xs text-zinc-300 line-clamp-2 leading-relaxed">{e.content.slice(0, 120)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoachAthletesPage() {
  return (
    <React.Suspense>
      <CoachAthletesInner />
    </React.Suspense>
  );
}

function CoachAthletesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [athletes, setAthletes] = React.useState<Athlete[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("flag");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => searchParams.get("open"),
  );

  React.useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteRow[]) => {
        setAthletes(data.map(computeAthleteStats));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sync ?open= param → selectedId after athletes load
  React.useEffect(() => {
    const openId = searchParams.get("open");
    if (openId && athletes.length > 0) {
      setSelectedId(openId);
      // Remove the param from the URL so Back still works cleanly
      router.replace("/coach/athletes", { scroll: false });
    }
  }, [athletes, searchParams, router]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? athletes.filter((a) => a.display_name.toLowerCase().includes(q)) : athletes;
    const flagOrder: Record<FlagLevel, number> = { attention: 0, monitor: 1, stable: 2 };
    return [...base].sort((a, b) => {
      if (sort === "flag") return flagOrder[a.flag] - flagOrder[b.flag];
      if (sort === "positive") return a.positiveRate - b.positiveRate;
      if (sort === "entries") return b.entriesThisWeek - a.entriesThisWeek;
      return a.display_name.localeCompare(b.display_name);
    });
  }, [athletes, search, sort]);

  const selected = React.useMemo(
    () => athletes.find((a) => a.id === selectedId) ?? null,
    [athletes, selectedId],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500/40 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative bg-surface-base text-white min-h-screen pb-24 pt-16">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.07),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="mb-5 pt-4 flex items-center justify-between">
          <div>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              PowerFlow · Coach
            </p>
            <h1 className="mt-1 font-saira text-2xl font-extrabold uppercase tracking-tight text-white">
              Athletes
            </h1>
          </div>
          <span className="font-saira text-xs text-zinc-400">{athletes.length} total</span>
        </div>

        {/* Search + sort */}
        {athletes.length > 0 && (
          <div className="mb-4 space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes…"
              className="w-full rounded-xl border border-white/10 bg-surface-alt px-4 py-2.5 font-saira text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/40"
            />
            <div className="flex gap-1.5">
              {([
                { key: "flag",     label: "Priority" },
                { key: "positive", label: "Mood" },
                { key: "entries",  label: "Activity" },
                { key: "name",     label: "Name" },
              ] as { key: SortKey; label: string }[]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`rounded-full border px-3 py-1 font-saira text-[9px] uppercase tracking-[0.14em] transition ${
                    sort === s.key
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >{s.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Athlete list */}
        {filtered.length > 0 ? (
          <div className="rounded-2xl border border-white/6 overflow-hidden divide-y divide-white/5">
            {filtered.map((a) => (
              <AthleteListRow key={a.id} athlete={a} onClick={() => setSelectedId(a.id)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-surface-alt p-10 text-center">
            <p className="font-saira text-sm text-zinc-400">
              {search ? "No athletes match your search" : "No athletes yet"}
            </p>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      {selected && (
        <BottomSheet
          open={!!selected}
          onClose={() => setSelectedId(null)}
          title={selected.display_name}
        >
          <AthleteQuickSheet athlete={selected} />
        </BottomSheet>
      )}
    </div>
  );
}
