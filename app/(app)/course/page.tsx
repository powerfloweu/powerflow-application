"use client";

import React from "react";
import Link from "next/link";
import PhaseBadge from "@/app/components/PhaseBadge";
import { computePhase } from "@/lib/phase";
import {
  COURSE_WEEKS,
  weeksByTheme,
  suggestedWeekNum,
  TOTAL_WEEKS,
  stepsComplete,
  type CourseWeek,
  type CourseProgressRow,
} from "@/lib/course";

type Profile = {
  id: string;
  display_name: string;
  meet_date: string | null;
  course_access: boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CourseIndexPage() {
  const [profile, setProfile]   = React.useState<Profile | null>(null);
  const [progress, setProgress] = React.useState<CourseProgressRow[]>([]);
  const [loading, setLoading]   = React.useState(true);

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

  const phase      = profile ? computePhase(profile.meet_date) : null;
  const daysUntil  = phase?.daysUntil ?? null;
  const currentNum = suggestedWeekNum(daysUntil);

  // Index by week_num for O(1) lookups
  const progressMap = React.useMemo(() => {
    const m: Record<number, CourseProgressRow> = {};
    for (const row of progress) m[row.week_num] = row;
    return m;
  }, [progress]);

  const completedCount = progress.filter((r) => !!r.completed_at).length;
  const percent        = Math.round((completedCount / TOTAL_WEEKS) * 100);
  const grouped        = weeksByTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ── Locked (no course access) ──────────────────────────────
  if (!loading && profile && !profile.course_access) {
    return <CourseLockedPage />;
  }

  const currentWeek = COURSE_WEEKS.find((w) => w.weekNumber === currentNum);

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

      {/* ── Progress bar ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
            Progress
          </p>
          <p className="font-saira text-xs text-zinc-400 tabular-nums">
            {completedCount} / {TOTAL_WEEKS} complete
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ── Current-week CTA ─────────────────────────────────── */}
      {currentWeek && !progressMap[currentNum]?.completed_at && (
        <Link
          href={`/course/w/${currentNum}`}
          className="block rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-purple-900/10 p-5 mb-6 hover:border-purple-400/50 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300">
              {profile?.meet_date ? "This week" : "Start here"}
            </p>
            <PhaseBadge phase={currentWeek.suggestedPhase} weekNum={currentWeek.weekNumber} />
          </div>
          <p className="font-saira text-lg font-bold text-white mb-1 group-hover:text-purple-200 transition">
            {currentWeek.title}
          </p>
          {currentWeek.subtitle && (
            <p className="font-saira text-xs text-zinc-400 mb-3">{currentWeek.subtitle}</p>
          )}
          {/* Mini progress dots */}
          <StepDots row={progressMap[currentNum]} />
          <p className="mt-3 font-saira text-xs text-purple-300 group-hover:text-white transition">
            Continue →
          </p>
        </Link>
      )}

      {/* ── Theme groups ──────────────────────────────────────── */}
      <div className="space-y-6">
        {grouped.map(({ theme, weeks }) => (
          <div key={theme}>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-3">
              {theme}
            </p>
            <div className="space-y-2">
              {weeks.map((w) => (
                <WeekCard
                  key={w.weekNumber}
                  week={w}
                  row={progressMap[w.weekNumber]}
                  isCurrent={w.weekNumber === currentNum}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WeekCard ──────────────────────────────────────────────────────────────────

function WeekCard({
  week,
  row,
  isCurrent,
}: {
  week: CourseWeek;
  row: CourseProgressRow | undefined;
  isCurrent: boolean;
}) {
  const done      = !!row?.completed_at;
  const hasStarted = !!row?.video_done_at || !!row?.quiz_done_at || !!row?.exercise_done_at;

  return (
    <Link
      href={`/course/w/${week.weekNumber}`}
      className={`flex items-center gap-4 rounded-xl border p-4 transition group ${
        done
          ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
          : isCurrent
          ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
          : "border-white/5 bg-[#17131F] hover:bg-[#1e1828]"
      }`}
    >
      {/* Week bubble */}
      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-saira text-xs font-bold ${
          done
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            : isCurrent
            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
            : "bg-white/5 text-zinc-500 border border-white/5"
        }`}
      >
        {done ? "✓" : `W${week.weekNumber}`}
      </div>

      {/* Title + step dots */}
      <div className="flex-1 min-w-0">
        <p className={`font-saira text-sm font-semibold truncate transition ${
          done ? "text-emerald-200" : "text-white group-hover:text-purple-300"
        }`}>
          {week.title}
        </p>
        {hasStarted && !done ? (
          <StepDots row={row} />
        ) : week.subtitle ? (
          <p className="font-saira text-[11px] text-zinc-500 truncate">{week.subtitle}</p>
        ) : null}
      </div>

      <span className="font-saira text-sm text-zinc-600 group-hover:text-purple-400 transition flex-shrink-0">
        →
      </span>
    </Link>
  );
}

// ── StepDots ──────────────────────────────────────────────────────────────────

function StepDots({ row }: { row: CourseProgressRow | undefined }) {
  const s = stepsComplete(row);
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Dot filled={s.video}    label="Video"    />
      <Dot filled={s.exercise} label="Exercise" />
      <Dot filled={s.quiz}     label="Q&A"      />
    </div>
  );
}

function Dot({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`w-1.5 h-1.5 rounded-full transition ${
        filled ? "bg-purple-400" : "bg-white/15"
      }`}
    />
  );
}

// ── CourseLockedPage ──────────────────────────────────────────────────────────

const PREVIEW_THEMES = [
  { theme: "Identity & Why", weeks: "W1 – W2" },
  { theme: "Focus & Attention", weeks: "W3 – W4" },
  { theme: "Confidence", weeks: "W5 – W7" },
  { theme: "Arousal & Anxiety", weeks: "W8 – W10" },
  { theme: "Mental Toughness", weeks: "W11 – W12" },
  { theme: "Competition Prep", weeks: "W13 – W14" },
  { theme: "Meet Day & Review", weeks: "W15 – W16" },
];

function CourseLockedPage() {
  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-10 sm:px-6 max-w-lg mx-auto flex flex-col">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · COURSE
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
          Mental Training
        </h1>
      </div>

      {/* ── Lock card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 to-[#17131F] p-6 mb-6 text-center">
        <div className="w-16 h-16 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-3xl mx-auto mb-4">
          🔒
        </div>
        <h2 className="font-saira text-xl font-bold text-white mb-2">
          16-Week Mental Performance System
        </h2>
        <p className="font-saira text-sm text-zinc-400 leading-relaxed mb-5">
          A structured programme covering every mental skill that separates good lifters from great ones — from identity and confidence through to meet-day execution.
        </p>

        {/* Bullets */}
        <ul className="text-left space-y-2 mb-6">
          {[
            "16 weeks of guided mental training",
            "Video lesson + reflection exercise each week",
            "Built around your competition date",
            "7 themes: identity, focus, confidence, anxiety, toughness, prep & meet day",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              </span>
              <span className="font-saira text-[13px] text-zinc-300">{point}</span>
            </li>
          ))}
        </ul>

        <a
          href="https://power-flow.eu/checkout/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition"
        >
          Get Access →
        </a>
        <p className="font-saira text-[10px] text-zinc-600 mt-2">
          One-time purchase · instant access
        </p>
      </div>

      {/* ── Blurred preview ───────────────────────────────────── */}
      <div className="relative rounded-2xl border border-white/5 bg-[#17131F] p-5 overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-[2px] bg-[#050608]/60 z-10 flex items-center justify-center rounded-2xl">
          <span className="font-saira text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Unlocks with access
          </span>
        </div>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-3">
          What's inside
        </p>
        <div className="space-y-2 opacity-40">
          {PREVIEW_THEMES.map(({ theme, weeks }) => (
            <div key={theme} className="flex items-center justify-between">
              <span className="font-saira text-sm text-white">{theme}</span>
              <span className="font-saira text-[11px] text-zinc-500">{weeks}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
