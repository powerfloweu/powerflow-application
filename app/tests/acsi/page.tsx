"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ACSI_ITEMS,
  ANSWER_LABELS,
  scoreAcsi,
  type AcsiReport,
} from "../../../lib/tests/acsi/scoring";

type Lang = "en" | "hu" | "de";
type Gender = "male" | "female";

const RESULT_KEY = "powerflow.acsi.lastResult.v1";
const RESULT_REF_KEY = "powerflow.acsi.resultRef.v1";
const UNLOCK_KEY = "powerflow.acsi.unlocked.v1";
const ITEMS_PER_PAGE = 14;

type Answers = Record<number, 1 | 2 | 3 | 4>;

const copy = {
  en: {
    heroTag: "PowerFlow · ACSI-28",
    heroTitle: "Athlete Coping Skills Inventory",
    heroSubtitle: "Athletic Coping Skills \u00B7 28 items \u00B7 ~10 minutes",
    intro: "About you",
    introBody:
      "A few details so we can compare your scores to the correct reference group and deliver your full report.",
    firstName: "First name",
    email: "Email (for your report)",
    gender: "Gender (determines reference norms)",
    male: "Male",
    female: "Female",
    lang: "Language",
    startTest: "Start the test",
    instructions:
      "Read each statement and select the option that best describes how you typically feel and behave in sport.",
    partLabel: (c: number, t: number) => `Part ${c} of ${t}`,
    back: "Back",
    next: "Next",
    submit: "Submit and see results",
    submitting: "Scoring\u2026",
    incomplete: "Please answer all items on this page before continuing.",
    allTests: "\u2190 All tests",
  },
  hu: {
    heroTag: "PowerFlow \u00B7 ACSI-28",
    heroTitle: "Sportol\u00F3 megk\u00FCzd\u00E9si k\u00E9szs\u00E9gek lelt\u00E1ra",
    heroSubtitle:
      "Sportol\u00F3i megk\u00FCzd\u00E9si k\u00E9szs\u00E9gek \u00B7 28 \u00E1ll\u00EDt\u00E1s \u00B7 ~10 perc",
    intro: "Alapadatok",
    introBody:
      "N\u00E9h\u00E1ny adat, hogy a megfelel\u0151 referenciacsoporthoz tudjunk viszon\u00EDtani, \u00E9s el tudjuk juttatni a teljes riportot.",
    firstName: "Keresztn\u00E9v",
    email: "E-mail c\u00EDm (a riporthoz)",
    gender: "Nem (a referencia\u00E9rt\u00E9kek ehhez igazodnak)",
    male: "F\u00E9rfi",
    female: "N\u0151",
    lang: "Nyelv",
    startTest: "Teszt ind\u00EDt\u00E1sa",
    instructions:
      "Olvasd el mindegyik \u00E1ll\u00EDt\u00E1st, \u00E9s v\u00E1laszd ki azt a lehet\u0151s\u00E9get, amely legink\u00E1bb le\u00EDrja, hogyan \u00E9rzel \u00E9s viselkedsz jellemz\u0151en a sportban.",
    partLabel: (c: number, t: number) => `${c}. r\u00E9sz / ${t}`,
    back: "Vissza",
    next: "Tov\u00E1bb",
    submit: "Bek\u00FCld\u00E9s \u00E9s eredm\u00E9ny",
    submitting: "\u00C9rt\u00E9kel\u00E9s\u2026",
    incomplete:
      "K\u00E9rlek, v\u00E1laszolj az oldal \u00F6sszes k\u00E9rd\u00E9s\u00E9re a tov\u00E1bbl\u00E9p\u00E9s el\u0151tt.",
    allTests: "\u2190 \u00D6sszes teszt",
  },
  de: {
    heroTag: "PowerFlow \u00B7 ACSI-28",
    heroTitle: "Athleten-Bew\u00E4ltigungsf\u00E4higkeiten-Inventar",
    heroSubtitle:
      "Athletische Bew\u00E4ltigungsf\u00E4higkeiten \u00B7 28 Aussagen \u00B7 ~10 Minuten",
    intro: "\u00DCber dich",
    introBody:
      "Einige Angaben, damit wir deine Ergebnisse mit der richtigen Referenzgruppe vergleichen und dir den vollst\u00E4ndigen Bericht liefern k\u00F6nnen.",
    firstName: "Vorname",
    email: "E-Mail (f\u00FCr deinen Bericht)",
    gender: "Geschlecht (bestimmt die Referenznormen)",
    male: "M\u00E4nnlich",
    female: "Weiblich",
    lang: "Sprache",
    startTest: "Test starten",
    instructions:
      "Lies jede Aussage und w\u00E4hle die Option, die am besten beschreibt, wie du dich typischerweise im Sport f\u00FChlst und verh\u00E4ltst.",
    partLabel: (c: number, t: number) => `Teil ${c} von ${t}`,
    back: "Zur\u00FCck",
    next: "Weiter",
    submit: "Absenden und Ergebnisse ansehen",
    submitting: "Auswertung\u2026",
    incomplete:
      "Bitte beantworte alle Fragen auf dieser Seite, bevor du fortf\u00E4hrst.",
    allTests: "\u2190 Alle Tests",
  },
} as const;

export default function AcsiTestPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);
  const [lang, setLang] = React.useState<Lang>("en");
  const [firstName, setFirstName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [page, setPage] = React.useState(0); // 0 = intro, 1 = items 1-14, 2 = items 15-28
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showValidation, setShowValidation] = React.useState(false);
  const [startedAt, setStartedAt] = React.useState("");

  const t = copy[lang];

  React.useEffect(() => {
    setHydrated(true);
    setStartedAt(new Date().toISOString());
  }, []);

  const totalItemPages = 2;
  const totalSteps = 1 + totalItemPages; // intro + 2 item pages

  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / 28) * 100);

  // Items for the current page
  const pageItems = React.useMemo(() => {
    if (page < 1 || page > totalItemPages) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return ACSI_ITEMS.slice(start, start + ITEMS_PER_PAGE);
  }, [page]);

  // Check if all items on the current page are answered
  const allPageItemsAnswered = React.useMemo(() => {
    return pageItems.every((item) => answers[item.id] !== undefined);
  }, [pageItems, answers]);

  const setAnswer = (id: number, v: 1 | 2 | 3 | 4) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setShowValidation(false);
  };

  const canAdvanceFromIntro =
    gender !== null && email.trim().length > 3 && firstName.trim().length > 0;

  const onNext = () => {
    if (page === 0 && !canAdvanceFromIntro) return;
    if (page >= 1 && page <= totalItemPages) {
      if (!allPageItemsAnswered) {
        setShowValidation(true);
        return;
      }
    }
    setShowValidation(false);
    setPage((p) => Math.min(p + 1, totalSteps));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onBack = () => {
    setShowValidation(false);
    setPage((p) => Math.max(p - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async () => {
    if (submitting) return;
    // Final page validation
    if (!allPageItemsAnswered) {
      setShowValidation(true);
      return;
    }
    if (!gender) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const report: AcsiReport = scoreAcsi(answers);
      const respondent = {
        firstName,
        email,
        gender,
        lang,
        startedAt,
        submittedAt: new Date().toISOString(),
      };
      const payload = { report, respondent };
      localStorage.setItem(RESULT_KEY, JSON.stringify(payload));
      // Clear any previous unlock so a new submission always starts locked,
      // unless the user purchased the bundle (which unlocks all tests permanently).
      try {
        if (localStorage.getItem("powerflow.bundle.unlocked.v1") !== "1") {
          localStorage.removeItem(UNLOCK_KEY);
        }
      } catch {
        /* ignore */
      }
      // Fire-and-forget: persist to server
      const resultRef = `pfac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      try {
        localStorage.setItem(RESULT_REF_KEY, resultRef);
      } catch {
        /* ignore */
      }
      fetch("/api/test/acsi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondent, report, resultRef }),
      }).catch(() => {
        /* silent */
      });
      // Mark coach assignment completed (if one exists)
      fetch("/api/athlete/assigned-tests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_slug: "acsi" }),
      }).catch(() => { /* silent */ });
      router.push("/tests/acsi/results");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
      setSubmitting(false);
    }
  };

  const answerLabels = ANSWER_LABELS[lang];

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface-base pt-24 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center font-saira text-sm text-zinc-400">
          Loading&hellip;
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface-base pt-24 text-white">
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
            <span>
              {page === 0
                ? t.intro
                : t.partLabel(page, totalItemPages)}
            </span>
            <span className="text-zinc-400">{answeredCount}/28</span>
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
          <section className="mt-10 rounded-2xl border border-white/5 bg-surface-section p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55)] sm:p-8">
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
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700/70 bg-surface-input px-3 py-2.5 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                  {t.email} <span className="text-purple-300">*</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700/70 bg-surface-input px-3 py-2.5 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
                />
              </label>
            </div>

            <div className="mt-6">
              <p className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                {t.gender} <span className="text-purple-300">*</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <PillButton
                  label={t.male}
                  checked={gender === "male"}
                  onClick={() => setGender("male")}
                />
                <PillButton
                  label={t.female}
                  checked={gender === "female"}
                  onClick={() => setGender("female")}
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                {t.lang}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {(["en", "hu", "de"] as const).map((L) => (
                  <button
                    key={L}
                    type="button"
                    onClick={() => setLang(L)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-saira text-xs uppercase tracking-[0.12em] transition ${
                      lang === L
                        ? "border-purple-400 bg-purple-500/20 text-white"
                        : "border-zinc-700 bg-surface-input text-zinc-200 hover:border-purple-400"
                    }`}
                  >
                    {L === "en" ? "English" : L === "hu" ? "Magyar" : "Deutsch"}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-7 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-3 font-saira text-xs text-zinc-300">
              {t.instructions}
            </p>
          </section>
        )}

        {/* Question pages */}
        {page >= 1 && page <= totalItemPages && (
          <section className="mt-10 space-y-4">
            {pageItems.map((item) => {
              const value = answers[item.id];
              const itemText = item[lang];
              const unanswered = showValidation && value === undefined;
              return (
                <div
                  id={`item-${item.id}`}
                  key={item.id}
                  className={`rounded-2xl border p-5 transition sm:p-6 ${
                    unanswered
                      ? "border-red-500/40 bg-red-950/10"
                      : value !== undefined
                        ? "border-purple-500/25 bg-gradient-to-br from-purple-600/8 to-transparent"
                        : "border-white/5 bg-surface-section"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="font-saira text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                      {String(item.id).padStart(2, "0")}
                    </div>
                    <p className="flex-1 font-saira text-sm text-zinc-100 sm:text-base">
                      {itemText}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 pl-9">
                    {answerLabels.map((label, idx) => (
                      <AnswerPill
                        key={idx}
                        label={label}
                        checked={value === (idx + 1)}
                        onClick={() => setAnswer(item.id, (idx + 1) as 1 | 2 | 3 | 4)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Validation message */}
        {showValidation && !allPageItemsAnswered && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 font-saira text-xs text-red-200">
            {t.incomplete}
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 font-saira text-xs text-red-200">
            {submitError}
          </div>
        )}

        {/* Nav */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={page === 0}
            className="rounded-full border border-purple-500/50 px-6 py-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] text-purple-200 transition hover:border-purple-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-400"
          >
            {t.back}
          </button>

          {page < totalItemPages ? (
            <button
              type="button"
              onClick={onNext}
              disabled={page === 0 && !canAdvanceFromIntro}
              className="rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {page === 0 ? t.startTest : t.next}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          )}
        </div>

        <div className="mt-8 text-center font-saira text-[11px] text-zinc-300">
          <Link
            href="/tests"
            className="underline decoration-zinc-600 hover:text-white"
          >
            {t.allTests}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PillButton({
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
          : "border-zinc-700 bg-surface-input text-zinc-200 hover:border-purple-400"
      }`}
    >
      {label}
    </button>
  );
}

function AnswerPill({
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
      className={`rounded-full border px-4 py-2 font-saira text-[11px] font-semibold tracking-[0.12em] transition ${
        checked
          ? "border-purple-400 bg-purple-500/80 text-white shadow-[0_0_18px_rgba(168,85,247,0.55)]"
          : "border-zinc-700 bg-surface-input text-zinc-300 hover:border-purple-400"
      }`}
    >
      {label}
    </button>
  );
}
