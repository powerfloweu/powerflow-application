"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Pricing tiers ────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: "opener",
    name: "Opener",
    tag: "Free",
    features: [
      "Daily training journal & log",
      "Weekly & monthly check-ins",
      "Relaxation audio (PMR · Autogenic Training)",
      "Coach visibility — connect to your coach",
    ],
  },
  {
    id: "second",
    name: "Second",
    tag: "Tools",
    highlight: true,
    features: [
      "Everything in Opener",
      "Guided visualization scripts (squat · bench · deadlift)",
      "All 4 validated mental performance tests",
      "Affirmations · Activation · Full audio library",
    ],
  },
  {
    id: "pr",
    name: "PR",
    tag: "All-access",
    features: [
      "Everything in Second",
      "16-week mental performance course",
      "AI coaching chat — knows your full history",
      "Personalized course plan · meet day prep",
    ],
  },
] as const;

// ─── Theme helper ─────────────────────────────────────────────────────────────

function tc(d: boolean, dark: string, light: string) { return d ? dark : light; }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoLanding() {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  return (
    <div className={`min-h-screen font-saira flex flex-col ${tc(d,"bg-[#0A0A0A] text-white","bg-gray-50 text-gray-900")}`}>
      {/* Background glow — dark only */}
      {d && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.12),transparent_60%)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-5 py-14 sm:py-20 max-w-xl mx-auto w-full">

        {/* Logo + theme toggle */}
        <div className="flex items-center gap-3 mb-10 w-full justify-center relative">
          <Image
            src="/fm_powerflow_logo_verziok_01_negative.png"
            alt="PowerFlow" width={36} height={36}
            className="h-9 w-9"
            style={d ? {} : { filter: "invert(1)", opacity: 0.7 }}
          />
          <span className={`text-xs font-bold uppercase tracking-[0.28em] ${tc(d,"text-violet-200/90","text-violet-700")}`}>PowerFlow</span>
          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(x => !x)}
            title={d ? "Light mode" : "Dark mode"}
            className={`absolute right-0 text-base leading-none px-2 py-1 rounded-lg transition ${tc(d,"text-zinc-400 hover:text-zinc-100","text-gray-400 hover:text-gray-700")}`}
          >
            {d ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Hero */}
        <h1 className={`text-center text-3xl sm:text-4xl font-extrabold uppercase tracking-tight leading-tight mb-3 ${tc(d,"text-white","text-gray-900")}`}>
          Mental Performance<br />Infrastructure
        </h1>
        <p className={`text-center text-sm leading-relaxed max-w-sm mb-12 ${tc(d,"text-zinc-400","text-gray-500")}`}>
          Built for strength athletes. Used daily. Visible to coaches.
        </p>

        {/* Two paths */}
        <div className="w-full space-y-4 mb-14">
          {/* Coach */}
          <Link href="/demo/coach" className={`group block rounded-2xl border transition-all p-6 ${tc(d,"border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40","border-violet-200 bg-violet-50 hover:bg-violet-100 hover:border-violet-300")}`}>
            <div className="flex items-start justify-between mb-4">
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tc(d,"text-violet-400","text-violet-600")}`}>For coaches</p>
              <span className={`text-lg group-hover:translate-x-1 transition-transform ${tc(d,"text-violet-400","text-violet-600")}`}>→</span>
            </div>
            <h2 className={`text-lg font-extrabold uppercase tracking-tight mb-3 ${tc(d,"text-white","text-gray-900")}`}>Why would I use this as a coach?</h2>
            <ul className="space-y-1.5 mb-4">
              {[
                "See every athlete's mental state in real time",
                "Activity feed: journals, training logs & check-ins in one place",
                "Assign all 4 validated mental performance tests",
                "AI speaks in your voice, reads every athlete's data",
                "Flag anxiety, perfectionism & confidence patterns early",
              ].map(item => (
                <li key={item} className={`flex items-start gap-2 text-xs ${tc(d,"text-zinc-300","text-gray-600")}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${tc(d,"text-violet-400","text-violet-600")}`}>·</span>{item}
                </li>
              ))}
            </ul>
            <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${tc(d,"bg-violet-500/15 border-violet-500/30 text-violet-300 group-hover:bg-violet-500/25","bg-violet-100 border-violet-200 text-violet-700 group-hover:bg-violet-200")}`}>
              See the Coach Experience →
            </div>
          </Link>

          {/* Athlete */}
          <Link href="/demo/athlete" className={`group block rounded-2xl border transition-all p-6 ${tc(d,"border-violet-400/20 bg-violet-400/[0.04] hover:bg-violet-400/[0.08] hover:border-violet-400/35","border-violet-200 bg-white hover:bg-violet-50 hover:border-violet-300")}`}>
            <div className="flex items-start justify-between mb-4">
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tc(d,"text-violet-300","text-violet-600")}`}>For athletes</p>
              <span className={`text-lg group-hover:translate-x-1 transition-transform ${tc(d,"text-violet-300","text-violet-600")}`}>→</span>
            </div>
            <h2 className={`text-lg font-extrabold uppercase tracking-tight mb-3 ${tc(d,"text-white","text-gray-900")}`}>Why would I use this as an athlete?</h2>
            <ul className="space-y-1.5 mb-4">
              {[
                "Build a daily mental training routine in 3–5 minutes",
                "AI coach available 24/7, knows your full training history",
                "16-week structured mental performance course",
                "Guided visualization: squat, bench, deadlift & meet day",
                "Track mood, readiness, sleep & energy across your prep",
              ].map(item => (
                <li key={item} className={`flex items-start gap-2 text-xs ${tc(d,"text-zinc-300","text-gray-600")}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${tc(d,"text-violet-300","text-violet-500")}`}>·</span>{item}
                </li>
              ))}
            </ul>
            <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${tc(d,"bg-violet-400/10 border-violet-400/25 text-violet-200 group-hover:bg-violet-400/20","bg-violet-50 border-violet-200 text-violet-700 group-hover:bg-violet-100")}`}>
              See the Athlete Experience →
            </div>
          </Link>
        </div>

        {/* Pricing */}
        <div className="w-full">
          <p className={`text-center text-[10px] font-bold uppercase tracking-[0.28em] mb-5 ${tc(d,"text-zinc-500","text-gray-400")}`}>Three tiers · one journey</p>
          <div className="space-y-3">
            {TIERS.map(tier => (
              <div key={tier.id} className={`rounded-2xl border p-5 ${
                tier.id === "second"
                  ? tc(d,"border-violet-500/35 bg-violet-500/[0.08]","border-violet-300 bg-violet-50")
                  : tier.id === "pr"
                    ? tc(d,"border-white/15 bg-white/[0.03]","border-gray-200 bg-white")
                    : tc(d,"border-white/8 bg-white/[0.02]","border-gray-100 bg-white")
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className={`font-saira text-base font-extrabold uppercase tracking-tight ${
                      tier.id === "second" ? tc(d,"text-violet-200","text-violet-800")
                      : tier.id === "pr"   ? tc(d,"text-white","text-gray-900")
                                           : tc(d,"text-white","text-gray-700")
                    }`}>{tier.name}</p>
                    <span className={`rounded-full border px-2.5 py-0.5 font-saira text-[9px] font-bold uppercase tracking-wider ${
                      tier.id === "second" ? tc(d,"border-violet-500/35 bg-violet-500/15 text-violet-300","border-violet-300 bg-violet-100 text-violet-700")
                      : tier.id === "pr"   ? tc(d,"border-white/15 bg-white/[0.07] text-zinc-200","border-gray-300 bg-gray-100 text-gray-600")
                                           : tc(d,"border-white/10 bg-white/[0.04] text-zinc-400","border-gray-200 bg-gray-50 text-gray-500")
                    }`}>{tier.tag}</span>
                  </div>
                  {tier.id === "second" && (
                    <span className={`font-saira text-[9px] uppercase tracking-widest rounded-full px-2.5 py-1 border ${tc(d,"text-violet-400 border-violet-500/30","text-violet-600 border-violet-300")}`}>Most popular</span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {tier.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-xs ${tc(d,"text-zinc-400","text-gray-600")}`}>
                      <span className={`mt-0.5 flex-shrink-0 text-[10px] ${
                        tier.id === "second" ? tc(d,"text-violet-400","text-violet-600")
                        : tier.id === "pr"   ? tc(d,"text-zinc-300","text-gray-500")
                                             : tc(d,"text-zinc-500","text-gray-400")
                      }`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className={`text-center text-[10px] mt-4 ${tc(d,"text-zinc-600","text-gray-400")}`}>Pricing available on request · coach team licences available</p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-1">
          <p className={`text-xs ${tc(d,"text-zinc-500","text-gray-400")}`}>powerflow.training</p>
          <a href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20enquiry" className={`text-[11px] transition ${tc(d,"text-violet-400 hover:text-violet-300","text-violet-600 hover:text-violet-700")}`}>
            trainer.pod@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
