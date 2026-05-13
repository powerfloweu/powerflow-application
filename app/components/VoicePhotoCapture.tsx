"use client";

/**
 * VoicePhotoCapture
 *
 * Voice → uses the browser's built-in Web Speech API (no backend transcription,
 *   no API keys needed). Sends the transcript as JSON to /api/ai/parse-entry.
 *
 * Photo → uploads the image to /api/ai/parse-entry which OCRs it with Claude Vision.
 *
 * The parent receives the structured result via `onParsed`.
 */

import React from "react";

// ─── Public result types ──────────────────────────────────────────────────────

export type ParsedJournalResult = {
  type: "journal";
  content: string;
  rawText: string;
};

export type ParsedTrainingResult = {
  type: "training";
  rawText: string;
  thoughts_before?: string;
  thoughts_after?: string;
  what_went_well?: string;
  frustrations?: string;
  next_session?: string;
};

export type ParsedResult = ParsedJournalResult | ParsedTrainingResult;

// ─── Web Speech API type shim ─────────────────────────────────────────────────

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition ??
    null
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type State = "idle" | "recording" | "processing";

type Props = {
  mode: "journal" | "training";
  onParsed: (result: ParsedResult) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
};

export default function VoicePhotoCapture({ mode, onParsed, onProcessingChange }: Props) {
  const [state, setState]     = React.useState<State>("idle");
  const [error, setError]     = React.useState<string | null>(null);
  const [liveText, setLiveText] = React.useState("");

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const finalTextRef   = React.useRef<string>("");
  const fileInputRef   = React.useRef<HTMLInputElement>(null);

  const setStateAndNotify = React.useCallback((s: State) => {
    setState(s);
    onProcessingChange?.(s === "processing");
  }, [onProcessingChange]);

  // ── Send transcript text to API (JSON body) ─────────────────────────────────

  async function sendText(text: string) {
    setStateAndNotify("processing");
    setLiveText("");
    setError(null);
    try {
      const res = await fetch("/api/ai/parse-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Processing failed");
      onParsed(data as ParsedResult);
      setStateAndNotify("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStateAndNotify("idle");
    }
  }

  // ── Send image file to API (FormData) ───────────────────────────────────────

  async function sendImage(file: File) {
    setStateAndNotify("processing");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("fileType", "image");
      fd.append("mode", mode);

      const res = await fetch("/api/ai/parse-entry", { method: "POST", body: fd });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Processing failed");

      onParsed(data as ParsedResult);
      setStateAndNotify("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStateAndNotify("idle");
    }
  }

  // ── Web Speech API recording ────────────────────────────────────────────────

  function startRecording() {
    setError(null);
    const SR = getSpeechRecognition();
    if (!SR) {
      setError("Voice not supported — please use Chrome or Safari, or use Photo instead.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;

    finalTextRef.current = "";
    setLiveText("");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTextRef.current += event.results[i][0].transcript + " ";
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      setLiveText((finalTextRef.current + interim).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setError(`Mic error: ${event.error}`);
        setStateAndNotify("idle");
        setLiveText("");
      }
    };

    recognition.onend = () => {
      const text = finalTextRef.current.trim();
      if (text) {
        sendText(text);
      } else {
        setStateAndNotify("idle");
        setLiveText("");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStateAndNotify("recording");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    // onend → sendText → sets state to processing
  }

  function handleMicClick() {
    if (state === "recording") stopRecording();
    else if (state === "idle") startRecording();
  }

  // ── Photo change ────────────────────────────────────────────────────────────

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    sendImage(file);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const busy = state !== "idle";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">

        {/* ── Mic button ─────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={state === "processing"}
          title={state === "recording" ? "Tap to stop" : "Record a voice note"}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-saira text-[10px] uppercase tracking-[0.18em] transition disabled:opacity-50 ${
            state === "recording"
              ? "bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse"
              : state === "processing"
              ? "bg-purple-500/10 border border-purple-500/30 text-purple-400"
              : "bg-white/5 border border-white/10 text-zinc-400 hover:border-purple-500/40 hover:text-purple-300"
          }`}
        >
          {state === "recording" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              Stop
            </>
          ) : state === "processing" ? (
            <>
              <span className="w-3 h-3 rounded-full border border-purple-400/40 border-t-purple-400 animate-spin flex-shrink-0" />
              AI filling…
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden>
                <rect x="5" y="1" width="6" height="8" rx="3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2.5 7.5A5.5 5.5 0 0 0 8 13a5.5 5.5 0 0 0 5.5-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Voice
            </>
          )}
        </button>

        {/* ── Camera / photo button ───────────────────────────── */}
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          title="Take a photo of your handwritten notes"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-saira text-[10px] uppercase tracking-[0.18em] bg-white/5 border border-white/10 text-zinc-400 hover:border-purple-500/40 hover:text-purple-300 transition disabled:opacity-50"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden>
            <path d="M1 5.5A1.5 1.5 0 0 1 2.5 4h.879l.707-1.414A1 1 0 0 1 5 2h6a1 1 0 0 1 .894.553L12.621 4H13.5A1.5 1.5 0 0 1 15 5.5v7A1.5 1.5 0 0 1 13.5 14h-11A1.5 1.5 0 0 1 1 12.5v-7z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Photo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Live transcription preview while recording */}
      {state === "recording" && liveText && (
        <p className="font-saira text-[10px] text-zinc-400 italic leading-relaxed max-w-xs truncate">
          {liveText}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="font-saira text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}
