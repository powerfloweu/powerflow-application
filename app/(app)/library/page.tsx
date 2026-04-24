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
      {
        id: "arousal-control",
        title: "Arousal Control",
        tagline: "Find your optimal zone",
        icon: "◎",
        color: "amber",
        steps: [
          "Peak performance sits between too calm and too anxious. Learn to adjust both directions.",
          "Too activated (nervous, scattered, heart racing): Box breathing — inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 rounds. Slows your nervous system within 2 minutes.",
          "Too flat (low energy, unmotivated, heavy): Power posing — stand tall, chest up, hands on hips or raised overhead. Hold for 2 minutes. Research shows this raises testosterone and energy.",
          "Activation cue (pre-lift spike): Explosive exhale, stamp one foot, say your personal cue word out loud. This creates a quick, trained spike of arousal — ideal 10–15 seconds before your attempt.",
          "Know your zone: after each session, rate your mental state 1–10. Over time you'll identify your personal optimal range — most athletes peak between 6–8.",
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
  border: string; bg: string; icon: string; dot: string; num: string;
}> = {
  purple: {
    border: "border-purple-500/20",
    bg:     "bg-purple-500/[0.06]",
    icon:   "bg-purple-500/15 text-purple-300 border-purple-500/30",
    dot:    "bg-purple-400",
    num:    "text-purple-400",
  },
  amber: {
    border: "border-amber-500/20",
    bg:     "bg-amber-500/[0.05]",
    icon:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot:    "bg-amber-400",
    num:    "text-amber-400",
  },
  teal: {
    border: "border-teal-500/20",
    bg:     "bg-teal-500/[0.05]",
    icon:   "bg-teal-500/15 text-teal-300 border-teal-500/30",
    dot:    "bg-teal-400",
    num:    "text-teal-400",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [openId, setOpenId] = React.useState<string | null>(null);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

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

      {/* ── Sections ──────────────────────────────────────────── */}
      <div className="space-y-8">
        {TOOLS.map(({ section, items }) => (
          <div key={section}>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-500 mb-3">
              {section}
            </p>
            <div className="space-y-2">
              {items.map((tool) => {
                const c   = COLOR_MAP[tool.color as ToolColor];
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
                      <div
                        className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-saira text-sm font-bold border ${c.icon}`}
                      >
                        {tool.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-saira text-sm font-semibold text-white">
                          {tool.title}
                        </p>
                        <p className="font-saira text-[11px] text-zinc-500">
                          {tool.tagline}
                        </p>
                      </div>
                      <span className={`font-saira text-sm transition-transform duration-200 ${open ? "rotate-90" : ""} text-zinc-600`}>
                        →
                      </span>
                    </button>

                    {/* Expandable steps */}
                    {open && (
                      <div className="px-5 pb-5">
                        <div className={`w-full h-px mb-4 ${c.border} border-t`} />
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
      </div>
    </div>
  );
}
