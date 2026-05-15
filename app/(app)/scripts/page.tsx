"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/lib/i18n";

type SavedScript = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export default function ScriptsPage() {
  const router = useRouter();
  const { t } = useT();

  const [scripts, setScripts] = React.useState<SavedScript[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [ttsError, setTtsError] = React.useState<string | null>(null);
  const [audioTime, setAudioTime] = React.useState<{ current: number; duration: number } | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [speed, setSpeed] = React.useState<0.75 | 1 | 1.25>(1);

  // ── Audio engine refs ─────────────────────────────────────────────────────────
  // Uses HTMLAudioElement (not Web Audio API) so the OS keeps audio playing when
  // the screen locks — Web Audio AudioContext gets suspended on iOS/Android sleep.
  const audioElRef  = React.useRef<HTMLAudioElement | null>(null);
  const blobUrlRef  = React.useRef<string | null>(null);
  const timerRef    = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef    = React.useRef<AbortController | null>(null);

  // ── On mount: verify ai_access + load scripts ──────────────────────────────

  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/scripts").then((r) => r.json()),
    ])
      .then(([profile, data]) => {
        const tier = profile?.plan_tier ?? "opener";
        const tierOk = tier === "second" || tier === "pr";
        if (!tierOk) {
          router.replace("/upgrade");
          return;
        }
        if (Array.isArray(data)) {
          setScripts(data);
        }
      })
      .catch(() => router.replace("/upgrade"))
      .finally(() => setLoading(false));
  }, [router]);

  // ── Stop audio on unmount (navigation away) ────────────────────────────────
  React.useEffect(() => {
    return () => { stopAudio(true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Audio engine ───────────────────────────────────────────────────────────

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const stopAudio = (silent = false) => {
    clearTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.onended = null;
      audioElRef.current.onplay  = null;
      audioElRef.current.src = "";
      audioElRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
    if (!silent) { setPlayingId(null); setLoadingId(null); setAudioTime(null); }
  };

  const handlePlay = async (script: SavedScript) => {
    const isActive = playingId === script.id || loadingId === script.id;
    stopAudio(true);
    setPlayingId(null);
    setLoadingId(null);
    setAudioTime(null);
    if (isActive) return; // toggle off

    setTtsError(null);
    setLoadingId(script.id);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script.content }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      if (abortRef.current !== controller) return; // stopped while loading

      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audio.playbackRate = speed;
      audioElRef.current = audio;

      // ── MediaSession: lock-screen controls ────────────────────────────────
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: script.title,
          artist: "PowerFlow",
        });
        navigator.mediaSession.setActionHandler("play",  () => { audio.play().catch(() => {}); });
        navigator.mediaSession.setActionHandler("pause", () => { audio.pause(); });
        navigator.mediaSession.setActionHandler("seekbackward", ({ seekOffset }) => {
          audio.currentTime = Math.max(0, audio.currentTime - (seekOffset ?? 10));
        });
        navigator.mediaSession.setActionHandler("seekforward", ({ seekOffset }) => {
          audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (seekOffset ?? 10));
        });
      }

      audio.onended = () => {
        clearTimer();
        setPlayingId(null);
        setAudioTime(null);
        audioElRef.current = null;
        if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
      };

      setLoadingId(null);
      setPlayingId(script.id);

      timerRef.current = setInterval(() => {
        const el = audioElRef.current;
        if (!el) return;
        setAudioTime({ current: el.currentTime, duration: el.duration || 0 });
        if ("mediaSession" in navigator) {
          navigator.mediaSession.setPositionState({
            duration: el.duration || 0,
            playbackRate: el.playbackRate,
            position: el.currentTime,
          });
        }
      }, 250);

      await audio.play();
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error("[TTS] error:", err);
      setPlayingId(null);
      setLoadingId(null);
      setAudioTime(null);
      setTtsError(script.id + "||" + detail);
      stopAudio(true);
    }
  };

  const seekBy = (delta: number) => {
    const el = audioElRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.currentTime + delta, (el.duration || 0) - 0.05));
  };

  const SPEEDS = [0.75, 1, 1.25] as const;
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioElRef.current) audioElRef.current.playbackRate = next;
  };

  const handleStop = () => stopAudio();

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/scripts?id=${id}`, { method: "DELETE" });
      setScripts((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">

      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 border-b border-white/6 bg-surface-base/95 backdrop-blur-sm">
        <div className="justify-self-start">
          <Link
            href="/chat"
            className="font-saira text-[11px] text-zinc-300 hover:text-purple-300 uppercase tracking-[0.18em] transition"
          >
            ← {t("common.back")}
          </Link>
        </div>
        <div className="flex items-center gap-2 justify-self-center">
          <span className="text-purple-400 text-sm">✦</span>
          <p className="font-saira text-sm font-semibold text-white uppercase tracking-[0.14em]">
            {t("scripts.title")}
          </p>
        </div>
        <div />
      </header>

      <div className="px-4 pt-6 pb-12 max-w-lg mx-auto md:max-w-2xl">

      {/* ── Empty state ───────────────────────────────────────── */}
      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="rounded-2xl border border-white/8 bg-surface-card px-6 py-8 max-w-sm w-full">
            <p className="font-saira text-sm font-semibold text-white mb-2">
              {t("scripts.emptyTitle")}
            </p>
            <p className="font-saira text-xs text-zinc-300 leading-relaxed mb-6">
              {t("scripts.emptyDesc")}
            </p>
            <Link
              href="/chat"
              className="inline-block rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
            >
              {t("scripts.openCoach")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scripts.map((script) => {
            const isPlaying = playingId === script.id;
            const isLoading = loadingId === script.id;
            const isExpanded = expandedId === script.id;
            const pct = isPlaying && audioTime && audioTime.duration > 0
              ? Math.min((audioTime.current / audioTime.duration) * 100, 100)
              : 0;

            return (
              <div
                key={script.id}
                className="rounded-2xl border border-white/8 bg-surface-card p-5"
              >
                {/* Title + date */}
                <div className="mb-3">
                  <p className="font-saira text-sm font-semibold text-white mb-0.5">
                    {script.title}
                  </p>
                  <p className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                    {t("scripts.savedWhen", { when: timeAgo(script.created_at) })}
                  </p>
                </div>

                {/* Script text — collapsed preview or full */}
                <div className="mb-4">
                  <p className={`font-saira text-xs text-zinc-400 leading-relaxed ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                    {isExpanded ? script.content : script.content.slice(0, 160) + (script.content.length > 160 ? "…" : "")}
                  </p>
                  {script.content.length > 160 && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : script.id)}
                      className="mt-1 font-saira text-[10px] uppercase tracking-wider text-purple-400 hover:text-purple-300 transition"
                    >
                      {isExpanded ? t("scripts.showLess") : t("scripts.readFull")}
                    </button>
                  )}
                </div>

                {/* Player */}
                {isLoading ? (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin flex-shrink-0" />
                      <span className="font-saira text-xs text-zinc-400">{t("scripts.generatingAudio")}</span>
                      <button
                        type="button"
                        onClick={() => stopAudio()}
                        className="ml-auto font-saira text-[10px] uppercase tracking-wider text-zinc-400 hover:text-zinc-400 transition"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                    <p className="font-saira text-[10px] text-zinc-400">
                      {t("scripts.keepOpen")}
                    </p>
                  </div>
                ) : isPlaying ? (
                  <div className="space-y-2 mb-3">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 rounded-full transition-all duration-200"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {audioTime && audioTime.duration > 0 && (
                      <div className="flex justify-between font-saira text-[10px] text-zinc-400">
                        <span>{fmtTime(audioTime.current)}</span>
                        <span>{fmtTime(audioTime.duration)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => seekBy(-10)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 font-saira text-[11px] text-zinc-400 hover:text-white hover:border-white/30 transition"
                      >
                        ← 10s
                      </button>
                      <button
                        type="button"
                        onClick={handleStop}
                        className="flex-1 rounded-xl border border-purple-500/30 bg-purple-500/10 py-2 font-saira text-xs uppercase tracking-wider text-purple-300 hover:bg-purple-500/20 transition"
                      >
                        {t("scripts.stop")}
                      </button>
                      <button
                        type="button"
                        onClick={() => seekBy(10)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 font-saira text-[11px] text-zinc-400 hover:text-white hover:border-white/30 transition"
                      >
                        10s →
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-saira text-[10px] text-zinc-500">
                        {t("scripts.noSound")}
                      </p>
                      <button
                        type="button"
                        onClick={cycleSpeed}
                        className="rounded-lg border border-white/10 px-2.5 py-1 font-saira text-[11px] font-semibold text-zinc-400 hover:text-white hover:border-white/30 transition tabular-nums"
                        aria-label="Cycle playback speed"
                      >
                        {speed}×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlay(script)}
                      className="border border-purple-500/30 bg-purple-500/10 text-purple-300 rounded-xl px-4 py-2 font-saira text-xs uppercase tracking-wider hover:bg-purple-500/20 transition"
                    >
                      {t("scripts.play")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(script.id)}
                      disabled={deletingId === script.id}
                      className="border border-white/10 text-zinc-400 rounded-xl px-3 py-2 font-saira text-xs uppercase tracking-wider hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-40"
                      aria-label="Delete script"
                    >
                      {deletingId === script.id ? "…" : t("scripts.delete")}
                    </button>
                    {ttsError?.startsWith(script.id + "||") && (
                      <p className="w-full font-saira text-[10px] text-red-400 break-all">
                        {ttsError.split("||")[1] || t("scripts.audioFailed")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>{/* /inner content */}
    </div>
  );
}
