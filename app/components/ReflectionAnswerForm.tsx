"use client";

/**
 * Athlete-facing question cards for a coach-authored reflection set.
 * Modeled directly on PostCompReflection.tsx — one question per card with
 * its helper text, a textarea, per-question autosave on blur (sending only
 * the changed question, since POST /api/reflections/:setId/answers merges),
 * and a "Save failed — tap to retry" affordance.
 *
 * Partial answers are the normal, expected case (the source material tells
 * the athlete to answer only the questions that feel most alive) — this
 * component never gates on completeness and never warns about incomplete
 * answers. The progress count shown is purely informational.
 *
 * `kind: "commitment"` questions (the "take with you" line) are rendered
 * visually distinct and always last, regardless of their position in the
 * authored question order.
 */

import React from "react";
import { useT } from "@/lib/i18n";
import type { ReflectionQuestion } from "@/lib/reflections";

interface Props {
  setId: string;
  questions: ReflectionQuestion[];
  initialAnswers: Record<string, string> | null;
}

export default function ReflectionAnswerForm({ setId, questions, initialAnswers }: Props) {
  const { t } = useT();
  const [answers, setAnswers] = React.useState<Record<string, string>>(initialAnswers ?? {});
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Tracks each field's value at the moment it gained focus, so blur can
  // detect a real edit. `answers` itself is no good for this comparison —
  // onChange keeps it in sync with the textarea on every keystroke, so by
  // the time onBlur fires it already equals the new value and a same-value
  // check against `answers` would always short-circuit and never save.
  const focusValues = React.useRef<Record<string, string>>({});

  const answeredCount = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;

  const save = React.useCallback((id: string, value: string) => {
    setSaving(true);
    setSaveError(null);
    fetch(`/api/reflections/${setId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: { [id]: value } }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`save failed: ${res.status}`);
      })
      .catch((err) => {
        console.error("[ReflectionAnswerForm] save failed", err);
        setSaveError(id);
      })
      .finally(() => setSaving(false));
  }, [setId]);

  // Blur saves whatever is currently in the field, including a cleared
  // (empty) answer — an athlete un-writing a response is a legitimate edit,
  // not something to silently ignore. Compares against the value captured
  // on focus (see focusValues above), not against `answers`.
  const handleFocus = (id: string, value: string) => {
    focusValues.current[id] = value;
  };
  const handleBlur = (id: string, value: string) => {
    const before = focusValues.current[id] ?? (initialAnswers?.[id] ?? "");
    if (value === before) return;
    save(id, value);
  };

  const textQuestions = questions.filter((q) => q.kind !== "commitment");
  const commitmentQuestions = questions.filter((q) => q.kind === "commitment");

  function renderQuestion(q: ReflectionQuestion, variant: "text" | "commitment") {
    const value = answers[q.id] ?? "";
    const done = value.trim().length > 0;
    const isCommitment = variant === "commitment";
    return (
      <div
        key={q.id}
        className={
          isCommitment
            ? "rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4"
            : ""
        }
      >
        {isCommitment && (
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400 mb-2">
            {t("reflections.commitmentLabel")}
          </p>
        )}
        <div className="flex items-start gap-2 mb-2">
          {!isCommitment && (
            <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
              done ? "border-emerald-400 bg-emerald-500/20" : "border-zinc-600 bg-transparent"
            }`}>
              {done && (
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-emerald-400" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          )}
          <p className="font-saira text-sm font-semibold text-zinc-100 leading-snug">{q.prompt}</p>
        </div>
        {q.helper && (
          <p className="font-saira text-xs text-zinc-400 italic mb-2 ml-6">{q.helper}</p>
        )}
        <textarea
          value={value}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          onFocus={(e) => handleFocus(q.id, e.target.value)}
          onBlur={(e) => handleBlur(q.id, e.target.value)}
          rows={3}
          className={`w-full rounded-xl border px-3 py-2.5 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition resize-none ${
            isCommitment
              ? "border-amber-600/40 bg-surface-input focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
              : "border-zinc-700/60 bg-surface-input focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
          }`}
        />
        {saveError === q.id && (
          <button
            type="button"
            onClick={() => save(q.id, answers[q.id] ?? "")}
            className="mt-1 font-saira text-[11px] text-red-400 underline underline-offset-2"
          >
            {t("reflections.saveFailed")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="font-saira text-xs text-zinc-400 text-right">
        {saving ? t("reflections.saving") : t("reflections.progress", { done: answeredCount, total: questions.length })}
      </p>

      {textQuestions.map((q) => renderQuestion(q, "text"))}
      {commitmentQuestions.map((q) => renderQuestion(q, "commitment"))}
    </div>
  );
}
