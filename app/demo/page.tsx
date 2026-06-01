"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

function tc(d: boolean, dark: string, light: string) { return d ? dark : light; }

const EVIDENCE = [
  {
    claim: "Visualization primes the neuromuscular system",
    body: "Mental rehearsal activates the same motor pathways as physical execution. Lifters who mentally rehearse attempts show more consistent technique and lower pre-attempt cortisol under competition pressure.",
    cite: "Guillot & Collet (2008) · Neuroscience of motor imagery",
    href: "https://doi.org/10.1080/17509840701823139",
  },
  {
    claim: "Competitive anxiety is measurable — and coachable",
    body: "The CSAI-2 separates cognitive anxiety, somatic anxiety, and self-confidence. In strength sports, high cognitive anxiety with low self-confidence reliably predicts missed attempts — and coaches can act on it.",
    cite: "Martens, Vealey & Burton (1990) · Competitive Anxiety in Sport",
    href: "https://scholar.google.com/scholar?q=Martens+Vealey+Burton+1990+CSAI-2+Competitive+Anxiety+Sport",
  },
  {
    claim: "Coping skills separate elite from sub-elite athletes",
    body: "The ACSI-28 identifies who performs under pressure versus who under-delivers. Concentration, goal-setting, and coachability can all be developed systematically.",
    cite: "Smith, Schutz, Smoll & Ptacek (1995) · J. Sport & Exercise Psychology",
    href: "https://doi.org/10.1123/jsep.17.4.379",
  },
  {
    claim: "Daily monitoring catches problems 72 hours early",
    body: "Subjective wellness tracking — mood, readiness, sleep, energy — predicts performance decrements and injury risk before they appear in training output. It is the earliest signal a coach has.",
    cite: "Hooper & Mackinnon (1995) · Sports Medicine",
    href: "https://pubmed.ncbi.nlm.nih.gov/7898325/",
  },
  {
    claim: "Structured programs outperform ad-hoc psychological support",
    body: "8–12 weeks of systematic mental skills training produces significantly larger gains in competitive confidence and coping efficacy than informal or reactive support.",
    cite: "Vealey (2007) · Handbook of Sport Psychology (3rd ed.)",
    href: "https://onlinelibrary.wiley.com/doi/10.1002/9781118270011.ch13",
  },
  {
    claim: "Perfectionism predicts competition blocks before they happen",
    body: "Elevated perfectionism on the DAS correlates with cognitive anxiety and avoidance behaviors at meets. Identifying at-risk athletes early enables targeted intervention — not crisis management.",
    cite: "Weissman & Beck (1978) · Dysfunctional Attitudes Scale",
    href: "https://eric.ed.gov/?id=ED167619",
  },
] as const;

export default function DemoLanding() {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  return (
    <div className={`min-h-screen font-saira flex flex-col ${tc(d,"bg-[#0A0A0A] text-white","bg-gray-50 text-gray-900")}`}>
      {d && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.15),transparent_65%)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-5 py-12 sm:py-16 max-w-xl mx-auto w-full">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="w-full flex items-center justify-between mb-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/fm_powerflow_logo_verziok_01_negative.png"
              alt="PowerFlow"
              width={52} height={52}
              className="h-13 w-13"
              style={d ? {} : { filter: "invert(1)", opacity: 0.75 }}
            />
            <div>
              <p className={`text-sm font-extrabold uppercase tracking-[0.3em] leading-none ${tc(d,"text-violet-200","text-violet-700")}`}>
                PowerFlow
              </p>
              <p className={`text-[9px] uppercase tracking-widest leading-none mt-1 ${tc(d,"text-zinc-500","text-gray-400")}`}>
                mental coaching
              </p>
            </div>
          </div>
          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(x => !x)}
            title={d ? "Light mode" : "Dark mode"}
            className={`text-base leading-none px-2 py-1 rounded-lg transition ${tc(d,"text-zinc-400 hover:text-zinc-100","text-gray-400 hover:text-gray-700")}`}
          >
            {d ? "☀️" : "🌙"}
          </button>
        </div>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <h1 className={`text-center text-4xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 ${tc(d,"text-white","text-gray-900")}`}>
          Mental<br />Performance<br />Infrastructure
        </h1>
        <p className={`text-center text-sm leading-relaxed max-w-xs mb-10 ${tc(d,"text-zinc-400","text-gray-500")}`}>
          Built for powerlifters. Used daily. Visible to coaches.
        </p>

        {/* ── Social proof ────────────────────────────────────────── */}
        <div className={`w-full rounded-2xl border p-5 mb-10 ${tc(d,"border-violet-500/20 bg-violet-500/[0.06]","border-violet-200 bg-violet-50")}`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-3 ${tc(d,"text-violet-400","text-violet-600")}`}>
            Proven results
          </p>
          <p className={`text-sm leading-relaxed ${tc(d,"text-zinc-200","text-gray-700")}`}>
            &ldquo;The PowerFlow team has improved the mindset of multiple champions, including world record holders across women&rsquo;s and men&rsquo;s weight classes and a Sheffield Classic winner.&rdquo;
          </p>
        </div>

        {/* ── Choose your path ────────────────────────────────────── */}
        <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-4 ${tc(d,"text-zinc-500","text-gray-400")}`}>
          Choose your demo
        </p>
        <div className="w-full space-y-3 mb-12">

          {/* Coach */}
          <Link href="/demo/coach" className={`group relative block rounded-2xl border transition-all overflow-hidden ${tc(d,"border-violet-500/30 bg-violet-500/[0.07] hover:bg-violet-500/[0.12] hover:border-violet-500/50","border-violet-200 bg-violet-50 hover:bg-violet-100 hover:border-violet-300")}`}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tc(d,"text-violet-400","text-violet-600")}`}>For coaches</p>
                <span className={`text-xl font-bold group-hover:translate-x-1.5 transition-transform ${tc(d,"text-violet-400","text-violet-600")}`}>→</span>
              </div>
              <h2 className={`text-xl font-extrabold uppercase tracking-tight mb-3 ${tc(d,"text-white","text-gray-900")}`}>
                Coach Dashboard
              </h2>
              <ul className="space-y-1.5 mb-5">
                {[
                  "See every athlete's mental state in real time",
                  "Activity feed: journals, logs & check-ins in one place",
                  "4 validated mental performance tests — assign & track",
                  "AI that speaks in your voice, reads every athlete's data",
                ].map(item => (
                  <li key={item} className={`flex items-start gap-2 text-xs ${tc(d,"text-zinc-300","text-gray-600")}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${tc(d,"text-violet-400","text-violet-600")}`}>·</span>{item}
                  </li>
                ))}
              </ul>
              <div className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition ${tc(d,"bg-violet-500/20 border-violet-500/40 text-violet-200 group-hover:bg-violet-500/30","bg-violet-600 border-violet-600 text-white")}`}>
                Enter coach demo →
              </div>
            </div>
          </Link>

          {/* Athlete */}
          <Link href="/demo/athlete" className={`group relative block rounded-2xl border transition-all overflow-hidden ${tc(d,"border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20","border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300")}`}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tc(d,"text-zinc-400","text-gray-500")}`}>For athletes</p>
                <span className={`text-xl font-bold group-hover:translate-x-1.5 transition-transform ${tc(d,"text-zinc-400","text-gray-500")}`}>→</span>
              </div>
              <h2 className={`text-xl font-extrabold uppercase tracking-tight mb-3 ${tc(d,"text-white","text-gray-900")}`}>
                Athlete Experience
              </h2>
              <ul className="space-y-1.5 mb-5">
                {[
                  "Daily mental training routine in 3–5 minutes",
                  "AI coach available 24/7, knows your full training history",
                  "16-week structured mental performance course",
                  "Guided visualization: squat, bench, deadlift & meet day",
                ].map(item => (
                  <li key={item} className={`flex items-start gap-2 text-xs ${tc(d,"text-zinc-300","text-gray-600")}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${tc(d,"text-zinc-500","text-gray-400")}`}>·</span>{item}
                  </li>
                ))}
              </ul>
              <div className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition ${tc(d,"bg-white/8 border-white/15 text-zinc-200 group-hover:bg-white/12","bg-gray-900 border-gray-900 text-white")}`}>
                Enter athlete demo →
              </div>
            </div>
          </Link>
        </div>

        {/* ── Research evidence ───────────────────────────────────── */}
        <div className="w-full mb-10">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-5 ${tc(d,"text-zinc-500","text-gray-400")}`}>
            Backed by sport psychology research
          </p>
          <div className="space-y-2.5">
            {EVIDENCE.map(item => (
              <div key={item.claim} className={`rounded-2xl border p-4 ${tc(d,"border-white/[0.12] bg-white/[0.04]","border-gray-200 bg-white")}`}>
                <p className={`text-xs font-bold mb-1.5 ${tc(d,"text-white","text-gray-900")}`}>{item.claim}</p>
                <p className={`text-[11px] leading-relaxed mb-2 ${tc(d,"text-zinc-300","text-gray-600")}`}>{item.body}</p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[9px] transition ${tc(d,"text-violet-400 hover:text-violet-300","text-violet-600 hover:text-violet-700")}`}
                >
                  ↳ {item.cite} ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="mt-2 text-center space-y-1.5">
          <a href="mailto:david@power-flow.eu?subject=PowerFlow%20enquiry" className={`block text-[11px] transition ${tc(d,"text-violet-400 hover:text-violet-300","text-violet-600 hover:text-violet-700")}`}>
            david@power-flow.eu
          </a>
          <a href="https://www.instagram.com/powerfloweu/" target="_blank" rel="noopener noreferrer" className={`block text-[11px] transition ${tc(d,"text-zinc-500 hover:text-zinc-300","text-gray-400 hover:text-gray-600")}`}>
            @powerfloweu
          </a>
        </div>

      </div>
    </div>
  );
}
