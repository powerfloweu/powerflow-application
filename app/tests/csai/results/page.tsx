"use client";

import React from "react";
import Link from "next/link";
import type {
  CsaiReport,
  CsaiSubscaleKey,
  Band,
} from "../../../../lib/tests/csai/scoring";
import {
  CSAI_INTRO,
  SUBSCALE_INTERPRETATIONS,
} from "../../../../lib/tests/csai/interpretations";
import {
  POPULATION_AVERAGES,
  BAND_CUTOFFS,
} from "../../../../lib/tests/csai/norms";

const RESULT_KEY = "powerflow.csai.lastResult.v1";
const UNLOCK_KEY = "powerflow.csai.unlocked.v1";
const RESULT_REF_KEY = "powerflow.csai.resultRef.v1";

// Stripe Payment Link placeholder for the CSAI full report.
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/placeholder";

type Lang = "en" | "hu" | "de";

type Respondent = {
  firstName: string;
  email: string;
  gender: "male" | "female";
  lang: Lang;
  startedAt: string;
  submittedAt: string;
};

type StoredPayload = { report: CsaiReport; respondent: Respondent };

// ---------------------------------------------------------------------------
// Subscale display order
// ---------------------------------------------------------------------------

const SUBSCALE_ORDER: CsaiSubscaleKey[] = [
  "cognitive",
  "somatic",
  "confidence",
];

// ---------------------------------------------------------------------------
// UI copy in 3 languages
// ---------------------------------------------------------------------------

const ui = {
  en: {
    headerTag: "PowerFlow \u00B7 CSAI-2 Profile",
    printDocTitle: "CSAI-2 Report",
    profileTitle: (name: string) => `${name}'s profile`,
    refNorms: (g: string) => `Reference norms: ${g}`,
    genderMale: "Male",
    genderFemale: "Female",
    chartTitle: "Your competitive state at a glance",
    chartFootnote:
      "Each bar shows your subscale score (9\u201336). The tick mark indicates the population average.",
    popAvg: "Pop. avg",
    stateNotice:
      "These results reflect your mental state at the time of the test \u2014 before your competition. They are a snapshot, not a fixed trait.",
    introTitle: "Understanding your results",
    subscalesTitle: "Your three dimensions",
    typical: "typical",
    noResults: "No results yet",
    noResultsBody:
      "You haven't completed the CSAI-2 test on this device. Start the test to see your profile.",
    startTest: "Start the test",
    verifying: "Verifying your payment with Stripe\u2026",
    verifyErrorSuffix: "If you completed payment, please contact",
    verifyErrorSuffix2: "with your Stripe receipt.",
    upsellTag: "Your full report",
    upsellTitle: "Unlock your written report",
    upsellBody: (email: string) =>
      `The chart above is a snapshot \u2014 the report explains what each of your three anxiety dimensions means for you right now, with specific pre-competition strategies tailored to your current state. We'll pre-fill the Stripe checkout with ${email}.`,
    upsellCta: "Unlock full report \u00B7 \u20AC29",
    upsellFine:
      "Secure payment via Stripe. You'll return here with the full narrative unlocked.",
    unlockedTag: "Full report unlocked",
    unlockedTitle: "Thank you",
    unlockedBody:
      "All three subscale narratives are now shown above. Download a PDF copy of this page to keep.",
    downloadPdf: "Download PDF",
    downloadFine:
      'Opens your browser print dialog \u2014 choose "Save as PDF" as the destination.',
    coaching: "Apply for 1:1 coaching",
    allTests: "\u2190 All tests",
  },
  hu: {
    headerTag: "PowerFlow \u00B7 CSAI-2 Profil",
    printDocTitle: "CSAI-2 Riport",
    profileTitle: (name: string) => `${name} profilja`,
    refNorms: (g: string) => `Referencia\u00E9rt\u00E9kek: ${g}`,
    genderMale: "F\u00E9rfi",
    genderFemale: "N\u0151",
    chartTitle: "Versenyelőtti állapotod egy pillantással",
    chartFootnote:
      "Minden s\u00E1v a pontsz\u00E1modat mutatja (9\u201336). A jel\u00F6l\u0151 a popul\u00E1ci\u00F3s \u00E1tlagot jelzi.",
    popAvg: "Pop. \u00E1tlag",
    stateNotice:
      "Ezek az eredm\u00E9nyek a teszt kit\u00F6lt\u00E9sekor \u00E9rzett ment\u00E1lis \u00E1llapotodat t\u00FCkr\u00F6zik \u2014 a verseny el\u0151tt. Ez egy pillanatk\u00E9p, nem \u00E1lland\u00F3 von\u00E1s.",
    introTitle: "Az eredm\u00E9nyek \u00E9rtelmez\u00E9se",
    subscalesTitle: "A h\u00E1rom dimenzi\u00F3d",
    typical: "tipikus",
    noResults: "M\u00E9g nincs eredm\u00E9ny",
    noResultsBody:
      "M\u00E9g nem t\u00F6lt\u00F6tted ki a CSAI-2 tesztet ezen az eszk\u00F6z\u00F6n. Ind\u00EDtsd el a tesztet a profilod megtekint\u00E9s\u00E9hez.",
    startTest: "Teszt ind\u00EDt\u00E1sa",
    verifying: "Stripe fizet\u00E9s ellen\u0151rz\u00E9se\u2026",
    verifyErrorSuffix:
      "Ha elv\u00E9gezted a fizet\u00E9st, k\u00E9rj\u00FCk vedd fel a kapcsolatot a k\u00F6vetkez\u0151 e-mail-en:",
    verifyErrorSuffix2: "a Stripe nyugt\u00E1ddal.",
    upsellTag: "Teljes riportod",
    upsellTitle: "Oldd fel az \u00EDr\u00E1sos riportot",
    upsellBody: (email: string) =>
      `A fenti \u00E1bra egy pillanatk\u00E9p \u2014 a riport elmagyar\u00E1zza, mit jelent sz\u00E1modra mind a h\u00E1rom szorongási dimenzió éppen most, a jelenlegi állapotodra szabott versenyelőtti stratégiákkal. A Stripe fizet\u00E9st ezzel az e-mail-lel t\u00F6ltj\u00FCk el\u0151: ${email}.`,
    upsellCta: "Riport felold\u00E1sa \u00B7 \u20AC29",
    upsellFine:
      "Biztons\u00E1gos fizet\u00E9s Stripe-on kereszt\u00FCl. A teljes narrat\u00EDv\u00E1val visszat\u00E9rhetsz ide.",
    unlockedTag: "Teljes riport feloldva",
    unlockedTitle: "K\u00F6sz\u00F6nj\u00FCk",
    unlockedBody:
      "A h\u00E1rom alsk\u00E1la narrat\u00EDv\u00E1ja most m\u00E1r l\u00E1that\u00F3 fent. T\u00F6ltsd le PDF-k\u00E9nt az oldalr\u00F3l.",
    downloadPdf: "PDF let\u00F6lt\u00E9se",
    downloadFine:
      'Megny\u00EDlik a b\u00F6ng\u00E9sz\u0151 nyomtat\u00E1si ablaka \u2014 v\u00E1laszd a \u201EMent\u00E9s PDF-k\u00E9nt\u201D lehet\u0151s\u00E9get.',
    coaching: "Jelentkez\u00E9s sportpszichol\u00F3giai konzult\u00E1ci\u00F3ra",
    allTests: "\u2190 \u00D6sszes teszt",
  },
  de: {
    headerTag: "PowerFlow \u00B7 CSAI-2 Profil",
    printDocTitle: "CSAI-2 Bericht",
    profileTitle: (name: string) => `${name}s Profil`,
    refNorms: (g: string) => `Referenznormen: ${g}`,
    genderMale: "M\u00E4nnlich",
    genderFemale: "Weiblich",
    chartTitle: "Dein Wettkampfzustand auf einen Blick",
    chartFootnote:
      "Jeder Balken zeigt deine Subskalenpunktzahl (9\u201336). Die Markierung zeigt den Bev\u00F6lkerungsdurchschnitt.",
    popAvg: "Pop.-Durchschn.",
    stateNotice:
      "Diese Ergebnisse spiegeln deinen mentalen Zustand zum Zeitpunkt des Tests wider \u2014 vor deinem Wettkampf. Sie sind eine Momentaufnahme, keine feste Eigenschaft.",
    introTitle: "Deine Ergebnisse verstehen",
    subscalesTitle: "Deine drei Dimensionen",
    typical: "typisch",
    noResults: "Noch keine Ergebnisse",
    noResultsBody:
      "Du hast den CSAI-2-Test auf diesem Ger\u00E4t noch nicht abgeschlossen. Starte den Test, um dein Profil zu sehen.",
    startTest: "Test starten",
    verifying: "Stripe-Zahlung wird \u00FCberpr\u00FCft\u2026",
    verifyErrorSuffix:
      "Falls du die Zahlung abgeschlossen hast, kontaktiere bitte",
    verifyErrorSuffix2: "mit deiner Stripe-Quittung.",
    upsellTag: "Dein vollst\u00E4ndiger Bericht",
    upsellTitle: "Vollst\u00E4ndigen Bericht freischalten",
    upsellBody: (email: string) =>
      `Das obige Diagramm ist eine Momentaufnahme \u2014 der Bericht erkl\u00E4rt, was jede deiner drei Angstdimensionen gerade f\u00FCr dich bedeutet, mit spezifischen Vorwettkampfstrategien f\u00FCr deinen aktuellen Zustand. Wir f\u00FCllen die Stripe-Kasse mit ${email} vor.`,
    upsellCta: "Vollst\u00E4ndigen Bericht freischalten \u00B7 \u20AC29",
    upsellFine:
      "Sichere Zahlung \u00FCber Stripe. Du kehrst hierher zur\u00FCck mit dem vollst\u00E4ndigen Bericht.",
    unlockedTag: "Vollst\u00E4ndiger Bericht freigeschaltet",
    unlockedTitle: "Danke",
    unlockedBody:
      "Alle drei Subskalenberichte werden jetzt oben angezeigt. Lade eine PDF-Kopie dieser Seite herunter.",
    downloadPdf: "PDF herunterladen",
    downloadFine:
      '\u00D6ffnet den Druckdialog deines Browsers \u2014 w\u00E4hle \u201EAls PDF speichern\u201C als Ziel.',
    coaching: "F\u00FCr 1:1-Coaching bewerben",
    allTests: "\u2190 Alle Tests",
  },
} as const;

// ---------------------------------------------------------------------------
// Bar color helper: INVERSE for anxiety subscales, NORMAL for confidence
// ---------------------------------------------------------------------------

function barColorForSubscale(key: CsaiSubscaleKey, band: Band): string {
  if (key === "confidence") {
    // Normal valence: high = good (emerald), low = concerning (amber)
    return band === "high"
      ? "bg-emerald-500"
      : band === "low"
        ? "bg-amber-500"
        : "bg-purple-500";
  }
  // Inverse valence for cognitive & somatic: low = good (emerald), high = concerning (amber/red)
  return band === "low"
    ? "bg-emerald-500"
    : band === "high"
      ? "bg-amber-500"
      : "bg-purple-500";
}

// ---------------------------------------------------------------------------
// Band pill color: also inverted for anxiety subscales
// ---------------------------------------------------------------------------

function bandPillColor(key: CsaiSubscaleKey, band: Band): string {
  if (key === "confidence") {
    // Normal: high = good, low = concerning
    return band === "high"
      ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
      : band === "low"
        ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
        : "border-purple-400/60 bg-purple-500/15 text-purple-200";
  }
  // Inverse for anxiety: low = good, high = concerning
  return band === "low"
    ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
    : band === "high"
      ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
      : "border-purple-400/60 bg-purple-500/15 text-purple-200";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CsaiResultsPage() {
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
              setVerifyError(
                data.error || "Payment could not be verified.",
              );
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
          alreadyUnlocked = localStorage.getItem(UNLOCK_KEY) === "1";
          if (alreadyUnlocked) setUnlocked(true);
        } catch {}

        // Silently check if admin has unlocked this result in the DB
        if (!alreadyUnlocked) {
          let resultRef = "";
          try {
            resultRef = localStorage.getItem(RESULT_REF_KEY) ?? "";
          } catch {}
          if (resultRef) {
            fetch(
              `/api/csai/check-paid?ref=${encodeURIComponent(resultRef)}`,
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
        `pfcs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    } catch {
      resultRef = `pfcs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    const url = new URL(STRIPE_PAYMENT_LINK);
    if (payload.respondent.email)
      url.searchParams.set("prefilled_email", payload.respondent.email);
    url.searchParams.set("client_reference_id", resultRef);
    window.location.href = url.toString();
  }, [payload]);

  const downloadPdf = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.print();
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#050608] pt-24 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center font-saira text-sm text-zinc-400">
          Loading&hellip;
        </div>
      </div>
    );
  }

  if (!payload) {
    const c = ui.en;
    return (
      <div className="relative min-h-screen bg-[#050608] pt-24 text-white">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.12em]">
            {c.noResults}
          </h1>
          <p className="mt-5 font-saira text-sm text-zinc-300">
            {c.noResultsBody}
          </p>
          <Link
            href="/tests/csai"
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

  // Localised text helpers
  const tParagraphs = (obj: {
    en: string[];
    hu: string[];
    de: string[];
  }): string[] => obj[lang] ?? obj.en;
  const tStr = (obj: {
    en: string;
    hu: string;
    de: string;
  }): string => obj[lang] ?? obj.en;

  // Build bar chart data
  const barData = SUBSCALE_ORDER.map((key) => {
    const sub = report.subscales.find((s) => s.key === key)!;
    const interp = SUBSCALE_INTERPRETATIONS[key];
    const cutoffs = BAND_CUTOFFS[key];
    return {
      key,
      label: tStr(interp.name),
      score: sub.score,
      min: sub.min,
      max: sub.max,
      band: sub.band,
      avg: POPULATION_AVERAGES[key],
      bandMin: cutoffs.average.min,
      bandMax: cutoffs.average.max,
    };
  });

  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 pb-20 text-white">
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

        {/* Header */}
        <div className="text-center">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300 print:hidden">
            {c.headerTag}
          </p>
          <h1 className="mt-3 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">
            {c.profileTitle(respondent.firstName)}
          </h1>
          <p className="mt-3 font-saira text-xs uppercase tracking-[0.2em] text-zinc-400">
            {c.refNorms(
              respondent.gender === "male" ? c.genderMale : c.genderFemale,
            )}{" "}
            &middot;{" "}
            {new Date(respondent.submittedAt).toLocaleDateString()}
          </p>
        </div>

        {/* State notice */}
        <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-950/10 px-5 py-3 text-center font-saira text-xs text-amber-100/70">
          {c.stateNotice}
        </div>

        {/* Bar chart -- always visible (free deliverable) */}
        <div className="mt-8 rounded-3xl border border-white/5 bg-[#0F1116] p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
              {c.chartTitle}
            </h2>
            <span className="flex items-center gap-2 font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              <span className="inline-block h-[2px] w-4 bg-zinc-400" />{" "}
              {c.popAvg}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {barData.map((d) => {
              const pct = ((d.score - d.min) / (d.max - d.min)) * 100;
              const avgPct =
                ((d.avg - d.min) / (d.max - d.min)) * 100;
              const color = barColorForSubscale(d.key, d.band);
              return (
                <div key={d.key} className="flex items-center gap-4">
                  <div className="w-40 shrink-0 text-right font-saira text-xs text-zinc-200 sm:w-56">
                    {d.label}
                  </div>
                  <div className="relative flex-1 h-7 rounded-full bg-white/5">
                    {/* Filled bar */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                    {/* Population average tick */}
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-zinc-400"
                      style={{ left: `${avgPct}%` }}
                    />
                  </div>
                  <div className="w-16 shrink-0 font-saira text-xs text-zinc-300">
                    {d.score} / {d.max}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center font-saira text-[11px] text-zinc-500">
            {c.chartFootnote}
          </p>
        </div>

        {/* Paid content */}
        {unlocked && (
          <>
            {/* Intro paragraphs */}
            <div className="mt-12 space-y-3">
              <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                {c.introTitle}
              </h2>
              {tParagraphs(CSAI_INTRO).map((p, i) => (
                <p key={i} className="font-saira text-sm text-zinc-300">
                  {p}
                </p>
              ))}
            </div>

            {/* Subscale interpretation cards */}
            <div className="mt-12 space-y-5">
              <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                {c.subscalesTitle}
              </h2>
              {SUBSCALE_ORDER.map((key) => {
                const sub = report.subscales.find((s) => s.key === key)!;
                const interp = SUBSCALE_INTERPRETATIONS[key];
                const narrative = tParagraphs(interp.bands[sub.band]);
                const cutoffs = BAND_CUTOFFS[key];
                return (
                  <div
                    key={key}
                    id={`subscale-${key}`}
                    className="rounded-2xl border border-white/5 bg-[#13151A] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.4)] sm:p-7"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="font-saira text-lg font-extrabold uppercase tracking-[0.1em]">
                        {tStr(interp.name)}
                      </h3>
                      <div className="flex items-center gap-3">
                        <CsaiBandPill
                          subscale={key}
                          band={sub.band}
                          lang={lang}
                        />
                        <span className="font-saira text-xs uppercase tracking-[0.18em] text-zinc-400">
                          {sub.score}/{sub.max} &middot; {c.typical}{" "}
                          {cutoffs.average.min}&ndash;{cutoffs.average.max}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 font-saira text-xs italic text-zinc-400">
                      {tStr(interp.definition)}
                    </p>
                    <div className="mt-4 space-y-3 font-saira text-sm text-zinc-200">
                      {narrative.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
            <p className="mt-4 font-saira text-[11px] text-zinc-500">
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
            <p className="mt-4 font-saira text-[11px] text-zinc-500">
              {c.downloadFine}
            </p>
          </div>
        )}

        <div className="mt-14 flex flex-col items-center gap-4 text-center print:hidden">
          <Link
            href="/"
            className="rounded-full border border-purple-500/50 px-7 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-purple-200 transition hover:border-purple-400 hover:text-white"
          >
            {c.coaching}
          </Link>
          <Link
            href="/tests"
            className="font-saira text-[11px] text-zinc-500 underline decoration-zinc-600 hover:text-white"
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
          <p className="font-saira text-[9px] uppercase tracking-[0.22em] text-zinc-500">
            David Sipos &mdash; Sports psychologist &middot; power-flow.eu
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 18mm 16mm 24mm;
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

          .bg-\\[\\#13151A\\],
          .bg-\\[\\#0F1116\\] {
            background: #13151a !important;
          }
          .bg-\\[\\#050608\\] {
            background: #050608 !important;
          }
          .bg-\\[\\#0D0F14\\] {
            background: #0d0f14 !important;
          }

          .rounded-2xl,
          .rounded-3xl {
            break-inside: avoid;
            box-shadow: none !important;
          }

          .rounded-full {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSAI Band pill (subscale-aware coloring)
// ---------------------------------------------------------------------------

function CsaiBandPill({
  subscale,
  band,
  lang = "en",
}: {
  subscale: CsaiSubscaleKey;
  band: Band;
  lang?: string;
}) {
  const color = bandPillColor(subscale, band);
  const labels: Record<string, Record<Band, string>> = {
    en: { high: "HIGH", average: "AVG", low: "LOW" },
    hu: { high: "MAGAS", average: "\u00C1TLAG", low: "ALACSONY" },
    de: { high: "HOCH", average: "MITTEL", low: "NIEDRIG" },
  };
  const label = (labels[lang] ?? labels.en)[band];
  return (
    <span
      className={`rounded-full border px-3 py-1 font-saira text-[10px] font-semibold uppercase tracking-[0.22em] ${color}`}
    >
      {label}
    </span>
  );
}
