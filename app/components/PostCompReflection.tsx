"use client";

import React from "react";

// ── Questions (from w16-post-meet course module) ─────────────────────────────

const QUESTIONS = [
  {
    id: "post-meet-overall",
    prompt: "How do you feel about your competition overall? What's your honest first reaction?",
    placeholder: "Write whatever comes to mind first — no filter needed.",
  },
  {
    id: "post-meet-win",
    prompt: "What was your biggest victory — on the platform or off it?",
    placeholder: "A lift, a mindset shift, showing up, anything that counts.",
  },
  {
    id: "post-meet-lesson",
    prompt: "What is the single most valuable thing you learned about yourself in this prep?",
    placeholder: "Could be about training, mental game, lifestyle…",
  },
  {
    id: "post-meet-mental",
    prompt: "Rate your mental preparation out of 10. What earned that score?",
    placeholder: "Be specific — what worked, what didn't.",
  },
  {
    id: "post-meet-next",
    prompt: "What is the one thing you'll do differently next prep?",
    placeholder: "Keep it concrete and actionable.",
  },
] as const;

type QuestionId = typeof QUESTIONS[number]["id"];
type Answers = Partial<Record<QuestionId, string>>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  meetDate: string; // YYYY-MM-DD
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PostCompReflection({ meetDate }: Props) {
  const [answers, setAnswers] = React.useState<Answers>({});
  const [saving, setSaving]   = React.useState(false);
  const [loaded, setLoaded]   = React.useState(false);
  const [open, setOpen]       = React.useState(true);

  // Load existing answers
  React.useEffect(() => {
    fetch(`/api/meet-reflections?meet_date=${meetDate}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.answers) setAnswers(data.answers as Answers);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [meetDate]);

  const completedCount = QUESTIONS.filter(q => (answers[q.id] ?? "").trim().length > 0).length;
  const allDone = completedCount === QUESTIONS.length;

  const save = React.useCallback((id: QuestionId, value: string) => {
    setSaving(true);
    fetch("/api/meet-reflections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meet_date: meetDate, answers: { [id]: value } }),
    })
      .catch(() => {})
      .finally(() => setSaving(false));
  }, [meetDate]);

  const handleBlur = (id: QuestionId, value: string) => {
    if (value.trim()) save(id, value.trim());
  };

  if (!loaded) return null;

  return (
    <div className="mb-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400 mb-0.5">
            Post-Competition Reflection
          </p>
          <p className="font-saira text-sm font-semibold text-zinc-100">
            {allDone ? "Reflection complete ✓" : `${completedCount} / ${QUESTIONS.length} questions answered`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Progress ring */}
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
            <circle
              cx="16" cy="16" r="13" fill="none"
              stroke="currentColor" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 13}`}
              strokeDashoffset={`${2 * Math.PI * 13 * (1 - completedCount / QUESTIONS.length)}`}
              className="text-emerald-400 transition-all duration-500"
            />
          </svg>
          <span className="text-zinc-400 font-saira text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-white/5 pt-4">
          {allDone && (
            <p className="font-saira text-xs text-emerald-300 text-center py-1">
              Great work — your coach can see this reflection.
            </p>
          )}

          {QUESTIONS.map((q) => {
            const value = answers[q.id] ?? "";
            const done = value.trim().length > 0;
            return (
              <div key={q.id}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                    done
                      ? "border-emerald-400 bg-emerald-500/20"
                      : "border-zinc-600 bg-transparent"
                  }`}>
                    {done && (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-emerald-400" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <p className="font-saira text-sm font-semibold text-zinc-100 leading-snug">
                    {q.prompt}
                  </p>
                </div>
                <textarea
                  value={value}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  onBlur={e => handleBlur(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-700/60 bg-surface-input px-3 py-2.5 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                />
              </div>
            );
          })}

          {saving && (
            <p className="font-saira text-[10px] text-zinc-400 text-right">Saving…</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Coach read-only view ──────────────────────────────────────────────────────

export type CoachReflectionEntry = {
  meet_date: string;
  answers: Answers;
};

interface CoachHistoryProps {
  athleteId: string;
}

export function CoachMeetHistory({ athleteId }: CoachHistoryProps) {
  const [entries, setEntries] = React.useState<CoachReflectionEntry[]>([]);
  const [loaded, setLoaded]   = React.useState(false);
  const [openDate, setOpenDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!athleteId) return;
    fetch(`/api/meet-reflections?athlete_id=${encodeURIComponent(athleteId)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setEntries(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [athleteId]);

  if (!loaded || entries.length === 0) return null;

  return (
    <div>
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400 mb-3">
        Competition Reflections
      </p>
      <div className="space-y-2">
        {entries.map(entry => {
          const isOpen = openDate === entry.meet_date;
          const answeredCount = QUESTIONS.filter(q => (entry.answers[q.id] ?? "").trim().length > 0).length;
          return (
            <div key={entry.meet_date} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenDate(isOpen ? null : entry.meet_date)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-saira text-sm font-semibold text-zinc-100">
                    {new Date(entry.meet_date + "T12:00:00").toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  <p className="font-saira text-[11px] text-zinc-400 mt-0.5">
                    {answeredCount} / {QUESTIONS.length} questions answered
                  </p>
                </div>
                <span className="text-zinc-500 text-sm">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-4 py-4 space-y-4">
                  {QUESTIONS.map(q => {
                    const text = (entry.answers[q.id] ?? "").trim();
                    return (
                      <div key={q.id}>
                        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80 mb-1">
                          {q.prompt}
                        </p>
                        <p className="font-saira text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {text || <span className="text-zinc-500 italic">No answer yet</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
