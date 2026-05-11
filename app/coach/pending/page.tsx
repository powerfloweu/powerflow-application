"use client";

import React from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import type { CoachApplication } from "@/lib/athlete";

type Step = "loading" | "questionnaire" | "waiting" | "rejected";

const QUESTIONS: { key: keyof CoachApplication; label: string; placeholder: string; type: "text" | "textarea" | "number" }[] = [
  { key: "athletes_count", label: "How many athletes do you currently coach?", placeholder: "e.g. 12", type: "number" },
  { key: "instagram",      label: "Your Instagram handle",                     placeholder: "@yourhandle", type: "text" },
  { key: "sports",         label: "What sport(s) / disciplines do you work with?", placeholder: "e.g. Powerlifting, Weightlifting, Strongman", type: "text" },
  { key: "background",     label: "Briefly describe your coaching background", placeholder: "Certifications, years of experience, competitive background…", type: "textarea" },
  { key: "why_powerflow",  label: "Why do you want to use PowerFlow?",         placeholder: "What drew you to the platform?", type: "textarea" },
];

export default function CoachPendingPage() {
  const [step, setStep]     = React.useState<Step>("loading");
  const [name, setName]     = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm]     = React.useState<CoachApplication>({
    athletes_count: "",
    instagram: "",
    sports: "",
    background: "",
    why_powerflow: "",
  });

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        if (!p) { setStep("questionnaire"); return; }
        if (p.display_name) setName(p.display_name.split(" ")[0]);
        if (p.coach_status === "rejected") { setStep("rejected"); return; }
        if (p.coach_application) { setStep("waiting"); return; }
        setStep("questionnaire");
      })
      .catch(() => setStep("questionnaire"));
  }, []);

  const signOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coach_application: form }),
      });
      setStep("waiting");
    } catch {
      // still move forward — don't block the coach
      setStep("waiting");
    } finally {
      setSaving(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center px-6">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,0.09),transparent_60%)]" />
      </div>
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Image src="/fm_powerflow_logo_verziok_01_negative.png" alt="PowerFlow" width={64} height={64} className="opacity-90" priority />
        </div>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.3em] text-purple-400 mb-4 text-center">
          PowerFlow · Coach
        </p>
        {children}
      </div>
    </div>
  );

  if (step === "loading") {
    return (
      <Shell>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (step === "rejected") {
    return (
      <Shell>
        <div className="text-center">
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-4">
            Application not approved
          </h1>
          <p className="font-saira text-sm text-zinc-400 leading-relaxed mb-3">
            Unfortunately your coach application wasn&apos;t approved at this time. This can happen if the platform isn&apos;t the right fit yet, or if we&apos;re at capacity.
          </p>
          <p className="font-saira text-sm text-zinc-500 leading-relaxed mb-8">
            If you think this is a mistake or want to discuss further, reach out directly.
          </p>
          <div className="rounded-2xl border border-white/5 bg-surface-card px-5 py-4 mb-8">
            <p className="font-saira text-xs text-zinc-400 mb-1">Get in touch</p>
            <a href="mailto:david@power-flow.eu" className="font-saira text-sm font-semibold text-purple-300 hover:text-purple-200 transition">
              david@power-flow.eu
            </a>
          </div>
          <button type="button" onClick={signOut} className="font-saira text-[11px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition">
            Sign out
          </button>
        </div>
      </Shell>
    );
  }

  if (step === "waiting") {
    return (
      <Shell>
        <div className="text-center max-w-sm mx-auto">
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-4">
            {name ? `Thanks, ${name}.` : "You're on the list."}
          </h1>
          <p className="font-saira text-sm text-zinc-400 leading-relaxed mb-3">
            Your application is under review. We go through every coach manually to keep the platform quality high.
          </p>
          <p className="font-saira text-sm text-zinc-500 leading-relaxed mb-10">
            You&apos;ll receive an email at your Google address once you&apos;re approved — usually within 1–2 business days.
          </p>
          <div className="rounded-2xl border border-white/5 bg-surface-card px-5 py-4 mb-8">
            <p className="font-saira text-xs text-zinc-400 mb-1">Questions? Reach out directly.</p>
            <a href="mailto:david@power-flow.eu" className="font-saira text-sm font-semibold text-purple-300 hover:text-purple-200 transition">
              david@power-flow.eu
            </a>
          </div>
          <button type="button" onClick={signOut} className="font-saira text-[11px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition">
            Sign out
          </button>
        </div>
      </Shell>
    );
  }

  // Questionnaire step
  return (
    <Shell>
      <div className="rounded-2xl border border-white/8 bg-surface-card p-6 md:p-8">
        <h1 className="font-saira text-xl font-extrabold uppercase tracking-tight text-white mb-1">
          Coach application
        </h1>
        <p className="font-saira text-xs text-zinc-400 mb-6">
          A few quick questions before we review your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {QUESTIONS.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block font-saira text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300 mb-1.5">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  required
                  rows={3}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-surface-base px-3 py-2.5 font-saira text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              ) : (
                <input
                  required
                  type={type}
                  min={type === "number" ? 0 : undefined}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-surface-base px-3 py-2.5 font-saira text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-saira text-sm font-bold uppercase tracking-[0.14em] text-white transition mt-2"
          >
            {saving ? "Submitting…" : "Submit application"}
          </button>
        </form>

        <button type="button" onClick={signOut} className="w-full mt-4 font-saira text-[11px] uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition">
          Sign out
        </button>
      </div>
    </Shell>
  );
}
