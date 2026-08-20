"use client";

/**
 * /seminar — public sign-up for the "Mental Performance for Coaches" seminar.
 *
 * Deliberately outside the (app) route group and outside proxy.ts's APP_ROUTES,
 * so it renders without the app shell and without requiring a session. Most
 * people landing here will not have a PowerFlow account.
 *
 * All copy, topics and capacity rules come from lib/seminar.ts — this file is
 * presentation only.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SEMINAR,
  SEMINAR_HOSTS,
  SEMINAR_TOPICS,
  COACHING_CONTEXTS,
  FORMAT_OPTIONS,
  MATERIAL_OPTIONS,
} from "@/lib/seminar";

function tc(d: boolean, dark: string, light: string) { return d ? dark : light; }

type Availability = { spotsLeft: number; isFull: boolean; closed: boolean };
type Submitted    = { status: "registered" | "waitlist"; already: boolean };

export default function SeminarPage() {
  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [fullName,   setFullName]   = React.useState("");
  const [email,      setEmail]      = React.useState("");
  const [country,    setCountry]    = React.useState("");
  const [context,    setContext]    = React.useState("");
  const [topics,     setTopics]     = React.useState<string[]>([]);
  const [formatPref, setFormatPref] = React.useState("");
  const [materials,  setMaterials]  = React.useState<string[]>([]);
  const [question,   setQuestion]   = React.useState("");
  const [consent,    setConsent]    = React.useState(false);
  const [website,    setWebsite]    = React.useState(""); // honeypot

  const [submitting, setSubmitting] = React.useState(false);
  const [error,      setError]      = React.useState<string | null>(null);
  const [submitted,  setSubmitted]  = React.useState<Submitted | null>(null);
  const [avail,      setAvail]      = React.useState<Availability | null>(null);

  // Rendered on the client only — the viewer's timezone is unknown on the
  // server, and computing it during render would break hydration.
  const [localTime, setLocalTime] = React.useState<string | null>(null);

  const loadAvailability = React.useCallback(() => {
    return fetch("/api/seminar")
      .then((r) => r.json())
      .then((a: Availability) => setAvail(a))
      .catch((err) => console.error("[seminar] availability fetch failed", err));
  }, []);

  React.useEffect(() => {
    loadAvailability();

    const start = new Date(SEMINAR.startsAt);
    const zone  = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Only worth showing when the visitor isn't already on Budapest time.
    if (zone && zone !== "Europe/Budapest") {
      setLocalTime(
        start.toLocaleString(undefined, {
          weekday: "long", day: "numeric", month: "long",
          hour: "2-digit", minute: "2-digit",
        }) + ` (${zone.replace(/_/g, " ")})`,
      );
    }
  }, [loadAvailability]);

  const dateLabel = new Date(SEMINAR.startsAt).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/Budapest",
  });

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
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
        body: JSON.stringify({
          fullName, email, country, context, topics,
          formatPref, materials, question, consent, website,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
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
  const panel  = tc(d, "border-white/[0.10] bg-white/[0.03]", "border-gray-200 bg-white");
  const label  = `block text-[11px] font-bold uppercase tracking-[0.16em] mb-2 ${tc(d, "text-zinc-400", "text-gray-500")}`;
  // text-base (16px) on inputs — anything smaller makes iOS Safari zoom on focus.
  const input  = `w-full rounded-xl border px-4 py-3 text-base outline-none transition ${tc(d,
    "border-white/10 bg-white/[0.04] text-white placeholder-zinc-600 focus:border-violet-500/60",
    "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-violet-500")}`;
  const muted  = tc(d, "text-zinc-400", "text-gray-500");
  const heading = tc(d, "text-white", "text-gray-900");

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
          <Link href="/coaches" className="flex items-center gap-3">
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
            Online seminar
          </p>
          <h1 className={`text-4xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 ${heading}`}>
            Mental performance<br />for coaches.
          </h1>
          <p className={`text-sm leading-relaxed ${muted}`}>
            A small, working session for coaches on the psychological side of the job — reading
            your athlete&rsquo;s state, saying the right thing at the right moment, and staying
            useful when things go badly. Kept deliberately small so everyone gets to speak.
          </p>
        </div>

        {/* ── When ── */}
        <div className={`w-full rounded-2xl border p-5 mb-8 ${panel}`}>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] mb-1 ${muted}`}>When</p>
              <p className={`text-sm font-bold ${heading}`}>{dateLabel}</p>
              <p className={`text-xs mt-0.5 ${muted}`}>{SEMINAR.hostTimeLabel}</p>
              {localTime && (
                <p className={`text-xs mt-1.5 ${tc(d, "text-violet-300", "text-violet-600")}`}>
                  Your time: {localTime}
                </p>
              )}
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] mb-1 ${muted}`}>Length</p>
              <p className={`text-sm font-bold ${heading}`}>{SEMINAR.durationLabel}</p>
              <p className={`text-xs mt-0.5 ${muted}`}>Online</p>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] mb-1 ${muted}`}>Group size</p>
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
        <div className="w-full mb-10">
          <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${tc(d, "text-violet-400", "text-violet-600")}`}>
            Run by three of us
          </p>
          <p className={`text-xs mb-5 ${muted}`}>
            All three coach powerlifters, and all three have stood in the warm-up room
            trying to get it right.
          </p>

          <div className="space-y-3">
            {SEMINAR_HOSTS.map((host) => (
              <div key={host.slug} className={`rounded-2xl border p-5 ${panel}`}>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden relative">
                    {host.photo ? (
                      <Image
                        src={host.photo} alt={host.name} fill
                        className="object-cover object-top" sizes="56px"
                      />
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
                <p className={`text-xs leading-relaxed ${tc(d, "text-zinc-300", "text-gray-600")}`}>
                  {host.intro}
                </p>
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
                  : "You'll get the joining link by email closer to the date. Your topic picks go straight into what we cover."}
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
          <form onSubmit={handleSubmit} className="w-full space-y-8">

            {/* ── You ── */}
            <fieldset className="space-y-4">
              <legend className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-4 ${tc(d, "text-violet-400", "text-violet-600")}`}>
                About you
              </legend>

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
                <label htmlFor="sem-country" className={label}>
                  Country <span className="font-normal normal-case tracking-normal opacity-60">— optional</span>
                </label>
                <input
                  id="sem-country" type="text" value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete="country-name" placeholder="So we know your timezone" className={input}
                />
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
            </fieldset>

            {/* ── Topics ── */}
            <fieldset>
              <legend className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${tc(d, "text-violet-400", "text-violet-600")}`}>
                What should we cover?
              </legend>
              <p className={`text-xs mb-4 ${muted}`}>
                Pick everything that interests you. We build the session around what the group
                chooses, so this genuinely decides the content.
              </p>

              <div className="space-y-2">
                {SEMINAR_TOPICS.map((topic) => {
                  const on = topics.includes(topic.id);
                  return (
                    <label
                      key={topic.id}
                      className={`flex gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                        on
                          ? tc(d, "border-violet-500/40 bg-violet-500/[0.08]", "border-violet-400 bg-violet-50")
                          : panel
                      }`}
                    >
                      <input
                        type="checkbox" checked={on}
                        onChange={() => toggle(topics, setTopics, topic.id)}
                        className="mt-0.5 h-5 w-5 flex-shrink-0 accent-violet-500"
                      />
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold leading-snug ${heading}`}>{topic.label}</span>
                        <span className={`block text-xs leading-relaxed mt-1 ${muted}`}>{topic.blurb}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* ── Format ── */}
            <fieldset>
              <legend className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${tc(d, "text-violet-400", "text-violet-600")}`}>
                How would you rather run it?
              </legend>
              <p className={`text-xs mb-4 ${muted}`}>Not decided yet — your answers settle it.</p>

              <div className="space-y-2">
                {FORMAT_OPTIONS.map((opt) => {
                  const on = formatPref === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                        on
                          ? tc(d, "border-violet-500/40 bg-violet-500/[0.08]", "border-violet-400 bg-violet-50")
                          : panel
                      }`}
                    >
                      <input
                        type="radio" name="formatPref" value={opt.id} checked={on}
                        onChange={() => setFormatPref(opt.id)}
                        className="mt-0.5 h-5 w-5 flex-shrink-0 accent-violet-500"
                      />
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold ${heading}`}>{opt.label}</span>
                        <span className={`block text-xs mt-0.5 ${muted}`}>{opt.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* ── Follow-up material ── */}
            <fieldset>
              <legend className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${tc(d, "text-violet-400", "text-violet-600")}`}>
                Afterwards
              </legend>
              <p className={`text-xs mb-4 ${muted}`}>Would you use either of these? Tick any, or none.</p>

              <div className="flex flex-wrap gap-2">
                {MATERIAL_OPTIONS.map((opt) => {
                  const on = materials.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition ${
                        on
                          ? tc(d, "border-violet-500/40 bg-violet-500/[0.08]", "border-violet-400 bg-violet-50")
                          : panel
                      }`}
                    >
                      <input
                        type="checkbox" checked={on}
                        onChange={() => toggle(materials, setMaterials, opt.id)}
                        className="h-5 w-5 accent-violet-500"
                      />
                      <span className={`text-sm font-semibold ${heading}`}>{opt.label}</span>
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
                id="sem-question" rows={4} value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={2000}
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
            <label className={`flex gap-3 rounded-2xl border p-4 cursor-pointer ${panel}`}>
              <input
                type="checkbox" checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 flex-shrink-0 accent-violet-500"
              />
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

            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-xl border py-4 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 ${tc(d,
                "bg-violet-500/15 border-violet-500/30 text-violet-200 hover:bg-violet-500/25",
                "bg-violet-600 border-violet-600 text-white hover:bg-violet-500")}`}
            >
              {submitting
                ? "Sending…"
                : avail?.isFull
                  ? "Join the waitlist →"
                  : "Save my spot →"}
            </button>

            {avail?.isFull && (
              <p className={`text-center text-xs -mt-4 ${muted}`}>
                All {SEMINAR.maxParticipants} spots are taken — you&rsquo;ll go on the waitlist and
                we&rsquo;ll email you if one frees up.
              </p>
            )}
          </form>
        )}

        {/* ── Footer ── */}
        <div className="mt-12 text-center space-y-1.5">
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
