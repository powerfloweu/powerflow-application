"use client";

import Link from "next/link";
import Image from "next/image";

const TIERS = [
  {
    id: "opener",
    name: "Opener",
    tag: "Free",
    color: "zinc",
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
    color: "violet",
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
    color: "emerald",
    features: [
      "Everything in Second",
      "16-week mental performance course",
      "AI coaching chat — knows your full history",
      "Personalized course plan · meet day prep",
    ],
  },
] as const;

export default function DemoLanding() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-saira flex flex-col">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.12),transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-5 py-14 sm:py-20 max-w-xl mx-auto w-full">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <Image src="/fm_powerflow_logo_verziok_01_negative.png" alt="PowerFlow" width={36} height={36} className="h-9 w-9" />
          <span className="text-xs font-bold uppercase tracking-[0.28em] text-purple-200/90">PowerFlow</span>
        </div>

        {/* Hero */}
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight mb-3">
          Mental Performance<br />Infrastructure
        </h1>
        <p className="text-center text-sm text-zinc-400 leading-relaxed max-w-sm mb-12">
          Built for strength athletes. Used daily. Visible to coaches.
        </p>

        {/* Two paths */}
        <div className="w-full space-y-4 mb-14">
          <Link href="/demo/coach" className="group block rounded-2xl border border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400">For coaches</p>
              <span className="text-violet-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-white mb-3">Why would I use this as a coach?</h2>
            <ul className="space-y-1.5 mb-4">
              {[
                "See every athlete's mental state in real time",
                "Activity feed: journals, training logs & check-ins in one place",
                "Assign all 4 validated mental performance tests",
                "AI speaks in your voice, reads every athlete's data",
                "Flag anxiety, perfectionism & confidence patterns early",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="text-violet-400 mt-0.5 flex-shrink-0">·</span>{item}
                </li>
              ))}
            </ul>
            <div className="inline-flex items-center gap-2 rounded-xl bg-violet-500/15 border border-violet-500/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-300 group-hover:bg-violet-500/25 transition">
              See the Coach Experience →
            </div>
          </Link>

          <Link href="/demo/athlete" className="group block rounded-2xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">For athletes</p>
              <span className="text-emerald-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-white mb-3">Why would I use this as an athlete?</h2>
            <ul className="space-y-1.5 mb-4">
              {[
                "Build a daily mental training routine in 3–5 minutes",
                "AI coach available 24/7, knows your full training history",
                "16-week structured mental performance course",
                "Guided visualization: squat, bench, deadlift & meet day",
                "Track mood, readiness, sleep & energy across your prep",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">·</span>{item}
                </li>
              ))}
            </ul>
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300 group-hover:bg-emerald-500/25 transition">
              See the Athlete Experience →
            </div>
          </Link>
        </div>

        {/* Pricing */}
        <div className="w-full">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500 mb-5">Three tiers · one journey</p>
          <div className="space-y-3">
            {TIERS.map(tier => (
              <div key={tier.id} className={`rounded-2xl border p-5 ${tier.id === "second" ? "border-violet-500/35 bg-violet-500/8" : tier.id === "pr" ? "border-emerald-500/25 bg-emerald-500/5" : "border-white/8 bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-saira text-base font-extrabold uppercase tracking-tight ${tier.id === "second" ? "text-violet-200" : tier.id === "pr" ? "text-emerald-200" : "text-white"}`}>{tier.name}</p>
                      <span className={`rounded-full border px-2.5 py-0.5 font-saira text-[9px] font-bold uppercase tracking-wider ${tier.id === "second" ? "border-violet-500/35 bg-violet-500/15 text-violet-300" : tier.id === "pr" ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/[0.04] text-zinc-400"}`}>{tier.tag}</span>
                    </div>
                  </div>
                  {tier.id === "second" && (
                    <span className="font-saira text-[9px] uppercase tracking-widest text-violet-400 border border-violet-500/30 rounded-full px-2.5 py-1">Most popular</span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                      <span className={`mt-0.5 flex-shrink-0 text-[10px] ${tier.id === "second" ? "text-violet-400" : tier.id === "pr" ? "text-emerald-400" : "text-zinc-600"}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-4">Pricing available on request · coach team licences available</p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-1">
          <p className="text-xs text-zinc-500">powerflow.training</p>
          <a href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20enquiry" className="text-[11px] text-violet-400 hover:text-violet-300 transition">
            trainer.pod@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
