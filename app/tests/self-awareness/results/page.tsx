"use client";

import React from "react";
import Link from "next/link";
import type { ScoreReport } from "../../../../lib/tests/self-awareness/scoring";
import { FACTORS, INTRO } from "../../../../lib/tests/self-awareness/interpretations";
import type { Band } from "../../../../lib/tests/self-awareness/norms";

const RESULT_KEY = "powerflow.selfAwareness.lastResult.v1";
const UNLOCK_KEY = "powerflow.selfAwareness.unlocked.v1";

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
        try {
          if (localStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
        } catch {}
      }
    }
    setHydrated(true);
  }, []);

  const openCheckout = React.useCallback(() => {
    if (!payload) return;
    const sessionId =
      `pfsa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Stripe Payment Links accept these query params:
    //   prefilled_email     — pre-fills the email field on the checkout page
    //   client_reference_id — forwarded to Stripe Checkout Session + webhooks
    const url = new URL(STRIPE_PAYMENT_LINK);
    if (payload.respondent.email)
      url.searchParams.set("prefilled_email", payload.respondent.email);
    url.searchParams.set("client_reference_id", sessionId);
    // Same-tab redirect so the Stripe success URL brings the user back here.
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

  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.14),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
            PowerFlow · Self-Awareness Profile
          </p>
          <h1 className="mt-3 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">
            {respondent.firstName}&apos;s profile
          </h1>
          <p className="mt-3 font-saira text-xs uppercase tracking-[0.2em] text-zinc-400">
            Reference norms: {respondent.gender === "male" ? "Male" : "Female"} ·{" "}
            {new Date(respondent.submittedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Validity banner */}
        {!report.validity.reliable && (
          <div className="mt-10 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 sm:p-6">
            <p className="font-saira text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              Response pattern notice
            </p>
            <p className="mt-3 font-saira text-sm text-amber-100">
              Your total &quot;yes&quot; count ({report.validity.sumYes}) falls outside
              the typical range of {report.validity.bandMin}–{report.validity.bandMax}.
              This suggests a tendency to agree (or disagree) with most items,
              which reduces the accuracy of the composite scores. Consider retaking
              the test with more discrimination between items, or use this profile
              as a rough sketch rather than a precise reading.
            </p>
          </div>
        )}

        {/* Radar chart — always visible (the free deliverable) */}
        <div className="mt-10">
          <RadarChart
            data={report.factors.map((f) => ({
              label: f.factor,
              value: f.rawScore,
              max: f.max,
              average: f.populationAverage,
            }))}
            onLabelClick={unlocked ? (label) => {
              document.getElementById(`factor-${label}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            } : undefined}
          />
        </div>

        {/* Everything below is paid content */}
        {unlocked && (
          <>
            {/* Intro */}
            <div className="mt-12 space-y-3 font-saira text-sm text-zinc-300">
              {INTRO.en.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Factor cards */}
            <div className="mt-12 space-y-5">
              <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                Your eleven drives
              </h2>
              {report.factors.map((f) => {
                const interp = FACTORS[f.factor];
                const narrative = interp.bands[f.band].en;
                return (
                  <div
                    key={f.factor}
                    id={`factor-${f.factor}`}
                    className="rounded-2xl border border-white/5 bg-[#13151A] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.4)] sm:p-7"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="font-saira text-lg font-extrabold uppercase tracking-[0.1em]">
                        {f.factor}
                      </h3>
                      <div className="flex items-center gap-3">
                        <BandPill band={f.band} />
                        <span className="font-saira text-xs uppercase tracking-[0.18em] text-zinc-400">
                          {f.rawScore}/{f.max} · typical {f.bandMin}–{f.bandMax}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 font-saira text-xs italic text-zinc-400">
                      {interp.definition.en}
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

            {/* Subfactors */}
            <div className="mt-12">
              <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                Composite dynamics
              </h2>
              <p className="mt-2 font-saira text-xs text-zinc-400">
                Weighted combinations of the eleven core drives. Useful for spotting
                interactions between motivations that are not obvious from single scores.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {report.subfactors.map((s) => (
                  <div
                    key={s.subfactor}
                    className="rounded-2xl border border-white/5 bg-[#13151A] p-5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-saira text-xs font-semibold uppercase tracking-[0.18em]">
                        {s.subfactor}
                      </span>
                      <BandPill band={s.band} />
                    </div>
                    <div className="mt-2 font-saira text-xs text-zinc-400">
                      Score {s.score} · typical {s.bandMin}–{s.bandMax}
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
            Verifying your payment with Stripe…
          </div>
        )}
        {verifyError && !unlocked && (
          <div className="mt-14 rounded-2xl border border-red-500/40 bg-red-950/20 p-5 text-center font-saira text-sm text-red-200 print:hidden">
            {verifyError} If you completed payment, please contact{" "}
            <a
              href="mailto:david@power-flow.eu"
              className="underline decoration-red-400 hover:text-white"
            >
              david@power-flow.eu
            </a>
            {" "}with your Stripe receipt.
          </div>
        )}

        {/* Upsell / unlocked banner */}
        {!unlocked ? (
          <div className="mt-14 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-fuchsia-500/10 to-transparent p-8 text-center shadow-[0_22px_60px_rgba(126,34,206,0.18)] print:hidden">
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-200/90">
              Your full report
            </p>
            <h2 className="mt-3 font-saira text-2xl font-extrabold uppercase tracking-[0.1em]">
              Unlock your written report
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-saira text-sm text-zinc-300">
              The chart above is a snapshot — the report explains what each of
              your eleven drives means for you, how they combine, and where the
              tensions are. Includes all eleven factor narratives, the six
              composite subfactor scores, and a downloadable PDF. We&apos;ll
              pre-fill the Stripe checkout with{" "}
              <span className="text-zinc-100">{respondent.email}</span>.
            </p>
            <button
              type="button"
              onClick={openCheckout}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
            >
              Unlock full report · €29
            </button>
            <p className="mt-4 font-saira text-[11px] text-zinc-500">
              Secure payment via Stripe. You&apos;ll return here with the full
              narrative unlocked.
            </p>
          </div>
        ) : (
          <div className="mt-14 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-transparent p-8 text-center shadow-[0_22px_60px_rgba(16,185,129,0.18)] print:hidden">
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
              Full report unlocked
            </p>
            <h2 className="mt-3 font-saira text-2xl font-extrabold uppercase tracking-[0.1em]">
              Thank you
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-saira text-sm text-zinc-300">
              All eleven factor narratives are now shown above. Download a PDF
              copy of this page to keep.
            </p>
            <button
              type="button"
              onClick={downloadPdf}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-emerald-400"
            >
              Download PDF
            </button>
            <p className="mt-4 font-saira text-[11px] text-zinc-500">
              Opens your browser print dialog — choose &quot;Save as PDF&quot; as
              the destination.
            </p>
          </div>
        )}

        <div className="mt-14 flex flex-col items-center gap-4 text-center print:hidden">
          <Link
            href="/"
            className="rounded-full border border-purple-500/50 px-7 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-purple-200 transition hover:border-purple-400 hover:text-white"
          >
            Apply for 1:1 coaching
          </Link>
          <Link href="/tests" className="font-saira text-[11px] text-zinc-500 underline decoration-zinc-600 hover:text-white">
            ← All tests
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 18mm;
            size: A4;
          }
          html,
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          /* Drop decorative fixed backgrounds */
          .pointer-events-none.fixed,
          .fixed.inset-0 {
            display: none !important;
          }
          /* Flatten dark panels to a printable look */
          .bg-\\[\\#050608\\],
          .bg-\\[\\#0F1116\\],
          .bg-\\[\\#13151A\\] {
            background: #ffffff !important;
          }
          .text-white,
          .text-zinc-100,
          .text-zinc-200,
          .text-zinc-300,
          .text-zinc-400,
          .text-zinc-500 {
            color: #111111 !important;
          }
          .text-purple-200,
          .text-purple-300,
          .text-fuchsia-200,
          .text-sky-200,
          .text-amber-100,
          .text-amber-300 {
            color: #4b0082 !important;
          }
          .border-white\\/5,
          .border-purple-500\\/25,
          .border-purple-500\\/30 {
            border-color: #cccccc !important;
          }
          /* Preserve the radar chart colours */
          svg polygon,
          svg circle,
          svg line {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Don't split a factor card across pages if avoidable */
          main section,
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

function BandPill({ band }: { band: Band }) {
  const color =
    band === "high"
      ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200"
      : band === "low"
      ? "border-sky-400/60 bg-sky-500/15 text-sky-200"
      : "border-zinc-500/60 bg-zinc-500/10 text-zinc-200";
  const label = band === "average" ? "AVG" : band.toUpperCase();
  return (
    <span
      className={`rounded-full border px-3 py-1 font-saira text-[10px] font-semibold uppercase tracking-[0.22em] ${color}`}
    >
      {label}
    </span>
  );
}

/* --- Radar chart (inline SVG, no deps) ------------------------------------ */

type RadarDatum = { label: string; value: number; max: number; average: number };

function RadarChart({ data, onLabelClick }: { data: RadarDatum[]; onLabelClick?: (label: string) => void }) {
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
          Your profile at a glance
        </h2>
        <div className="flex items-center gap-4 font-saira text-[11px] uppercase tracking-[0.18em]">
          <span className="inline-flex items-center gap-2 text-purple-200">
            <span className="inline-block h-2 w-4 rounded-full bg-purple-400" /> You
          </span>
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <span className="inline-block h-2 w-4 rounded-full border border-zinc-500" /> Population avg
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
                onClick={clickable ? () => onLabelClick(d.label) : undefined}
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
        Each axis shows your raw score out of 15 compared to the{" "}
        {/* show gender note in caller context if desired */}
        population average for your reference group.
      </p>
    </div>
  );
}

