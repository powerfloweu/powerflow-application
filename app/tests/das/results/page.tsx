"use client";

import React from "react";
import Link from "next/link";
import type { DasReport, DasSubscaleKey } from "../../../../lib/tests/das/scoring";
import { DAS_INTRO, SUBSCALE_INTERPRETATIONS, DEPRESSION_PRONE_TEXT } from "../../../../lib/tests/das/interpretations";
import { SUBSCALE_LABELS } from "../../../../lib/tests/das/norms";

const RESULT_KEY = "powerflow.das.lastResult.v1";
const UNLOCK_KEY = "powerflow.das.unlocked.v1";
const RESULT_REF_KEY = "powerflow.das.resultRef.v1";

const STRIPE_PAYMENT_LINK = "STRIPE_DAS_PLACEHOLDER";

type Lang = "en" | "hu" | "de";

type Respondent = {
  firstName: string;
  email: string;
  lang: Lang;
  startedAt: string;
  submittedAt: string;
};

type StoredPayload = { report: DasReport; respondent: Respondent };

// ---------------------------------------------------------------------------
// Subscale display order
// ---------------------------------------------------------------------------

const SUBSCALE_ORDER: DasSubscaleKey[] = [
  "externalApproval",
  "lovability",
  "achievement",
  "perfectionism",
  "entitlement",
  "omnipotence",
  "externalControl",
];

// ---------------------------------------------------------------------------
// UI copy in 3 languages
// ---------------------------------------------------------------------------

const ui = {
  en: {
    headerTag: "PowerFlow \u00B7 DAS Profile",
    printDocTitle: "DAS Report",
    profileTitle: (name: string) => `${name}'s profile`,
    chartTitle: "Your attitude profile",
    normalZone: "Normal range",
    dysfunctional: "Dysfunctional",
    normal: "Normal",
    externalControl: "External control",
    autonomy: "Autonomy",
    introTitle: "Understanding your results",
    subscalesTitle: "Your seven belief dimensions",
    noResults: "No results yet",
    noResultsBody:
      "You haven't completed the Dysfunctional Attitude Scale on this device.",
    startTest: "Start the test",
    verifying: "Verifying your payment with Stripe\u2026",
    verifyErrorSuffix: "If you completed payment, please contact",
    verifyErrorSuffix2: "with your Stripe receipt.",
    upsellTag: "Your full report",
    upsellTitle: "Unlock your written report",
    upsellBody: (email: string) =>
      `The chart above shows where your attitudes sit \u2014 the report explains what each pattern means for you, how it plays out under competitive pressure, and what to work on. We'll pre-fill the Stripe checkout with ${email}.`,
    upsellCta: "Unlock full report \u00B7 \u20AC19",
    upsellFine:
      "Secure payment via Stripe. You'll return here with the full narrative unlocked.",
    depressionProneTitle: "Elevated overall score",
    depressionProneNotice:
      "Your combined score across all subscales is elevated. See your full report for a detailed explanation.",
    unlockedTag: "Full report unlocked",
    unlockedTitle: "Thank you",
    unlockedBody:
      "All seven subscale narratives are now shown above. Download a PDF copy of this page to keep.",
    downloadPdf: "Download PDF",
    downloadFine:
      'Opens your browser print dialog \u2014 choose "Save as PDF" as the destination.',
    coaching: "Apply for 1:1 coaching",
    allTests: "\u2190 All tests",
  },
  hu: {
    headerTag: "PowerFlow \u00B7 DAS Profil",
    printDocTitle: "DAS Riport",
    profileTitle: (name: string) => `${name} profilja`,
    chartTitle: "Az attit\u0171dprofilod",
    normalZone: "Norm\u00E1l tartom\u00E1ny",
    dysfunctional: "Diszfunkcion\u00E1lis",
    normal: "Norm\u00E1l",
    externalControl: "K\u00FCls\u0151 kontroll",
    autonomy: "Auton\u00F3mia",
    introTitle: "Az eredm\u00E9nyek \u00E9rtelmez\u00E9se",
    subscalesTitle: "A h\u00E9t hiedelemdimenz\u00ED\u00F3",
    noResults: "M\u00E9g nincsenek eredm\u00E9nyek",
    noResultsBody:
      "Ezen az eszk\u00F6z\u00F6n m\u00E9g nem t\u00F6lt\u00F6tted ki a Diszfunkcion\u00E1lis Attit\u0171d Sk\u00E1l\u00E1t.",
    startTest: "Teszt ind\u00EDt\u00E1sa",
    verifying: "Fizet\u00E9s ellen\u0151rz\u00E9se a Stripe-on\u2026",
    verifyErrorSuffix:
      "Ha elv\u00E9gezted a fizet\u00E9st, k\u00E9rlek, vedd fel a kapcsolatot vel\u00FCnk",
    verifyErrorSuffix2: "a Stripe-visszaigazol\u00E1s\u00E1val.",
    upsellTag: "A teljes riportod",
    upsellTitle: "Teljes riport felold\u00E1sa",
    upsellBody: (email: string) =>
      `A fenti diagram mutatja, hol \u00E1llnak az attit\u0171djeid \u2014 a riport elmagyar\u00E1zza, mit jelent minden egyes minta sz\u00E1modra, hogyan jelenik meg versenynyom\u00E1s alatt, \u00E9s min \u00E9rdemes dolgoznod. A Stripe-fizet\u00E9st el\u0151re kit\u00F6ltj\u00FCk a(z) ${email} e-mail-c\u00EDmmel.`,
    upsellCta: "Teljes riport felold\u00E1sa \u00B7 19 \u20AC",
    upsellFine:
      "Biztons\u00E1gos fizet\u00E9s Stripe-on kereszt\u00FCl. A teljes narrat\u00EDva feloldva t\u00E9r vissza ide.",
    depressionProneTitle: "Emelkedett \u00F6ssz\u00EDpontsz\u00E1m",
    depressionProneNotice:
      "Az alsk\u00E1l\u00E1k \u00F6sszes\u00EDtett pontoz\u00E1sa emelkedett. A r\u00E9szletes magyar\u00E1zat\u00E9rt tekintsd meg a teljes riportot.",
    unlockedTag: "Teljes riport feloldva",
    unlockedTitle: "K\u00F6sz\u00F6nj\u00FCk",
    unlockedBody:
      "A h\u00E9t alsk\u00E1la narrat\u00EDv\u00E1ja most m\u00E1r l\u00E1that\u00F3 fent. T\u00F6ltsd le PDF-k\u00E9nt az oldalt, hogy meg\u0151rizhesd.",
    downloadPdf: "PDF let\u00F6lt\u00E9se",
    downloadFine:
      'Megny\u00EDtja a b\u00F6ng\u00E9sz\u0151 nyomtat\u00E1si p\u00E1rbesz\u00E9dablakit \u2014 v\u00E1laszd a \u201EMent\u00E9s PDF-k\u00E9nt\u201D lehet\u0151s\u00E9get.',
    coaching: "Jelent\u00E9kez\u00E9s 1:1 coachingra",
    allTests: "\u2190 \u00D6sszes teszt",
  },
  de: {
    headerTag: "PowerFlow \u00B7 DAS Profil",
    printDocTitle: "DAS Bericht",
    profileTitle: (name: string) => `${name}s Profil`,
    chartTitle: "Dein Einstellungsprofil",
    normalZone: "Normalbereich",
    dysfunctional: "Dysfunktional",
    normal: "Normal",
    externalControl: "Ext. Kontrolle",
    autonomy: "Autonomie",
    introTitle: "Deine Ergebnisse verstehen",
    subscalesTitle: "Deine sieben \u00DCberzeugungsdimensionen",
    noResults: "Noch keine Ergebnisse",
    noResultsBody:
      "Du hast die Dysfunktionale Einstellungsskala auf diesem Ger\u00E4t noch nicht ausgef\u00FCllt.",
    startTest: "Test starten",
    verifying:
      "Zahlung wird mit Stripe verifiziert\u2026",
    verifyErrorSuffix:
      "Wenn du die Zahlung abgeschlossen hast, kontaktiere uns bitte",
    verifyErrorSuffix2: "mit deiner Stripe-Quittung.",
    upsellTag: "Dein vollst\u00E4ndiger Bericht",
    upsellTitle: "Vollst\u00E4ndigen Bericht freischalten",
    upsellBody: (email: string) =>
      `Das obige Diagramm zeigt, wo deine Einstellungen liegen \u2014 der Bericht erkl\u00E4rt, was jedes Muster f\u00FCr dich bedeutet, wie es sich unter Wettkampfdruck auswirkt und woran du arbeiten solltest. Wir f\u00FCllen den Stripe-Checkout vorab mit ${email} aus.`,
    upsellCta:
      "Vollst\u00E4ndigen Bericht freischalten \u00B7 19 \u20AC",
    upsellFine:
      "Sichere Zahlung \u00FCber Stripe. Du kehrst hier mit vollst\u00E4ndig freigeschalteter Erz\u00E4hlung zur\u00FCck.",
    depressionProneTitle: "Erh\u00F6hter Gesamtwert",
    depressionProneNotice:
      "Dein kombinierter Score \u00FCber alle Subskalen ist erh\u00F6ht. Sieh deinen vollst\u00E4ndigen Bericht f\u00FCr eine detaillierte Erkl\u00E4rung.",
    unlockedTag: "Vollst\u00E4ndiger Bericht freigeschaltet",
    unlockedTitle: "Danke",
    unlockedBody:
      "Alle sieben Subskalen-Erz\u00E4hlungen werden jetzt oben angezeigt. Lade eine PDF-Kopie dieser Seite herunter, um sie zu behalten.",
    downloadPdf: "PDF herunterladen",
    downloadFine:
      '\u00D6ffnet den Druckdialog deines Browsers \u2014 w\u00E4hle "Als PDF speichern" als Ziel.',
    coaching: "F\u00FCr 1:1-Coaching bewerben",
    allTests: "\u2190 Alle Tests",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DasResultsPage() {
  const [payload, setPayload] = React.useState<StoredPayload | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(RESULT_KEY);
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      /* ignore */
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (sessionId && sessionId.startsWith("cs_")) {
        setVerifying(true);
        fetch(
          `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
        )
          .then((r) => r.json())
          .then((data: { paid: boolean; error?: string }) => {
            if (data.paid) {
              try {
                localStorage.setItem(UNLOCK_KEY, "1");
              } catch {}
              setUnlocked(true);
            } else {
              setVerifyError(data.error || "Payment could not be verified.");
            }
          })
          .catch(() => setVerifyError("Could not reach verification server."))
          .finally(() => {
            setVerifying(false);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete("session_id");
              window.history.replaceState(null, "", url.toString());
            } catch {}
          });
      } else {
        let alreadyUnlocked = false;
        try {
          alreadyUnlocked =
            localStorage.getItem(UNLOCK_KEY) === "1" ||
            localStorage.getItem("powerflow.bundle.unlocked.v1") === "1";
          if (alreadyUnlocked) setUnlocked(true);
        } catch {}

        if (!alreadyUnlocked) {
          let resultRef = "";
          try {
            resultRef = localStorage.getItem(RESULT_REF_KEY) ?? "";
          } catch {}
          if (resultRef) {
            fetch(
              `/api/das/check-paid?ref=${encodeURIComponent(resultRef)}`,
            )
              .then((r) => r.json())
              .then((data: { paid: boolean }) => {
                if (data.paid) {
                  try {
                    localStorage.setItem(UNLOCK_KEY, "1");
                  } catch {}
                  setUnlocked(true);
                }
              })
              .catch(() => {
                /* non-fatal */
              });
          }

          // Check 4: profile-level test_access flag OR second/pr tier
          fetch("/api/me")
            .then((r) => r.ok ? r.json() : null)
            .then((profile) => {
              const tier = profile?.plan_tier ?? "opener";
              const tierOk = tier === "second" || tier === "pr";
              if (profile?.test_access === true || tierOk) setUnlocked(true);
            })
            .catch(() => {});
        }
      }
    }
    setHydrated(true);
  }, []);

  const openCheckout = React.useCallback(() => {
    if (!payload) return;
    let resultRef: string;
    try {
      resultRef =
        localStorage.getItem(RESULT_REF_KEY) ??
        `pfdas_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    } catch {
      resultRef = `pfdas_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    const url = new URL(STRIPE_PAYMENT_LINK);
    if (payload.respondent.email)
      url.searchParams.set("prefilled_email", payload.respondent.email);
    url.searchParams.set("client_reference_id", resultRef);
    window.location.href = url.toString();
  }, [payload]);

  const downloadPdf = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const prev = document.title;
    document.title = "";
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1500);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface-base pt-24 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center font-saira text-sm text-zinc-400">
          Loading&hellip;
        </div>
      </div>
    );
  }

  if (!payload) {
    const c = ui.en;
    return (
      <div className="relative min-h-screen bg-surface-base pt-24 text-white">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.12em]">
            {c.noResults}
          </h1>
          <p className="mt-5 font-saira text-sm text-zinc-300">
            {c.noResultsBody}
          </p>
          <Link
            href="/tests/das"
            className="mt-8 inline-block rounded-full bg-purple-500 px-7 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
          >
            {c.startTest}
          </Link>
        </div>
      </div>
    );
  }

  const { report, respondent } = payload;
  const lang: Lang = (respondent.lang as Lang) ?? "en";
  const c = ui[lang] ?? ui.en;

  const tStr = (obj: { en: string; hu: string; de: string }): string =>
    obj[lang] ?? obj.en;

  // Build chart data
  const chartData = SUBSCALE_ORDER.map((key) => {
    const sub = report.subscales.find((s) => s.key === key)!;
    const label = SUBSCALE_LABELS[lang]?.[key] ?? SUBSCALE_LABELS.en[key] ?? key;
    return {
      key,
      label,
      score: sub.score,
      band: sub.band,
      direction: sub.direction,
    };
  });

  return (
    <div className="relative min-h-screen bg-surface-base pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.14),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Print-only branded header */}
        <div className="hidden print:flex items-center justify-between pb-7 mb-8 border-b border-purple-500/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fm_powerflow_logo_verziok_01_negative.png"
            alt="PowerFlow"
            style={{ height: "36px", width: "auto" }}
          />
          <div className="text-right">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-300">
              {c.printDocTitle}
            </p>
            <p className="mt-1 font-saira text-[11px] text-zinc-400">
              David Sipos &mdash; Sports psychologist
            </p>
          </div>
        </div>

        {/* Hero Profile Header */}
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-br from-[#1C0F30] via-[#110B1E] to-[#050608] p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl print:hidden" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-44 w-44 rounded-full bg-fuchsia-700/10 blur-3xl print:hidden" />
          <p className="relative font-saira text-[10px] font-semibold uppercase tracking-[0.3em] text-purple-300 print:hidden">
            {c.headerTag}
          </p>
          <h1 className="relative mt-2 font-saira text-4xl font-extrabold uppercase tracking-[0.08em] sm:text-5xl">
            {c.profileTitle(respondent.firstName)}
          </h1>
          <div className="relative mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-saira text-[11px] uppercase tracking-[0.22em] text-zinc-400">
              {new Date(respondent.submittedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Diverging bar chart — always visible */}
        <div className="mt-8 rounded-3xl border border-white/5 bg-surface-alt p-6 sm:p-8">
          <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
            {c.chartTitle}
          </h2>

          <div className="mt-6 overflow-x-auto">
            <DivergingBarChart
              data={chartData}
              lang={lang}
              normalZoneLabel={c.normalZone}
            />
          </div>
        </div>

        {/* Depression-prone warning — always visible if applicable */}
        {report.depressionProne && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-[#0F1116] to-[#0F1116] p-5 print:border-amber-500/40">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 text-amber-400">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  {c.depressionProneTitle}
                </p>
                <p className="mt-1.5 font-saira text-sm text-amber-100/80">
                  {unlocked
                    ? DEPRESSION_PRONE_TEXT[lang] ?? DEPRESSION_PRONE_TEXT.en
                    : c.depressionProneNotice}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Intro text — always visible */}
        <div className="mt-10 space-y-3">
          <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
            {c.introTitle}
          </h2>
          <p className="font-saira text-sm text-zinc-300">
            {DAS_INTRO[lang] ?? DAS_INTRO.en}
          </p>
        </div>

        {/* Paid content — subscale narratives */}
        {unlocked && (
          <div className="mt-12 space-y-5">
            <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
              {c.subscalesTitle}
            </h2>
            {SUBSCALE_ORDER.map((key) => {
              const sub = report.subscales.find((s) => s.key === key)!;
              const interp = SUBSCALE_INTERPRETATIONS[key];
              const band = sub.band;
              const score = sub.score;

              let narrative: string;
              if (band === "normal" || score === 0) {
                narrative = interp.normalText[lang] ?? interp.normalText.en;
              } else if (band === "dysfunctional" && score > 0) {
                narrative = interp.highText[lang] ?? interp.highText.en;
              } else {
                narrative = interp.lowText[lang] ?? interp.lowText.en;
              }

              const isDysfunctional = band === "dysfunctional";
              const isPositive = score > 0;

              const accentGradient = isDysfunctional
                ? isPositive
                  ? "from-rose-500 to-rose-400"
                  : "from-sky-500 to-sky-400"
                : "from-purple-500 to-purple-400";

              const cardBorder = isDysfunctional
                ? isPositive
                  ? "border-rose-500/20"
                  : "border-sky-500/20"
                : "border-purple-500/15";

              const cardBg = isDysfunctional
                ? isPositive
                  ? "from-rose-950/25 via-[#0F1116] to-[#0F1116]"
                  : "from-sky-950/25 via-[#0F1116] to-[#0F1116]"
                : "from-purple-950/20 via-[#0F1116] to-[#0F1116]";

              // Band label
              let bandLabel: string;
              if (key === "externalControl") {
                bandLabel = score > 0
                  ? c.externalControl.toUpperCase()
                  : c.autonomy.toUpperCase();
              } else {
                bandLabel = band === "normal"
                  ? c.normal.toUpperCase()
                  : c.dysfunctional.toUpperCase();
              }

              const pillColor = isDysfunctional
                ? isPositive
                  ? "border-rose-400/60 bg-rose-500/15 text-rose-200"
                  : "border-sky-400/60 bg-sky-500/15 text-sky-200"
                : "border-purple-400/60 bg-purple-500/15 text-purple-200";

              return (
                <div
                  key={key}
                  id={`subscale-${key}`}
                  className={`overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(0,0,0,0.4)] bg-gradient-to-br ${cardBorder} ${cardBg}`}
                >
                  <div className={`h-[3px] w-full bg-gradient-to-r ${accentGradient}`} />
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-saira text-lg font-extrabold uppercase tracking-[0.1em]">
                          {tStr(interp.name)}
                        </h3>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-saira text-2xl font-extrabold tabular-nums leading-none text-white">
                          {score > 0 ? `+${score}` : score}
                          <span className="text-sm font-normal text-zinc-300"> / ±10</span>
                        </div>
                        <div className="mt-1.5">
                          <span
                            className={`rounded-full border px-3 py-1 font-saira text-[10px] font-semibold uppercase tracking-[0.22em] ${pillColor}`}
                          >
                            {bandLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mini diverging bar */}
                    <div className="mt-4 relative h-2 rounded-full bg-white/[0.06]">
                      {/* Normal zone shading */}
                      <div className="absolute inset-y-0 left-[37.5%] w-1/4 rounded-full bg-purple-500/10" />
                      {/* Center line */}
                      <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-600/60" />
                      {/* Score bar */}
                      {score !== 0 && (
                        <div
                          className={`absolute inset-y-0 rounded-full bg-gradient-to-r ${accentGradient}`}
                          style={
                            score > 0
                              ? { left: "50%", width: `${Math.abs(score) * 5}%` }
                              : { right: "50%", width: `${Math.abs(score) * 5}%` }
                          }
                        />
                      )}
                    </div>
                    <div className="mt-1 flex justify-between font-saira text-[9px] text-zinc-400">
                      <span>-10</span>
                      <span>0</span>
                      <span>+10</span>
                    </div>

                    <div className="mt-5 font-saira text-sm leading-relaxed text-zinc-300">
                      <p>{narrative}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stripe verification state */}
        {verifying && (
          <div className="mt-14 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 text-center font-saira text-sm text-purple-100 print:hidden">
            {c.verifying}
          </div>
        )}
        {verifyError && !unlocked && (
          <div className="mt-14 rounded-2xl border border-red-500/40 bg-red-950/20 p-5 text-center font-saira text-sm text-red-200 print:hidden">
            {verifyError} {c.verifyErrorSuffix}{" "}
            <a
              href="mailto:david@power-flow.eu"
              className="underline decoration-red-400 hover:text-white"
            >
              david@power-flow.eu
            </a>{" "}
            {c.verifyErrorSuffix2}
          </div>
        )}

        {/* Upsell / unlocked banner */}
        {!unlocked ? (
          <div className="mt-14 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-fuchsia-500/10 to-transparent p-8 text-center shadow-[0_22px_60px_rgba(126,34,206,0.18)] print:hidden">
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-200/90">
              {c.upsellTag}
            </p>
            <h2 className="mt-3 font-saira text-2xl font-extrabold uppercase tracking-[0.1em]">
              {c.upsellTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-saira text-sm text-zinc-300">
              {c.upsellBody(respondent.email)}
            </p>
            <button
              type="button"
              onClick={openCheckout}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
            >
              {c.upsellCta}
            </button>
            <p className="mt-4 font-saira text-[11px] text-zinc-300">
              {c.upsellFine}
            </p>
          </div>
        ) : (
          <div className="mt-14 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-transparent p-8 text-center shadow-[0_22px_60px_rgba(16,185,129,0.18)] print:hidden">
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
              {c.unlockedTag}
            </p>
            <h2 className="mt-3 font-saira text-2xl font-extrabold uppercase tracking-[0.1em]">
              {c.unlockedTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-saira text-sm text-zinc-300">
              {c.unlockedBody}
            </p>
            <button
              type="button"
              onClick={downloadPdf}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-emerald-400"
            >
              {c.downloadPdf}
            </button>
            <p className="mt-4 font-saira text-[11px] text-zinc-300">
              {c.downloadFine}
            </p>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-14 flex flex-col items-center gap-4 text-center print:hidden">
          <Link
            href="/"
            className="rounded-full border border-purple-500/50 px-7 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-purple-200 transition hover:border-purple-400 hover:text-white"
          >
            {c.coaching}
          </Link>
          <Link
            href="/tests"
            className="font-saira text-[11px] text-zinc-300 underline decoration-zinc-600 hover:text-white"
          >
            {c.allTests}
          </Link>
        </div>
      </div>

      {/* Print-only footer watermark */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 px-8 py-4 border-t border-purple-500/20">
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fm_powerflow_logo_verziok_01_negative.png"
            alt="PowerFlow"
            style={{ height: "20px", width: "auto", opacity: 0.6 }}
          />
          <p className="font-saira text-[9px] uppercase tracking-[0.22em] text-zinc-300">
            David Sipos &mdash; Sports psychologist &middot; power-flow.eu
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            background: #050608 !important;
            color: #ffffff !important;
          }

          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }

          .hidden.print\\:flex,
          .hidden.print\\:block {
            display: flex !important;
          }

          .pointer-events-none.fixed {
            display: none !important;
          }

          .pt-24 {
            padding-top: 0 !important;
          }

          .bg-\\[\\#0B0D12\\],
          .bg-\\[\\#0F1116\\] {
            background: #0b0d12 !important;
          }

          .bg-\\[\\#050608\\] {
            background: #050608 !important;
          }

          .rounded-2xl,
          .rounded-3xl {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diverging bar chart
// ---------------------------------------------------------------------------

type ChartDatum = {
  key: DasSubscaleKey;
  label: string;
  score: number;
  band: "normal" | "dysfunctional";
  direction?: "externalControl" | "autonomy";
};

function DivergingBarChart({
  data,
  lang,
  normalZoneLabel,
}: {
  data: ChartDatum[];
  lang: Lang;
  normalZoneLabel: string;
}) {
  // SVG layout
  const labelWidth = 130;
  const scoreWidth = 36;
  const chartWidth = 300;
  const totalWidth = labelWidth + chartWidth + scoreWidth;
  const rowHeight = 28;
  const paddingTop = 24;
  const paddingBottom = 28;
  const totalHeight = paddingTop + data.length * rowHeight + paddingBottom;

  // X scale: score -10..+10 maps to 0..chartWidth
  const cx = chartWidth / 2; // center x within chart area
  const scale = chartWidth / 20; // px per unit

  // Normal zone: -5 to +5 → x = cx-5*scale to cx+5*scale
  const nzLeft = cx - 5 * scale;
  const nzWidth = 10 * scale;

  // X-axis tick values
  const ticks = [-10, -5, 0, 5, 10];

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width="100%"
      style={{ maxWidth: "580px", display: "block", margin: "0 auto" }}
      aria-label="Diverging bar chart of DAS subscale scores"
      role="img"
    >
      {/* Normal zone background */}
      <rect
        x={labelWidth + nzLeft}
        y={paddingTop - 4}
        width={nzWidth}
        height={data.length * rowHeight + 8}
        fill="rgba(168,85,247,0.08)"
        rx="3"
      />

      {/* Normal zone label */}
      <text
        x={labelWidth + cx}
        y={paddingTop - 8}
        textAnchor="middle"
        fontSize="7.5"
        fill="rgba(168,85,247,0.55)"
        fontFamily="inherit"
        letterSpacing="0.08em"
        fontWeight="600"
        textRendering="optimizeLegibility"
      >
        {normalZoneLabel.toUpperCase()}
      </text>

      {/* Center line */}
      <line
        x1={labelWidth + cx}
        y1={paddingTop - 4}
        x2={labelWidth + cx}
        y2={paddingTop + data.length * rowHeight + 4}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Rows */}
      {data.map((d, i) => {
        const y = paddingTop + i * rowHeight + rowHeight / 2;
        const barHeight = 10;
        const barY = y - barHeight / 2;
        const barLen = Math.abs(d.score) * scale;

        // Bar color
        let barFill: string;
        if (d.band === "normal") {
          barFill = "rgba(168,85,247,0.75)";
        } else if (d.score > 0) {
          barFill = "rgba(244,63,94,0.80)"; // rose — dysfunctional positive
        } else {
          barFill = "rgba(56,189,248,0.80)"; // sky — adaptive negative
        }

        const barX =
          d.score >= 0
            ? labelWidth + cx
            : labelWidth + cx - barLen;

        // Score label display
        const scoreDisplay = d.score > 0 ? `+${d.score}` : `${d.score}`;

        // Direction label for externalControl
        let directionTag: string | null = null;
        if (d.key === "externalControl" && d.band === "dysfunctional") {
          if (lang === "hu") {
            directionTag = d.score > 0 ? "KÜLSŐ KONTROLL" : "AUTONÓMIA";
          } else if (lang === "de") {
            directionTag = d.score > 0 ? "EXT. KONTROLLE" : "AUTONOMIE";
          } else {
            directionTag = d.score > 0 ? "EXT. CONTROL" : "AUTONOMY";
          }
        }

        return (
          <g key={d.key}>
            {/* Row separator */}
            {i > 0 && (
              <line
                x1={0}
                y1={paddingTop + i * rowHeight}
                x2={totalWidth}
                y2={paddingTop + i * rowHeight}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            )}

            {/* Subscale label */}
            <text
              x={labelWidth - 8}
              y={y + 1}
              textAnchor="end"
              fontSize="9.5"
              fill={d.band === "dysfunctional" ? "#e4e4e7" : "#a1a1aa"}
              fontFamily="inherit"
              dominantBaseline="middle"
              fontWeight={d.band === "dysfunctional" ? "600" : "400"}
            >
              {d.label}
            </text>

            {/* Bar track */}
            <rect
              x={labelWidth}
              y={barY}
              width={chartWidth}
              height={barHeight}
              fill="rgba(255,255,255,0.04)"
              rx="3"
            />

            {/* Score bar */}
            {d.score !== 0 && (
              <rect
                x={barX}
                y={barY}
                width={barLen}
                height={barHeight}
                fill={barFill}
                rx="3"
              />
            )}

            {/* Score value */}
            <text
              x={labelWidth + chartWidth + 6}
              y={y + 1}
              textAnchor="start"
              fontSize="9.5"
              fill={d.band === "dysfunctional" ? "#e4e4e7" : "#71717a"}
              fontFamily="inherit"
              dominantBaseline="middle"
              fontWeight="600"
            >
              {scoreDisplay}
              {directionTag && (
                <tspan fontSize="7.5" fill="rgba(255,255,255,0.35)" dx="3">
                  {directionTag}
                </tspan>
              )}
            </text>
          </g>
        );
      })}

      {/* X-axis ticks */}
      {ticks.map((t) => {
        const tx = labelWidth + cx + t * scale;
        const isZero = t === 0;
        return (
          <g key={t}>
            <line
              x1={tx}
              y1={paddingTop + data.length * rowHeight + 4}
              x2={tx}
              y2={paddingTop + data.length * rowHeight + (isZero ? 10 : 7)}
              stroke={isZero ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)"}
              strokeWidth={isZero ? "1.5" : "1"}
            />
            <text
              x={tx}
              y={paddingTop + data.length * rowHeight + 19}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgba(255,255,255,0.3)"
              fontFamily="inherit"
              fontWeight={isZero ? "700" : "400"}
            >
              {t > 0 ? `+${t}` : t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
