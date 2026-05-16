"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import BottomSheet from "@/app/components/BottomSheet";
import type { Sentiment } from "@/lib/journal";
import type { TrainingEntry } from "@/lib/training";
import type { WeeklyCheckin } from "@/lib/weeklyCheckin";

// ── Test result row types (mirror /api/coach/athletes) ────────────────────────
type SatRow  = { id: string; total_score: number; submitted_at: string };
type AcsiRow = { id: string; score_coping: number; score_concentration: number; score_confidence: number; score_goal_setting: number; total_score: number; submitted_at: string };
type CsaiRow = { id: string; score_cognitive: number; score_somatic: number; score_confidence: number; submitted_at: string };
type DasRow  = { id: string; total_score: number; depression_prone: boolean; submitted_at: string };

// ── Athlete data shape from the API ──────────────────────────────────────────
type AthleteRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  entries: { id: string; content: string; sentiment: Sentiment; created_at: string }[];
  training_entries: TrainingEntry[];
  all_training_entries: TrainingEntry[];
  weekly_checkins: WeeklyCheckin[];
  // lifts
  squat_current_kg: number | null;
  squat_goal_kg: number | null;
  bench_current_kg: number | null;
  bench_goal_kg: number | null;
  deadlift_current_kg: number | null;
  deadlift_goal_kg: number | null;
  // profile
  meet_date: string | null;
  bodyweight_kg: number | null;
  federation: string | null;
  // test scores (most recent first)
  sat: SatRow[];
  acsi: AcsiRow[];
  csai: CsaiRow[];
  das: DasRow[];
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Athlete list row ──────────────────────────────────────────────────────────

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

// ── Athlete bottom-sheet detail ───────────────────────────────────────────────

function AthleteQuickSheet({ athlete }: { athlete: Athlete }) {
  const [tab, setTab] = React.useState<"overview" | "activity" | "tests">("overview");

  // ── Data prep ──────────────────────────────────────────────────────────────

  const cutoff14 = new Date(); cutoff14.setDate(cutoff14.getDate() - 14);

  const recentJournal = athlete.entries
    .filter((e) => new Date(e.created_at) >= cutoff14)
    .slice(0, 15);

  // Training entries in last 14d that have at least one written answer
  const recentTraining = athlete.all_training_entries
    .filter((e) => {
      const d = new Date(e.entry_date + "T12:00:00");
      return d >= cutoff14 && (
        e.thoughts_before || e.thoughts_after || e.what_went_well ||
        e.frustrations || e.next_session
      );
    })
    .slice(0, 8);

  // Interleave journal + training by date descending
  type ActivityItem =
    | { kind: "journal"; date: Date; entry: typeof recentJournal[0] }
    | { kind: "training"; date: Date; entry: typeof recentTraining[0] };

  const activityItems: ActivityItem[] = [
    ...recentJournal.map((e) => ({ kind: "journal" as const, date: new Date(e.created_at), entry: e })),
    ...recentTraining.map((e) => ({ kind: "training" as const, date: new Date(e.entry_date + "T12:00:00"), entry: e })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Most recent weekly check-in
  const latestCheckin = athlete.weekly_checkins[0] ?? null;

  // Lift pairs [label, current, goal]
  const lifts: [string, number | null, number | null][] = [
    ["SQ", athlete.squat_current_kg,    athlete.squat_goal_kg],
    ["BP", athlete.bench_current_kg,    athlete.bench_goal_kg],
    ["DL", athlete.deadlift_current_kg, athlete.deadlift_goal_kg],
  ];
  const hasLifts = lifts.some(([, v]) => v);

  // ── Render ─────────────────────────────────────────────────────────────────

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
          athlete.flag === "monitor"   ? "border-amber-500/30 text-amber-300 bg-amber-500/10" :
                                         "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
        }`}>{athlete.flag}</span>
        <span className="font-saira text-xs text-zinc-400 ml-auto">{athlete.lastActive}</span>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-white/8 overflow-hidden">
        {(["overview", "activity", "tests"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`flex-1 py-2 font-saira text-[10px] uppercase tracking-[0.14em] transition ${
              tab === k ? "bg-purple-500/20 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >{k}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-3">

          {/* Meet date */}
          {athlete.meet_date && (
            <div className="flex justify-between rounded-xl border border-white/6 bg-surface-alt px-4 py-3">
              <span className="font-saira text-xs text-zinc-400">Meet date</span>
              <span className="font-saira text-xs text-zinc-200">
                {new Date(athlete.meet_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}

          {/* Profile quick stats */}
          {(athlete.bodyweight_kg || athlete.federation) && (
            <div className="flex gap-2">
              {athlete.bodyweight_kg && (
                <div className="flex-1 rounded-xl border border-white/6 bg-surface-alt px-3 py-2.5 text-center">
                  <p className="font-saira text-sm font-bold text-zinc-100 tabular-nums">{athlete.bodyweight_kg}kg</p>
                  <p className="font-saira text-[9px] text-zinc-400 uppercase tracking-[0.16em]">Bodyweight</p>
                </div>
              )}
              {athlete.federation && (
                <div className="flex-1 rounded-xl border border-white/6 bg-surface-alt px-3 py-2.5 text-center">
                  <p className="font-saira text-sm font-bold text-zinc-100">{athlete.federation}</p>
                  <p className="font-saira text-[9px] text-zinc-400 uppercase tracking-[0.16em]">Federation</p>
                </div>
              )}
            </div>
          )}

          {/* Lifts with goals */}
          {hasLifts && (
            <div className="rounded-xl border border-white/6 bg-surface-alt p-4 space-y-2">
              <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Current lifts</p>
              {lifts.filter(([, v]) => v).map(([label, cur, goal]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-saira text-xs font-bold text-zinc-400">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-saira text-xs text-zinc-200 tabular-nums">{cur}kg</span>
                    {goal && (
                      <span className="font-saira text-[10px] text-zinc-500 tabular-nums">→ {goal}kg</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Latest weekly check-in */}
          {latestCheckin && (
            <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Latest check-in
                </p>
                <span className="font-saira text-[10px] text-zinc-400">
                  {fmtDate(latestCheckin.week_start)}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: "Mood",     v: latestCheckin.mood_rating },
                  { label: "Train",    v: latestCheckin.training_quality },
                  { label: "Energy",   v: latestCheckin.energy_rating },
                  { label: "Sleep",    v: latestCheckin.sleep_rating },
                  { label: "Ready",    v: latestCheckin.readiness_rating },
                ].map(({ label, v }) => (
                  <div key={label}>
                    <p className={`font-saira text-base font-extrabold tabular-nums ${
                      v >= 8 ? "text-emerald-400" : v >= 5 ? "text-purple-300" : "text-rose-400"
                    }`}>{v}</p>
                    <p className="font-saira text-[8px] uppercase tracking-[0.12em] text-zinc-500 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
              {latestCheckin.biggest_win && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-400 mb-1">Biggest win</p>
                  <p className="font-saira text-xs text-zinc-300 leading-relaxed line-clamp-2">{latestCheckin.biggest_win}</p>
                </div>
              )}
            </div>
          )}

          {!athlete.meet_date && !hasLifts && !latestCheckin && !athlete.bodyweight_kg && !athlete.federation && (
            <p className="font-saira text-sm text-zinc-400 text-center py-4">No profile data yet</p>
          )}
        </div>
      )}

      {/* ── ACTIVITY ── */}
      {tab === "activity" && (
        <div className="space-y-2">
          {activityItems.length === 0 && (
            <p className="font-saira text-sm text-zinc-400 text-center py-4">No activity in the last 14 days</p>
          )}
          {activityItems.map((item) =>
            item.kind === "journal" ? (
              <div key={"j" + item.entry.id} className="rounded-xl border border-white/6 bg-surface-alt p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-saira text-[9px] uppercase tracking-[0.14em] text-purple-300 border border-purple-500/20 rounded-full px-2 py-0.5 bg-purple-500/10">Journal</span>
                  <span className="font-saira text-[10px] text-zinc-400">{fmtDate(item.entry.created_at)}</span>
                  {item.entry.sentiment === "positive" && <span className="ml-auto text-emerald-400 text-xs">+</span>}
                  {item.entry.sentiment === "negative" && <span className="ml-auto text-rose-400 text-xs">–</span>}
                </div>
                <p className="font-saira text-xs text-zinc-300 line-clamp-3 leading-relaxed">{item.entry.content.slice(0, 160)}</p>
              </div>
            ) : (
              <div key={"t" + item.entry.id} className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-saira text-[9px] uppercase tracking-[0.14em] text-sky-300 border border-sky-500/20 rounded-full px-2 py-0.5 bg-sky-500/10">Training</span>
                  <span className="font-saira text-[10px] text-zinc-400">{fmtDate(item.entry.entry_date + "T12:00:00")}</span>
                  {item.entry.mood_rating != null && (
                    <span className="ml-auto font-saira text-[10px] text-zinc-400">mood {item.entry.mood_rating}/10</span>
                  )}
                </div>
                {[
                  { label: "After", value: item.entry.thoughts_after },
                  { label: "Well",  value: item.entry.what_went_well },
                  { label: "Issue", value: item.entry.frustrations },
                  { label: "Before",value: item.entry.thoughts_before },
                  { label: "Next",  value: item.entry.next_session },
                ].filter((f) => f.value).slice(0, 2).map((f) => (
                  <div key={f.label} className="mb-1 last:mb-0">
                    <span className="font-saira text-[9px] uppercase tracking-[0.14em] text-zinc-500">{f.label}: </span>
                    <span className="font-saira text-xs text-zinc-300 leading-relaxed line-clamp-2">{f.value}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ── TESTS ── */}
      {tab === "tests" && (
        <div className="space-y-3">

          {/* DAS */}
          <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-2">DAS — Depression / Anxiety / Stress</p>
            {athlete.das[0] ? (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-saira text-xs text-zinc-400">Total score</span>
                  <span className={`font-saira text-xs font-bold tabular-nums ${
                    athlete.das[0].depression_prone ? "text-rose-400" : athlete.das[0].total_score > 18 ? "text-amber-400" : "text-emerald-400"
                  }`}>{athlete.das[0].total_score > 0 ? "+" : ""}{athlete.das[0].total_score} / ±70</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-saira text-xs text-zinc-400">Risk flag</span>
                  <span className={`font-saira text-xs font-semibold ${athlete.das[0].depression_prone ? "text-rose-400" : "text-emerald-400"}`}>
                    {athlete.das[0].depression_prone ? "⚠ Elevated" : "Normal"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-saira text-xs text-zinc-400">Date</span>
                  <span className="font-saira text-xs text-zinc-300">{fmtDate(athlete.das[0].submitted_at)}</span>
                </div>
              </div>
            ) : (
              <p className="font-saira text-xs text-zinc-500">No result yet</p>
            )}
          </div>

          {/* ACSI */}
          <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-2">ACSI — Athletic Coping Skills</p>
            {athlete.acsi[0] ? (() => {
              const r = athlete.acsi[0];
              const total = r.total_score ?? (r.score_coping + r.score_concentration + r.score_confidence + r.score_goal_setting);
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-saira text-xs text-zinc-400">Total</span>
                    <span className={`font-saira text-xs font-bold tabular-nums ${total >= 130 ? "text-emerald-400" : total >= 90 ? "text-amber-400" : "text-rose-400"}`}>{total} / 196</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {[
                      { l: "Coping",     v: r.score_coping,        max: 28 },
                      { l: "Concentrat.",v: r.score_concentration,  max: 28 },
                      { l: "Confidence", v: r.score_confidence,     max: 28 },
                      { l: "Goal-set.",  v: r.score_goal_setting,   max: 28 },
                    ].map(({ l, v, max }) => (
                      <div key={l} className="flex justify-between">
                        <span className="font-saira text-[10px] text-zinc-500">{l}</span>
                        <span className={`font-saira text-[10px] tabular-nums ${v >= 18 ? "text-emerald-400" : "text-rose-400"}`}>{v}/{max}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-saira text-xs text-zinc-400">Date</span>
                    <span className="font-saira text-xs text-zinc-300">{fmtDate(r.submitted_at)}</span>
                  </div>
                </div>
              );
            })() : (
              <p className="font-saira text-xs text-zinc-500">No result yet</p>
            )}
          </div>

          {/* CSAI-2 */}
          <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-sky-400 mb-2">CSAI-2 — Competitive State Anxiety</p>
            {athlete.csai[0] ? (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: "Cognitive",   v: athlete.csai[0].score_cognitive,  good: athlete.csai[0].score_cognitive  <= 18, sub: "/36" },
                    { l: "Somatic",     v: athlete.csai[0].score_somatic,    good: athlete.csai[0].score_somatic    <= 18, sub: "/36" },
                    { l: "Confidence",  v: athlete.csai[0].score_confidence, good: athlete.csai[0].score_confidence >= 22, sub: "/36" },
                  ].map(({ l, v, good, sub }) => (
                    <div key={l} className="rounded-lg bg-white/[0.03] p-2">
                      <p className={`font-saira text-sm font-bold tabular-nums ${good ? "text-emerald-400" : "text-rose-400"}`}>{v}<span className="text-[9px] text-zinc-500">{sub}</span></p>
                      <p className="font-saira text-[8px] uppercase tracking-[0.1em] text-zinc-500 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-saira text-xs text-zinc-400">Date</span>
                  <span className="font-saira text-xs text-zinc-300">{fmtDate(athlete.csai[0].submitted_at)}</span>
                </div>
              </div>
            ) : (
              <p className="font-saira text-xs text-zinc-500">No result yet</p>
            )}
          </div>

          {/* SAT */}
          <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-fuchsia-400 mb-2">SAT — Sport Anxiety Test</p>
            {athlete.sat[0] ? (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-saira text-xs text-zinc-400">Total score</span>
                  <span className="font-saira text-xs font-bold text-zinc-100 tabular-nums">{athlete.sat[0].total_score} / 165</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-saira text-xs text-zinc-400">Date</span>
                  <span className="font-saira text-xs text-zinc-300">{fmtDate(athlete.sat[0].submitted_at)}</span>
                </div>
              </div>
            ) : (
              <p className="font-saira text-xs text-zinc-500">No result yet</p>
            )}
          </div>

          <Link
            href="/coach"
            className="block text-center font-saira text-[10px] text-zinc-500 hover:text-emerald-400 transition pt-1"
          >
            Full profile & history on desktop →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Page wrapper (Suspense for useSearchParams) ───────────────────────────────

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
