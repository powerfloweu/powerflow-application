"use client";

import React from "react";
import Link from "next/link";
import { COURSE_WEEKS, weeksByTheme, type CoursePlan, type CourseWeek, type CourseProgressRow } from "@/lib/course";
import { stepsComplete } from "@/lib/course";

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  display_name: string;
  meet_date: string | null;
  course_access: boolean;
  course_plan: CoursePlan | null;
};

/** All UI states for the page */
type PageStage =
  | { stage: "loading" }
  | { stage: "locked" }
  | { stage: "no-plan" }
  | { stage: "generating" }
  | { stage: "editing"; plan: CoursePlan }
  | { stage: "plan"; plan: CoursePlan };

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CourseIndexPage() {
  const [profile, setProfile]   = React.useState<Profile | null>(null);
  const [progress, setProgress] = React.useState<CourseProgressRow[]>([]);
  const [uiStage, setUiStage]   = React.useState<PageStage>({ stage: "loading" });

  // ── Load profile + progress ──────────────────────────────────────────────
  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/course/progress").then((r) => r.json()),
    ])
      .then(([prof, prog]) => {
        if (!prof?.id) return;
        const p = prof as Profile;
        setProfile(p);
        setProgress(Array.isArray(prog) ? prog : []);

        if (!p.course_access) {
          setUiStage({ stage: "locked" });
        } else if (p.course_plan?.slugs?.length) {
          setUiStage({ stage: "plan", plan: p.course_plan });
        } else {
          setUiStage({ stage: "no-plan" });
        }
      })
      .catch(() => setUiStage({ stage: "no-plan" }));
  }, []);

  // ── Progress index ────────────────────────────────────────────────────────
  const progressMap = React.useMemo(() => {
    const m: Record<number, CourseProgressRow> = {};
    for (const row of progress) m[row.week_num] = row;
    return m;
  }, [progress]);

  // ── Generate plan ─────────────────────────────────────────────────────────
  async function handleGenerate() {
    setUiStage({ stage: "generating" });
    try {
      const res  = await fetch("/api/course/generate-plan", { method: "POST" });
      const data = await res.json() as { plan?: CoursePlan; error?: string };
      if (!res.ok || !data.plan) throw new Error(data.error ?? "Generation failed");
      setUiStage({ stage: "editing", plan: data.plan });
    } catch (err) {
      console.error(err);
      // Fall back to no-plan so user can retry
      setUiStage({ stage: "no-plan" });
    }
  }

  // ── Save plan ─────────────────────────────────────────────────────────────
  async function handleSave(plan: CoursePlan) {
    const res  = await fetch("/api/course/save-plan", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ plan }),
    });
    if (res.ok) {
      setProfile((prev) => prev ? { ...prev, course_plan: plan } : prev);
      setUiStage({ stage: "plan", plan });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (uiStage.stage === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  if (uiStage.stage === "locked") {
    return <CourseLockedPage />;
  }

  if (uiStage.stage === "no-plan") {
    return (
      <NoPlanPage
        onGenerate={handleGenerate}
        generating={false}
      />
    );
  }

  if (uiStage.stage === "generating") {
    return (
      <NoPlanPage
        onGenerate={handleGenerate}
        generating={true}
      />
    );
  }

  if (uiStage.stage === "editing") {
    return (
      <PlanEditor
        plan={uiStage.plan}
        onSave={handleSave}
        onRegenerate={handleGenerate}
      />
    );
  }

  // ── Plan view ─────────────────────────────────────────────────────────────
  const plan = uiStage.plan;
  const planWeeks = plan.slugs
    .map((slug) => COURSE_WEEKS.find((w) => w.slug === slug))
    .filter((w): w is CourseWeek => !!w);

  const completedCount = planWeeks.filter((w) => !!progressMap[w.weekNumber]?.completed_at).length;
  const pct            = Math.round((completedCount / planWeeks.length) * 100);

  // First incomplete week in plan order
  const currentWeek = planWeeks.find((w) => !progressMap[w.weekNumber]?.completed_at);
  const currentPos  = currentWeek ? planWeeks.indexOf(currentWeek) + 1 : null;

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-10 sm:px-6 max-w-lg mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · YOUR PLAN
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          Mental Training
        </h1>
        <p className="font-saira text-sm text-zinc-500">
          {planWeeks.length} weeks · athlete-paced
          {plan.type === "ai" && " · AI-personalised"}
        </p>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
            Progress
          </p>
          <p className="font-saira text-xs text-zinc-400 tabular-nums">
            {completedCount} / {planWeeks.length} complete
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Current step CTA ────────────────────────────────────────────────── */}
      {currentWeek && (
        <Link
          href={`/course/w/${currentWeek.weekNumber}`}
          className="block rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-purple-900/10 p-5 mb-6 hover:border-purple-400/50 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300">
              Step {currentPos} of {planWeeks.length}
            </p>
            <span className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-500 border border-white/10 rounded-full px-2 py-0.5">
              {currentWeek.theme}
            </span>
          </div>
          <p className="font-saira text-lg font-bold text-white mb-1 group-hover:text-purple-200 transition">
            {currentWeek.title}
          </p>
          {currentWeek.subtitle && (
            <p className="font-saira text-xs text-zinc-400 mb-3">{currentWeek.subtitle}</p>
          )}
          <StepDots row={progressMap[currentWeek.weekNumber]} />
          <p className="mt-3 font-saira text-xs text-purple-300 group-hover:text-white transition">
            Continue →
          </p>
        </Link>
      )}

      {/* ── AI rationale ────────────────────────────────────────────────────── */}
      {plan.rationale && (
        <div className="rounded-xl border border-white/5 bg-[#17131F] px-4 py-3 mb-6">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-1">
            Why this plan
          </p>
          <p className="font-saira text-xs text-zinc-400 leading-relaxed">{plan.rationale}</p>
        </div>
      )}

      {/* ── Plan week list ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {planWeeks.map((w, idx) => (
          <PlanWeekCard
            key={w.slug}
            week={w}
            position={idx + 1}
            total={planWeeks.length}
            row={progressMap[w.weekNumber]}
            isCurrent={w === currentWeek}
          />
        ))}
      </div>

      {/* ── Edit plan link ───────────────────────────────────────────────────── */}
      <div className="mt-10 text-center">
        <button
          onClick={() => setUiStage({ stage: "editing", plan })}
          className="font-saira text-xs text-zinc-600 hover:text-zinc-400 transition underline underline-offset-2"
        >
          Edit or regenerate plan
        </button>
      </div>
    </div>
  );
}

// ── PlanWeekCard ──────────────────────────────────────────────────────────────

function PlanWeekCard({
  week, position, total, row, isCurrent,
}: {
  week: CourseWeek;
  position: number;
  total: number;
  row: CourseProgressRow | undefined;
  isCurrent: boolean;
}) {
  const done       = !!row?.completed_at;
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
      {/* Step bubble */}
      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-saira text-xs font-bold ${
          done
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            : isCurrent
            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
            : "bg-white/5 text-zinc-500 border border-white/5"
        }`}
      >
        {done ? "✓" : position}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-saira text-sm font-semibold truncate transition ${
          done ? "text-emerald-200" : "text-white group-hover:text-purple-300"
        }`}>
          {week.title}
        </p>
        {hasStarted && !done ? (
          <StepDots row={row} />
        ) : (
          <p className="font-saira text-[11px] text-zinc-600 truncate">
            {week.theme}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-saira text-[10px] text-zinc-700">
          {position}/{total}
        </span>
        <span className="font-saira text-sm text-zinc-600 group-hover:text-purple-400 transition">
          →
        </span>
      </div>
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
      className={`w-1.5 h-1.5 rounded-full transition ${filled ? "bg-purple-400" : "bg-white/15"}`}
    />
  );
}

// ── NoPlanPage ────────────────────────────────────────────────────────────────

function NoPlanPage({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-10 sm:px-6 max-w-lg mx-auto flex flex-col">

      {/* Header */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · COURSE
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          Mental Training
        </h1>
        <p className="font-saira text-sm text-zinc-500">
          Your personalised plan hasn't been set up yet.
        </p>
      </div>

      {/* CTA card */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 to-[#17131F] p-6 mb-6">
        <div className="w-14 h-14 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-2xl mx-auto mb-4">
          ✦
        </div>
        <h2 className="font-saira text-xl font-bold text-white text-center mb-2">
          Build your plan
        </h2>
        <p className="font-saira text-sm text-zinc-400 leading-relaxed text-center mb-2">
          Based on your mental goals and self-assessment, Claude will build a personalised training sequence from the full 15-module library.
        </p>
        <p className="font-saira text-xs text-zinc-600 text-center mb-6">
          12–16 weeks is recommended for athletes without prior sports psychology experience. You can customise the plan before saving it.
        </p>

        <button
          onClick={onGenerate}
          disabled={generating}
          className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition flex items-center justify-center gap-3"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Analysing your profile…
            </>
          ) : (
            "Generate my plan →"
          )}
        </button>

        <p className="font-saira text-[10px] text-zinc-600 text-center mt-3">
          Takes about 10 seconds · you review before it saves
        </p>
      </div>

      {/* Blurred library preview */}
      <div className="relative rounded-2xl border border-white/5 bg-[#17131F] p-5 overflow-hidden flex-1">
        <div className="absolute inset-0 backdrop-blur-[2px] bg-[#050608]/60 z-10 flex items-center justify-center rounded-2xl">
          <span className="font-saira text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Available after plan is generated
          </span>
        </div>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-3">
          Module library
        </p>
        <div className="space-y-2 opacity-30">
          {weeksByTheme().map(({ theme, weeks }) => (
            <div key={theme}>
              <p className="font-saira text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{theme}</p>
              {weeks.map((w) => (
                <div key={w.slug} className="font-saira text-sm text-zinc-300 py-0.5">{w.title}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PlanEditor ────────────────────────────────────────────────────────────────

function PlanEditor({
  plan,
  onSave,
  onRegenerate,
}: {
  plan: CoursePlan;
  onSave: (plan: CoursePlan) => Promise<void>;
  onRegenerate: () => void;
}) {
  const [slugs, setSlugs]     = React.useState<string[]>(plan.slugs);
  const [saving, setSaving]   = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  const weekMap = React.useMemo(() => {
    const m: Record<string, CourseWeek> = {};
    for (const w of COURSE_WEEKS) m[w.slug] = w;
    return m;
  }, []);

  // Weeks not yet in the plan (available to add)
  const available = COURSE_WEEKS.filter((w) => !slugs.includes(w.slug));

  function moveUp(idx: number) {
    if (idx === 0) return;
    setSlugs((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    if (idx === slugs.length - 1) return;
    setSlugs((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function remove(idx: number) {
    if (slugs.length <= 8) return;
    setSlugs((prev) => prev.filter((_, i) => i !== idx));
  }

  function addWeek(slug: string) {
    if (!slug || slugs.includes(slug)) return;
    setSlugs((prev) => [...prev, slug]);
    setAddOpen(false);
  }

  async function handleSave() {
    setSaving(true);
    await onSave({ ...plan, slugs });
    setSaving(false);
  }

  const tooShort = slugs.length < 8;

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-10 sm:px-6 max-w-lg mx-auto">

      {/* Header */}
      <div className="mb-6">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · REVIEW PLAN
        </p>
        <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          Your plan is ready
        </h1>
        <p className="font-saira text-sm text-zinc-500">
          {slugs.length} week{slugs.length !== 1 ? "s" : ""} ·{" "}
          <span className={slugs.length >= 12 ? "text-emerald-400" : "text-amber-400"}>
            {slugs.length < 8
              ? "minimum 8 required"
              : slugs.length < 12
              ? "12–16 recommended"
              : "great length"}
          </span>
        </p>
      </div>

      {/* Rationale */}
      {plan.rationale && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 mb-5">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400 mb-1">
            Your journey · personalised
          </p>
          <p className="font-saira text-xs text-zinc-300 leading-relaxed">{plan.rationale}</p>
        </div>
      )}

      {/* Week list */}
      <div className="space-y-2 mb-6">
        {slugs.map((slug, idx) => {
          const w = weekMap[slug];
          if (!w) return null;
          return (
            <div
              key={slug}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#17131F] px-3 py-3"
            >
              {/* Position */}
              <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center font-saira text-xs text-zinc-500 flex-shrink-0">
                {idx + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-saira text-sm font-semibold text-white truncate">{w.title}</p>
                <p className="font-saira text-[11px] text-zinc-600 truncate">{w.theme}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white disabled:opacity-20 transition rounded"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === slugs.length - 1}
                  className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white disabled:opacity-20 transition rounded"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => remove(idx)}
                  disabled={slugs.length <= 8}
                  className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-red-400 disabled:opacity-20 transition rounded ml-1"
                  title={slugs.length <= 8 ? "Minimum 8 weeks" : "Remove"}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add a week */}
      {available.length > 0 && (
        <div className="mb-6">
          {addOpen ? (
            <div className="rounded-xl border border-white/10 bg-[#17131F] p-3">
              <p className="font-saira text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                Add a module
              </p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {weeksByTheme().map(({ theme, weeks: themeWeeks }) => {
                  const avail = themeWeeks.filter((w) => !slugs.includes(w.slug));
                  if (!avail.length) return null;
                  return (
                    <div key={theme} className="mb-2">
                      <p className="font-saira text-[10px] text-zinc-600 uppercase tracking-wider px-2 mb-1">
                        {theme}
                      </p>
                      {avail.map((w) => (
                        <button
                          key={w.slug}
                          onClick={() => addWeek(w.slug)}
                          className="w-full text-left px-2 py-1.5 rounded-lg font-saira text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition"
                        >
                          {w.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="mt-2 font-saira text-xs text-zinc-600 hover:text-zinc-400 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddOpen(true)}
              className="w-full rounded-xl border border-dashed border-white/10 py-3 font-saira text-sm text-zinc-500 hover:border-purple-500/40 hover:text-purple-300 transition"
            >
              + Add a module
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || tooShort}
          className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition flex items-center justify-center gap-3"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving…
            </>
          ) : (
            "Save this plan →"
          )}
        </button>

        <button
          onClick={onRegenerate}
          disabled={saving}
          className="w-full rounded-xl border border-white/8 py-3 font-saira text-sm text-zinc-400 hover:text-white hover:border-white/20 transition"
        >
          Regenerate plan
        </button>
      </div>

      {tooShort && (
        <p className="font-saira text-xs text-amber-400 text-center mt-3">
          Add more modules — minimum 8 required to save.
        </p>
      )}
    </div>
  );
}

// ── CourseLockedPage ──────────────────────────────────────────────────────────

const PREVIEW_THEMES = [
  { theme: "Self Knowledge",               weeks: "W1 – W2" },
  { theme: "Goal Setting",                 weeks: "W3" },
  { theme: "Athlete-Coach Relationship",   weeks: "W4" },
  { theme: "Altered State of Mind",        weeks: "W5 – W8" },
  { theme: "Visualization & Mental Train", weeks: "W9 – W12" },
  { theme: "Focus",                        weeks: "W13 – W14" },
  { theme: "Performance",                  weeks: "W15" },
];

function CourseLockedPage() {
  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-10 sm:px-6 max-w-lg mx-auto flex flex-col">

      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · COURSE
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
          Mental Training
        </h1>
      </div>

      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 to-[#17131F] p-6 mb-6 text-center">
        <div className="w-16 h-16 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-3xl mx-auto mb-4">
          🔒
        </div>
        <h2 className="font-saira text-xl font-bold text-white mb-2">
          Personalised Mental Performance Plan
        </h2>
        <p className="font-saira text-sm text-zinc-400 leading-relaxed mb-5">
          An AI-personalised programme built around your mental goals, competition timeline, and self-assessment — covering every mental skill that separates good lifters from great ones.
        </p>

        <ul className="text-left space-y-2 mb-6">
          {[
            "AI-curated plan based on your profile",
            "15 modules across 7 mental performance themes",
            "Video lesson + reflection exercise each week",
            "Fully customisable — add, remove, or reorder",
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
