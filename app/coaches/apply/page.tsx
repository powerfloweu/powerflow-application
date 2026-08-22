"use client";

/**
 * /coaches/apply — public application to become a PowerFlow affiliated coach.
 *
 * Sits above /coaches/[slug] in Next's routing (static segments beat dynamic
 * ones), so "apply" is never mistaken for a coach slug.
 *
 * The question set is a first pass, chosen to separate a serious applicant
 * from a speculative one. It lives in lib/coachApply.ts and is expected to
 * change once the affiliate criteria are settled.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";
import { QUALIFICATIONS, EXPERIENCE_BANDS, COACH_LANGUAGES } from "@/lib/coachApply";
import { tc, Check, Eyebrow } from "@/lib/publicUi";

export default function CoachApplyPage() {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  const [fullName,      setFullName]      = React.useState("");
  const [email,         setEmail]         = React.useState("");
  const [country,       setCountry]       = React.useState("");
  const [instagram,     setInstagram]     = React.useState("");
  const [website,       setWebsite]       = React.useState("");
  const [qualification, setQualification] = React.useState("");
  const [experience,    setExperience]    = React.useState("");
  const [languages,     setLanguages]     = React.useState<string[]>([]);
  const [athletes,      setAthletes]      = React.useState("");
  const [motivation,    setMotivation]    = React.useState("");
  const [consent,       setConsent]       = React.useState(false);
  const [website2,      setWebsite2]      = React.useState(""); // honeypot

  const [submitting, setSubmitting] = React.useState(false);
  const [error,      setError]      = React.useState<string | null>(null);
  const [done,       setDone]       = React.useState<{ already: boolean } | null>(null);

  function toggleLanguage(id: string) {
    setLanguages((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (motivation.trim().length < 40) {
      setError("Tell us a little more about why you want to coach with PowerFlow.");
      return;
    }
    if (!consent) {
      setError("Please confirm we can contact you about your application.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/coach-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, country, instagram, website, qualification,
          experience, languages, athletes, motivation, consent, website2,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); return; }
      setDone({ already: !!data.already });
    } catch (err) {
      console.error("[coach-apply] submit failed", err);
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const panel   = tc(d, "border-white/[0.10] bg-white/[0.03]", "border-gray-200 bg-white");
  const chosen  = tc(d,
    "border-violet-500/50 bg-violet-500/[0.10] shadow-[0_0_0_1px_rgba(139,92,246,0.25)]",
    "border-violet-400 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]");
  const label   = `block text-[11px] font-bold uppercase tracking-[0.16em] mb-2 ${tc(d, "text-zinc-400", "text-gray-500")}`;
  const input   = `w-full rounded-xl border px-4 py-3.5 text-base outline-none transition ${tc(d,
    "border-white/10 bg-white/[0.04] text-white placeholder-zinc-600 focus:border-violet-500/70 focus:bg-white/[0.06]",
    "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white")}`;
  const muted   = tc(d, "text-zinc-400", "text-gray-500");
  const heading = tc(d, "text-white", "text-gray-900");
  const optional = <span className="font-normal normal-case tracking-normal opacity-60">— optional</span>;

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
        <div className="w-full mb-10">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-3 ${tc(d, "text-violet-400", "text-violet-600")}`}>
            For coaches
          </p>
          <h1 className={`text-4xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 ${heading}`}>
            Coach with<br />PowerFlow.
          </h1>
          <p className={`text-sm leading-relaxed ${muted}`}>
            Affiliated coaches run their own practice inside PowerFlow — journals,
            check-ins, psychological tests and AI tools, with your athletes&rsquo; data in
            one place instead of scattered across spreadsheets and DMs.
          </p>
        </div>

        {done ? (
          <div className={`w-full rounded-2xl border p-6 ${tc(d, "border-violet-500/25 bg-violet-500/[0.06]", "border-violet-200 bg-violet-50")}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${tc(d, "text-violet-400", "text-violet-600")}`}>
              {done.already ? "Already applied" : "Application received"}
            </p>
            <h2 className={`text-2xl font-extrabold uppercase tracking-tight mb-3 ${heading}`}>
              {done.already ? "We already have yours" : "Thanks — we'll be in touch"}
            </h2>
            <p className={`text-sm leading-relaxed ${muted}`}>
              {done.already
                ? "There's already an application from that email address, so we haven't created a second one. If you'd like to add something, email david@power-flow.eu."
                : "David reads every application himself, so this takes a few days rather than a few minutes. You'll hear back either way — check your inbox for a confirmation."}
            </p>
            <Link
              href="/coaches"
              className={`inline-block mt-5 text-[11px] transition ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
            >
              ← Back to coaches
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-10">

            {/* ── You ── */}
            <fieldset>
              <legend className="w-full"><Eyebrow dark={d}>About you</Eyebrow></legend>
              <div className="space-y-4">
                <div>
                  <label htmlFor="ca-name" className={label}>Name</label>
                  <input
                    id="ca-name" type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name" placeholder="Your name" className={input}
                  />
                </div>

                <div>
                  <label htmlFor="ca-email" className={label}>Email</label>
                  <input
                    id="ca-email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email" placeholder="you@example.com" className={input}
                  />
                </div>

                <div>
                  <label htmlFor="ca-country" className={label}>Where are you based? {optional}</label>
                  <select id="ca-country" value={country} onChange={(e) => setCountry(e.target.value)} className={input}>
                    <option value="">Prefer not to say</option>
                    {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="ca-instagram" className={label}>Instagram {optional}</label>
                  <input
                    id="ca-instagram" type="text" value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle" className={input}
                  />
                </div>

                <div>
                  <label htmlFor="ca-website" className={label}>Website {optional}</label>
                  <input
                    id="ca-website" type="text" value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="yoursite.com" className={input}
                  />
                </div>
              </div>
            </fieldset>

            {/* ── Background ── */}
            <fieldset>
              <legend className="w-full"><Eyebrow dark={d}>Your background</Eyebrow></legend>
              <div className="space-y-4">
                <div>
                  <label htmlFor="ca-qual" className={label}>Closest description</label>
                  <select id="ca-qual" value={qualification} onChange={(e) => setQualification(e.target.value)} className={input}>
                    <option value="">Select…</option>
                    {QUALIFICATIONS.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="ca-exp" className={label}>How long have you been coaching?</label>
                  <select id="ca-exp" value={experience} onChange={(e) => setExperience(e.target.value)} className={input}>
                    <option value="">Select…</option>
                    {EXPERIENCE_BANDS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                </div>

                <div>
                  <span className={label}>Which languages can you coach in?</span>
                  <div className="flex flex-wrap gap-2">
                    {COACH_LANGUAGES.map((l) => {
                      const on = languages.includes(l.id);
                      return (
                        <label
                          key={l.id}
                          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-150 ${on ? chosen : panel}`}
                        >
                          <input
                            type="checkbox" checked={on}
                            onChange={() => toggleLanguage(l.id)}
                            className="peer sr-only"
                          />
                          <Check on={on} dark={d} />
                          <span className={`text-sm font-semibold ${heading}`}>{l.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="ca-athletes" className={label}>Who do you work with at the moment? {optional}</label>
                  <textarea
                    id="ca-athletes" rows={3} value={athletes} maxLength={1000}
                    onChange={(e) => setAthletes(e.target.value)}
                    placeholder="Level, sport, roughly how many athletes."
                    className={`${input} resize-y leading-relaxed`}
                  />
                </div>
              </div>
            </fieldset>

            {/* ── Motivation ── */}
            <fieldset>
              <legend className="w-full"><Eyebrow dark={d}>Why PowerFlow?</Eyebrow></legend>
              <p className={`text-xs mb-4 ${muted}`}>
                The part David actually reads. What you&rsquo;d want to do here, and what
                you&rsquo;d bring.
              </p>
              <textarea
                id="ca-motivation" rows={6} required value={motivation} maxLength={3000}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="A few sentences is plenty."
                className={`${input} resize-y leading-relaxed`}
              />
              <p className={`text-[11px] mt-1.5 ${motivation.trim().length >= 40 ? muted : tc(d, "text-zinc-500", "text-gray-400")}`}>
                {motivation.trim().length < 40
                  ? `${40 - motivation.trim().length} more characters`
                  : `${motivation.trim().length} characters`}
              </p>
            </fieldset>

            {/* Honeypot — hidden from people, tempting to bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="ca-website2">Company website</label>
              <input
                id="ca-website2" type="text" tabIndex={-1} autoComplete="off"
                value={website2} onChange={(e) => setWebsite2(e.target.value)}
              />
            </div>

            {/* ── Consent ── */}
            <label className={`flex gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all duration-150 ${consent ? chosen : panel}`}>
              <input
                type="checkbox" checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="peer sr-only"
              />
              <Check on={consent} dark={d} />
              <span className={`text-xs leading-relaxed ${muted}`}>
                PowerFlow can contact me about this application. Nothing else, and you can
                ask us to delete my details at any time.
              </span>
            </label>

            {error && (
              <p className={`text-sm rounded-xl border px-4 py-3 ${tc(d, "border-red-500/30 bg-red-500/10 text-red-300", "border-red-200 bg-red-50 text-red-700")}`}>
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="submit" disabled={submitting}
                className="w-full rounded-xl py-4 text-sm font-extrabold uppercase tracking-[0.12em] bg-violet-600 text-white hover:bg-violet-500 transition disabled:opacity-50 shadow-[0_8px_30px_-10px_rgba(124,58,237,0.9)]"
              >
                {submitting ? "Sending…" : "Send application"}
              </button>
              <p className={`text-center text-[11px] ${muted}`}>
                David reads every application himself. Expect a few days.
              </p>
            </div>
          </form>
        )}

        {/* ── Footer ── */}
        <div className="mt-14 text-center space-y-1.5">
          <a
            href="mailto:david@power-flow.eu?subject=PowerFlow%20affiliate%20coaching"
            className={`block text-[11px] transition ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
          >
            david@power-flow.eu
          </a>
        </div>
      </div>
    </div>
  );
}
