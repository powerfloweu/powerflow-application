"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

function tc(d: boolean, dark: string, light: string) { return d ? dark : light; }

export default function DemoLanding() {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  return (
    <div className={`min-h-screen font-saira flex flex-col ${tc(d,"bg-[#0A0A0A] text-white","bg-gray-50 text-gray-900")}`}>
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
        <div className="w-full space-y-4 mb-10">
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

        {/* Research evidence section */}
        <div className="w-full mb-10">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] text-center mb-5 ${tc(d,"text-zinc-500","text-gray-400")}`}>
            Backed by sport psychology research
          </p>
          <div className="space-y-2.5">
            {([
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
            ] as const).map(item => (
              <div key={item.claim} className={`rounded-2xl border p-4 ${tc(d,"border-white/[0.07] bg-white/[0.02]","border-gray-100 bg-white")}`}>
                <p className={`text-xs font-bold mb-1.5 ${tc(d,"text-white","text-gray-900")}`}>{item.claim}</p>
                <p className={`text-[11px] leading-relaxed mb-2 ${tc(d,"text-zinc-400","text-gray-500")}`}>{item.body}</p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[9px] transition ${tc(d,"text-zinc-600 hover:text-violet-400","text-gray-400 hover:text-violet-600")}`}
                >
                  <span className={tc(d,"text-zinc-500","text-gray-400")}>↳ </span>{item.cite} ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center space-y-1">
          <p className={`text-xs ${tc(d,"text-zinc-500","text-gray-400")}`}>powerflow.training</p>
          <a href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20enquiry" className={`text-[11px] transition ${tc(d,"text-violet-400 hover:text-violet-300","text-violet-600 hover:text-violet-700")}`}>
            trainer.pod@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
