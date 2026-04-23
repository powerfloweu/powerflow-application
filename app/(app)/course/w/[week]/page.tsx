"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PhaseBadge from "@/app/components/PhaseBadge";
import VidyardPlayer from "@/app/components/VidyardPlayer";
import BottomSheet from "@/app/components/BottomSheet";
import {
  getWeekByNum,
  COURSE_WEEKS,
  stepsComplete,
  type CourseQuestion,
  type CourseProgressRow,
  type CourseAnswerRow,
} from "@/lib/course";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WeekDetailPage() {
  const router = useRouter();
  const { week: weekParam } = useParams<{ week: string }>();
  const weekNum = Number(weekParam);
  const week    = getWeekByNum(weekNum);

  // ── State ──────────────────────────────────────────────────
  const [progress, setProgress]       = React.useState<CourseProgressRow | null>(null);
  const [answers, setAnswers]         = React.useState<Record<string, string>>({});
  const [activeQ, setActiveQ]         = React.useState<CourseQuestion | null>(null);
  const [sheetText, setSheetText]     = React.useState("");
  const [sheetTab, setSheetTab]       = React.useState<"text" | "voice">("text");
  const [sheetSaving, setSheetSaving] = React.useState(false);
  const [sheetSaved, setSheetSaved]   = React.useState(false);
  const [completing, setCompleting]   = React.useState(false);
  const [loading, setLoading]         = React.useState(true);

  // ── Load data ──────────────────────────────────────────────
  React.useEffect(() => {
    if (!weekNum) return;
    Promise.all([
      fetch("/api/course/progress").then((r) => r.json()),
      fetch(`/api/course/answers?week=${weekNum}`).then((r) => r.json()),
    ])
      .then(([prog, ans]: [CourseProgressRow[], CourseAnswerRow[]]) => {
        const row = Array.isArray(prog) ? prog.find((p) => p.week_num === weekNum) ?? null : null;
        setProgress(row);
        const map: Record<string, string> = {};
        if (Array.isArray(ans)) for (const a of ans) map[a.question_id] = a.text ?? "";
        setAnswers(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekNum]);

  // ── Open question sheet ────────────────────────────────────
  const openQuestion = (q: CourseQuestion) => {
    setActiveQ(q);
    setSheetText(answers[q.id] ?? "");
    setSheetTab("text");
    setSheetSaved(false);
  };

  const closeSheet = () => setActiveQ(null);

  // ── Save answer ────────────────────────────────────────────
  const saveAnswer = async () => {
    if (!activeQ) return;
    setSheetSaving(true);
    await fetch("/api/course/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_num: weekNum, question_id: activeQ.id, text: sheetText }),
    });
    setAnswers((prev) => ({ ...prev, [activeQ.id]: sheetText }));
    // If quiz step just became done, refresh progress
    if (sheetText.trim() && !progress?.quiz_done_at) {
      const rows: CourseProgressRow[] = await fetch("/api/course/progress")
        .then((r) => r.json()).catch(() => []);
      const row = Array.isArray(rows) ? rows.find((p) => p.week_num === weekNum) ?? null : null;
      setProgress(row);
    }
    setSheetSaving(false);
    setSheetSaved(true);
    setTimeout(() => setSheetSaved(false), 1800);
  };

  // ── Mark video done ────────────────────────────────────────
  const markVideoDone = async () => {
    if (progress?.video_done_at) return; // already done
    await fetch("/api/course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_num: weekNum, step: "video" }),
    });
    setProgress((p) => p
      ? { ...p, video_done_at: new Date().toISOString() }
      : { user_id: "", week_num: weekNum, video_done_at: new Date().toISOString(), exercise_done_at: null, quiz_done_at: null, completed_at: null, updated_at: new Date().toISOString() }
    );
  };

  // ── Mark exercise done (on textarea blur with content) ─────
  const markExerciseDone = async () => {
    if (progress?.exercise_done_at) return;
    await fetch("/api/course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_num: weekNum, step: "exercise" }),
    });
    setProgress((p) => p ? { ...p, exercise_done_at: new Date().toISOString() } : p);
  };

  const [exerciseText, setExerciseText] = React.useState("");
  const [exerciseSaving, setExerciseSaving] = React.useState(false);
  const exerciseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExerciseChange = (v: string) => {
    setExerciseText(v);
    if (exerciseTimer.current) clearTimeout(exerciseTimer.current);
    exerciseTimer.current = setTimeout(async () => {
      if (!v.trim()) return;
      setExerciseSaving(true);
      // Save as a special answer with question_id = "exercise"
      await fetch("/api/course/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_num: weekNum, question_id: "exercise", text: v }),
      });
      setExerciseSaving(false);
      await markExerciseDone();
    }, 800);
  };

  // Load existing exercise answer
  React.useEffect(() => {
    if (answers["exercise"]) setExerciseText(answers["exercise"]);
  }, [answers]);

  // ── Mark week complete ─────────────────────────────────────
  const markComplete = async () => {
    setCompleting(true);
    await fetch("/api/course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_num: weekNum, step: "complete" }),
    });
    setProgress((p) => p ? { ...p, completed_at: new Date().toISOString() } : p);
    setCompleting(false);
  };

  const steps  = stepsComplete(progress ?? undefined);
  const idx    = COURSE_WEEKS.findIndex((w) => w.weekNumber === weekNum);
  const prev   = idx > 0 ? COURSE_WEEKS[idx - 1] : null;
  const next   = idx >= 0 && idx < COURSE_WEEKS.length - 1 ? COURSE_WEEKS[idx + 1] : null;

  // ── 404 ────────────────────────────────────────────────────
  if (!loading && !week) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <p className="font-saira text-sm text-zinc-400">Week not found.</p>
        <button onClick={() => router.push("/course")} className="font-saira text-xs text-purple-300 underline">
          ← Back to course
        </button>
      </div>
    );
  }

  if (loading || !week) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#050608] px-4 pt-8 pb-6 sm:px-6 max-w-lg mx-auto">

        {/* ── Back ────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push("/course")}
          className="mb-4 font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
        >
          ← Course
        </button>

        {/* ── Hero ────────────────────────────────────────────── */}
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

          {/* Step progress */}
          <div className="flex items-center gap-3 mt-3">
            <StepPill done={steps.video}    label="Video"    />
            <StepPill done={steps.exercise} label="Exercise" />
            <StepPill done={steps.quiz}     label="Q&A"      />
          </div>
        </div>

        {/* ── Watch ───────────────────────────────────────────── */}
        <section className="mb-6">
          <SectionLabel icon="▶" label="Watch" />
          <VidyardPlayer
            uuid={week.vidyardUuid ?? ""}
            title={week.title}
            onPlay={markVideoDone}
          />
        </section>

        {/* ── Overview + key points ───────────────────────────── */}
        <section className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
          <p className="font-saira text-sm text-zinc-300 leading-relaxed mb-4">
            {week.overview}
          </p>
          <ul className="space-y-2">
            {week.keyPoints.map((kp, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-saira text-[10px] text-purple-400 font-bold mt-0.5 flex-shrink-0 w-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-saira text-[13px] text-zinc-300 leading-relaxed">{kp}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Reflect / Q&A ───────────────────────────────────── */}
        <section className="mb-6">
          <SectionLabel icon="?" label="Reflect" />
          <div className="space-y-2">
            {week.questions.map((q) => {
              const answered = !!(answers[q.id]?.trim());
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => openQuestion(q)}
                  className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition group ${
                    answered
                      ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "border-white/5 bg-[#17131F] hover:bg-[#1e1828]"
                  }`}
                >
                  <span className={`w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                    answered
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-white/10 text-zinc-600"
                  }`}>
                    {answered ? "✓" : "?"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-saira text-sm text-white leading-snug group-hover:text-purple-200 transition">
                      {q.prompt}
                    </p>
                    {answered && (
                      <p className="font-saira text-[11px] text-zinc-500 mt-1 truncate">
                        {answers[q.id]}
                      </p>
                    )}
                  </div>
                  <span className="font-saira text-sm text-zinc-600 group-hover:text-purple-400 transition flex-shrink-0 mt-0.5">
                    {answered ? "Edit" : "→"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Practise (exercise) ─────────────────────────────── */}
        {week.exercise && (
          <section className="mb-6">
            <SectionLabel icon="◐" label="Practise" />
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
              <p className="font-saira text-sm font-semibold text-purple-200 mb-1">
                {week.exercise.title}
              </p>
              <p className="font-saira text-[13px] text-zinc-300 leading-relaxed mb-4">
                {week.exercise.body}
              </p>
              <textarea
                value={exerciseText}
                onChange={(e) => handleExerciseChange(e.target.value)}
                placeholder="Write your response here…"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark]"
              />
              {exerciseSaving && (
                <p className="font-saira text-[10px] text-zinc-600 mt-1">Saving…</p>
              )}
            </div>
          </section>
        )}

        {/* ── Mark complete ────────────────────────────────────── */}
        <button
          type="button"
          onClick={markComplete}
          disabled={completing || !!progress?.completed_at}
          className={`w-full rounded-2xl py-4 font-saira text-sm font-semibold uppercase tracking-[0.16em] transition disabled:opacity-60 ${
            progress?.completed_at
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "bg-purple-600 hover:bg-purple-500 text-white"
          }`}
        >
          {completing ? "…" : progress?.completed_at ? "Week complete ✓" : "Mark week complete"}
        </button>

        {/* ── Prev / Next ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mt-6">
          {prev ? (
            <Link
              href={`/course/w/${prev.weekNumber}`}
              className="flex-1 rounded-xl border border-white/5 bg-[#17131F] p-3 hover:bg-[#1e1828] transition"
            >
              <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-0.5">← Prev</p>
              <p className="font-saira text-xs text-zinc-300 truncate">W{prev.weekNumber} · {prev.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {next ? (
            <Link
              href={`/course/w/${next.weekNumber}`}
              className="flex-1 rounded-xl border border-white/5 bg-[#17131F] p-3 hover:bg-[#1e1828] transition text-right"
            >
              <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-0.5">Next →</p>
              <p className="font-saira text-xs text-zinc-300 truncate">W{next.weekNumber} · {next.title}</p>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </div>

      {/* ── Question bottom sheet ────────────────────────────── */}
      <BottomSheet open={!!activeQ} onClose={closeSheet} title={activeQ?.prompt}>
        {activeQ && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-white/5 bg-[#0D0B14] p-1">
              {(["text", "voice"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSheetTab(tab)}
                  className={`flex-1 rounded-lg py-2 font-saira text-xs uppercase tracking-[0.16em] transition ${
                    sheetTab === tab
                      ? "bg-purple-600 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab === "text" ? "Text" : "Voice"}
                </button>
              ))}
            </div>

            {sheetTab === "text" ? (
              <>
                <textarea
                  value={sheetText}
                  onChange={(e) => { setSheetText(e.target.value); setSheetSaved(false); }}
                  placeholder={activeQ.placeholder ?? "Write your reflection…"}
                  rows={6}
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-3 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={saveAnswer}
                  disabled={sheetSaving || !sheetText.trim()}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 font-saira text-xs font-semibold uppercase tracking-[0.16em] text-white transition"
                >
                  {sheetSaving ? "Saving…" : sheetSaved ? "Saved ✓" : "Save reflection"}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-14 h-14 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-2xl">
                  🎙
                </div>
                <p className="font-saira text-sm font-semibold text-white">Voice answers coming soon</p>
                <p className="font-saira text-xs text-zinc-500 max-w-[260px]">
                  Audio recording will be available in the next update. Use text for now.
                </p>
                <button
                  type="button"
                  onClick={() => setSheetTab("text")}
                  className="font-saira text-xs text-purple-300 underline"
                >
                  Switch to text
                </button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: string; label: string }) {
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

function StepPill({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.14em] border transition ${
      done
        ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
        : "border-white/5 bg-white/[0.03] text-zinc-600"
    }`}>
      <span className={`w-1 h-1 rounded-full ${done ? "bg-purple-400" : "bg-zinc-700"}`} />
      {label}
    </span>
  );
}
