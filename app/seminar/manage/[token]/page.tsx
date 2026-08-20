"use client";

/**
 * /seminar/manage/[token] — self-service page linked from the confirmation email.
 *
 * The token in the URL is the only credential, so this page never shows more
 * than the person already knows about themselves, and never lets them change
 * the email address the link was sent to.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SEMINAR_TOPICS } from "@/lib/seminar";
import { tc, Check, Eyebrow } from "../../ui";

type Status = "registered" | "waitlist" | "cancelled";
type Signup = {
  fullName: string; email: string; topics: string[];
  question: string | null; status: Status;
};
type Loaded = { signup: Signup; seminar: { title: string; startsAt: string; hostTime: string; duration: string } };

export default function ManageSignupPage() {
  const token = String(useParams().token ?? "");

  const [isDark, setIsDark] = React.useState(true);
  const d = isDark;

  const [data,    setData]    = React.useState<Loaded | null>(null);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);

  const [topics,   setTopics]   = React.useState<string[]>([]);
  const [question, setQuestion] = React.useState("");

  const [saving,    setSaving]    = React.useState(false);
  const [saved,     setSaved]     = React.useState(false);
  const [saveErr,   setSaveErr]   = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [cancelled, setCancelled] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/seminar/manage/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) { setLoadErr(j.error ?? "That link isn't valid any more."); return; }
        setData(j);
        setTopics(j.signup.topics ?? []);
        setQuestion(j.signup.question ?? "");
        if (j.signup.status === "cancelled") setCancelled(true);
      })
      .catch((err) => {
        console.error("[seminar/manage] load failed", err);
        setLoadErr("We couldn't load your sign-up. Check your connection and try again.");
      });
  }, [token]);

  function toggleTopic(id: string) {
    setSaved(false);
    setTopics((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function save() {
    setSaveErr(null);
    if (topics.length === 0) { setSaveErr("Keep at least one topic selected."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/seminar/manage/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, question }),
      });
      const j = await res.json();
      if (!res.ok) { setSaveErr(j.error ?? "We couldn't save that."); return; }
      setSaved(true);
    } catch (err) {
      console.error("[seminar/manage] save failed", err);
      setSaveErr("We couldn't reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelPlace() {
    setSaveErr(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/seminar/manage/${token}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) { setSaveErr(j.error ?? "We couldn't cancel that."); return; }
      setCancelled(true);
      setConfirming(false);
    } catch (err) {
      console.error("[seminar/manage] cancel failed", err);
      setSaveErr("We couldn't reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const panel   = tc(d, "border-white/[0.10] bg-white/[0.03]", "border-gray-200 bg-white");
  const muted   = tc(d, "text-zinc-400", "text-gray-500");
  const heading = tc(d, "text-white", "text-gray-900");
  const chosen  = tc(d,
    "border-violet-500/50 bg-violet-500/[0.10] shadow-[0_0_0_1px_rgba(139,92,246,0.25)]",
    "border-violet-400 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]");
  const input   = `w-full rounded-xl border px-4 py-3 text-base outline-none transition ${tc(d,
    "border-white/10 bg-white/[0.04] text-white placeholder-zinc-600 focus:border-violet-500/60",
    "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-violet-500")}`;

  const dateLabel = data
    ? new Date(data.seminar.startsAt).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Budapest",
      })
    : "";

  return (
    <div className={`min-h-screen font-saira flex flex-col ${tc(d, "bg-[#0A0A0A] text-white", "bg-gray-50 text-gray-900")}`}>
      {d && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.15),transparent_65%)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-5 py-12 sm:py-16 max-w-xl mx-auto w-full">

        <div className="w-full flex items-center justify-between mb-12">
          <Link href="/seminar" className="flex items-center gap-3">
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

        {loadErr ? (
          <div className={`w-full rounded-2xl border p-6 text-center ${panel}`}>
            <p className={`text-sm font-bold mb-1 ${heading}`}>{loadErr}</p>
            <Link href="/seminar" className={`inline-block mt-3 text-[11px] ${tc(d, "text-violet-400 hover:text-violet-300", "text-violet-600 hover:text-violet-700")}`}>
              Go to the sign-up page →
            </Link>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-violet-400/40 border-t-violet-400 animate-spin" />
          </div>
        ) : cancelled ? (
          <div className={`w-full rounded-2xl border p-6 ${panel}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${muted}`}>Cancelled</p>
            <h1 className={`text-2xl font-extrabold uppercase tracking-tight mb-3 ${heading}`}>
              Your place is released
            </h1>
            <p className={`text-sm leading-relaxed ${muted}`}>
              Thanks for letting us know — it goes to whoever is next in line. If you change
              your mind, you can sign up again and we&rsquo;ll fit you in if there&rsquo;s room.
            </p>
            <Link
              href="/seminar"
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 mt-5 text-xs font-bold uppercase tracking-wider transition ${tc(d,
                "bg-violet-500/15 border-violet-500/30 text-violet-200 hover:bg-violet-500/25",
                "bg-violet-600 border-violet-600 text-white hover:bg-violet-500")}`}
            >
              Sign up again →
            </Link>
          </div>
        ) : (
          <>
            {/* ── Who and what ── */}
            <div className="w-full mb-8">
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-3 ${tc(d, "text-violet-400", "text-violet-600")}`}>
                {data.signup.status === "waitlist" ? "You're on the waitlist" : "Your place is booked"}
              </p>
              <h1 className={`text-3xl sm:text-4xl font-extrabold uppercase tracking-tight leading-[1.08] mb-4 ${heading}`}>
                {data.seminar.title}
              </h1>
              <p className={`text-sm ${muted}`}>
                {dateLabel} · {data.seminar.hostTime} · {data.seminar.duration}
              </p>
            </div>

            <div className={`w-full rounded-2xl border p-4 mb-8 ${panel}`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] mb-1 ${muted}`}>Signed up as</p>
              <p className={`text-sm font-bold ${heading}`}>{data.signup.fullName}</p>
              <p className={`text-xs ${muted}`}>{data.signup.email}</p>
              <p className={`text-[11px] mt-2 ${muted}`}>
                To change your name or email, email david@power-flow.eu.
              </p>
            </div>

            {/* ── Topics ── */}
            <fieldset className="w-full mb-8">
              <legend className="w-full"><Eyebrow dark={d}>What you&rsquo;d like covered</Eyebrow></legend>
              <p className={`text-xs mb-4 ${muted}`}>Change these as often as you like before the day.</p>
              <div className="space-y-2">
                {SEMINAR_TOPICS.map((topic) => {
                  const on = topics.includes(topic.id);
                  return (
                    <label key={topic.id} className={`flex gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all duration-150 ${on ? chosen : panel}`}>
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

            {/* ── Question ── */}
            <div className="w-full mb-8">
              <label htmlFor="mg-question" className={`block text-[11px] font-bold uppercase tracking-[0.16em] mb-2 ${muted}`}>
                Anything specific you&rsquo;re stuck on?
              </label>
              <textarea
                id="mg-question" rows={4} value={question} maxLength={2000}
                onChange={(e) => { setSaved(false); setQuestion(e.target.value); }}
                placeholder="A situation with an athlete, a question you'd like answered."
                className={`${input} resize-y leading-relaxed`}
              />
            </div>

            {saveErr && (
              <p className={`w-full text-sm rounded-xl border px-4 py-3 mb-4 ${tc(d, "border-red-500/30 bg-red-500/10 text-red-300", "border-red-200 bg-red-50 text-red-700")}`}>
                {saveErr}
              </p>
            )}

            <button
              type="button" onClick={save} disabled={saving}
              className={`w-full rounded-xl border py-4 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 ${tc(d,
                "bg-violet-500/15 border-violet-500/30 text-violet-200 hover:bg-violet-500/25",
                "bg-violet-600 border-violet-600 text-white hover:bg-violet-500")}`}
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
            </button>

            {/* ── Cancel ── */}
            <div className={`w-full mt-10 pt-8 border-t ${tc(d, "border-white/8", "border-gray-200")}`}>
              {confirming ? (
                <div className={`rounded-2xl border p-5 ${tc(d, "border-red-500/25 bg-red-500/[0.05]", "border-red-200 bg-red-50")}`}>
                  <p className={`text-sm font-bold mb-1 ${heading}`}>Give up your place?</p>
                  <p className={`text-xs leading-relaxed mb-4 ${muted}`}>
                    It goes straight to the next person on the waitlist. You can sign up
                    again later, but only if there&rsquo;s still room.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button" onClick={cancelPlace} disabled={saving}
                      className={`flex-1 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 ${tc(d,
                        "bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25",
                        "bg-red-600 border-red-600 text-white hover:bg-red-500")}`}
                    >
                      {saving ? "Cancelling…" : "Yes, cancel"}
                    </button>
                    <button
                      type="button" onClick={() => setConfirming(false)} disabled={saving}
                      className={`flex-1 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition ${panel} ${muted}`}
                    >
                      Keep my place
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button" onClick={() => setConfirming(true)}
                  className={`text-xs transition ${tc(d, "text-zinc-500 hover:text-red-300", "text-gray-400 hover:text-red-600")}`}
                >
                  Can&rsquo;t make it? Cancel my place
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
