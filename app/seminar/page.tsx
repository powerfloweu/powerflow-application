"use client";

/**
 * /seminar — public sign-up for the "Mental Performance for Coaches" seminar.
 *
 * Deliberately outside the (app) route group and outside proxy.ts's APP_ROUTES,
 * so it renders without the app shell and without requiring a session. Most
 * people landing here will not have a PowerFlow account.
 *
 * All copy, topics, hosts and capacity rules come from lib/seminar.ts — this
 * file is presentation only.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SEMINAR,
  SEMINAR_HOSTS,
  SEMINAR_TOPICS,
  COACHING_CONTEXTS,
  COUNTRIES,
  countryForZone,
  zoneForCountry,
  startTimeIn,
  startDateIn,
} from "@/lib/seminar";
import { tc, Check, Eyebrow } from "@/lib/publicUi";

type Availability = { spotsLeft: number; isFull: boolean; closed: boolean };
type Submitted    = { status: "registered" | "waitlist"; already: boolean };

const HOST_ZONE = "Europe/Budapest";

export default function SeminarPage() {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [fullName, setFullName] = React.useState("");
  const [email,    setEmail]    = React.useState("");
  const [country,  setCountry]  = React.useState("");
  const [context,  setContext]  = React.useState("");
  const [topics,   setTopics]   = React.useState<string[]>([]);
  const [question, setQuestion] = React.useState("");
  const [consent,  setConsent]  = React.useState(false);
  const [website,  setWebsite]  = React.useState(""); // honeypot

  const [submitting, setSubmitting] = React.useState(false);
  const [error,      setError]      = React.useState<string | null>(null);
  const [submitted,  setSubmitted]  = React.useState<Submitted | null>(null);
  const [avail,      setAvail]      = React.useState<Availability | null>(null);

  /** The visitor's zone, from the browser until they pick a country. Resolved
   *  on the client only — the server cannot know it, and computing it during
   *  render would break hydration. */
  const [browserZone, setBrowserZone] = React.useState<string | null>(null);

  const loadAvailability = React.useCallback(() => {
    return fetch("/api/seminar")
      .then((r) => r.json())
      .then((a: Availability) => setAvail(a))
      .catch((err) => console.error("[seminar] availability fetch failed", err));
  }, []);

  React.useEffect(() => {
    loadAvailability();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    setBrowserZone(zone);
    // Pre-fill the country from the detected zone so nobody has to hunt for
    // their own country just to see what time it starts.
    const guess = countryForZone(zone);
    if (guess) setCountry(guess);
  }, [loadAvailability]);

  const zone       = zoneForCountry(country) ?? browserZone;
  const localTime  = startTimeIn(zone);
  const localDate  = startDateIn(zone);
  const isElsewhere = !!zone && zone !== HOST_ZONE && !!localTime;

  const dateLabel = new Date(SEMINAR.startsAt).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: HOST_ZONE,
  });

  function toggleTopic(id: string) {
    setTopics((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (topics.length === 0) { setError("Pick at least one topic you'd like covered."); return; }
    if (!consent)            { setError("Please confirm we can email you about the seminar."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/seminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, country, context, topics, question, consent, website }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); return; }
      setSubmitted({ status: data.status, already: !!data.already });
      loadAvailability();
    } catch (err) {
      console.error("[seminar] submit failed", err);
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared class fragments ────────────────────────────────────────────────
  const panel   = tc(d, "border-white/[0.10] bg-white/[0.03]", "border-gray-200 bg-white");
  const chosen  = tc(d,
    "border-violet-500/50 bg-violet-500/[0.10] shadow-[0_0_0_1px_rgba(139,92,246,0.25)]",
    "border-violet-400 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]");
  const label   = `block text-[11px] font-bold uppercase tracking-[0.16em] mb-2 ${tc(d, "text-zinc-400", "text-gray-500")}`;
  // text-base (16px) on inputs — anything smaller makes iOS Safari zoom on focus.
  const input   = `w-full rounded-xl border px-4 py-3.5 text-base outline-none transition ${tc(d,
    "border-white/10 bg-white/[0.04] text-white placeholder-zinc-600 focus:border-violet-500/70 focus:bg-white/[0.06]",
    "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white")}`;
  const muted   = tc(d, "text-zinc-400", "text-gray-500");
  const heading = tc(d, "text-white", "text-gray-900");
  const statLbl = `text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 ${tc(d, "text-zinc-500", "text-gray-400")}`;

  return (
    <div className={`min-h-screen font-saira flex flex-col ${tc(d, "bg-[#0A0A0A] text-white", "bg-gray-50 text-gray-900")}`}>
      {d && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.18),transparent_65%)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-5 py-12 sm:py-16 max-w-xl mx-auto w-full">

        {/* ── Header ── */}
        <div className="w-full flex items-center justify-between mb-12">
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

        {/* ── Hero ── */}
        <div className="w-full mb-8">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-3 ${tc(d, "text-violet-400", "text-violet-600")}`}>
            Online seminar · {SEMINAR.format}
          </p>
          <h1 className={`text-4xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 ${heading}`}>
            Mental performance<br />for coaches.
          </h1>
          <p className={`text-sm leading-relaxed ${muted}`}>
            A session for coaches on the psychological side of the job — reading your
            athlete&rsquo;s state, saying the right thing at the right moment, and staying
            useful when things go badly. Kept small so everyone gets to speak.
          </p>
        </div>

        {/* ── When ── */}
        <div className={`w-full rounded-2xl border overflow-hidden mb-10 ${panel}`}>
          <div className="p-5">
            <p className={statLbl}>When</p>
            <p className={`text-xl font-extrabold leading-tight ${heading}`}>{dateLabel}</p>
            <p className={`text-sm mt-0.5 ${muted}`}>
              {SEMINAR.hostTimeLabel} · {SEMINAR.durationLabel} · online
            </p>

            {isElsewhere && (
              <div className={`mt-4 rounded-xl border px-4 py-3 ${tc(d, "border-violet-500/25 bg-violet-500/[0.07]", "border-violet-200 bg-violet-50")}`}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5 ${tc(d, "text-violet-400", "text-violet-600")}`}>
                  Where you are
                </p>
                <p className={`text-base font-extrabold tabular-nums ${heading}`}>
                  {localTime} — {localDate}
                </p>
              </div>
            )}
          </div>

          <div className={`grid grid-cols-2 border-t ${tc(d, "border-white/8", "border-gray-200")}`}>
            <div className={`p-5 border-r ${tc(d, "border-white/8", "border-gray-200")}`}>
              <p className={statLbl}>Format</p>
              <p className={`text-sm font-bold ${heading}`}>{SEMINAR.format}</p>
              <p className={`text-xs mt-0.5 leading-snug ${muted}`}>{SEMINAR.formatNote}</p>
            </div>
            <div className="p-5">
              <p className={statLbl}>Group size</p>
              <p className={`text-sm font-bold ${heading}`}>Max {SEMINAR.maxParticipants}</p>
              <p className={`text-xs mt-0.5 ${muted}`}>
                {avail === null
                  ? " "
                  : avail.isFull
                    ? "Waitlist only"
                    : `${avail.spotsLeft} ${avail.spotsLeft === 1 ? "spot" : "spots"} left`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Who's running it ── */}
        <div className="w-full mb-12">
          <Eyebrow dark={d}>Run by three of us</Eyebrow>
          <p className={`text-xs mb-5 ${muted}`}>
            Mental preparation for powerlifters is what all three of us do — with athletes
            from a first meet to the international platform.
          </p>

          <div className="space-y-3">
            {SEMINAR_HOSTS.map((host) => (
              <div key={host.slug} className={`rounded-2xl border p-5 ${panel}`}>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden relative">
                    {host.photo ? (
                      <Image src={host.photo} alt={host.name} fill className="object-cover object-top" sizes="56px" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-extrabold text-sm ${tc(d, "bg-violet-500/15 text-violet-300", "bg-violet-100 text-violet-700")}`}>
                        {host.initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-extrabold text-base leading-tight ${heading}`}>{host.name}</p>
                    <p className={`text-xs mt-0.5 ${muted}`}>{host.title}</p>
                    {host.instagram && (
                      <a
                        href={`https://www.instagram.com/${host.instagram}/`}
                        target="_blank" rel="noopener noreferrer"
                        className={`text-[11px] transition mt-0.5 inline-block ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
                      >
                        @{host.instagram}
                      </a>
                    )}
                  </div>
                </div>
                <p className={`text-xs leading-relaxed ${tc(d, "text-zinc-300", "text-gray-600")}`}>{host.intro}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Confirmation, or the form ── */}
        {submitted ? (
          <div className={`w-full rounded-2xl border p-6 ${tc(d, "border-violet-500/25 bg-violet-500/[0.06]", "border-violet-200 bg-violet-50")}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${tc(d, "text-violet-400", "text-violet-600")}`}>
              {submitted.already ? "Already on the list" : submitted.status === "waitlist" ? "On the waitlist" : "You're in"}
            </p>
            <h2 className={`text-2xl font-extrabold uppercase tracking-tight mb-3 ${heading}`}>
              {submitted.status === "waitlist" ? "We'll be in touch" : "See you on 3 October"}
            </h2>
            <p className={`text-sm leading-relaxed ${muted}`}>
              {submitted.already
                ? "You had already signed up with that email address, so nothing has changed — your spot is safe."
                : submitted.status === "waitlist"
                  ? `All ${SEMINAR.maxParticipants} spots are taken, so you're first in line if someone drops out. We'll email you either way.`
                  : "Check your inbox — your confirmation is on its way, with a link you can use to change your topics or cancel."}
            </p>
            <Link
              href="/coaches"
              className={`inline-block mt-5 text-[11px] transition ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
            >
              ← Back to PowerFlow
            </Link>
          </div>
        ) : avail?.closed ? (
          <div className={`w-full rounded-2xl border p-6 text-center ${panel}`}>
            <p className={`text-sm font-bold mb-1 ${heading}`}>Sign-ups have closed</p>
            <p className={`text-xs ${muted}`}>This seminar has already taken place.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-10">

            {/* ── You ── */}
            <fieldset>
              <legend className="w-full"><Eyebrow dark={d}>About you</Eyebrow></legend>

              <div className="space-y-4">
                <div>
                  <label htmlFor="sem-name" className={label}>Name</label>
                  <input
                    id="sem-name" type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name" placeholder="Your name" className={input}
                  />
                </div>

                <div>
                  <label htmlFor="sem-email" className={label}>Email</label>
                  <input
                    id="sem-email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email" placeholder="you@example.com" className={input}
                  />
                  <p className={`text-[11px] mt-1.5 ${muted}`}>This is where the joining link goes.</p>
                </div>

                <div>
                  <label htmlFor="sem-country" className={label}>Where are you?</label>
                  <select
                    id="sem-country" value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={input}
                  >
                    <option value="">Select your country…</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <p className={`text-xs mt-2 leading-relaxed ${
                    country && localTime
                      ? tc(d, "text-violet-300", "text-violet-600")
                      : muted
                  }`}>
                    {country && localTime
                      ? `The seminar starts at ${localTime} where you are — ${localDate}.`
                      : "So we can show you what time the seminar starts for you."}
                  </p>
                </div>

                <div>
                  <label htmlFor="sem-context" className={label}>
                    What do you coach? <span className="font-normal normal-case tracking-normal opacity-60">— optional</span>
                  </label>
                  <select
                    id="sem-context" value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className={input}
                  >
                    <option value="">Prefer not to say</option>
                    {COACHING_CONTEXTS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* ── Topics ── */}
            <fieldset>
              <legend className="w-full"><Eyebrow dark={d}>What should we cover?</Eyebrow></legend>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <p className={`text-xs leading-relaxed ${muted}`}>
                  We build the session around what the group picks, so this genuinely
                  decides the content.
                </p>
                <span className={`text-[11px] font-bold tabular-nums whitespace-nowrap ${
                  topics.length ? tc(d, "text-violet-300", "text-violet-600") : muted
                }`}>
                  {topics.length}/{SEMINAR_TOPICS.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {SEMINAR_TOPICS.map((topic) => {
                  const on = topics.includes(topic.id);
                  return (
                    <label
                      key={topic.id}
                      className={`flex gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all duration-150 ${on ? chosen : panel}`}
                    >
                      <input
                        type="checkbox" checked={on}
                        onChange={() => toggleTopic(topic.id)}
                        className="peer sr-only"
                      />
                      <Check on={on} dark={d} />
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold leading-snug ${heading}`}>{topic.label}</span>
                        <span className={`block text-xs leading-relaxed mt-1 ${muted}`}>{topic.blurb}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* ── Open question ── */}
            <div>
              <label htmlFor="sem-question" className={label}>
                Anything specific you&rsquo;re stuck on? <span className="font-normal normal-case tracking-normal opacity-60">— optional</span>
              </label>
              <textarea
                id="sem-question" rows={4} value={question} maxLength={2000}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="A situation with an athlete, a question you'd like answered — anything you'd want addressed on the day."
                className={`${input} resize-y leading-relaxed`}
              />
            </div>

            {/* Honeypot — hidden from people, tempting to bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="sem-website">Website</label>
              <input
                id="sem-website" type="text" tabIndex={-1} autoComplete="off"
                value={website} onChange={(e) => setWebsite(e.target.value)}
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
                PowerFlow can email me about this seminar — the joining link, any change of
                plan, and the follow-up. Nothing else, and you can ask us to delete your
                details at any time.
              </span>
            </label>

            {error && (
              <p className={`text-sm rounded-xl border px-4 py-3 ${tc(d, "border-red-500/30 bg-red-500/10 text-red-300", "border-red-200 bg-red-50 text-red-700")}`}>
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-xl py-4 text-sm font-extrabold uppercase tracking-[0.12em] transition disabled:opacity-50 ${tc(d,
                  "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_8px_30px_-10px_rgba(124,58,237,0.9)]",
                  "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_8px_24px_-12px_rgba(124,58,237,0.8)]")}`}
              >
                {submitting ? "Sending…" : avail?.isFull ? "Join the waitlist" : "Save my spot"}
              </button>

              <p className={`text-center text-[11px] ${muted}`}>
                {avail?.isFull
                  ? `All ${SEMINAR.maxParticipants} spots are taken — you'll go on the waitlist and we'll email you if one frees up.`
                  : "Free. You can change your topics or cancel at any time."}
              </p>
            </div>
          </form>
        )}

        {/* ── Footer ── */}
        <div className="mt-14 text-center space-y-1.5">
          <a
            href="mailto:david@power-flow.eu?subject=Mental%20Performance%20for%20Coaches%20seminar"
            className={`block text-[11px] transition ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}
          >
            david@power-flow.eu
          </a>
          <a
            href="https://www.instagram.com/powerfloweu/"
            target="_blank" rel="noopener noreferrer"
            className={`block text-[11px] transition ${tc(d, "text-zinc-500 hover:text-zinc-300", "text-gray-400 hover:text-gray-600")}`}
          >
            @powerfloweu
          </a>
        </div>

      </div>
    </div>
  );
}
