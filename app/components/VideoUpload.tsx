"use client";
import React from "react";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "processing" }
  | { status: "ready"; playbackId: string }
  | { status: "error"; message: string };

/**
 * Reusable Mux video upload component.
 * Handles the full flow: file pick → direct upload to Mux → poll until ready → callback.
 *
 * Usage:
 *   <VideoUpload
 *     onUploadComplete={(playbackId) => doSomething(playbackId)}
 *     existingPlaybackId={lift.mux_playback_id}
 *   />
 */
export default function VideoUpload({
  onUploadComplete,
  existingPlaybackId,
}: {
  onUploadComplete: (playbackId: string) => void;
  existingPlaybackId?: string | null;
}) {
  const [state, setState] = React.useState<UploadState>(
    existingPlaybackId
      ? { status: "ready", playbackId: existingPlaybackId }
      : { status: "idle" }
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pollRef = React.useRef<NodeJS.Timeout | null>(null);
  // Checked after every await in the upload/poll chain so an unmount landing
  // mid-await doesn't let the async continuation re-arm a new timer or call
  // setState / onUploadComplete against an unmounted component.
  const cancelledRef = React.useRef(false);

  React.useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    };
  }, []);

  async function handleFile(file: File) {
    setState({ status: "uploading", progress: 0 });

    let uploadId: string;
    let uploadUrl: string;
    try {
      const res = await fetch("/api/mux/upload", { method: "POST" });
      if (cancelledRef.current) return;
      if (!res.ok) throw new Error("Failed to create upload");
      ({ uploadId, uploadUrl } = await res.json());
      if (cancelledRef.current) return;
    } catch {
      if (!cancelledRef.current) {
        setState({ status: "error", message: "Could not start upload. Try again." });
      }
      return;
    }

    // Upload directly to Mux with XHR for progress tracking
    const uploadOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && !cancelledRef.current) {
          setState({ status: "uploading", progress: Math.round((e.loaded / e.total) * 100) });
        }
      };
      xhr.onload  = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.open("PUT", uploadUrl);
      xhr.send(file);
    });

    if (cancelledRef.current) return;

    if (!uploadOk) {
      setState({ status: "error", message: "Upload failed. Check your connection and try again." });
      return;
    }

    // Poll until asset is ready. Capped attempts + gentle backoff so a stuck
    // Mux asset can't poll forever, and cancelledRef stops the chain dead if
    // the component unmounts while a poll's fetch is in flight (the async
    // callback's cleanup would otherwise race an already-fired timer handle
    // and re-arm a new one after unmount).
    setState({ status: "processing" });
    const MAX_ATTEMPTS = 40;
    let attempt = 0;

    function poll() {
      if (cancelledRef.current) return;
      attempt += 1;
      const delay = Math.min(2500 + attempt * 250, 8000); // backoff, capped at 8s
      pollRef.current = setTimeout(async () => {
        if (cancelledRef.current) return;
        try {
          const r = await fetch(`/api/mux/upload?upload_id=${uploadId}`).then(res => res.ok ? res.json() : null);
          if (cancelledRef.current) return;
          if (r?.playbackId) {
            setState({ status: "ready", playbackId: r.playbackId });
            onUploadComplete(r.playbackId);
          } else if (r?.status === "error") {
            setState({ status: "error", message: "Video processing failed." });
          } else if (attempt >= MAX_ATTEMPTS) {
            setState({ status: "error", message: "Video is taking longer than expected to process. Please try again shortly." });
          } else {
            poll();
          }
        } catch {
          if (cancelledRef.current) return;
          if (attempt >= MAX_ATTEMPTS) {
            setState({ status: "error", message: "Video is taking longer than expected to process. Please try again shortly." });
          } else {
            poll();
          }
        }
      }, delay);
    }
    poll();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  }

  if (state.status === "ready") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-500/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="font-saira text-xs text-emerald-300">Video uploaded</span>
        </div>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition"
        >
          Replace
        </button>
      </div>
    );
  }

  if (state.status === "uploading") {
    return (
      <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
        <div className="flex justify-between">
          <span className="font-saira text-[10px] text-zinc-400">Uploading…</span>
          <span className="font-saira text-[10px] text-zinc-400 tabular-nums">{state.progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-400 transition-all duration-200"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (state.status === "processing") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
        <div className="w-3 h-3 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin flex-shrink-0" />
        <span className="font-saira text-xs text-zinc-400">Processing video…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-rose-400/30 bg-rose-500/5 px-3 py-2 space-y-1">
        <p className="font-saira text-xs text-rose-400">{state.message}</p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  // idle
  return (
    <>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFileChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-dashed border-white/20 hover:border-purple-400/40 bg-white/[0.02] hover:bg-purple-500/5 py-3 font-saira text-xs text-zinc-400 hover:text-zinc-200 transition"
      >
        ↑ Upload video
      </button>
    </>
  );
}
