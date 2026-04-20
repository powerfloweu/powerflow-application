"use client";

import React from "react";
import Link from "next/link";
import type { ScoreReport } from "../../../../lib/tests/self-awareness/scoring";
import { FACTORS, INTRO } from "../../../../lib/tests/self-awareness/interpretations";
import type { Band } from "../../../../lib/tests/self-awareness/norms";

const RESULT_KEY = "powerflow.selfAwareness.lastResult.v1";
const UNLOCK_KEY = "powerflow.selfAwareness.unlocked.v1";
const RESULT_REF_KEY = "powerflow.selfAwareness.resultRef.v1";

// Stripe Payment Link for the Self-Awareness full report (€29).
// Configure the success URL in the Stripe Dashboard to:
//   {origin}/tests/self-awareness/results?unlocked=true
// so the buyer returns here in the unlocked state.
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/eVq9ASdD16Go4kA1LfdfG0q";

type Respondent = {
  firstName: string;
  email: string;
  gender: "male" | "female";
  lang: "en" | "hu";
  startedAt: string;
  submittedAt: string;
};

type StoredPayload = { report: ScoreReport; respondent: Respondent };

export default function ResultsPage() {
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

    // Verify a Stripe Checkout Session server-side before unlocking.
    // Stripe's Payment Link success URL should include {CHECKOUT_SESSION_ID}
    // (configured in the Stripe dashboard), which becomes ?session_id=cs_...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (sessionId && sessionId.startsWith("cs_")) {
        setVerifying(true);
        fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`)
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
            // Strip session_id from the URL so reload doesn't re-verify
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
          try { resultRef = localStorage.getItem(RESULT_REF_KEY) ?? ""; } catch {}
          if (resultRef) {
            fetch(`/api/sat/check-paid?ref=${encodeURIComponent(resultRef)}`)
              .then((r) => r.json())
              .then((data: { paid: boolean }) => {
                if (data.paid) {
                  try { localStorage.setItem(UNLOCK_KEY, "1"); } catch {}
                  setUnlocked(true);
                }
              })
              .catch(() => {/* non-fatal */});
          }
        }
      }
    }
    setHydrated(true);
  }, []);

  const openCheckout = React.useCallback(() => {
    if (!payload) return;
    // Stripe Payment Links accept these query params:
    //   prefilled_email     — pre-fills the email field on the checkout page
    //   client_reference_id — forwarded to Stripe Checkout Session + webhooks
    let resultRef: string;
    try { resultRef = localStorage.getItem(RESULT_REF_KEY) ?? `pfsa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; } catch { resultRef = `pfsa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
    const url = new URL(STRIPE_PAYMENT_LINK);
    if (payload.respondent.email)
      url.searchParams.set("prefilled_email", payload.respondent.email);
    url.searchParams.set("client_reference_id", resultRef);
    // Same-tab redirect so the Stripe success URL brings the user back here.
    window.location.href = url.toString();
  }, [payload]);

  const downloadPdf = React.useCallback(() => {
    if (typeof window === "undefined") return;
    // Clear the document title so the browser doesn't print it in the PDF header
    const prev = document.title;
    document.title = "";
    window.print();
    setTimeout(() => { document.title = prev; }, 1500);
  }, []);


  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#050608] pt-24 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center font-saira text-sm text-zinc-400">
          Loading…
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="relative min-h-screen bg-[#050608] pt-24 text-white">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.12em]">
            No results yet
          </h1>
          <p className="mt-5 font-saira text-sm text-zinc-300">
            You haven&apos;t completed a test on this device. Start the Self-Awareness
            Test to see your profile.
          </p>
          <Link
            href="/tests/self-awareness"
            className="mt-8 inline-block rounded-full bg-purple-500 px-7 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
          >
            Start the test
          </Link>
        </div>
      </div>
    );
  }

  const { report, respondent } = payload;
  const lang = respondent.lang ?? "en";
  // Helper: pick the localised string, fall back to English
  const t = <T extends { en: string[] }>(obj: T): string[] =>
    ((obj as Record<string, string[]>)[lang] ?? obj.en);
  const tStr = <T extends { en: string }>(obj: T): string =>
    ((obj as Record<string, string>)[lang] ?? obj.en);

  const ui = {
    en: {
      headerTag: "PowerFlow · Self-Awareness Profile",
      printDocTitle: "Self-Assessment Test",
      profileTitle: (name: string) => `${name}'s profile`,
      refNorms: (g: string) => `Reference norms: ${g}`,
      genderMale: "Male", genderFemale: "Female",
      validityNotice: "Response pattern notice",
      validityBody: (sum: number, min: number, max: number) =>
        `Your total "yes" count (${sum}) falls outside the typical range of ${min}–${max}. This suggests a tendency to agree (or disagree) with most items, which reduces the accuracy of the composite scores. Consider retaking the test with more discrimination between items, or use this profile as a rough sketch rather than a precise reading.`,
      radarTitle: "Your profile at a glance",
      radarYou: "You", radarAvg: "Population avg",
      radarFootnote: "Each axis shows your raw score out of 15 compared to the population average for your reference group.",
      drivesTitle: "Your eleven drives",
      typical: "typical",
      compositesTitle: "Composite dynamics",
      compositesBody: "Weighted combinations of the eleven core drives. Useful for spotting interactions between motivations that are not obvious from single scores.",
      score: "Score",
      verifying: "Verifying your payment with Stripe…",
      verifyErrorSuffix: "If you completed payment, please contact",
      verifyErrorSuffix2: "with your Stripe receipt.",
      upsellTag: "Your full report",
      upsellTitle: "Unlock your written report",
      upsellBody: (email: string) => `The chart above is a snapshot — the report explains what each of your eleven drives means for you, how they combine, and where the tensions are. Includes all eleven factor narratives, the six composite subfactor scores, and a downloadable PDF. We'll pre-fill the Stripe checkout with ${email}.`,
      upsellCta: "Unlock full report · €29",
      upsellFine: "Secure payment via Stripe. You'll return here with the full narrative unlocked.",
      unlockedTag: "Full report unlocked",
      unlockedTitle: "Thank you",
      unlockedBody: "All eleven factor narratives are now shown above. Download a PDF copy of this page to keep.",
      downloadPdf: "Download PDF",
      downloadFine: `Opens your browser print dialog — choose "Save as PDF" as the destination.`,
      coaching: "Apply for 1:1 coaching",
      allTests: "← All tests",
    },
    hu: {
      headerTag: "PowerFlow · Önismereti Profil",
      printDocTitle: "Önismereti Teszt",
      profileTitle: (name: string) => `${name} profilja`,
      refNorms: (g: string) => `Referencianormák: ${g}`,
      genderMale: "Férfi", genderFemale: "Nő",
      validityNotice: "Válaszminta megjegyzés",
      validityBody: (sum: number, min: number, max: number) =>
        `Az „igen" válaszaid száma (${sum}) kívül esik a tipikus ${min}–${max} tartományon. Ez arra utalhat, hogy a legtöbb állítással hajlamos voltál egyetérteni (vagy egyet nem érteni), ami csökkenti az összesített pontszámok pontosságát. Érdemes lehet megismételni a tesztet körültekintőbb válaszadással, vagy ezt a profilt inkább hozzávetőleges képként kezelni.`,
      radarTitle: "Profilod egy pillantással",
      radarYou: "Te", radarAvg: "Populáció átlag",
      radarFootnote: "Minden tengely a nyers pontszámodat mutatja 15-ből, összehasonlítva a referenciaadat populáció átlagával.",
      drivesTitle: "Tizenegy hajtóerőd",
      typical: "tipikus",
      compositesTitle: "Összetett dinamikák",
      compositesBody: "A tizenegy alapvető hajtóerő súlyozott kombinációi. Hasznos az egyes pontszámokból nem nyilvánvaló motivációs összefüggések felismeréséhez.",
      score: "Pontszám",
      verifying: "Stripe fizetés ellenőrzése…",
      verifyErrorSuffix: "Ha elvégezted a fizetést, kérjük vedd fel a kapcsolatot a következő e-mail-en:",
      verifyErrorSuffix2: "a Stripe nyugtáddal.",
      upsellTag: "Teljes riportod",
      upsellTitle: "Oldd fel az írásos riportot",
      upsellBody: (email: string) => `A fenti ábra egy pillanatkép – a riport elmagyarázza, mit jelent számodra mindegyik hajtóerő, hogyan kapcsolódnak egymáshoz, és hol vannak a feszültségpontok. Tartalmazza mind a tizenegy faktor narratíváját, a hat összetett alpontszámot és egy letölthető PDF-et. A Stripe fizetést ezzel az e-mail-lel töltjük elő: ${email}.`,
      upsellCta: "Riport feloldása · €29",
      upsellFine: "Biztonságos fizetés Stripe-on keresztül. A teljes narratívával visszatérhetsz ide.",
      unlockedTag: "Teljes riport feloldva",
      unlockedTitle: "Köszönjük",
      unlockedBody: "A tizenegy faktor narratívája most már látható fent. Töltsd le PDF-ként az oldalról.",
      downloadPdf: "PDF letöltése",
      downloadFine: `Megnyílik a böngésző nyomtatási ablaka – válaszd a „Mentés PDF-ként" lehetőséget.`,
      coaching: "Jelentkezés sportpszichológiai konzultációra",
      allTests: "← Összes teszt",
    },
  };
  const c = lang === "hu" ? ui.hu : ui.en;

  // Factor name localisation
  const FACTOR_HU: Record<string, string> = {
    Performance: "Teljesítmény", Affiliation: "Affiliáció", Aggression: "Agresszió",
    Defensiveness: "Védekezés", Consciousness: "Lelkiismeret", Dominance: "Dominancia",
    Exhibition: "Exhibíció", Autonomy: "Autonómia", Caregiving: "Gondoskodás",
    Order: "Rend", Helplessness: "Segítségkérés",
  };
  const factorLabel = (name: string) => lang === "hu" ? (FACTOR_HU[name] ?? name) : name;

  // Subfactor name localisation
  const SUBFACTOR_HU: Record<string, string> = {
    "Self-confirmation": "Önmegerősítés",
    "Rational dominance": "Racionális dominancia",
    "Aggressive nonconformity": "Agresszív nonkonformitás",
    "Passive dependence": "Passzív dependencia",
    "Sociability": "Szociabilitás",
    "Agreeableness": "Megegyezési igény",
  };
  const subfactorLabel = (name: string) => lang === "hu" ? (SUBFACTOR_HU[name] ?? name) : name;

  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.14),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Print-only branded header ─────────────────────────────────────── */}
        <div className="hidden print:flex items-center justify-between pb-7 mb-8 border-b border-purple-500/30">
          {/* Left: logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fm_powerflow_logo_verziok_01_negative.png"
            alt="PowerFlow"
            style={{ height: "36px", width: "auto" }}
          />
          {/* Right: document identity */}
          <div className="text-right">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-300">
              {c.printDocTitle}
            </p>
            <p className="mt-1 font-saira text-[11px] text-zinc-400">
              David Sipos — Sports psychologist
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
              {respondent.gender === "male" ? c.genderMale : c.genderFemale}
            </span>
            <span className="text-zinc-600">&middot;</span>
            <span className="font-saira text-[11px] uppercase tracking-[0.22em] text-zinc-400">
              {new Date(respondent.submittedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="relative mt-6 flex items-center gap-4 border-t border-white/5 pt-5">
            <div>
              <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {lang === "en" ? "Factors profiled" : "Feltárt tényezők"}
              </p>
              <p className="mt-1 font-saira text-2xl font-extrabold tabular-nums text-white">
                11
              </p>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div>
              <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {c.refNorms(respondent.gender === "male" ? c.genderMale : c.genderFemale)}
              </p>
              <p className="mt-1 font-saira text-sm font-semibold text-zinc-300">
                {lang === "en" ? "Sports psychology norms" : lang === "hu" ? "Sportpszichológiai normák" : "Sportpsychologie-Normen"}
              </p>
            </div>
          </div>
        </div>

        {/* Validity banner */}
        {!report.validity.reliable && (
          <div className="mt-10 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 sm:p-6">
            <p className="font-saira text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              {c.validityNotice}
            </p>
            <p className="mt-3 font-saira text-sm text-amber-100">
              {c.validityBody(report.validity.sumYes, report.validity.bandMin, report.validity.bandMax)}
            </p>
          </div>
        )}

        {/* Radar chart — always visible (the free deliverable) */}
        <div className="mt-10">
          <RadarChart
            data={report.factors.map((f) => ({
              label: factorLabel(f.factor),
              factorKey: f.factor,
              value: f.rawScore,
              max: f.max,
              average: f.populationAverage,
            }))}
            radarTitle={c.radarTitle}
            radarYou={c.radarYou}
            radarAvg={c.radarAvg}
            radarFootnote={c.radarFootnote}
            onLabelClick={unlocked ? (factorKey) => {
              document.getElementById(`factor-${factorKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            } : undefined}
          />
        </div>

        {/* Everything below is paid content */}
        {unlocked && (
          <>
            {/* Intro */}
            <div className="mt-12 space-y-3 font-saira text-sm text-zinc-300">
              {t(INTRO).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Factor cards */}
            <div className="mt-12 space-y-5">
              <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                {c.drivesTitle}
              </h2>
              {report.factors.map((f) => {
                const interp = FACTORS[f.factor];
                const narrative = t(interp.bands[f.band]);
                const scorePct = (f.rawScore / f.max) * 100;
                const accentGradient =
                  f.band === "high"
                    ? "from-fuchsia-500 to-fuchsia-400"
                    : f.band === "low"
                      ? "from-sky-500 to-sky-400"
                      : "from-zinc-600 to-zinc-500";
                const cardBorder =
                  f.band === "high"
                    ? "border-fuchsia-500/20"
                    : f.band === "low"
                      ? "border-sky-500/20"
                      : "border-white/5";
                const cardBg =
                  f.band === "high"
                    ? "from-fuchsia-950/25 via-[#0F1116] to-[#0F1116]"
                    : f.band === "low"
                      ? "from-sky-950/25 via-[#0F1116] to-[#0F1116]"
                      : "from-zinc-900/20 via-[#0F1116] to-[#0F1116]";
                return (
                  <div
                    key={f.factor}
                    id={`factor-${f.factor}`}
                    className={`overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(0,0,0,0.4)] bg-gradient-to-br ${cardBorder} ${cardBg}`}
                  >
                    <div className={`h-[3px] w-full bg-gradient-to-r ${accentGradient}`} />
                    <div className="p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-saira text-lg font-extrabold uppercase tracking-[0.1em]">
                            {factorLabel(f.factor)}
                          </h3>
                          <p className="mt-1.5 font-saira text-xs italic text-zinc-400">
                            {tStr(interp.definition)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-saira text-2xl font-extrabold tabular-nums leading-none text-white">
                            {f.rawScore}
                            <span className="text-sm font-normal text-zinc-500">/{f.max}</span>
                          </div>
                          <div className="mt-1.5">
                            <BandPill band={f.band} lang={lang} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${accentGradient} transition-all duration-700`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between font-saira text-[9px] text-zinc-600">
                        <span>0</span>
                        <span>{c.typical} {f.bandMin}–{f.bandMax}</span>
                        <span>{f.max}</span>
                      </div>
                      <div className="mt-5 space-y-3 font-saira text-sm leading-relaxed text-zinc-200">
                        {narrative.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subfactors */}
            <div className="mt-12">
              <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                {c.compositesTitle}
              </h2>
              <p className="mt-2 font-saira text-xs text-zinc-400">
                {c.compositesBody}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {report.subfactors.map((s) => (
                  <div
                    key={s.subfactor}
                    className="rounded-2xl border border-white/5 bg-[#0F1116] p-5 transition hover:border-purple-500/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
                        {subfactorLabel(s.subfactor)}
                      </span>
                      <BandPill band={s.band} lang={lang} />
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          s.band === "high"
                            ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-400"
                            : s.band === "low"
                              ? "bg-gradient-to-r from-sky-600 to-sky-400"
                              : "bg-gradient-to-r from-zinc-600 to-zinc-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, ((s.score - s.bandMin * 0.5) / (s.bandMax * 1.5 - s.bandMin * 0.5)) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="mt-2 font-saira text-xs text-zinc-400">
                      {c.score} <span className="font-semibold text-zinc-200">{s.score}</span>
                      <span className="text-zinc-600 mx-1">·</span>
                      <span className="text-zinc-500">{c.typical} {s.bandMin}–{s.bandMax}</span>
                    </div>
                  </div>
                ))}
              </div>
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
            </a>
            {" "}{c.verifyErrorSuffix2}
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
          <Link href="/tests" className="font-saira text-[11px] text-zinc-500 underline decoration-zinc-600 hover:text-white">
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
            David Sipos — Sports psychologist · power-flow.eu
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }

          /* Force background colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Keep the dark theme */
          html, body {
            background: #050608 !important;
            color: #ffffff !important;
          }

          /* Hide screen-only elements */
          header, nav, .print\\:hidden {
            display: none !important;
          }

          /* Show print-only elements */
          .hidden.print\\:flex,
          .hidden.print\\:block {
            display: flex !important;
          }

          /* Kill fixed gradient overlay (already hidden via print:hidden class) */
          .pointer-events-none.fixed {
            display: none !important;
          }

          /* Remove top padding that was for the nav */
          .pt-24 {
            padding-top: 0 !important;
          }

          /* Factor cards — dark background kept */
          .bg-\\[\\#13151A\\], .bg-\\[\\#0F1116\\] {
            background: #13151A !important;
          }
          .bg-\\[\\#050608\\] {
            background: #050608 !important;
          }
          .bg-\\[\\#0D0F14\\] {
            background: #0D0F14 !important;
          }

          /* Don't split factor cards across pages */
          .rounded-2xl, .rounded-3xl {
            break-inside: avoid;
            box-shadow: none !important;
          }

          /* Keep SVG chart colors */
          svg polygon, svg circle, svg line, svg text {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Band pills */
          .rounded-full {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

function BandPill({ band, lang = "en" }: { band: Band; lang?: string }) {
  const color =
    band === "high"
      ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200"
      : band === "low"
      ? "border-sky-400/60 bg-sky-500/15 text-sky-200"
      : "border-zinc-500/60 bg-zinc-500/10 text-zinc-200";
  const labels: Record<string, Record<Band, string>> = {
    en: { high: "HIGH", average: "AVG", low: "LOW" },
    hu: { high: "MAGAS", average: "ÁTLAG", low: "ALACSONY" },
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

/* --- Radar chart (inline SVG, no deps) ------------------------------------ */

type RadarDatum = { label: string; factorKey: string; value: number; max: number; average: number };

function RadarChart({ data, onLabelClick, radarTitle, radarYou, radarAvg, radarFootnote }: {
  data: RadarDatum[];
  onLabelClick?: (factorKey: string) => void;
  radarTitle: string;
  radarYou: string;
  radarAvg: string;
  radarFootnote: string;
}) {
  const size = 480;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 80;
  const n = data.length;

  // angle for axis i (start at top, go clockwise)
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

  const point = (i: number, v: number, vmax: number) => {
    const a = angle(i);
    const rr = (v / vmax) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  };

  const valuePolyline = data
    .map((d, i) => point(i, d.value, d.max))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const averagePolyline = data
    .map((d, i) => point(i, d.average, d.max))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-3xl border border-white/5 bg-[#0F1116] p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
          {radarTitle}
        </h2>
        <div className="flex items-center gap-4 font-saira text-[11px] uppercase tracking-[0.18em]">
          <span className="inline-flex items-center gap-2 text-purple-200">
            <span className="inline-block h-2 w-4 rounded-full bg-purple-400" /> {radarYou}
          </span>
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <span className="inline-block h-2 w-4 rounded-full border border-zinc-500" /> {radarAvg}
          </span>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <svg viewBox={`-70 -20 ${size + 140} ${size + 30}`} overflow="visible" className="w-full max-w-[540px]">
          {/* Grid rings */}
          {gridLevels.map((lv, i) => (
            <polygon
              key={i}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              points={data
                .map((_, j) => {
                  const a = angle(j);
                  const rr = lv * r;
                  return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
                })
                .join(" ")}
            />
          ))}
          {/* Axes */}
          {data.map((_, i) => {
            const [x, y] = point(i, 1, 1);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
            );
          })}
          {/* Population average polygon */}
          <polygon
            points={averagePolyline}
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(180,180,180,0.55)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          {/* User polygon */}
          <polygon
            points={valuePolyline}
            fill="rgba(168,85,247,0.28)"
            stroke="rgb(192,132,252)"
            strokeWidth={2}
          />
          {/* User points */}
          {data.map((d, i) => {
            const [x, y] = point(i, d.value, d.max);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3.5}
                fill="rgb(216,180,254)"
                stroke="rgb(126,34,206)"
                strokeWidth={1}
              />
            );
          })}
          {/* Labels */}
          {data.map((d, i) => {
            const a = angle(i);
            const lx = cx + (r + 38) * Math.cos(a);
            const ly = cy + (r + 38) * Math.sin(a);
            // Break long labels onto two lines where helpful
            const parts = d.label.split(/(?=[A-Z])/);
            const anchor =
              Math.cos(a) > 0.3 ? "start" : Math.cos(a) < -0.3 ? "end" : "middle";
            const clickable = !!onLabelClick;
            return (
              <text
                key={i}
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="font-saira"
                fontSize={14}
                fill={clickable ? "rgba(216,180,254,0.95)" : "rgba(228,228,231,0.9)"}
                style={clickable ? { cursor: "pointer" } : undefined}
                onClick={clickable ? () => onLabelClick(d.factorKey) : undefined}
              >
                {parts.length > 1 && d.label.length > 10 ? (
                  <>
                    <tspan x={lx} dy="-0.5em">
                      {parts[0]}
                    </tspan>
                    <tspan x={lx} dy="1.2em">
                      {parts.slice(1).join("")}
                    </tspan>
                  </>
                ) : (
                  d.label
                )}
              </text>
            );
          })}
          {/* Centre dot */}
          <circle cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.3)" />
        </svg>
      </div>
      <p className="mt-4 text-center font-saira text-[11px] text-zinc-500">
        {radarFootnote}
      </p>
    </div>
  );
}

