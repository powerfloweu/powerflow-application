"use client";

/**
 * VoicePhotoCapture
 *
 * Renders two small buttons — "Voice" and "Photo" — that let an athlete
 * record a voice note or snap a photo of their handwritten log.
 *
 * The captured file is sent to POST /api/ai/parse-entry which transcribes
 * (ElevenLabs Scribe) or OCRs (Claude Vision) the content, then parses it
 * into structured journal / training-log fields.
 *
 * The parent receives the result via `onParsed` and can pre-fill form fields.
 */

import React from "react";

// ─── Public result types (imported by consumers) ─────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

type State = "idle" | "recording" | "processing";

type Props = {
  mode: "journal" | "training";
  onParsed: (result: ParsedResult) => void;
  /** Called whenever processing starts or finishes (useful to disable parent save) */
  onProcessingChange?: (isProcessing: boolean) => void;
};

export default function VoicePhotoCapture({ mode, onParsed, onProcessingChange }: Props) {
  const [state, setState] = React.useState<State>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const recorderRef  = React.useRef<MediaRecorder | null>(null);
  const chunksRef    = React.useRef<Blob[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Notify parent whenever processing state changes
  const setStateAndNotify = React.useCallback((s: State) => {
    setState(s);
    onProcessingChange?.(s === "processing");
  }, [onProcessingChange]);

  // ── Send file to API ────────────────────────────────────────────────────────

  async function sendFile(blob: Blob, fileType: "audio" | "image", filename: string) {
    setStateAndNotify("processing");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", blob, filename);
      fd.append("fileType", fileType);
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

  // ── Voice recording ─────────────────────────────────────────────────────────

  async function startRecording() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording not supported on this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick the best supported MIME type
      const mimeType = (["audio/webm", "audio/ogg", "audio/mp4"] as const)
        .find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const ext = mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mp4")
          ? "mp4"
          : "webm";
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        sendFile(blob, "audio", `recording.${ext}`);
      };

      recorderRef.current = recorder;
      recorder.start();
      setStateAndNotify("recording");
    } catch {
      setError("Microphone access denied");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      // state → processing is set inside recorder.onstop → sendFile
    }
  }

  function handleMicClick() {
    if (state === "recording") stopRecording();
    else if (state === "idle") startRecording();
  }

  // ── Photo capture ───────────────────────────────────────────────────────────

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be reselected
    sendFile(file, "image", file.name);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const busy = state !== "idle";

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* ── Mic button ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={state === "processing"}
        title={state === "recording" ? "Tap to stop recording" : "Record a voice note"}
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
            {/* Microphone SVG */}
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden>
              <rect x="5" y="1" width="6" height="8" rx="3" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M2.5 7.5A5.5 5.5 0 0 0 8 13a5.5 5.5 0 0 0 5.5-5.5"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
              />
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
        {/* Camera SVG */}
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden>
          <path
            d="M1 5.5A1.5 1.5 0 0 1 2.5 4h.879l.707-1.414A1 1 0 0 1 5 2h6a1 1 0 0 1 .894.553L12.621 4H13.5A1.5 1.5 0 0 1 15 5.5v7A1.5 1.5 0 0 1 13.5 14h-11A1.5 1.5 0 0 1 1 12.5v-7z"
            stroke="currentColor" strokeWidth="1.3"
          />
          <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Photo
      </button>

      {/* Hidden file input — uses camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* Error */}
      {error && (
        <p className="w-full font-saira text-[10px] text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
}
