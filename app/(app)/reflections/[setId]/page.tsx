"use client";

/**
 * /reflections/[setId] — the answering view for one coach-authored
 * reflection set. This is the deep-link target the push notification opens
 * (see POST /api/coach/reflections/:setId's push on draft→sent), so it must
 * work standalone, not as a modal hanging off another page.
 */

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import ReflectionAnswerForm from "@/app/components/ReflectionAnswerForm";
import ReflectionNoteThread from "@/app/components/ReflectionNoteThread";
import type { ReflectionSetRow, ReflectionNoteRow } from "@/lib/reflections";

type Detail = {
  set: ReflectionSetRow;
  answers: Record<string, string> | null;
  notes: ReflectionNoteRow[];
};

export default function ReflectionSetPage() {
  const router = useRouter();
  const { t } = useT();
  const params = useParams<{ setId: string }>();
  const setId = params.setId;

  const [detail, setDetail] = React.useState<Detail | null | "not-found">(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!setId) return;
    Promise.all([
      fetch(`/api/reflections/${setId}`).then((r) => (r.status === 404 ? "not-found" : r.ok ? r.json() : null)),
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([d, me]) => {
        setDetail(d);
        if (me?.id) setUserId(me.id);
      })
      .catch((err) => {
        console.error("[reflections/[setId]] load failed", err);
        setDetail(null);
      });
  }, [setId]);

  if (detail === null || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  if (detail === "not-found") {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-saira text-sm font-semibold text-zinc-200">{t("reflections.notFoundTitle")}</p>
        <p className="font-saira text-xs text-zinc-400">{t("reflections.notFoundBody")}</p>
        <Link
          href="/reflections"
          className="font-saira text-[11px] text-purple-400 hover:text-purple-300 uppercase tracking-[0.14em] transition"
        >
          {t("reflections.backToList")}
        </Link>
      </div>
    );
  }

  const { set, answers, notes } = detail;

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Sticky back header */}
      <div className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/reflections")}
            className="flex items-center gap-2 font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400 hover:text-purple-300 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("reflections.backToList")}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-24">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-400 mb-1">
          {t("reflections.title")}
        </p>
        <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-3">
          {set.title}
        </h1>
        {set.intro && (
          <p className="font-saira text-sm text-zinc-300 leading-relaxed mb-3">{set.intro}</p>
        )}
        <p className="font-saira text-xs text-zinc-500 italic leading-relaxed mb-4">
          {t("reflections.framingQuote")}
        </p>

        {/* Non-buried visibility notice — a requirement, not decoration */}
        <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.05] px-3 py-2.5 mb-6">
          <svg className="w-4 h-4 flex-shrink-0 text-purple-300" viewBox="0 0 20 20" fill="none">
            <path d="M2 10s3-5.5 8-5.5 8 5.5 8 5.5-3 5.5-8 5.5-8-5.5-8-5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <p className="font-saira text-xs text-purple-200">{t("reflections.visibilityNotice")}</p>
        </div>

        <ReflectionAnswerForm setId={set.id} questions={set.questions} initialAnswers={answers} />

        <div className="mt-8 pt-6 border-t border-white/5">
          <ReflectionNoteThread
            setId={set.id}
            initialNotes={notes}
            currentUserId={userId}
            otherPartyLabel={t("reflections.yourCoach")}
            postNoteUrl={`/api/reflections/${set.id}/notes`}
            audioUploadUrl={`/api/reflections/${set.id}/audio`}
          />
        </div>
      </div>
    </div>
  );
}
