"use client";

import React from "react";
import Link from "next/link";
import PhaseBadge from "@/app/components/PhaseBadge";
import { computePhase } from "@/lib/phase";
import {
  COURSE_WEEKS,
  weeksByTheme,
  suggestedWeek,
  TOTAL_WEEKS,
  type CourseWeek,
  type CourseProgressRow,
} from "@/lib/course";

type Profile = {
  id: string;
  display_name: string;
  meet_date: string | null;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CourseIndexPage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [progress, setProgress] = React.useState<CourseProgressRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/course/progress").then((r) => r.json()),
    ])
      .then(([prof, prog]) => {
        if (prof?.id) setProfile(prof);
        setProgress(Array.isArray(prog) ? prog : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const phase = profile ? computePhase(profile.meet_date) : null;
  const daysUntil = phase?.daysUntil ?? null;
  const suggested = suggestedWeek(daysUntil);

  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.week_slug),
  );
  const completedCount = completedSet.size;
  const percent = Math.round((completedCount / TOTAL_WEEKS) * 100);

  const grouped = weeksByTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-6 sm:px-6 max-w-lg mx-auto">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · COURSE
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          Mental Training
        </h1>
        <p className="font-saira text-sm text-zinc-500">
          {TOTAL_WEEKS} weeks · 7 themes · athlete-paced
        </p>
      </div>

      {/* ── Progress card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
            Progress
          </p>
          <p className="font-saira text-xs text-zinc-400 tabular-nums">
            {completedCount} / {TOTAL_WEEKS}
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ── Suggested week CTA ────────────────────────────────── */}
      {!completedSet.has(suggested.slug) && (
        <Link
          href={`/course/${suggested.slug}`}
          className="block rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-purple-900/10 p-5 mb-6 hover:border-purple-400/50 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300">
              {phase ? "Suggested for you" : "Start here"}
            </p>
            <PhaseBadge phase={suggested.suggestedPhase} weekNum={suggested.weekNumber} />
          </div>
          <p className="font-saira text-lg font-bold text-white mb-1 group-hover:text-purple-200 transition">
            {suggested.title}
          </p>
          {suggested.subtitle && (
            <p className="font-saira text-xs text-zinc-400 mb-3">{suggested.subtitle}</p>
          )}
          <p className="font-saira text-[11px] text-zinc-500 leading-relaxed line-clamp-3">
            {suggested.overview}
          </p>
          <p className="mt-3 font-saira text-xs text-purple-300 group-hover:text-purple-200">
            Open week →
          </p>
        </Link>
      )}

      {/* ── Themes + weeks ────────────────────────────────────── */}
      <div className="space-y-6">
        {grouped.map(({ theme, weeks }) => (
          <div key={theme}>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-3">
              {theme}
            </p>
            <div className="space-y-2">
              {weeks.map((w) => (
                <WeekRow
                  key={w.slug}
                  week={w}
                  completed={completedSet.has(w.slug)}
                  isSuggested={w.slug === suggested.slug}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Placeholder empty-state hint for dev ──────────────── */}
      {COURSE_WEEKS.length === 0 && (
        <p className="text-center font-saira text-sm text-zinc-600 mt-10">
          No course weeks configured yet.
        </p>
      )}
    </div>
  );
}

// ── WeekRow ──────────────────────────────────────────────────────────────────

function WeekRow({
  week,
  completed,
  isSuggested,
}: {
  week: CourseWeek;
  completed: boolean;
  isSuggested: boolean;
}) {
  return (
    <Link
      href={`/course/${week.slug}`}
      className={`flex items-center gap-4 rounded-xl border p-4 transition group ${
        completed
          ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
          : isSuggested
          ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
          : "border-white/5 bg-[#17131F] hover:bg-[#1e1828]"
      }`}
    >
      {/* Week number */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-saira text-xs font-bold tracking-wide ${
          completed
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            : isSuggested
            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
            : "bg-white/5 text-zinc-500 border border-white/5"
        }`}
      >
        {completed ? "✓" : `W${week.weekNumber}`}
      </div>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-saira text-sm font-semibold truncate transition ${
            completed
              ? "text-emerald-200"
              : "text-white group-hover:text-purple-300"
          }`}
        >
          {week.title}
        </p>
        {week.subtitle && (
          <p className="font-saira text-[11px] text-zinc-500 truncate">
            {week.subtitle}
          </p>
        )}
      </div>

      {/* Arrow */}
      <span className="font-saira text-sm text-zinc-600 group-hover:text-purple-400 transition flex-shrink-0">
        →
      </span>
    </Link>
  );
}
