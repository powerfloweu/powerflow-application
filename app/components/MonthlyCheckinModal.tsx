"use client";

import React from "react";
import { weekLabel } from "@/lib/weeklyCheckin";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TargetWeek {
  week: number;
  year: number;
  weekStart: string;
}

interface Props {
  targetWeek: TargetWeek;
  onDone: () => void;
  onSkip?: () => void;
}

// ── Shared rating row (identical style to WeeklyCheckinModal) ─────────────────

function RatingRow({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  accent = "purple",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
  accent?: "purple" | "amber";
}) {
  const selected =
    accent === "amber"
      ? "border-amber-500 bg-amber-500/80 text-white"
      : "border-purple-500 bg-purple-600 text-white";

  return (
    <div className="space-y-2">
      <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </span>
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`aspect-square rounded-lg sm:rounded-xl border font-saira text-xs sm:text-sm font-semibold transition ${
              value === n
                ? selected
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between font-saira text-[9px] text-zinc-500 px-0.5">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionHeading({
  title,
  sub,
  accent = false,
}: {
  title: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <p
        className={`font-saira text-base font-extrabold uppercase tracking-[0.12em] ${
          accent ? "text-amber-400" : "text-white"
        }`}
      >
        {title}
      </p>
      {sub && (
        <p className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.18em]">{sub}</p>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function MonthlyCheckinModal({ targetWeek, onDone, onSkip }: Props) {
  const label = weekLabel(targetWeek.week, targetWeek.weekStart);

  // ── Weekly ratings ──────────────────────────────────────────────────────────
  const [mood,      setMood]      = React.useState(7);
  const [training,  setTraining]  = React.useState(7);
  const [readiness, setReadiness] = React.useState(7);
  const [energy,    setEnergy]    = React.useState(7);
  const [sleep,     setSleep]     = React.useState(7);

  // ── Weekly reflection ───────────────────────────────────────────────────────
  const [biggestWin,       setBiggestWin]       = React.useState("");
  const [biggestChallenge, setBiggestChallenge] = React.useState("");
  const [focusNextWeek,    setFocusNextWeek]    = React.useState("");

  // ── Monthly-specific ────────────────────────────────────────────────────────
  const [overallProgress,      setOverallProgress]      = React.useState(7);
  const [biggestBreakthrough,  setBiggestBreakthrough]  = React.useState("");
  const [keyLesson,            setKeyLesson]            = React.useState("");
  const [nextMonthIntention,   setNextMonthIntention]   = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error,  setError]  = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/monthly-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_rating:          mood,
          training_quality:     training,
          readiness_rating:     readiness,
          energy_rating:        energy,
          sleep_rating:         sleep,
          overall_progress:     overallProgress,
          biggest_win:          biggestWin,
          biggest_challenge:    biggestChallenge,
          focus_next_week:      focusNextWeek,
          biggest_breakthrough: biggestBreakthrough,
          key_lesson:           keyLesson,
          next_month_intention: nextMonthIntention,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      onDone();
    } catch {
      setError("Couldn't save — please try again.");
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onSkip} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-alt border border-white/8 shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between px-6 pt-6 pb-4 bg-surface-alt border-b border-white/5">
          <div>
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400 mb-1">
              Monthly Check-In
            </p>
            <h2 className="font-saira text-lg font-extrabold uppercase tracking-[0.08em]">
              {label}
            </h2>
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-300 hover:bg-white/5 transition"
              aria-label="Skip for now"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── Weekly ratings ─────────────────────────────────────────────── */}
          <div className="space-y-5">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
              Rate your week  ·  1 = very low · 10 = excellent
            </p>
            <RatingRow label="Overall mood"            value={mood}      onChange={setMood}      lowLabel="Low"       highLabel="Great"      />
            <RatingRow label="Training quality"        value={training}  onChange={setTraining}  lowLabel="Poor"      highLabel="Peak"       />
            <RatingRow label="Energy levels"           value={energy}    onChange={setEnergy}    lowLabel="Drained"   highLabel="Strong"     />
            <RatingRow label="Sleep quality"           value={sleep}     onChange={setSleep}     lowLabel="Poor"      highLabel="Excellent"  />
            <RatingRow label="Readiness for next week" value={readiness} onChange={setReadiness} lowLabel="Not ready" highLabel="Very ready" />
          </div>

          {/* ── Weekly reflection ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <SectionHeading title="Reflect" sub="all optional" />

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                What was your biggest win or positive moment this week?
              </label>
              <textarea
                value={biggestWin}
                onChange={(e) => setBiggestWin(e.target.value)}
                placeholder="Something that went well…"
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition"
              />
            </div>

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                What was the main challenge you faced?
              </label>
              <textarea
                value={biggestChallenge}
                onChange={(e) => setBiggestChallenge(e.target.value)}
                placeholder="A difficulty, doubt, or obstacle…"
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition"
              />
            </div>

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                One thing to focus on next week
              </label>
              <textarea
                value={focusNextWeek}
                onChange={(e) => setFocusNextWeek(e.target.value)}
                placeholder="An intention, goal, or process cue…"
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition"
              />
            </div>
          </div>

          {/* ── Monthly reflection divider ──────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-amber-500/20" />
            <span className="font-saira text-[9px] font-bold uppercase tracking-[0.26em] text-amber-400/70">
              Monthly Reflection
            </span>
            <div className="flex-1 h-px bg-amber-500/20" />
          </div>

          {/* ── Monthly-specific section ────────────────────────────────────── */}
          <div className="space-y-5">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
              How was your month overall?  ·  1 = very low · 10 = excellent
            </p>
            <RatingRow
              label="Overall monthly progress"
              value={overallProgress}
              onChange={setOverallProgress}
              lowLabel="Stalled"
              highLabel="On fire"
              accent="amber"
            />
          </div>

          <div className="space-y-4">
            <SectionHeading title="Look back" sub="all optional" accent />

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                What was your biggest breakthrough or achievement this month?
              </label>
              <textarea
                value={biggestBreakthrough}
                onChange={(e) => setBiggestBreakthrough(e.target.value)}
                placeholder="A result, realisation, or moment of growth…"
                rows={2}
                className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-amber-400/40 resize-none transition"
              />
            </div>

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                What's the most important thing you learned about yourself this month?
              </label>
              <textarea
                value={keyLesson}
                onChange={(e) => setKeyLesson(e.target.value)}
                placeholder="A pattern, strength, or area to work on…"
                rows={2}
                className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-amber-400/40 resize-none transition"
              />
            </div>

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                What's your main intention going into next month?
              </label>
              <textarea
                value={nextMonthIntention}
                onChange={(e) => setNextMonthIntention(e.target.value)}
                placeholder="A goal, process focus, or mindset shift…"
                rows={2}
                className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-amber-400/40 resize-none transition"
              />
            </div>
          </div>

          {error && (
            <p className="font-saira text-xs text-rose-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 px-5 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
            >
              {saving ? "Saving…" : "Submit check-in"}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-xl border border-white/10 px-4 py-3 font-saira text-[11px] text-zinc-300 hover:text-zinc-300 hover:border-white/20 transition"
              >
                Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
