"use client";

import React from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROUND_LABEL: Record<number, string> = {
  1: "30-day check-in",
  2: "60-day check-in",
  3: "90-day check-in",
};

const ATHLETE_TOOLS = [
  "Daily log", "Training journal", "Weekly check-in",
  "Monthly check-in", "Coach AI", "Visualization tools", "Mental tests",
];

const COACH_PROFILE_PARTS = [
  "Check-in ratings", "Journal entries", "Test scores",
  "Training logs", "Coach AI conversations",
];


// ── Sub-components ────────────────────────────────────────────────────────────

function MultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(
      selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt],
    );
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`rounded-full border px-3 py-1.5 font-saira text-xs font-semibold transition ${
            selected.includes(opt)
              ? "border-purple-500 bg-purple-600/80 text-white"
              : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-zinc-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function NpsRow({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`aspect-square rounded-lg border font-saira text-xs font-semibold transition ${
            value === n
              ? "border-purple-500 bg-purple-600 text-white"
              : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-white"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-saira text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-purple-500/40"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const DISMISS_KEY = "survey_dismissed_until";

export default function SurveyModal() {
  const [state, setState] = React.useState<
    | { status: "idle" }
    | { status: "due"; round: number; role: string }
    | { status: "done" }
  >({ status: "idle" });

  // Answers
  const [toolsUsed, setToolsUsed]       = React.useState<string[]>([]);
  const [dashboardQ, setDashboardQ]     = React.useState("");
  const [profileParts, setProfileParts] = React.useState<string[]>([]);
  const [athleteMentioned, setAthleteMentioned] = React.useState("");
  const [mentalShift, setMentalShift]   = React.useState("");
  const [surprised, setSurprised]       = React.useState("");
  const [missing, setMissing]           = React.useState("");
  const [wtp, setWtp]                   = React.useState<string | null>(null);
  const [nps, setNps]                   = React.useState<number | null>(null);
  const [submitting, setSubmitting]   = React.useState(false);

  React.useEffect(() => {
    // Respect a temporary dismissal (48 h)
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    fetch("/api/survey")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.due) setState({ status: "due", round: data.round, role: data.role });
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    // Snooze for 48 hours
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 48 * 60 * 60 * 1000));
    setState({ status: "done" });
  };

  const submit = async () => {
    if (state.status !== "due") return;
    setSubmitting(true);

    const answers =
      state.role === "coach"
        ? { dashboard_change: dashboardQ, profile_parts: profileParts, athletes_mentioned: athleteMentioned, what_would_help: missing, wtp, nps }
        : { tools_used: toolsUsed, mental_shift: mentalShift, surprised, fix_or_add: missing, wtp, nps };

    await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round: state.round, answers }),
    }).catch(() => {});

    localStorage.removeItem(DISMISS_KEY);
    setSubmitting(false);
    setState({ status: "done" });
  };

  if (state.status !== "due") return null;

  const { round, role } = state;
  const isCoach = role === "coach";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-[#111118] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600/20 border-b border-purple-500/20 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.24em] text-purple-400 mb-0.5">
              PowerFlow · Feedback
            </p>
            <p className="font-saira text-base font-bold text-white">{ROUND_LABEL[round]}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition"
            aria-label="Maybe later"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Questions */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">

          {isCoach ? (
            <>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  How has the app changed how you work with your athletes — if at all?
                </p>
                <TextArea
                  value={dashboardQ}
                  onChange={setDashboardQ}
                  placeholder="What's different, if anything…"
                />
              </div>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  Which parts of the athlete profile do you actually look at?
                </p>
                <MultiSelect
                  options={COACH_PROFILE_PARTS}
                  selected={profileParts}
                  onChange={setProfileParts}
                />
              </div>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  Have any of your athletes mentioned the app to you unprompted?
                </p>
                <TextArea
                  value={athleteMentioned}
                  onChange={setAthleteMentioned}
                  placeholder="What did they say…"
                />
              </div>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  What would make you reach for this before a session with an athlete?
                </p>
                <TextArea
                  value={missing}
                  onChange={setMissing}
                  placeholder="What's missing or what would make it click…"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  Which parts did you actually use?
                </p>
                <MultiSelect
                  options={ATHLETE_TOOLS}
                  selected={toolsUsed}
                  onChange={setToolsUsed}
                />
              </div>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  What, if anything, has shifted in how you think about or approach training since using it?
                </p>
                <TextArea
                  value={mentalShift}
                  onChange={setMentalShift}
                  placeholder="Even a small shift counts…"
                />
              </div>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  Has anything surprised you about how you responded to the mental work?
                </p>
                <TextArea
                  value={surprised}
                  onChange={setSurprised}
                  placeholder="Expected one thing, got another…"
                />
              </div>
              <div className="space-y-2">
                <p className="font-saira text-xs font-semibold text-zinc-300">
                  If you could change one thing, what would it be?
                </p>
                <TextArea
                  value={missing}
                  onChange={setMissing}
                  placeholder="Be brutal…"
                />
              </div>
            </>
          )}

          {/* Willingness to pay */}
          <div className="space-y-2">
            <p className="font-saira text-xs font-semibold text-zinc-300">
              What would you pay for this per month?
            </p>
            <div className="flex items-center gap-2">
              <span className="font-saira text-sm text-zinc-400">€</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={wtp ?? ""}
                onChange={(e) => setWtp(e.target.value || null)}
                className="w-28 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-saira text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="font-saira text-sm text-zinc-500">/month</span>
            </div>
          </div>

          {/* NPS — shared */}
          <div className="space-y-2">
            <p className="font-saira text-xs font-semibold text-zinc-300">
              How likely are you to keep using PowerFlow? <span className="text-zinc-500 font-normal">(1 = no, 10 = definitely)</span>
            </p>
            <NpsRow value={nps} onChange={setNps} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-xl border border-white/10 py-2.5 font-saira text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 font-saira text-xs font-bold text-white transition disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send feedback →"}
          </button>
        </div>
      </div>
    </div>
  );
}
