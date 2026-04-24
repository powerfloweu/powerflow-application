"use client";

import React from "react";

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    section: "Visualizations",
    items: [
      {
        id: "viz-squat",
        title: "Squat",
        tagline: "Mental rehearsal · Squat",
        icon: "S",
        color: "purple",
        steps: [
          "Stand at the back of the platform. See the bar loaded, chalk on your hands. Take a slow breath — you've done this hundreds of times.",
          "Step under the bar. Feel its weight settle across your upper back. Hands locked in, elbows pulling down and in.",
          "Unrack with confidence. Two steps back — feet planted, toes out at your natural angle.",
          "Big breath into your belly. Fill 360° — brace your core like a punch is coming. Hold it.",
          "Sit back and down. Knees tracking over your toes. Hit depth — hips crease the knee.",
          "Floor pressing drill: drive the floor away. Hips and shoulders rise together. Don't let your chest drop first.",
          "Lockout. Stand tall. The bar hasn't moved — you have. Rack it under control.",
        ],
      },
      {
        id: "viz-bench",
        title: "Bench",
        tagline: "Mental rehearsal · Bench Press",
        icon: "B",
        color: "purple",
        steps: [
          "Lie back and feel the bench under your shoulder blades. Set your arch — hips down, chest up.",
          "Plant your feet hard into the floor. Feel the leg drive before you even touch the bar.",
          "Grip the bar — squeeze it like you're trying to snap it in half. Feel your lats engage.",
          "Unrack with a straight path. Bar directly over your chest. Shoulders packed into the bench.",
          "Lower under control — bar to your lower chest, elbows tucking slightly. Feel the stretch load.",
          "Press — drive the bar back and slightly toward your face. Full hip-to-shoulder power.",
          "Lock out cleanly. Pause at the top. Your chest did that.",
        ],
      },
      {
        id: "viz-deadlift",
        title: "Deadlift",
        tagline: "Mental rehearsal · Deadlift",
        icon: "D",
        color: "purple",
        steps: [
          "Walk to the bar. It's not going anywhere. You control the pace.",
          "Set your feet hip-width, shins close. Hinge and grip — double overhand or mixed, whichever is yours.",
          "Pull the slack out. Hear the click. The bar is now an extension of your hands.",
          "Big air — fill your belly, brace hard. Think '360° of pressure'.",
          "Leg press the floor away. Hips and shoulders move together from the floor.",
          "Bar stays dragging up your shins, past your knees. Don't let it drift forward.",
          "Drive your hips through at the top. Stand completely upright. Done.",
        ],
      },
    ],
  },
  {
    section: "Activation",
    items: [
      {
        id: "resource-activation",
        title: "Resource Activation",
        tagline: "Anchor your peak state",
        icon: "⚡",
        color: "amber",
        steps: [
          "Close your eyes. Think of a specific moment when you felt completely in the zone — strong, confident, and unstoppable. Make it real.",
          "Step into that moment fully. What do you see around you? What sounds are there? What does your body feel like — the tension, the power?",
          "Let the feeling build to its peak. When it's at maximum intensity, squeeze your thumb and index finger together firmly. Hold for 3 seconds.",
          "Release, open your eyes, shake it off. Then close your eyes again and repeat — build the memory, squeeze at the peak.",
          "Do this 5 times total. Each repetition deepens the anchor.",
          "To use it: before a heavy set, squeeze your thumb and index finger. The state comes back automatically. It is a skill — the more you practise it, the faster and stronger it fires.",
        ],
      },
    ],
  },
  {
    section: "Relaxation",
    items: [
      {
        id: "pmr",
        title: "Progressive Muscle Relaxation",
        tagline: "Full-body tension release",
        icon: "~",
        color: "teal",
        steps: [
          "Lie on your back or sit in a chair. Close your eyes. Take three slow breaths to settle.",
          "Feet and calves: curl your toes tightly, tense your calves. Hold 5 seconds. Release completely. Notice the contrast.",
          "Thighs and glutes: squeeze hard. Hold 5 seconds. Release. Let the weight sink into the surface beneath you.",
          "Abdomen and core: pull your navel in, brace. Hold 5 seconds. Release — let your belly be totally soft.",
          "Chest and back: take a deep breath and hold it while tensing your chest. Hold 5 seconds. Exhale fully. Feel your spine settle.",
          "Hands and forearms: clench your fists tight. Hold 5 seconds. Release — fingers loose, palms open.",
          "Shoulders and neck: shrug your shoulders up to your ears. Hold 5 seconds. Drop them completely.",
          "Face: scrunch your face — eyes, jaw, forehead all tight. Hold 5 seconds. Release into a neutral expression.",
          "Scan your body from feet to crown. If any area still holds tension, breathe into it and let go. Remain still for 2 minutes.",
        ],
      },
      {
        id: "breathing",
        title: "Breathing Methods",
        tagline: "Breath as a performance tool",
        icon: "∿",
        color: "teal",
        steps: [
          "Box Breathing (calm focus): Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Use before a competition, between attempts, or during weigh-in stress.",
          "4-7-8 Breathing (sleep & deep recovery): Inhale 4s → Hold 7s → Exhale 8s. Activates the parasympathetic system. Best used at night or after a hard training block.",
          "Power Breathing (pre-lift activation): 3 sharp inhales through the nose stacking air, then one explosive exhale through the mouth. Raises arousal and focus. Use in the 30 seconds before your call.",
          "Tactical Breathing (between sets): In through the nose for 4s, out through the mouth for 6s. Keeps cortisol in check during a long session.",
          "General rule: slow and long exhales calm you down; sharp and fast exhales activate you. You always have your breath as a tool — use it deliberately.",
        ],
      },
    ],
  },
] as const;

type ToolColor = "purple" | "amber" | "teal";

const COLOR_MAP: Record<ToolColor, {
  border: string; bg: string; icon: string; num: string;
}> = {
  purple: {
    border: "border-purple-500/20",
    bg:     "bg-purple-500/[0.06]",
    icon:   "bg-purple-500/15 text-purple-300 border-purple-500/30",
    num:    "text-purple-400",
  },
  amber: {
    border: "border-amber-500/20",
    bg:     "bg-amber-500/[0.05]",
    icon:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
    num:    "text-amber-400",
  },
  teal: {
    border: "border-teal-500/20",
    bg:     "bg-teal-500/[0.05]",
    icon:   "bg-teal-500/15 text-teal-300 border-teal-500/30",
    num:    "text-teal-400",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [openId, setOpenId]       = React.useState<string | null>(null);
  const [requestText, setRequestText] = React.useState("");
  const [requestState, setRequestState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const submitRequest = async () => {
    const text = requestText.trim();
    if (!text) return;
    setRequestState("sending");
    try {
      const res = await fetch("/api/tool-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed");
      setRequestState("sent");
      setRequestText("");
    } catch {
      setRequestState("error");
      setTimeout(() => setRequestState("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-8 sm:px-6 max-w-lg mx-auto">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · TOOLS
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
          Mental Tools
        </h1>
        <p className="font-saira text-sm text-zinc-500">
          Visualizations, activation &amp; relaxation methods
        </p>
      </div>

      {/* ── Tool sections ─────────────────────────────────────── */}
      <div className="space-y-8">
        {TOOLS.map(({ section, items }) => (
          <div key={section}>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-500 mb-3">
              {section}
            </p>
            <div className="space-y-2">
              {items.map((tool) => {
                const c    = COLOR_MAP[tool.color as ToolColor];
                const open = openId === tool.id;
                return (
                  <div
                    key={tool.id}
                    className={`rounded-2xl border transition-colors ${
                      open ? `${c.border} ${c.bg}` : "border-white/5 bg-[#17131F]"
                    }`}
                  >
                    {/* Header row */}
                    <button
                      type="button"
                      onClick={() => toggle(tool.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-saira text-sm font-bold border ${c.icon}`}>
                        {tool.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-saira text-sm font-semibold text-white">{tool.title}</p>
                        <p className="font-saira text-[11px] text-zinc-500">{tool.tagline}</p>
                      </div>
                      <span className={`font-saira text-sm text-zinc-600 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
                        →
                      </span>
                    </button>

                    {/* Expandable steps */}
                    {open && (
                      <div className="px-5 pb-5">
                        <div className={`w-full h-px mb-4 border-t ${c.border}`} />
                        <ol className="space-y-3">
                          {tool.steps.map((step, i) => (
                            <li key={i} className="flex gap-3">
                              <span className={`font-saira text-[10px] font-bold flex-shrink-0 mt-0.5 w-5 tabular-nums ${c.num}`}>
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <p className="font-saira text-[13px] text-zinc-300 leading-relaxed">
                                {step}
                              </p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Request a tool ──────────────────────────────────── */}
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-500 mb-3">
            Suggest a Tool
          </p>
          <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5">
            {requestState === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">
                  ✓
                </div>
                <p className="font-saira text-sm font-semibold text-emerald-300">Request sent</p>
                <p className="font-saira text-xs text-zinc-500 max-w-[240px]">
                  Thank you — we review every suggestion and add the most-requested tools.
                </p>
                <button
                  type="button"
                  onClick={() => setRequestState("idle")}
                  className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-400 underline transition"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <>
                <p className="font-saira text-xs text-zinc-400 mb-3">
                  Is there a mental skill or technique you'd like to see added? Let us know.
                </p>
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="e.g. A pre-meet focus routine, self-talk scripts, handling nerves on the platform…"
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-3 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark] mb-3"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="font-saira text-[10px] text-zinc-600 tabular-nums">
                    {requestText.length}/500
                  </span>
                  <button
                    type="button"
                    onClick={submitRequest}
                    disabled={!requestText.trim() || requestState === "sending"}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-5 py-2.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
                  >
                    {requestState === "sending" ? "Sending…" : requestState === "error" ? "Try again" : "Send request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
