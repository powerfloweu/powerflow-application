"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function ScriptsPage() {
  const router = useRouter();

  const [scripts, setScripts] = React.useState<SavedScript[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const currentAudio = React.useRef<HTMLAudioElement | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // ── On mount: verify ai_access + load scripts ──────────────────────────────

  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/scripts").then((r) => r.json()),
    ])
      .then(([profile, data]) => {
        if (!profile?.ai_access) {
          router.replace("/library");
          return;
        }
        if (Array.isArray(data)) {
          setScripts(data);
        }
      })
      .catch(() => router.replace("/library"))
      .finally(() => setLoading(false));
  }, [router]);

  // ── Audio playback ─────────────────────────────────────────────────────────

  const handlePlay = async (script: SavedScript) => {
    // Stop current audio
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
      setPlayingId(null);
      if (playingId === script.id) return;
    }

    setPlayingId(script.id);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script.content }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio.current = audio;

      audio.onended = () => {
        setPlayingId(null);
        currentAudio.current = null;
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingId(null);
        currentAudio.current = null;
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch {
      setPlayingId(null);
      currentAudio.current = null;
    }
  };

  const handleStop = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    setPlayingId(null);
  };

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
    <div className="min-h-screen bg-[#050608] px-4 pt-6 pb-12 max-w-lg mx-auto">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/chat"
          className="font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-sm">✦</span>
          <p className="font-saira text-sm font-semibold text-white uppercase tracking-[0.14em]">
            My Scripts
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* ── Empty state ───────────────────────────────────────── */}
      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="rounded-2xl border border-white/8 bg-[#17131F] px-6 py-8 max-w-sm w-full">
            <p className="font-saira text-sm font-semibold text-white mb-2">
              No saved scripts yet.
            </p>
            <p className="font-saira text-xs text-zinc-500 leading-relaxed mb-6">
              Ask the AI coach to generate a visualization, grounding, or
              pre-competition script&nbsp;— then save it here.
            </p>
            <Link
              href="/chat"
              className="inline-block rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
            >
              Open AI Coach →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {scripts.map((script) => {
            const isPlaying = playingId === script.id;
            return (
              <div
                key={script.id}
                className="rounded-2xl border border-white/8 bg-[#17131F] p-5"
              >
                {/* Title + date */}
                <div className="mb-3">
                  <p className="font-saira text-sm font-semibold text-white mb-0.5">
                    {script.title}
                  </p>
                  <p className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                    Saved {timeAgo(script.created_at)}
                  </p>
                </div>

                {/* Preview */}
                <p className="font-saira text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                  {script.content.slice(0, 150)}
                  {script.content.length > 150 ? "…" : ""}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  {isPlaying ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="border border-purple-500/30 bg-purple-500/10 text-purple-300 rounded-xl px-4 py-2 font-saira text-xs uppercase tracking-wider animate-pulse"
                    >
                      ◼ Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlay(script)}
                      className="border border-purple-500/30 bg-purple-500/10 text-purple-300 rounded-xl px-4 py-2 font-saira text-xs uppercase tracking-wider hover:bg-purple-500/20 transition"
                    >
                      ▶ Play
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(script.id)}
                    disabled={deletingId === script.id}
                    className="border border-white/10 text-zinc-600 rounded-xl px-3 py-2 font-saira text-xs uppercase tracking-wider hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-40"
                    aria-label="Delete script"
                  >
                    {deletingId === script.id ? "…" : "✕ Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
