"use client";

import React from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import PhaseBadge from "@/app/components/PhaseBadge";
import VidyardPlayer from "@/app/components/VidyardPlayer";
import {
  getWeek,
  COURSE_WEEKS,
  type CourseQuestion,
  type CourseAnswerRow,
} from "@/lib/course";

// ── Component ────────────────────────────────────────────────────────────────

export default function WeekDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const week = getWeek(slug);

  if (!week) {
    notFound();
  }

  // ── Local state ────────────────────────────────────────────
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = React.useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());
  const [completed, setCompleted] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // ── Load existing answers + progress ───────────────────────
  React.useEffect(() => {
    Promise.all([
      fetch(`/api/course/answers?week=${encodeURIComponent(slug)}`).then((r) => r.json()),
      fetch(`/api/course/progress`).then((r) => r.json()),
    ])
      .then(([ans, prog]: [CourseAnswerRow[], { week_slug: string; completed: boolean }[]]) => {
        const map: Record<string, string> = {};
        if (Array.isArray(ans)) {
          for (const a of ans) map[a.question_id] = a.answer ?? "";
        }
        setAnswers(map);
        if (Array.isArray(prog)) {
          const row = prog.find((p) => p.week_slug === slug);
          if (row?.completed) setCompleted(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Autosave with debounce ─────────────────────────────────
  const saveTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const scheduleSave = (q: CourseQuestion, value: string) => {
    if (saveTimers.current[q.id]) clearTimeout(saveTimers.current[q.id]);
    saveTimers.current[q.id] = setTimeout(async () => {
      setSavingIds((s) => new Set(s).add(q.id));
      setSavedIds((s) => {
        const next = new Set(s);
        next.delete(q.id);
        return next;
      });

      try {
        await fetch("/api/course/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            week_slug: slug,
            question_id: q.id,
            answer: value,
            journalMirror: q.journalMirror ?? false,
            questionPrompt: q.prompt,
          }),
        });
        setSavedIds((s) => new Set(s).add(q.id));
        setTimeout(() => {
          setSavedIds((s) => {
            const next = new Set(s);
            next.delete(q.id);
            return next;
          });
        }, 2000);
      } finally {
        setSavingIds((s) => {
          const next = new Set(s);
          next.delete(q.id);
          return next;
        });
      }
    }, 700);
  };

  const handleChange = (q: CourseQuestion, value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    scheduleSave(q, value);
  };

  // ── Complete / reopen ──────────────────────────────────────
  const toggleComplete = async () => {
    setCompleting(true);
    try {
      await fetch("/api/course/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_slug: slug, completed: !completed }),
      });
      setCompleted(!completed);
    } finally {
      setCompleting(false);
    }
  };

  // ── Navigation to prev/next week ───────────────────────────
  const idx = COURSE_WEEKS.findIndex((w) => w.slug === slug);
  const prev = idx > 0 ? COURSE_WEEKS[idx - 1] : null;
  const next = idx >= 0 && idx < COURSE_WEEKS.length - 1 ? COURSE_WEEKS[idx + 1] : null;

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-8 pb-6 sm:px-6 max-w-lg mx-auto">

      {/* ── Back link ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => router.push("/course")}
        className="mb-4 font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
      >
        ← Course
      </button>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <PhaseBadge phase={week.suggestedPhase} weekNum={week.weekNumber} />
          <span className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            {week.theme}
          </span>
        </div>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          {week.title}
        </h1>
        {week.subtitle && (
          <p className="font-saira text-sm text-zinc-400">{week.subtitle}</p>
        )}
      </div>

      {/* ── Watch ─────────────────────────────────────────────── */}
      <section className="mb-6">
        <SectionHeader icon="▶" label="Watch" />
        <VidyardPlayer uuid={week.vidyardUuid ?? ""} title={week.title} />
      </section>

      {/* ── Listen (audio, optional) ──────────────────────────── */}
      {week.audioUrl && (
        <section className="mb-6">
          <SectionHeader icon="♪" label="Listen" />
          <div className="rounded-2xl border border-white/5 bg-[#17131F] p-4">
            <audio
              src={week.audioUrl}
              controls
              className="w-full [color-scheme:dark]"
              preload="none"
            />
          </div>
        </section>
      )}

      {/* ── Overview + key points ─────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-white/5 bg-[#17131F] p-5">
        <p className="font-saira text-sm text-zinc-300 leading-relaxed mb-4">
          {week.overview}
        </p>
        <ul className="space-y-2">
          {week.keyPoints.map((kp, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-saira text-[10px] text-purple-400 font-bold mt-1 flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-saira text-[13px] text-zinc-300 leading-relaxed">
                {kp}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Reflect ───────────────────────────────────────────── */}
      <section className="mb-6">
        <SectionHeader icon="✎" label="Reflect" />
        <div className="space-y-4">
          {week.questions.map((q) => (
            <QuestionBlock
              key={q.id}
              question={q}
              value={answers[q.id] ?? ""}
              saving={savingIds.has(q.id)}
              saved={savedIds.has(q.id)}
              onChange={(v) => handleChange(q, v)}
            />
          ))}
        </div>
      </section>

      {/* ── Practise (exercise, optional) ─────────────────────── */}
      {week.exercise && (
        <section className="mb-6">
          <SectionHeader icon="◐" label="Practise" />
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
            <p className="font-saira text-sm font-semibold text-purple-200 mb-2">
              {week.exercise.title}
            </p>
            <p className="font-saira text-[13px] text-zinc-300 leading-relaxed">
              {week.exercise.body}
            </p>
          </div>
        </section>
      )}

      {/* ── Complete button ───────────────────────────────────── */}
      <button
        type="button"
        onClick={toggleComplete}
        disabled={completing}
        className={`w-full rounded-2xl py-4 font-saira text-sm font-semibold uppercase tracking-[0.16em] transition disabled:opacity-50 ${
          completed
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            : "bg-purple-600 hover:bg-purple-500 text-white"
        }`}
      >
        {completing
          ? "…"
          : completed
          ? "Week complete ✓ (tap to reopen)"
          : "Mark week complete"}
      </button>

      {/* ── Prev / Next ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mt-6">
        {prev ? (
          <Link
            href={`/course/${prev.slug}`}
            className="flex-1 rounded-xl border border-white/5 bg-[#17131F] p-3 hover:bg-[#1e1828] transition"
          >
            <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-0.5">
              ← Prev
            </p>
            <p className="font-saira text-xs text-zinc-300 truncate">
              W{prev.weekNumber} · {prev.title}
            </p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/course/${next.slug}`}
            className="flex-1 rounded-xl border border-white/5 bg-[#17131F] p-3 hover:bg-[#1e1828] transition text-right"
          >
            <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-0.5">
              Next →
            </p>
            <p className="font-saira text-xs text-zinc-300 truncate">
              W{next.weekNumber} · {next.title}
            </p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center font-saira text-[10px] text-purple-300">
        {icon}
      </span>
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function QuestionBlock({
  question,
  value,
  saving,
  saved,
  onChange,
}: {
  question: CourseQuestion;
  value: string;
  saving: boolean;
  saved: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#17131F] p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-saira text-sm font-semibold text-white leading-snug flex-1">
          {question.prompt}
        </p>
        <span className="font-saira text-[10px] text-zinc-600 flex-shrink-0 mt-0.5 min-w-[52px] text-right">
          {saving ? "saving…" : saved ? "saved ✓" : question.journalMirror ? "→ journal" : ""}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder ?? "Your reflection…"}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark]"
      />
    </div>
  );
}
