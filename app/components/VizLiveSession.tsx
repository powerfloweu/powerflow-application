"use client";

import React from "react";

// ── Prompts ───────────────────────────────────────────────────────────────────

const VIZ_PROMPTS: Record<string, { prompt: string; hint: string }[]> = {
  "viz-squat": [
    {
      prompt: "What do you do before you approach the bar?",
      hint: "Think about your routine — breathing, mindset, anything you do to prepare.",
    },
    {
      prompt: "How and where do you grip the bar?",
      hint: "Width, hand position, wrist angle — describe exactly where you hold it.",
    },
    {
      prompt: "What do you do with your hands?",
      hint: "Squeeze, hook, press — what do your hands do once they're on the bar?",
    },
    {
      prompt: "What do you do with your feet?",
      hint: "Stance width, toe angle, pressure distribution — describe your foot position.",
    },
    {
      prompt: "What do you do to make your back solid?",
      hint: "Upper back tightness, chest position, lats — how do you create rigidity?",
    },
    {
      prompt: "How do you walk out?",
      hint: "Number of steps, direction, how you find your stance after unracking.",
    },
    {
      prompt: "How do you breathe before initiating the lift?",
      hint: "Timing, depth, where you feel the air go — describe your breath sequence.",
    },
    {
      prompt: "Where do you look?",
      hint: "Eye position and gaze — where do your eyes go and why?",
    },
    {
      prompt: "How do you know you are ready to start?",
      hint: "What signal or feeling tells you it's time to begin the descent?",
    },
    {
      prompt: "How do you initiate the movement?",
      hint: "What moves first? What cue starts the squat?",
    },
    {
      prompt: "How does the movement itself feel after you've started?",
      hint: "Sensations in your legs, back, core — what do you notice on the way down?",
    },
    {
      prompt: "How do you breathe during the lift?",
      hint: "Do you hold, release, or anything else during the movement?",
    },
    {
      prompt: "How do you know you've reached depth?",
      hint: "What tells you — a feeling, a position, a cue?",
    },
    {
      prompt: "What muscles do you activate?",
      hint: "Which muscle groups do you consciously engage and when?",
    },
    {
      prompt: "What do you do at the sticking point?",
      hint: "Where does it get hard and what do you do to push through?",
    },
    {
      prompt: "What do you do when it is hard?",
      hint: "Your mental and physical response when the lift fights back.",
    },
    {
      prompt: "How do you finish the squat?",
      hint: "Lockout, rerack, breath — what does the end of the lift look like?",
    },
    {
      prompt: "What are the critical points you want to focus on while performing a squat?",
      hint: "Distil everything — what are the two or three things that matter most?",
    },
  ],
  "viz-bench": [
    {
      prompt: "What do you do before you approach the bench?",
      hint: "Your pre-lift routine — breathing, focus, anything that sets you up.",
    },
    {
      prompt: "How and where do you grip the bar?",
      hint: "Grip width, hand position, where the bar sits in your palm.",
    },
    {
      prompt: "What do you do with your hands?",
      hint: "Squeeze direction, wrist position — what are your hands doing?",
    },
    {
      prompt: "What do you do with your feet?",
      hint: "Foot placement, drive through the floor — describe your foot position and role.",
    },
    {
      prompt: "What do you do to reach your best bridge?",
      hint: "Back arch, upper back position, glute drive — how do you set your bridge?",
    },
    {
      prompt: "What do you do to make your back solid?",
      hint: "Upper back tightness, scapula position — how do you create a stable base?",
    },
    {
      prompt: "How do you breathe before initiating the lift?",
      hint: "When do you breathe, how deep, where does the air go?",
    },
    {
      prompt: "How do you take the bar out?",
      hint: "The unrack — who helps, how you move it, where it ends up.",
    },
    {
      prompt: "Where do you look?",
      hint: "Eye position during the lift — fixed point, ceiling, bar?",
    },
    {
      prompt: "How do you know you are ready to start?",
      hint: "What signal or feeling tells you to begin lowering the bar?",
    },
    {
      prompt: "How do you initiate the movement?",
      hint: "What moves first? What cue starts the descent?",
    },
    {
      prompt: "How does the movement itself feel after you've started?",
      hint: "Sensations in your chest, shoulders, lats — what do you notice on the way down?",
    },
    {
      prompt: "How do you breathe during the lift?",
      hint: "Held breath, bracing, release — describe the breathing through the rep.",
    },
    {
      prompt: "Where on your chest do you touch the bar?",
      hint: "Exact contact point — describe where the bar lands.",
    },
    {
      prompt: "How do you keep yourself tight while holding the bar at your chest?",
      hint: "Tension in chest, lats, legs — how do you stay rigid at the bottom?",
    },
    {
      prompt: "What muscles do you activate?",
      hint: "Which muscle groups do you consciously engage and when?",
    },
    {
      prompt: "How do you use your legs?",
      hint: "Leg drive, foot position, pushing into the floor — describe your leg role.",
    },
    {
      prompt: "What do you do at the dead centre?",
      hint: "The sticking point mid-press — what do you do to push through?",
    },
    {
      prompt: "What do you do when it is hard?",
      hint: "Your mental and physical response when the bar slows or stalls.",
    },
    {
      prompt: "How do you finish the bench press?",
      hint: "Lockout, rerack, breath — what does the end of the lift look like?",
    },
    {
      prompt: "What are the critical points you want to focus on while performing a bench press?",
      hint: "Distil everything — what are the two or three things that matter most?",
    },
  ],
  "viz-deadlift": [
    {
      prompt: "What do you do before you approach the bar?",
      hint: "Your pre-lift routine — chalk, music, breathing, focus cues.",
    },
    {
      prompt: "How and where do you grip the bar?",
      hint: "Grip type, hand width, where the bar sits in your palm.",
    },
    {
      prompt: "What do you do with your hands?",
      hint: "Hook grip, straps, squeeze — what exactly do your hands do?",
    },
    {
      prompt: "What do you do with your feet?",
      hint: "Stance width, toe angle, shin contact — describe your foot position.",
    },
    {
      prompt: "How do you know you've reached your best stance?",
      hint: "What does it feel like when everything is in the right position?",
    },
    {
      prompt: "What do you do to make your whole body solid?",
      hint: "Lats, core, upper back — how do you create full-body tension?",
    },
    {
      prompt: "How do you breathe before initiating the lift?",
      hint: "When, how deep, where the air goes — describe the full breath sequence.",
    },
    {
      prompt: "Where do you look?",
      hint: "Eye position and gaze during the pull.",
    },
    {
      prompt: "How do you know you are ready to start?",
      hint: "What signal or feeling tells you it's time to initiate the pull?",
    },
    {
      prompt: "How do you initiate the movement?",
      hint: "What moves first? What cue starts the deadlift?",
    },
    {
      prompt: "How does the movement itself feel after you've started?",
      hint: "Sensations in your legs, back, grip — what do you notice as the bar leaves the floor?",
    },
    {
      prompt: "How do you breathe during the lift?",
      hint: "Held breath, bracing, when you exhale — describe it through the rep.",
    },
    {
      prompt: "What muscles do you activate?",
      hint: "Which muscle groups do you consciously engage and when?",
    },
    {
      prompt: "What do you do at the dead centre?",
      hint: "The sticking point at or above the knee — what gets you through?",
    },
    {
      prompt: "What do you do when it is hard?",
      hint: "Your mental and physical response when the pull slows or fights back.",
    },
    {
      prompt: "How do you finish the deadlift?",
      hint: "Hips through, lockout, lower — what does the top of the lift look like?",
    },
    {
      prompt: "What are the critical points you want to focus on while performing a deadlift?",
      hint: "Distil everything — what are the two or three things that matter most?",
    },
  ],
};

// ── Speech recognition ────────────────────────────────────────────────────────
// Creates a FRESH SpeechRecognition instance on every start() call.
// Reusing the same instance across questions causes Chrome to silently ignore
// r.start() once the instance has fired onend, which is why speech stopped
// working after the first couple of questions.
// onResultRef keeps the callback current so the step value is never stale.

type SRConstructor = new () => SpeechRecognition;

function useSpeech(onResult: (text: string) => void) {
  const [listening, setListening] = React.useState(false);
  const [supported, setSupported] = React.useState(false);

  // Keep callback fresh without recreating start/stop
  const onResultRef = React.useRef(onResult);
  React.useLayoutEffect(() => { onResultRef.current = onResult; });

  const SRClassRef = React.useRef<SRConstructor | null>(null);
  const recogRef   = React.useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    const SR: SRConstructor | undefined =
      (window as Window & typeof globalThis & { SpeechRecognition?: SRConstructor }).SpeechRecognition ??
      (window as Window & typeof globalThis & { webkitSpeechRecognition?: SRConstructor }).webkitSpeechRecognition;
    if (SR) { SRClassRef.current = SR; setSupported(true); }
  }, []);

  const start = React.useCallback(() => {
    if (listening || !SRClassRef.current) return;
    // Always create a fresh instance — spent instances can't be restarted
    const SR = SRClassRef.current;
    const r  = new SR();
    r.continuous     = true;
    r.interimResults = false;
    r.lang           = "";
    r.onresult = (e: SpeechRecognitionEvent) => {
      const texts: string[] = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) texts.push(e.results[i][0].transcript.trim());
      }
      if (texts.length) onResultRef.current(texts.join(" "));
    };
    r.onend   = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    try { r.start(); setListening(true); } catch { /* already running */ }
  }, [listening]);

  const stop = React.useCallback(() => {
    const r = recogRef.current;
    if (!r) return;
    try { r.stop(); } catch { /* already stopped */ }
    recogRef.current = null;
    setListening(false);
  }, []);

  const toggle = React.useCallback(() => {
    listening ? stop() : start();
  }, [listening, start, stop]);

  return { listening, supported, toggle, stop };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  toolId: "viz-squat" | "viz-bench" | "viz-deadlift";
  onClose: () => void;
}

type Phase = "intro" | "session" | "done";

export default function VizLiveSession({ toolId, onClose }: Props) {
  const prompts = VIZ_PROMPTS[toolId] ?? [];

  const [phase,        setPhase]        = React.useState<Phase>("intro");
  const [step,         setStep]         = React.useState(0);
  const [responses,    setResponses]    = React.useState<string[]>(() => prompts.map(() => ""));
  const [saving,       setSaving]       = React.useState(false);
  const [saved,        setSaved]        = React.useState(false);
  const [saveError,    setSaveError]    = React.useState<string | null>(null);
  const [confirmExit,  setConfirmExit]  = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const liftLabel =
    toolId === "viz-squat" ? "Squat" :
    toolId === "viz-bench" ? "Bench" : "Deadlift";

  const saveToJournal = async () => {
    setSaving(true);
    setSaveError(null);
    const lines: string[] = [`── Visualization: ${liftLabel} ──`];
    prompts.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.prompt}`);
      lines.push(responses[i].trim() ? `   ${responses[i].trim()}` : "   (skipped)");
    });
    const text = lines.join("\n");
    try {
      const today = new Date();
      const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/training/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_date: ymd, thoughts_before: text }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaved(true);
    } catch {
      setSaveError("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Accumulate STT results into the current step's response
  const { listening, supported, toggle, stop } = useSpeech((text) => {
    setResponses((prev) => {
      const next = [...prev];
      const sep = next[step] && !next[step].endsWith(" ") ? " " : "";
      next[step] = next[step] + sep + text;
      return next;
    });
    // Auto-grow textarea
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    });
  });

  const goNext = () => {
    if (listening) stop();
    if (step < prompts.length - 1) {
      setStep((s) => s + 1);
    } else {
      setPhase("done");
    }
  };

  const goBack = () => {
    if (listening) stop();
    if (step > 0) setStep((s) => s - 1);
  };

  const restart = () => {
    stop();
    setResponses(prompts.map(() => ""));
    setStep(0);
    setPhase("intro");
  };

  // Reset textarea height when step changes
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [step]);

  const progress = (step + 1) / prompts.length;

  // ── Intro screen ──────────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-5 space-y-4">
        <div>
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.24em] text-purple-400 mb-1.5">
            Live Session · {prompts.length} prompts
          </p>
          <p className="font-saira text-sm text-zinc-300 leading-relaxed">
            Answer each question in your own words — speak or type. Your answers
            become the building blocks of your personal visualization: exactly how
            {" "}<em>you</em> perform each lift, in your own language.
            {supported && " Your voice is captured in real time."}
            {!supported && " Your browser doesn't support voice input, but you can type your responses."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPhase("session")}
            className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
          >
            Start session
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-3 font-saira text-[11px] text-zinc-400 hover:text-zinc-300 hover:border-white/20 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────────────────

  if (phase === "done") {
    const answered = responses.filter((r) => r.trim().length > 0).length;
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-4">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400 mb-1">
            Session complete
          </p>
          <p className="font-saira text-sm text-zinc-300">
            {answered} of {prompts.length} prompts answered. That mental rehearsal is now locked in.
          </p>
        </div>

        {/* Transcript */}
        <div className="space-y-3">
          {prompts.map((p, i) => (
            <div key={i} className="rounded-xl border border-white/6 bg-surface-section px-4 py-3">
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-400 mb-1">
                {i + 1} / {prompts.length}
              </p>
              <p className="font-saira text-xs font-semibold text-zinc-300 mb-1.5">{p.prompt}</p>
              {responses[i].trim() ? (
                <p className="font-saira text-xs text-zinc-400 leading-relaxed italic">
                  "{responses[i].trim()}"
                </p>
              ) : (
                <p className="font-saira text-[10px] text-zinc-600 italic">Skipped</p>
              )}
            </div>
          ))}
        </div>

        {/* Save to journal */}
        {!saved ? (
          <button
            type="button"
            onClick={saveToJournal}
            disabled={saving}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2.5 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
            ) : "Save to today's journal"}
          </button>
        ) : (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-center">
            <p className="font-saira text-[11px] text-emerald-400 font-semibold">Saved to your journal ✓</p>
          </div>
        )}
        {saveError && <p className="font-saira text-[10px] text-rose-400 text-center -mt-1">{saveError}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={restart}
            className="flex-1 rounded-xl border border-purple-500/30 bg-purple-500/[0.08] px-4 py-2.5 font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-300 hover:bg-purple-500/[0.14] transition"
          >
            Run again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 font-saira text-[11px] text-zinc-400 hover:text-zinc-300 hover:border-white/20 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Session screen ────────────────────────────────────────────────────────

  const current = prompts[step];

  return (
    <div className="space-y-4">

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500 transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="font-saira text-[10px] text-zinc-500 tabular-nums flex-shrink-0">
          {step + 1} / {prompts.length}
        </span>
      </div>

      {/* Prompt card */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-5 py-4">
        <p className="font-saira text-base font-bold text-white leading-snug mb-2">
          {current.prompt}
        </p>
        <p className="font-saira text-[11px] text-zinc-400 leading-relaxed">
          {current.hint}
        </p>
      </div>

      {/* Response area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={responses[step]}
          onChange={(e) => {
            const next = [...responses];
            next[step] = e.target.value;
            setResponses(next);
            // Auto-grow
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          placeholder={
            listening
              ? "Listening…"
              : supported
              ? "Speak or type your answer…"
              : "Type your answer…"
          }
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-surface-section px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-purple-400/40 resize-none overflow-hidden [color-scheme:dark] transition"
          style={{ minHeight: "80px" }}
        />
        {listening && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-saira text-[10px] text-rose-400">Recording</span>
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">

        {/* Back */}
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-300 hover:border-white/20 disabled:opacity-30 transition flex-shrink-0"
          aria-label="Previous prompt"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>

        {/* Mic */}
        {supported && (
          <button
            type="button"
            onClick={toggle}
            aria-label={listening ? "Stop recording" : "Start voice input"}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
              listening
                ? "bg-rose-600 hover:bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.4)]"
                : "border border-white/10 bg-surface-section text-zinc-400 hover:border-purple-500/40 hover:text-purple-300"
            }`}
          >
            {listening ? (
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="white" aria-hidden>
                <rect x="5" y="5" width="10" height="10" rx="1.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="7" y="2" width="6" height="10" rx="3" />
                <path d="M4 10a6 6 0 0012 0" />
                <line x1="10" y1="16" x2="10" y2="19" />
                <line x1="7" y1="19" x2="13" y2="19" />
              </svg>
            )}
          </button>
        )}

        {/* Next / Finish */}
        <button
          type="button"
          onClick={goNext}
          className="flex-1 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
        >
          {step < prompts.length - 1 ? "Next →" : "Finish"}
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={() => setConfirmExit(true)}
          className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition flex-shrink-0"
          aria-label="Exit session"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {/* Exit confirm banner */}
      {confirmExit && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-2.5">
          <p className="font-saira text-[11px] text-zinc-300">Exit? Progress will be lost.</p>
          <div className="flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => { stop(); onClose(); }}
              className="font-saira text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
            >
              Exit
            </button>
            <button
              type="button"
              onClick={() => setConfirmExit(false)}
              className="font-saira text-[11px] text-zinc-400 hover:text-zinc-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Skip hint */}
      <p className="font-saira text-[10px] text-zinc-400 text-center">
        Nothing to say? Tap Next → to move on
      </p>
    </div>
  );
}
