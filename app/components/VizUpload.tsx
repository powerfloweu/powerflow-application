"use client";

import React from "react";

interface Props {
  toolId: "viz-squat" | "viz-bench" | "viz-deadlift";
  /** Whether the user already has a stored recording for this tool (path non-empty). */
  hasExisting: boolean;
  /** Called after a successful upload so the parent can update its state. */
  onUploaded: (storagePath: string) => void;
  /** Called after a successful delete. */
  onDeleted: () => void;
}

type Phase = "idle" | "uploading" | "ready";

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
  "audio/aac", "audio/ogg", "audio/wav", "audio/webm", "audio/flac", "audio/quicktime"];

export default function VizUpload({ toolId, hasExisting, onUploaded, onDeleted }: Props) {
  const [phase, setPhase]           = React.useState<Phase>(hasExisting ? "ready" : "idle");
  const [file, setFile]             = React.useState<File | null>(null);
  const [uploadPct, setUploadPct]   = React.useState(0);
  const [error, setError]           = React.useState<string | null>(null);
  const [deleting, setDeleting]     = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [dragOver, setDragOver]     = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Audio playback (for the existing recording) ──────────────────────────
  const audioRef    = React.useRef<HTMLAudioElement>(null);
  const [playUrl, setPlayUrl]       = React.useState<string | null>(null);
  const [playing, setPlaying]       = React.useState(false);
  const [progress, setProgress]     = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration]     = React.useState(0);
  const [loadingUrl, setLoadingUrl] = React.useState(false);

  // Fetch the signed read URL when entering ready phase
  React.useEffect(() => {
    if (phase !== "ready") return;
    setLoadingUrl(true);
    fetch(`/api/tools/viz-recording?toolId=${toolId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.url) setPlayUrl(d.url); })
      .catch(() => {})
      .finally(() => setLoadingUrl(false));
  }, [phase, toolId]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !playUrl) return;
    if (playing) { el.pause(); } else { el.play().catch(() => {}); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  // ── Upload flow ──────────────────────────────────────────────────────────

  const handleFile = (f: File) => {
    setError(null);
    if (!AUDIO_TYPES.includes(f.type) && !f.name.match(/\.(mp3|m4a|mp4|aac|ogg|wav|webm|flac)$/i)) {
      setError("Please upload an audio file (MP3, M4A, WAV, etc.)");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("File is too large. Maximum size is 100 MB.");
      return;
    }
    setFile(f);
    startUpload(f);
  };

  const startUpload = async (f: File) => {
    setPhase("uploading");
    setUploadPct(0);
    setError(null);
    try {
      // Step 1 — get signed upload URL from our API
      const res = await fetch("/api/tools/viz-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, filename: f.name, mimeType: f.type }),
      });
      if (!res.ok) throw new Error("Could not create upload URL");
      const { signedUrl, storagePath } = await res.json() as { signedUrl: string; storagePath: string };

      // Step 2 — upload directly to Supabase Storage (XHR for progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", f.type || "audio/mpeg");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(f);
      });

      // Step 3 — save path to profile
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viz_recordings: { [toolId]: storagePath } }),
      });

      onUploaded(storagePath);
      setPlayUrl(null); // will re-fetch on phase change
      setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again.");
      setPhase("idle");
      setFile(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/tools/viz-recording?toolId=${toolId}`, { method: "DELETE" });
      setPlayUrl(null);
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setFile(null);
      setPhase("idle");
      onDeleted();
    } catch {
      setError("Couldn't remove the recording — please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Drag-and-drop ────────────────────────────────────────────────────────

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Render: uploading ────────────────────────────────────────────────────

  if (phase === "uploading") {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-section p-4 space-y-3">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Uploading…
        </p>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500 transition-[width] duration-200"
            style={{ width: `${uploadPct}%` }}
          />
        </div>
        <p className="font-saira text-xs text-zinc-500">
          {file?.name} · {uploadPct}%
        </p>
      </div>
    );
  }

  // ── Render: ready (playback) ─────────────────────────────────────────────

  if (phase === "ready") {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-section p-4 space-y-3">
        {/* Hidden audio element */}
        {playUrl && (
          <audio
            ref={audioRef}
            src={playUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
            onTimeUpdate={() => {
              const el = audioRef.current;
              if (!el || !el.duration) return;
              setCurrentTime(el.currentTime);
              setProgress(el.currentTime / el.duration);
            }}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
            preload="metadata"
          />
        )}

        <div className="flex items-center gap-3">
          {/* Play / pause */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={!playUrl || loadingUrl}
            className="w-10 h-10 flex-shrink-0 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 flex items-center justify-center transition"
            aria-label={playing ? "Pause" : "Play"}
          >
            {loadingUrl ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : playing ? (
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="white" aria-hidden>
                <rect x="5" y="3" width="3.5" height="14" rx="1"/>
                <rect x="11.5" y="3" width="3.5" height="14" rx="1"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="w-4 h-4 ml-0.5" fill="white" aria-hidden>
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
              </svg>
            )}
          </button>

          {/* Progress + time */}
          <div className="flex-1 min-w-0">
            <div
              className="h-1.5 rounded-full bg-white/10 cursor-pointer overflow-hidden"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full bg-purple-400 transition-[width]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-saira text-[10px] text-zinc-400 tabular-nums">{fmtTime(currentTime)}</span>
              <span className="font-saira text-[10px] text-zinc-400 tabular-nums">{duration ? fmtTime(duration) : "--:--"}</span>
            </div>
          </div>
        </div>

        {/* Your voice note label + actions */}
        <div className="flex items-center justify-between">
          <p className="font-saira text-[10px] text-zinc-500">Your voice note</p>
          {!confirmDelete ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-saira text-[10px] text-zinc-400 hover:text-purple-300 underline transition"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="font-saira text-[10px] text-zinc-400 hover:text-rose-400 underline transition"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-saira text-[10px] text-zinc-400">Remove this note?</span>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); handleDelete(); }}
                disabled={deleting}
                className="font-saira text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Explain usage */}
        <p className="font-saira text-[10px] text-zinc-600 leading-relaxed">
          This recording plays as your personal cue during guided audio sessions.
        </p>

        {/* Hidden file input for replace */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />

        {error && <p className="font-saira text-xs text-rose-400">{error}</p>}
      </div>
    );
  }

  // ── Render: idle (file picker) ───────────────────────────────────────────

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed cursor-pointer transition px-5 py-8 flex flex-col items-center gap-3 text-center ${
          dragOver
            ? "border-purple-400/60 bg-purple-500/10"
            : "border-white/15 hover:border-purple-500/40 hover:bg-white/[0.02]"
        }`}
      >
        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
          <svg viewBox="0 0 20 20" className="w-4.5 h-4.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2v10M6 6l4-4 4 4" />
            <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
          </svg>
        </div>
        <div>
          <p className="font-saira text-sm font-semibold text-zinc-300">Drop an audio file here</p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">or tap to browse · MP3, M4A, WAV, etc. · up to 100 MB</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {error && <p className="font-saira text-xs text-rose-400">{error}</p>}
    </div>
  );
}
