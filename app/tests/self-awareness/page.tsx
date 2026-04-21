"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ITEMS } from "../../../lib/tests/self-awareness/items";
import {
  score,
  unansweredItemIds,
  type Answer,
  type Answers,
} from "../../../lib/tests/self-awareness/scoring";
import type { Gender } from "../../../lib/tests/self-awareness/norms";

type Lang = "en" | "hu";

const STORAGE_KEY = "powerflow.selfAwareness.v1";
const RESULT_KEY = "powerflow.selfAwareness.lastResult.v1";
const RESULT_REF_KEY = "powerflow.selfAwareness.resultRef.v1";
const ITEMS_PER_PAGE = 15;

type SavedState = {
  lang: Lang;
  gender: Gender | null;
  email: string;
  firstName: string;
  answers: Answers;
  startedAt: string;
};

const EMPTY: SavedState = {
  lang: "en",
  gender: null,
  email: "",
  firstName: "",
  answers: {},
  startedAt: "",
};

const copy = {
  en: {
    heroTag: "PowerFlow · Self-Awareness Test",
    heroTitle: "Map your eleven core drives",
    heroSubtitle:
      "165 yes/no items · ~30–45 minutes · your progress saves automatically. You can leave and come back later on the same device.",
    intro: "About you",
    introBody:
      "A few details so we can compare your scores to the correct reference group and deliver your full report.",
    firstName: "First name",
    email: "Email (for your report)",
    gender: "Gender (determines reference norms)",
    male: "Male",
    female: "Female",
    lang: "Language",
    resumeTitle: "Continue where you left off?",
    resumeBody: (done: number) =>
      `We found a saved session with ${done} of 165 answers. Do you want to continue or start over?`,
    resumeContinue: "Continue",
    resumeRestart: "Start over",
    startTest: "Start the test",
    stepLabel: (c: number, t: number) => `Step ${c} of ${t}`,
    yes: "Yes",
    no: "No",
    back: "Back",
    next: "Next",
    review: "Review and submit",
    submit: "Submit and see results",
    submitting: "Scoring…",
    incomplete: (n: number) =>
      `${n} item(s) still unanswered. Click an unanswered item below to jump back and complete them.`,
    introDisclaimer:
      "Answer instinctively — there are no right or wrong answers. Pick the first response that feels true most of the time.",
  },
  hu: {
    heroTag: "PowerFlow · Önismereti Teszt",
    heroTitle: "Tizenegy alapvető motiváció feltérképezése",
    heroSubtitle:
      "165 igen/nem állítás · kb. 30–45 perc · a haladás automatikusan mentésre kerül. Később ugyanezen az eszközön folytathatod.",
    intro: "Alapadatok",
    introBody:
      "Néhány adat, hogy a megfelelő referenciacsoporthoz tudjunk viszonyítani, és el tudjuk juttatni a teljes riportot.",
    firstName: "Keresztnév",
    email: "E-mail cím (a riporthoz)",
    gender: "Nem (a referenciaértékek ehhez igazodnak)",
    male: "Férfi",
    female: "Nő",
    lang: "Nyelv",
    resumeTitle: "Folytatod, ahol abbahagytad?",
    resumeBody: (done: number) =>
      `${done}/165 válasszal találtunk egy mentett munkamenetet. Folytatod vagy újrakezded?`,
    resumeContinue: "Folytatás",
    resumeRestart: "Újrakezdés",
    startTest: "Teszt indítása",
    stepLabel: (c: number, t: number) => `${c}. lépés / ${t}`,
    yes: "Igen",
    no: "Nem",
    back: "Vissza",
    next: "Tovább",
    review: "Áttekintés és beküldés",
    submit: "Beküldés és eredmény",
    submitting: "Értékelés…",
    incomplete: (n: number) =>
      `${n} kérdés még nincs megválaszolva. Kattints egy megjelölt kérdésre, hogy odaugorjon és kitöltsd.`,
    introDisclaimer:
      "Ösztönösen válaszolj — nincs jó vagy rossz válasz. Azt jelöld, ami az esetek többségében igaz.",
  },
} as const;

export default function SelfAwarenessTestPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);
  const [state, setState] = React.useState<SavedState>(EMPTY);
  const [page, setPage] = React.useState(0); // 0 = intro, 1..11 = question pages, 12 = review
  const [resumeAsk, setResumeAsk] = React.useState<null | SavedState>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [reviewMode, setReviewMode] = React.useState(false);

  const t = copy[state.lang];

  // Hydrate from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedState;
        if (parsed && typeof parsed === "object" && parsed.answers) {
          const done = Object.keys(parsed.answers).length;
          if (done > 0) {
            setResumeAsk(parsed);
            setHydrated(true);
            return;
          }
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist on change
  React.useEffect(() => {
    if (!hydrated) return;
    if (state === EMPTY) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const totalPages = 11;
  const totalSteps = 1 + totalPages + 1; // intro + 11 page + review = 13 steps

  const answeredCount = Object.keys(state.answers).length;
  const progressPct = Math.round((answeredCount / 165) * 100);

  // Page 1..11 shows items: [(p-1)*15 + 1 .. p*15]
  const pageItems = React.useMemo(() => {
    if (page < 1 || page > totalPages) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return ITEMS.slice(start, start + ITEMS_PER_PAGE);
  }, [page]);

  const setAnswer = (id: number, v: Answer) => {
    setState((s) => {
      const updated = { ...s.answers, [id]: v };
      if (reviewMode) {
        // After a short pause (so the selection registers visually),
        // jump to the next unanswered item — or back to review if all done.
        setTimeout(() => {
          const remaining = unansweredItemIds(updated);
          if (remaining.length === 0) {
            setReviewMode(false);
            setPage(totalSteps - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            const next = remaining[0];
            const nextPage = Math.floor((next - 1) / ITEMS_PER_PAGE) + 1;
            setPage(nextPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => {
              document.getElementById(`item-${next}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
            }, 60);
          }
        }, 350);
      }
      return { ...s, answers: updated };
    });
  };

  const canAdvanceFromIntro =
    state.gender !== null && state.email.trim().length > 3 && state.firstName.trim().length > 0;

  const onNext = () => {
    if (page === 0 && !canAdvanceFromIntro) return;
    setPage((p) => Math.min(p + 1, totalSteps - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const onBack = () => {
    setPage((p) => Math.max(p - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToFirstUnanswered = () => {
    const missing = unansweredItemIds(state.answers);
    if (missing.length === 0) return;
    const firstMissing = missing[0];
    const targetPage = Math.floor((firstMissing - 1) / ITEMS_PER_PAGE) + 1;
    setPage(targetPage);
    // scroll to the item after paint
    setTimeout(() => {
      const el = document.getElementById(`item-${firstMissing}`);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 50);
  };

  const onSubmit = async () => {
    if (submitting) return;
    const missing = unansweredItemIds(state.answers);
    if (missing.length > 0) {
      setSubmitError(t.incomplete(missing.length));
      return;
    }
    if (!state.gender) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const report = score(state.answers, state.gender);
      const respondent = {
        firstName: state.firstName,
        email: state.email,
        gender: state.gender,
        lang: state.lang,
        startedAt: state.startedAt,
        submittedAt: new Date().toISOString(),
      };
      const payload = { report, respondent };
      localStorage.setItem(RESULT_KEY, JSON.stringify(payload));
      // Clear any previous unlock so a new submission always starts locked,
      // unless the user purchased the bundle (which unlocks all tests permanently).
      try {
        if (localStorage.getItem("powerflow.bundle.unlocked.v1") !== "1") {
          localStorage.removeItem("powerflow.selfAwareness.unlocked.v1");
        }
      } catch { /* ignore */ }
      // Fire-and-forget: persist to server (test works even if this fails)
      const resultRef = `pfsa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      try { localStorage.setItem(RESULT_REF_KEY, resultRef); } catch { /* ignore */ }
      fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondent, report, resultRef }),
      }).catch(() => {/* silent */});
      router.push("/tests/self-awareness/results");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#050608] pt-24 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center font-saira text-sm text-zinc-400">
          Loading…
        </div>
      </div>
    );
  }

  if (resumeAsk) {
    const done = Object.keys(resumeAsk.answers).length;
    return (
      <div className="relative min-h-screen bg-[#050608] pt-24 text-white">
        <div className="mx-auto max-w-xl px-4 py-12 text-center">
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.14em]">
            {copy[resumeAsk.lang].resumeTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-md font-saira text-sm text-zinc-300">
            {copy[resumeAsk.lang].resumeBody(done)}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="rounded-full bg-purple-500 px-7 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
              onClick={() => {
                setState(resumeAsk);
                const firstMissing = unansweredItemIds(resumeAsk.answers)[0] ?? 1;
                const targetPage = Math.floor((firstMissing - 1) / ITEMS_PER_PAGE) + 1;
                setPage(targetPage);
                setResumeAsk(null);
              }}
            >
              {copy[resumeAsk.lang].resumeContinue}
            </button>
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-7 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition hover:border-purple-400 hover:text-white"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setState({ ...EMPTY, startedAt: new Date().toISOString() });
                setPage(0);
                setResumeAsk(null);
              }}
            >
              {copy[resumeAsk.lang].resumeRestart}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure startedAt is set
  if (!state.startedAt) {
    setTimeout(() => setState((s) => (s.startedAt ? s : { ...s, startedAt: new Date().toISOString() })), 0);
  }

  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.14),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
            {t.heroTag}
          </p>
          <h1 className="mt-2 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">
            {t.heroTitle}
          </h1>
          {page === 0 && (
            <p className="mx-auto mt-4 max-w-xl font-saira text-sm text-zinc-300">
              {t.heroSubtitle}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="mt-10 space-y-2">
          <div className="flex items-center justify-between font-saira text-[11px] uppercase tracking-[0.18em] text-purple-200/80">
            <span>{t.stepLabel(page + 1, totalSteps)}</span>
            <span className="text-zinc-400">
              {answeredCount}/165
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.35)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Intro */}
        {page === 0 && (
          <section className="mt-10 rounded-2xl border border-white/5 bg-[#13151A] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55)] sm:p-8">
            <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
              {t.intro}
            </h2>
            <p className="mt-3 font-saira text-sm text-zinc-300">{t.introBody}</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                  {t.firstName} <span className="text-purple-300">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={state.firstName}
                  onChange={(e) =>
                    setState((s) => ({ ...s, firstName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-700/70 bg-[#0D0F14] px-3 py-2.5 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                  {t.email} <span className="text-purple-300">*</span>
                </span>
                <input
                  type="email"
                  required
                  value={state.email}
                  onChange={(e) =>
                    setState((s) => ({ ...s, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-700/70 bg-[#0D0F14] px-3 py-2.5 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
                />
              </label>
            </div>

            <div className="mt-6">
              <p className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                {t.gender} <span className="text-purple-300">*</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <GenderPill
                  label={t.male}
                  checked={state.gender === "male"}
                  onClick={() => setState((s) => ({ ...s, gender: "male" }))}
                />
                <GenderPill
                  label={t.female}
                  checked={state.gender === "female"}
                  onClick={() => setState((s) => ({ ...s, gender: "female" }))}
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                {t.lang}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {(["en", "hu"] as const).map((L) => (
                  <button
                    key={L}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, lang: L }))}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-saira text-xs uppercase tracking-[0.12em] transition ${
                      state.lang === L
                        ? "border-purple-400 bg-purple-500/20 text-white"
                        : "border-zinc-700 bg-[#0D0F14] text-zinc-200 hover:border-purple-400"
                    }`}
                  >
                    {L === "en" ? "🇬🇧 English" : "🇭🇺 Magyar"}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-7 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-3 font-saira text-xs text-zinc-300">
              {t.introDisclaimer}
            </p>
          </section>
        )}

        {/* Question pages */}
        {page >= 1 && page <= totalPages && (
          <section className="mt-10 space-y-4">
            {pageItems.map((item) => {
              const value = state.answers[item.id];
              const itemText = state.lang === "hu" ? item.text.hu : item.text.en;
              return (
                <div
                  id={`item-${item.id}`}
                  key={item.id}
                  className={`rounded-2xl border p-5 transition sm:p-6 ${
                    value === undefined
                      ? "border-white/5 bg-[#13151A]"
                      : "border-purple-500/25 bg-gradient-to-br from-purple-600/8 to-transparent"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="font-saira text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      {String(item.id).padStart(3, "0")}
                    </div>
                    <p className="flex-1 font-saira text-sm text-zinc-100 sm:text-base">
                      {itemText}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 pl-9">
                    <YesNoButton
                      label={t.yes}
                      checked={value === 1}
                      onClick={() => setAnswer(item.id, 1)}
                    />
                    <YesNoButton
                      label={t.no}
                      checked={value === 0}
                      onClick={() => setAnswer(item.id, 0)}
                    />
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Review */}
        {page === totalSteps - 1 && (
          <section className="mt-10 space-y-6 rounded-2xl border border-white/5 bg-[#13151A] p-6 sm:p-8">
            <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
              {t.review}
            </h2>
            {unansweredItemIds(state.answers).length === 0 ? (
              <p className="font-saira text-sm text-zinc-300">
                {state.lang === "hu"
                  ? "Minden válasz kitöltve. Kattints a beküldésre az eredmény megtekintéséhez."
                  : "All 165 items are answered. Click submit to see your profile."}
              </p>
            ) : (
              <div>
                <p className="font-saira text-sm text-red-200">
                  {t.incomplete(unansweredItemIds(state.answers).length)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {unansweredItemIds(state.answers)
                    .slice(0, 30)
                    .map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          const p = Math.floor((id - 1) / ITEMS_PER_PAGE) + 1;
                          setReviewMode(true);
                          setPage(p);
                          setTimeout(() => {
                            const el = document.getElementById(`item-${id}`);
                            if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
                          }, 50);
                        }}
                        className="rounded-full border border-red-500/40 px-3 py-1 font-saira text-[11px] text-red-200 hover:border-red-400"
                      >
                        Q{id}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 font-saira text-xs text-red-200">
                {submitError}
              </div>
            )}
          </section>
        )}

        {/* Nav */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={page === 0}
            className="rounded-full border border-purple-500/50 px-6 py-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] text-purple-200 transition hover:border-purple-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
          >
            {t.back}
          </button>

          <div className="flex items-center gap-3">
            {reviewMode && page >= 1 && page <= totalPages && (
              <button
                type="button"
                onClick={() => { setPage(totalSteps - 1); setReviewMode(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="rounded-full border border-amber-500/60 px-6 py-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition hover:border-amber-400"
              >
                ↩ Back to review
              </button>
            )}

          {page < totalSteps - 1 ? (
            <button
              type="button"
              onClick={onNext}
              disabled={page === 0 && !canAdvanceFromIntro}
              className="rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {page === 0 ? t.startTest : t.next}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || unansweredItemIds(state.answers).length > 0}
              className="rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          )}
          </div>
        </div>

        <div className="mt-8 text-center font-saira text-[11px] text-zinc-500">
          <Link href="/tests" className="underline decoration-zinc-600 hover:text-white">
            ← All tests
          </Link>
        </div>
      </div>
    </div>
  );
}

function GenderPill({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-5 py-2 font-saira text-xs uppercase tracking-[0.12em] transition ${
        checked
          ? "border-purple-400 bg-purple-500/20 text-white"
          : "border-zinc-700 bg-[#0D0F14] text-zinc-200 hover:border-purple-400"
      }`}
    >
      {label}
    </button>
  );
}

function YesNoButton({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-6 py-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] transition ${
        checked
          ? "border-purple-400 bg-purple-500/80 text-white shadow-[0_0_18px_rgba(168,85,247,0.55)]"
          : "border-zinc-700 bg-[#0D0F14] text-zinc-300 hover:border-purple-400"
      }`}
    >
      {label}
    </button>
  );
}
