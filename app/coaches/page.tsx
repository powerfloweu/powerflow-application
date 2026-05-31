"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

function tc(d: boolean, dark: string, light: string) { return d ? dark : light; }

type Coach = {
  slug: string;
  name: string;
  initials: string;
  title: string;
  bio: string;
  instagram: string | null;
  photo: string | null;
  tags: string[];
  external?: boolean;
  applyUrl?: string;
};

const COACHES: Coach[] = [
  {
    slug: "david",
    name: "David Sipos",
    initials: "DS",
    title: "Sport Psychologist (MSc) · Founder",
    bio: "Hungarian powerlifter competing since 2016 across the 93 and 105 kg classes — 612.5 kg total. David built PowerFlow after 600+ hours of practice with strength athletes, distilling sport psychology into tools any athlete can apply: visualization scripts, pre-meet routines, competition anxiety work and individualized mental skill sets. Works with athletes across IPF, USAPL and EPF.",
    instagram: "powerfloweu",
    photo: "/coaches/david.jpg",
    tags: ["Visualization", "Competition anxiety", "Goal setting", "Meet-day prep"],
  },
  {
    slug: "jay",
    name: "Jacqueline Ulrich",
    initials: "JU",
    title: "Mental Performance Coach",
    bio: "Having participated in international-level powerlifting competitions, Jay knows what it feels like to deal with pressure, doubt, and expectations. As a powerlifting coach she realised long-term development takes more than training plans — and went deeper into the mental side. She helps athletes understand their own thoughts and experiences and find their way toward more clarity and confidence in themselves.",
    instagram: "omgitsjacqueline",
    photo: null,
    tags: ["Mental resilience", "Confidence", "Performance routines", "Consistency"],
  },
  {
    slug: "clarice",
    name: "Clarice Tighe",
    initials: "CT",
    title: "Sport Psychologist (MSc)",
    bio: "Full-time performance mentality coach at Odyssey Strength and competing powerlifter based in Ireland. Having navigated life with Multiple Sclerosis while continuing to compete — returning to the platform at the 2024 IrishPF Open after what she describes as her lowest points — Clarice brings a depth of lived resilience to her coaching. She specialises in the self-talk and mental habits that keep athletes together when conditions are hardest.",
    instagram: "clarice_odyssey",
    photo: "/coaches/clarice.jpg",
    tags: ["Self-talk", "Cognitive patterns", "Pressure performance", "Mindset"],
    applyUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdeIVKKhkAn5SZgBuJZWm2SigpHBeCR__RwyWaQPcKrkJO20Q/viewform",
  },
  {
    slug: "kate",
    name: "Dr. Kate Cohen-Maher",
    initials: "KC",
    title: "Sport Psychologist (PhD)",
    bio: "Sport psychologist (PhD candidate, Florida State University), 48 kg pro powerlifter and 2× USAPL National Champion. Former Raw American junior and collegiate record holder in squat, bench and deadlift. Works with D1 and elite athletes on confidence, attention control, anxiety regulation and performing under pressure. Affiliated with Juggernaut Training Systems.",
    instagram: "kateco220",
    photo: "/coaches/kate.jpg",
    tags: ["Confidence", "Anxiety regulation", "Focus & attention", "Elite performance"],
    external: true,
    applyUrl: "https://docs.google.com/forms/d/e/1FAIpQLSepNr4SC7zIy40wUV_nTohd06a8bXEXD8dJsYJ03BUzIxhVgw/viewform",
  },
];

export default function CoachesPage() {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  return (
    <div className={`min-h-screen font-saira flex flex-col ${tc(d, "bg-[#0A0A0A] text-white", "bg-gray-50 text-gray-900")}`}>
      {d && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.15),transparent_65%)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-5 py-12 sm:py-16 max-w-xl mx-auto w-full">

        {/* ── Header ── */}
        <div className="w-full flex items-center justify-between mb-12">
          <Link href="/demo" className="flex items-center gap-3">
            <Image
              src="/fm_powerflow_logo_verziok_01_negative.png"
              alt="PowerFlow"
              width={52} height={52}
              className="h-13 w-13"
              style={d ? {} : { filter: "invert(1)", opacity: 0.75 }}
            />
            <div>
              <p className={`text-sm font-extrabold uppercase tracking-[0.3em] leading-none ${tc(d, "text-violet-200", "text-violet-700")}`}>
                PowerFlow
              </p>
              <p className={`text-[9px] uppercase tracking-widest leading-none mt-1 ${tc(d, "text-zinc-500", "text-gray-400")}`}>
                mental coaching
              </p>
            </div>
          </Link>
          <button
            onClick={() => setIsDark(x => !x)}
            title={d ? "Light mode" : "Dark mode"}
            className={`text-base leading-none px-2 py-1 rounded-lg transition ${tc(d, "text-zinc-400 hover:text-zinc-100", "text-gray-400 hover:text-gray-700")}`}
          >
            {d ? "☀️" : "🌙"}
          </button>
        </div>

        {/* ── Hero ── */}
        <div className="w-full mb-10">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-3 ${tc(d, "text-violet-400", "text-violet-600")}`}>
            1:1 coaching
          </p>
          <h1 className={`text-4xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 ${tc(d, "text-white", "text-gray-900")}`}>
            Work with a<br />coach directly.
          </h1>
          <p className={`text-sm leading-relaxed max-w-sm ${tc(d, "text-zinc-400", "text-gray-500")}`}>
            Every PowerFlow coach works inside the same system your athletes use — journals, check-ins, tests, and AI tools. Your data is always in one place.
          </p>
        </div>

        {/* ── Coach cards ── */}
        <div className="w-full space-y-4 mb-12">
          {COACHES.map((coach) => (
            <div
              key={coach.slug}
              className={`rounded-2xl border p-5 ${tc(d,
                coach.external
                  ? "border-amber-500/20 bg-amber-500/[0.04]"
                  : "border-white/[0.10] bg-white/[0.03]",
                coach.external
                  ? "border-amber-200 bg-amber-50"
                  : "border-gray-200 bg-white"
              )}`}
            >
              {/* Top row */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar — photo or initials fallback */}
                <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden relative">
                  {coach.photo ? (
                    <Image
                      src={coach.photo}
                      alt={coach.name}
                      fill
                      className="object-cover object-top"
                      sizes="64px"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-extrabold text-sm ${tc(d, "bg-violet-500/15 text-violet-300", "bg-violet-100 text-violet-700")}`}>
                      {coach.initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className={`font-extrabold text-base leading-tight ${tc(d, "text-white", "text-gray-900")}`}>
                      {coach.name}
                    </p>
                    {coach.external && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border ${tc(d, "border-amber-500/30 bg-amber-500/10 text-amber-400", "border-amber-300 bg-amber-100 text-amber-700")}`}>
                        External
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${tc(d, "text-zinc-400", "text-gray-500")}`}>{coach.title}</p>
                  {coach.instagram && (
                    <a
                      href={`https://www.instagram.com/${coach.instagram}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-[11px] transition mt-0.5 inline-block ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
                    >
                      @{coach.instagram}
                    </a>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {coach.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] font-semibold rounded-full px-2.5 py-1 border ${tc(d, "border-white/8 bg-white/[0.04] text-zinc-400", "border-gray-200 bg-gray-50 text-gray-500")}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Bio */}
              <p className={`text-xs leading-relaxed mb-4 ${tc(d, "text-zinc-300", "text-gray-600")}`}>
                {coach.bio}
              </p>

              {/* CTA */}
              {coach.applyUrl ? (
                <a
                  href={coach.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition ${tc(d,
                    "bg-violet-500/15 border-violet-500/30 text-violet-200 hover:bg-violet-500/25",
                    "bg-violet-600 border-violet-600 text-white hover:bg-violet-500"
                  )}`}
                >
                  Apply for 1:1 coaching with {coach.name.split(" ")[0]} →
                </a>
              ) : coach.external ? (
                <a
                  href={`https://www.instagram.com/${coach.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition ${tc(d,
                    "bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20",
                    "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
                  )}`}
                >
                  Follow {coach.name.split(" ")[0]} on Instagram →
                </a>
              ) : (
                <Link
                  href={`/onboarding?coach=${coach.slug}`}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition ${tc(d,
                    "bg-violet-500/15 border-violet-500/30 text-violet-200 hover:bg-violet-500/25",
                    "bg-violet-600 border-violet-600 text-white hover:bg-violet-500"
                  )}`}
                >
                  Apply for 1:1 coaching with {coach.name.split(" ")[0]} →
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="mt-2 text-center space-y-1.5">
          <a
            href="mailto:david@power-flow.eu?subject=PowerFlow%20coaching%20enquiry"
            className={`block text-[11px] transition ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
          >
            david@power-flow.eu
          </a>
          <a
            href="https://www.instagram.com/powerfloweu/"
            target="_blank"
            rel="noopener noreferrer"
            className={`block text-[11px] transition ${tc(d, "text-zinc-500 hover:text-zinc-300", "text-gray-400 hover:text-gray-600")}`}
          >
            @powerfloweu
          </a>
        </div>

      </div>
    </div>
  );
}
