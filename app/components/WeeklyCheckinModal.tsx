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
  onDone: () => void;   // called after successful submit or skip
  onSkip?: () => void;  // dismiss without submitting
}

// ── Rating row ────────────────────────────────────────────────────────────────

function RatingRow({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          {label}
        </span>
        <span className={`font-saira text-sm font-bold tabular-nums ${
          value >= 8 ? "text-emerald-400" : value >= 5 ? "text-purple-300" : "text-rose-400"
        }`}>
          {value}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-7 rounded font-saira text-[10px] font-bold transition-all ${
              n <= value
                ? n >= 8
                  ? "bg-emerald-500/80 text-white"
                  : n >= 5
                  ? "bg-purple-500/80 text-white"
                  : "bg-rose-500/70 text-white"
                : "bg-white/5 text-zinc-500 hover:bg-white/10"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between mt-1">
          <span className="font-saira text-[9px] text-zinc-500">{lowLabel}</span>
          <span className="font-saira text-[9px] text-zinc-500">{highLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function WeeklyCheckinModal({ targetWeek, onDone, onSkip }: Props) {
  const label = weekLabel(targetWeek.week, targetWeek.weekStart);

  const [mood,      setMood]      = React.useState(7);
  const [training,  setTraining]  = React.useState(7);
  const [readiness, setReadiness] = React.useState(7);
  const [energy,    setEnergy]    = React.useState(7);
  const [sleep,     setSleep]     = React.useState(7);

  const [biggestWin,       setBiggestWin]       = React.useState("");
  const [biggestChallenge, setBiggestChallenge] = React.useState("");
  const [focusNextWeek,    setFocusNextWeek]    = React.useState("");

  const [saving,  setSaving]  = React.useState(false);
  const [error,   setError]   = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_rating:      mood,
          training_quality: training,
          readiness_rating: readiness,
          energy_rating:    energy,
          sleep_rating:     sleep,
          biggest_win:      biggestWin,
          biggest_challenge: biggestChallenge,
          focus_next_week:  focusNextWeek,
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
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.28em] text-purple-400 mb-1">
              Weekly Check-In
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

          {/* Ratings */}
          <div className="space-y-5">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
              Rate your week  ·  1 = very low · 10 = excellent
            </p>
            <RatingRow label="Overall mood"       value={mood}      onChange={setMood}      lowLabel="Low" highLabel="Great" />
            <RatingRow label="Training quality"   value={training}  onChange={setTraining}  lowLabel="Poor" highLabel="Peak" />
            <RatingRow label="Energy levels"      value={energy}    onChange={setEnergy}    lowLabel="Drained" highLabel="Strong" />
            <RatingRow label="Sleep quality"      value={sleep}     onChange={setSleep}     lowLabel="Poor" highLabel="Excellent" />
            <RatingRow label="Readiness for next week" value={readiness} onChange={setReadiness} lowLabel="Not ready" highLabel="Very ready" />
          </div>

          {/* Text questions */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <p className="font-saira text-base font-extrabold uppercase tracking-[0.12em] text-white">
                Reflect
              </p>
              <p className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
                all optional
              </p>
            </div>

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

          {error && (
            <p className="font-saira text-xs text-rose-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 px-5 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
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
