"use client";

import React from "react";

// ── Prompts ───────────────────────────────────────────────────────────────────

const VIZ_PROMPTS: Record<string, { prompt: string; hint: string }[]> = {
  "viz-squat": [
    {
      prompt: "Settle in. You are about to step onto the platform.",
      hint: "Your breathing, your focus, how your body feels right now.",
    },
    {
      prompt: "Walk to the bar. It is loaded. This is your lift.",
      hint: "What does it look like? What weight is on it? What do you notice first?",
    },
    {
      prompt: "Step under the bar. Feel it settle across your back.",
      hint: "Where does it sit? How does the contact feel? Are you balanced?",
    },
    {
      prompt: "Set your stance. Feet exactly where they belong.",
      hint: "Feel the floor through your feet. Tension building from the ground up.",
    },
    {
      prompt: "Take a big breath. Brace hard. Every muscle locks in.",
      hint: "What does maximum tension feel like in your torso and legs?",
    },
    {
      prompt: "Begin the descent. Control every centimetre.",
      hint: "Hips back and down. Bar stays balanced. What are you feeling?",
    },
    {
      prompt: "Hit depth. Drive. Push the floor away.",
      hint: "Chest up, knees tracking, every muscle firing. Feel the rep through.",
    },
    {
      prompt: "Lock out. Breathe. You made that lift.",
      hint: "Stay with the feeling of a perfect rep. What does it feel like to own it?",
    },
  ],
  "viz-bench": [
    {
      prompt: "You are lying on the bench. Get tight.",
      hint: "Upper back and glutes pressing down. How much tension can you create?",
    },
    {
      prompt: "Set your grip. Bar settled in your hands.",
      hint: "Where exactly does the bar sit in your palm? How hard are you squeezing?",
    },
    {
      prompt: "Unrack. Feel the weight transfer to you.",
      hint: "Take a moment with the bar locked out. How does it feel in your hands?",
    },
    {
      prompt: "Lower the bar — controlled, tight, on your path.",
      hint: "Feel the bar track to your chest. Where is your touch point?",
    },
    {
      prompt: "Touch. Pause. The tension is coiled and ready.",
      hint: "The bar is on your chest. Every muscle waiting. What do you feel?",
    },
    {
      prompt: "Press. Drive your back into the bench.",
      hint: "Push yourself away from the bar. Feel the force leave your body.",
    },
    {
      prompt: "Lock out. Clean. Rerack smooth.",
      hint: "The lift is yours. How did your body feel from first breath to lockout?",
    },
    {
      prompt: "Breathe. Stay with the feeling of a perfect bench.",
      hint: "Carry this exactly as it felt into your next attempt.",
    },
  ],
  "viz-deadlift": [
    {
      prompt: "Approach the bar. Look at it.",
      hint: "It is loaded exactly right. This is your pull. What do you feel standing over it?",
    },
    {
      prompt: "Set your stance. Feel your feet connect to the floor.",
      hint: "Feet exactly where they belong. How is your weight distributed?",
    },
    {
      prompt: "Hinge to the bar. Take your grip.",
      hint: "Feel the knurling in your hands. Your lats engage. You are ready.",
    },
    {
      prompt: "Pull the slack out. Feel the tension before it moves.",
      hint: "The bar bends before it breaks the floor. What does that resistance feel like?",
    },
    {
      prompt: "Big breath. Brace. Every muscle engaged.",
      hint: "Maximum tension, maximum air. You are coiled and ready.",
    },
    {
      prompt: "Push the floor away. Bar stays close.",
      hint: "Hips and shoulders rise together. Feel the bar track up your legs.",
    },
    {
      prompt: "Hips through. Stand tall. Lock out.",
      hint: "Squeeze every muscle at the top. You are standing with the bar.",
    },
    {
      prompt: "Hold it. You made that lift.",
      hint: "Stay in this moment. How does a perfect deadlift feel in your body?",
    },
  ],
};

// ── Speech recognition (single-utterance, auto-stops on silence) ──────────────

function useSingleShotSpeech(onResult: (text: string) => void) {
  const [listening, setListening]   = React.useState(false);
  const [supported, setSupported]   = React.useState(false);
  const recogRef = React.useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    const SR =
      (window as Window & typeof globalThis & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    setSupported(!!SR);
    if (!SR) return;
    const r = new SR();
    r.continuous      = true;
    r.interimResults  = false;
    r.lang            = "";
    r.onresult = (e: SpeechRecognitionEvent) => {
      const texts: string[] = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) texts.push(e.results[i][0].transcript.trim());
      }
      if (texts.length) onResult(texts.join(" "));
    };
    r.onend  = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = React.useCallback(() => {
    const r = recogRef.current;
    if (!r || listening) return;
    try { r.start(); setListening(true); } catch { /* already running */ }
  }, [listening]);

  const stop = React.useCallback(() => {
    const r = recogRef.current;
    if (!r || !listening) return;
    r.stop();
    setListening(false);
  }, [listening]);

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
  const { listening, supported, toggle, stop } = useSingleShotSpeech((text) => {
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
            Speak your mental imagery aloud — or type it. Each prompt gives you space
            to picture your perfect lift in as much detail as you can.
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
