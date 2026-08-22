"use client";

/**
 * The visible half of /coaches/[slug]. Sections that have no content are not
 * rendered at all — a coach with no testimonials yet shows no testimonials
 * heading, rather than an empty shell that reads as "nobody has anything good
 * to say".
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { tc, Eyebrow } from "@/lib/publicUi";
import {
  type Coach,
  coachBioParagraphs,
  coachFirstName,
} from "@/lib/coaches";

export default function CoachLanding({ coach }: { coach: Coach }) {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  /** Index into coach.gallery, or null when the lightbox is closed. */
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  // Escape closes the lightbox; arrows move through the set.
  React.useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % coach.gallery.length));
      if (e.key === "ArrowLeft")  setLightbox((i) => (i === null ? null : (i - 1 + coach.gallery.length) % coach.gallery.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, coach.gallery.length]);

  const panel   = tc(d, "border-white/[0.10] bg-white/[0.03]", "border-gray-200 bg-white");
  const muted   = tc(d, "text-zinc-400", "text-gray-500");
  const heading = tc(d, "text-white", "text-gray-900");
  const body    = tc(d, "text-zinc-300", "text-gray-600");
  const first   = coachFirstName(coach);
  const apply   = coach.applyUrl ?? `/onboarding?coach=${coach.slug}`;
  const external = !!coach.applyUrl;

  return (
    <div className={`min-h-screen font-saira flex flex-col ${tc(d, "bg-[#0A0A0A] text-white", "bg-gray-50 text-gray-900")}`}>
      {d && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.18),transparent_65%)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-5 pt-24 pb-12 sm:pt-28 sm:pb-16 max-w-xl mx-auto w-full">

        {/* ── Header ── */}
        <div className="w-full flex items-center justify-between mb-10">
          <Link href="/coaches" className="flex items-center gap-3">
            <Image
              src="/fm_powerflow_logo_verziok_01_negative.png"
              alt="PowerFlow" width={52} height={52} className="h-13 w-13"
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
            onClick={() => setIsDark((x) => !x)}
            aria-label={d ? "Switch to light mode" : "Switch to dark mode"}
            className={`text-base leading-none px-2 py-1 rounded-lg transition ${tc(d, "text-zinc-400 hover:text-zinc-100", "text-gray-400 hover:text-gray-700")}`}
          >
            {d ? "☀️" : "🌙"}
          </button>
        </div>

        <Link
          href="/coaches"
          className={`self-start text-[11px] mb-6 transition ${tc(d, "text-zinc-500 hover:text-zinc-300", "text-gray-400 hover:text-gray-600")}`}
        >
          ← All coaches
        </Link>

        {/* ── Hero ── */}
        <div className="w-full mb-8">
          <div className="flex items-start gap-5 mb-5">
            <div className="w-24 h-24 rounded-2xl flex-shrink-0 overflow-hidden relative">
              {coach.photo ? (
                <Image src={coach.photo} alt={coach.name} fill className="object-cover object-top" sizes="96px" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center font-extrabold text-lg ${tc(d, "bg-violet-500/15 text-violet-300", "bg-violet-100 text-violet-700")}`}>
                  {coach.initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              {coach.external && (
                <span className={`inline-block text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border mb-2 ${tc(d, "border-amber-500/30 bg-amber-500/10 text-amber-400", "border-amber-300 bg-amber-100 text-amber-700")}`}>
                  External coach
                </span>
              )}
              <h1 className={`text-3xl sm:text-4xl font-extrabold uppercase tracking-tight leading-[1.05] ${heading}`}>
                {coach.name}
              </h1>
              <p className={`text-xs mt-1.5 ${muted}`}>{coach.title}</p>
              {coach.instagram && (
                <a
                  href={`https://www.instagram.com/${coach.instagram}/`}
                  target="_blank" rel="noopener noreferrer"
                  className={`text-[11px] transition mt-1 inline-block ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
                >
                  @{coach.instagram}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {coach.tags.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] font-semibold rounded-full px-2.5 py-1 border ${tc(d, "border-white/8 bg-white/[0.04] text-zinc-400", "border-gray-200 bg-gray-50 text-gray-500")}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Bio ── */}
        <div className="w-full mb-12">
          <Eyebrow dark={d}>About {first}</Eyebrow>
          <div className="space-y-3">
            {coachBioParagraphs(coach).map((para, i) => (
              <p key={i} className={`text-sm leading-relaxed ${body}`}>{para}</p>
            ))}
          </div>
        </div>

        {/* ── Gallery ── */}
        {coach.gallery.length > 0 && (
          <div className="w-full mb-12">
            <Eyebrow dark={d}>On the platform</Eyebrow>
            <div className="grid grid-cols-2 gap-2.5">
              {coach.gallery.map((photo, i) => (
                <button
                  key={photo.src}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className={`relative aspect-[4/5] rounded-xl overflow-hidden border transition hover:opacity-90 ${tc(d, "border-white/8", "border-gray-200")}`}
                >
                  <Image
                    src={photo.src} alt={photo.alt} fill
                    className="object-cover" sizes="(max-width: 640px) 50vw, 280px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Testimonials ── */}
        {coach.testimonials.length > 0 && (
          <div className="w-full mb-12">
            <Eyebrow dark={d}>What their athletes say</Eyebrow>
            <div className="space-y-3">
              {coach.testimonials.map((t, i) => (
                <figure key={i} className={`rounded-2xl border p-5 ${panel}`}>
                  <blockquote className={`text-sm leading-relaxed ${body}`}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className={`text-[11px] mt-3 ${muted}`}>
                    <span className={`font-bold ${heading}`}>{t.author}</span>
                    {t.context && <> · {t.context}</>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* ── Apply ── */}
        <div className="w-full">
          {external ? (
            <a
              href={apply} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl py-4 text-sm font-extrabold uppercase tracking-[0.12em] bg-violet-600 text-white hover:bg-violet-500 transition shadow-[0_8px_30px_-10px_rgba(124,58,237,0.9)]"
            >
              Apply for 1:1 coaching with {first}
            </a>
          ) : (
            <Link
              href={apply}
              className="flex items-center justify-center rounded-xl py-4 text-sm font-extrabold uppercase tracking-[0.12em] bg-violet-600 text-white hover:bg-violet-500 transition shadow-[0_8px_30px_-10px_rgba(124,58,237,0.9)]"
            >
              Apply for 1:1 coaching with {first}
            </Link>
          )}
          <p className={`text-center text-[11px] mt-3 ${muted}`}>
            {coach.external
              ? `${first} coaches outside the PowerFlow app — applications go to her own form.`
              : `You'll work inside the same system your journals, check-ins and tests live in.`}
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="mt-14 text-center space-y-1.5">
          <a
            href="mailto:david@power-flow.eu?subject=PowerFlow%20coaching%20enquiry"
            className={`block text-[11px] transition ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
          >
            david@power-flow.eu
          </a>
          <Link href="/coaches" className={`block text-[11px] transition ${tc(d, "text-zinc-500 hover:text-zinc-300", "text-gray-400 hover:text-gray-600")}`}>
            All PowerFlow coaches
          </Link>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && coach.gallery[lightbox] && (
        <div
          role="dialog" aria-modal="true" aria-label={coach.gallery[lightbox].alt}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full max-w-3xl aspect-[3/4] max-h-[85vh]">
            <Image
              src={coach.gallery[lightbox].src}
              alt={coach.gallery[lightbox].alt}
              fill className="object-contain" sizes="100vw"
            />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-white/70 hover:text-white text-2xl leading-none"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
