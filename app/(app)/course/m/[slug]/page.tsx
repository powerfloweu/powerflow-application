"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import PhaseBadge from "@/app/components/PhaseBadge";
import MuxVideoPlayer from "@/app/components/MuxVideoPlayer";
import BottomSheet from "@/app/components/BottomSheet";
import {
  getModule,
  stepsComplete,
  type CourseModule,
  type CourseQuestion,
  type CourseProgressRow,
  type CourseAnswerRow,
} from "@/lib/course";
import { useT } from "@/lib/i18n";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ModuleDetailPage() {
  const router = useRouter();
  const { t } = useT();
  const { slug } = useParams<{ slug: string }>();
  const mod = getModule(slug);

  // ── State ──────────────────────────────────────────────────────────────────
  const [progress, setProgress]       = React.useState<CourseProgressRow | null>(null);
  const [answers, setAnswers]         = React.useState<Record<string, string>>({});
  const [activeQ, setActiveQ]         = React.useState<CourseQuestion | null>(null);
  const [sheetText, setSheetText]     = React.useState("");
  const [sheetTab, setSheetTab]       = React.useState<"text" | "voice">("text");
  const [sheetSaving, setSheetSaving] = React.useState(false);
  const [sheetSaved, setSheetSaved]   = React.useState(false);
  const [completing, setCompleting]   = React.useState(false);
  const [practiceLogging, setPracticeLogging] = React.useState(false);
  const [practiceJustLogged, setPracticeJustLogged] = React.useState(false);
  const [loading, setLoading]         = React.useState(true);

  const [exerciseText, setExerciseText]     = React.useState("");
  const [exerciseSaving, setExerciseSaving] = React.useState(false);
  const exerciseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/course/progress").then((r) => r.json()),
      fetch(`/api/course/answers?slug=${encodeURIComponent(slug)}`).then((r) => r.json()),
    ])
      .then(([profile, prog, ans]: [{ course_access?: boolean; plan_tier?: string }, CourseProgressRow[], CourseAnswerRow[]]) => {
        const tier = profile?.plan_tier ?? "opener";
        const hasAccess = profile?.course_access || tier === "pr";
        if (!hasAccess) { router.replace("/course"); return; }
        const row = Array.isArray(prog)
          ? prog.find((p) => p.module_slug === slug) ?? null
          : null;
        setProgress(row);
        const map: Record<string, string> = {};
        if (Array.isArray(ans)) for (const a of ans) map[a.question_id] = a.text ?? "";
        setAnswers(map);
        if (map["exercise"]) setExerciseText(map["exercise"]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, router]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const postProgress = async (step: string) => {
    await fetch("/api/course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, step }),
    });
  };

  const refreshProgress = async () => {
    const rows: CourseProgressRow[] = await fetch("/api/course/progress")
      .then((r) => r.json()).catch(() => []);
    const row = Array.isArray(rows) ? rows.find((p) => p.module_slug === slug) ?? null : null;
    setProgress(row);
  };

  // ── Mark video done ────────────────────────────────────────────────────────
  const markVideoDone = async () => {
    if (progress?.video_done_at) return;
    await postProgress("video");
    setProgress((p) => ({
      ...(p ?? emptyRow(slug, mod?.weekNumber ?? 0)),
      video_done_at: new Date().toISOString(),
    }));
  };

  // ── Exercise autosave ──────────────────────────────────────────────────────
  const handleExerciseChange = (v: string) => {
    setExerciseText(v);
    if (exerciseTimer.current) clearTimeout(exerciseTimer.current);
    exerciseTimer.current = setTimeout(async () => {
      if (!v.trim()) return;
      setExerciseSaving(true);
      await fetch("/api/course/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, question_id: "exercise", text: v }),
      });
      setExerciseSaving(false);
      if (!progress?.exercise_done_at) {
        await postProgress("exercise");
        setProgress((p) => ({
          ...(p ?? emptyRow(slug, mod?.weekNumber ?? 0)),
          exercise_done_at: new Date().toISOString(),
        }));
      }
    }, 800);
  };

  // ── Answer sheet ───────────────────────────────────────────────────────────
  const openQuestion = (q: CourseQuestion) => {
    setActiveQ(q); setSheetText(answers[q.id] ?? "");
    setSheetTab("text"); setSheetSaved(false);
  };

  const saveAnswer = async () => {
    if (!activeQ) return;
    setSheetSaving(true);
    await fetch("/api/course/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, question_id: activeQ.id, text: sheetText }),
    });
    setAnswers((prev) => ({ ...prev, [activeQ.id]: sheetText }));
    if (sheetText.trim() && !progress?.quiz_done_at) await refreshProgress();
    setSheetSaving(false);
    setSheetSaved(true);
    setTimeout(() => setSheetSaved(false), 1800);
  };

  // ── Log practice session ───────────────────────────────────────────────────
  const logPractice = async () => {
    setPracticeLogging(true);
    await postProgress("practice");
    setProgress((p) => ({
      ...(p ?? emptyRow(slug, mod?.weekNumber ?? 0)),
      practice_count: (p?.practice_count ?? 0) + 1,
    }));
    setPracticeLogging(false);
    setPracticeJustLogged(true);
    setTimeout(() => setPracticeJustLogged(false), 2000);
  };

  // ── Mark complete ──────────────────────────────────────────────────────────
  const markComplete = async () => {
    setCompleting(true);
    await postProgress("complete");
    setProgress((p) => ({
      ...(p ?? emptyRow(slug, mod?.weekNumber ?? 0)),
      completed_at: new Date().toISOString(),
    }));
    setCompleting(false);
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const steps   = stepsComplete(progress ?? undefined, mod ?? undefined);
  const isPractice = mod?.moduleType === "practice";

  if (!loading && !mod) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <p className="font-saira text-sm text-zinc-400">{t("course.moduleNotFound")}</p>
        <button onClick={() => router.push("/course")}
          className="font-saira text-xs text-purple-300 underline">{t("course.backToCourseShort")}</button>
      </div>
    );
  }

  if (loading || !mod) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-surface-base px-4 pt-8 pb-10 sm:px-6 max-w-lg mx-auto">

        {/* ── Back ──────────────────────────────────────────────────────────── */}
        <button type="button" onClick={() => router.push("/course")}
          className="mb-4 font-saira text-[11px] text-zinc-300 hover:text-purple-300 uppercase tracking-[0.18em] transition">
          {t("course.backToCourse")}
        </button>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <PhaseBadge phase={mod.suggestedPhase} weekNum={mod.weekNumber} />
            <span className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              {mod.theme}
            </span>
            <span className={`ml-auto font-saira text-[9px] uppercase tracking-[0.16em] rounded-full px-2 py-0.5 border ${
              isPractice
                ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                : "border-white/10 bg-white/5 text-zinc-300"
            }`}>
              {isPractice ? t("course.modulePractice") : t("course.moduleInsight")}
            </span>
          </div>
          <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
            {mod.title}
          </h1>
          {mod.subtitle && (
            <p className="font-saira text-sm text-zinc-400">{mod.subtitle}</p>
          )}

          {/* Step pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <StepPill done={steps.video}    label={t("course.pillVideo")}    />
            <StepPill done={steps.exercise} label={t("course.pillExercise")} />
            <StepPill done={steps.quiz}     label={t("course.pillReflect")}  />
            {isPractice && (
              <StepPill
                done={steps.practiceGoal}
                label={t("course.pillPractice", { count: steps.practiceCount, target: steps.practiceTarget })}
              />
            )}
          </div>
        </div>

        {/* ── Watch ─────────────────────────────────────────────────────────── */}
        <section className="mb-6">
          <SectionLabel icon="▶" label={t("course.sectionWatch")} />
          <MuxVideoPlayer playbackId={mod.muxPlaybackId} title={mod.title} onPlay={markVideoDone} />
        </section>

        {/* ── Overview + key points ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/5 bg-surface-card p-5 mb-6">
          <p className="font-saira text-sm text-zinc-300 leading-relaxed mb-4">{mod.overview}</p>
          <ul className="space-y-2">
            {mod.keyPoints.map((kp, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-saira text-[10px] text-purple-400 font-bold mt-0.5 flex-shrink-0 w-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-saira text-[13px] text-zinc-300 leading-relaxed">{kp}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Reflect ───────────────────────────────────────────────────────── */}
        <section className="mb-6">
          <SectionLabel icon="?" label={t("course.sectionReflect")} />
          <div className="space-y-2">
            {mod.questions.map((q) => {
              const answered = !!(answers[q.id]?.trim());
              return (
                <button key={q.id} type="button" onClick={() => openQuestion(q)}
                  className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition group ${
                    answered
                      ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "border-white/5 bg-surface-card hover:bg-[#1e1828]"
                  }`}>
                  <span className={`w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                    answered
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-white/10 text-zinc-400"
                  }`}>
                    {answered ? "✓" : "?"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-saira text-sm text-white leading-snug group-hover:text-purple-200 transition">
                      {q.prompt}
                    </p>
                    {answered && (
                      <p className="font-saira text-[11px] text-zinc-300 mt-1 truncate">{answers[q.id]}</p>
                    )}
                  </div>
                  <span className="font-saira text-sm text-zinc-400 group-hover:text-purple-400 transition flex-shrink-0 mt-0.5">
                    {answered ? t("common.edit") : "→"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Downloads ─────────────────────────────────────────────────────── */}
        {mod.downloads && mod.downloads.length > 0 && (
          <section className="mb-6">
            <SectionLabel icon="↓" label={t("course.sectionWorksheets")} />
            <div className="space-y-3">
              {mod.downloads.map((dl) => (
                <div key={dl.url} className="rounded-2xl border border-white/8 bg-surface-card p-4">
                  {dl.description && (
                    <p className="font-saira text-[12px] text-zinc-400 leading-relaxed mb-3">
                      {dl.description}
                    </p>
                  )}
                  <a
                    href={dl.url}
                    download
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2.5 font-saira text-[11px] uppercase tracking-[0.18em] text-purple-300 transition-colors"
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
                      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    {dl.label}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Use this tool ─────────────────────────────────────────────────── */}
        {mod.toolLinks && mod.toolLinks.length > 0 && (
          <section className="mb-6">
            <SectionLabel icon="→" label={t("course.sectionUseTool")} />
            <div className="space-y-2">
              {mod.toolLinks.map((tl) => (
                <a
                  key={tl.href}
                  href={tl.href}
                  className="flex items-start gap-4 rounded-xl border border-purple-500/15 bg-purple-500/[0.04] hover:bg-purple-500/[0.08] p-4 transition-colors group"
                >
                  <div className="w-8 h-8 flex-shrink-0 rounded-lg border border-purple-500/25 bg-purple-500/10 flex items-center justify-center mt-0.5">
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-purple-400" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-saira text-sm font-semibold text-purple-200 group-hover:text-white transition">
                      {tl.label}
                    </p>
                    {tl.description && (
                      <p className="font-saira text-[11px] text-zinc-300 mt-0.5 leading-snug">
                        {tl.description}
                      </p>
                    )}
                  </div>
                  <span className="font-saira text-xs text-zinc-400 group-hover:text-purple-400 transition flex-shrink-0 mt-0.5">
                    Open →
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Practise (exercise) ───────────────────────────────────────────── */}
        {mod.exercise && (
          <section className="mb-6">
            <SectionLabel icon="◐" label={t("course.sectionPractise")} />
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
              <p className="font-saira text-sm font-semibold text-purple-200 mb-1">{mod.exercise.title}</p>
              <p className="font-saira text-[13px] text-zinc-300 leading-relaxed mb-4">{mod.exercise.body}</p>
              <textarea
                value={exerciseText}
                onChange={(e) => handleExerciseChange(e.target.value)}
                placeholder="Write your response here…"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-surface-panel px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark]"
              />
              {exerciseSaving && (
                <p className="font-saira text-[10px] text-zinc-400 mt-1">Saving…</p>
              )}
            </div>
          </section>
        )}

        {/* ── Practice log (practice modules only) ──────────────────────────── */}
        {isPractice && (
          <section className="mb-6">
            <SectionLabel icon="◆" label={t("course.sectionDailyPractice")} />
            <div className="rounded-2xl border border-white/5 bg-surface-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-saira text-sm text-white font-semibold">
                    {t("course.practiceCount", { count: steps.practiceCount, target: steps.practiceTarget })}
                  </p>
                  <p className="font-saira text-[11px] text-zinc-300 mt-0.5">
                    {steps.practiceGoal
                      ? t("course.targetReached")
                      : t("course.sessionsRemaining", { count: steps.practiceTarget - steps.practiceCount })}
                  </p>
                </div>
                {steps.practiceGoal && (
                  <span className="font-saira text-[10px] text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    {t("course.goalMet")}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-500"
                  style={{ width: `${Math.min((steps.practiceCount / steps.practiceTarget) * 100, 100)}%` }}
                />
              </div>

              <button
                type="button"
                onClick={logPractice}
                disabled={practiceLogging}
                className={`w-full rounded-xl py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] transition flex items-center justify-center gap-2 ${
                  practiceJustLogged
                    ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300"
                    : "bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
                }`}
              >
                {practiceLogging
                  ? <span className="w-4 h-4 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
                  : practiceJustLogged
                  ? t("course.logged")
                  : t("course.logPractice")}
              </button>
            </div>
          </section>
        )}

        {/* ── Complete / status ──────────────────────────────────────────────── */}
        {progress?.completed_at ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
            <p className="font-saira text-sm font-semibold text-emerald-300 mb-1">{t("course.moduleComplete")}</p>
            <p className="font-saira text-xs text-zinc-300">
              {isPractice && !steps.practiceGoal
                ? t("course.contentDoneKeepPracticing")
                : t("course.greatWork")}
            </p>
            <button
              type="button"
              onClick={() => router.push("/course")}
              className="mt-3 font-saira text-xs text-purple-300 hover:text-white transition underline underline-offset-2"
            >
              {t("course.backToPlan")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={markComplete}
            disabled={completing || !steps.contentDone}
            className="w-full rounded-2xl py-4 font-saira text-sm font-semibold uppercase tracking-[0.16em] transition bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            title={!steps.contentDone ? t("course.completeContentFirst") : undefined}
          >
            {completing ? "…" : isPractice ? t("course.markContentComplete") : t("course.markComplete")}
          </button>
        )}

        {isPractice && !progress?.completed_at && steps.contentDone && !steps.practiceGoal && (
          <p className="font-saira text-[11px] text-zinc-400 text-center mt-2">
            {t("course.keepLoggingPractice")}
          </p>
        )}
      </div>

      {/* ── Question bottom sheet ──────────────────────────────────────────── */}
      <BottomSheet
        open={!!activeQ}
        onClose={() => setActiveQ(null)}
        title={activeQ?.prompt}
        footer={
          activeQ && sheetTab === "text" ? (
            <button type="button" onClick={saveAnswer}
              disabled={sheetSaving || !sheetText.trim()}
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 font-saira text-xs font-semibold uppercase tracking-[0.16em] text-white transition">
              {sheetSaving ? t("common.saving") : sheetSaved ? t("common.saved") : t("course.saveReflection")}
            </button>
          ) : undefined
        }
      >
        {activeQ && (
          <div className="space-y-4">
            <div className="flex gap-1 rounded-xl border border-white/5 bg-surface-panel p-1">
              {(["text", "voice"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setSheetTab(tab)}
                  className={`flex-1 rounded-lg py-2 font-saira text-xs uppercase tracking-[0.16em] transition ${
                    sheetTab === tab ? "bg-purple-600 text-white" : "text-zinc-300 hover:text-zinc-300"
                  }`}>
                  {tab === "text" ? t("course.reflectionTextTab") : t("course.reflectionVoiceTab")}
                </button>
              ))}
            </div>
            {sheetTab === "text" ? (
              <textarea
                value={sheetText}
                onChange={(e) => { setSheetText(e.target.value); setSheetSaved(false); }}
                placeholder={activeQ.placeholder ?? t("course.reflectionPlaceholder")}
                rows={6}
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-surface-panel px-3 py-3 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark]"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-14 h-14 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-2xl">🎙</div>
                <p className="font-saira text-sm font-semibold text-white">{t("course.voiceAnswersComing")}</p>
                <p className="font-saira text-xs text-zinc-300 max-w-[260px]">
                  {t("course.voiceAnswersHint")}
                </p>
                <button type="button" onClick={() => setSheetTab("text")}
                  className="font-saira text-xs text-purple-300 underline">{t("course.switchToText")}</button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyRow(slug: string, weekNumber: number): CourseProgressRow {
  return {
    user_id: "", module_slug: slug, week_num: weekNumber,
    video_done_at: null, exercise_done_at: null, quiz_done_at: null,
    completed_at: null, practice_count: 0, updated_at: new Date().toISOString(),
  };
}

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
      done ? "border-purple-500/40 bg-purple-500/15 text-purple-300" : "border-white/5 bg-white/[0.03] text-zinc-400"
    }`}>
      <span className={`w-1 h-1 rounded-full ${done ? "bg-purple-400" : "bg-zinc-700"}`} />
      {label}
    </span>
  );
}
