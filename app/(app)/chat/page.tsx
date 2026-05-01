"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/lib/i18n";

// ── Speech recognition hook ───────────────────────────────────────────────────

function useSpeechRecognition(onTranscript: (text: string, isFinal: boolean) => void) {
  const [listening, setListening] = React.useState(false);
  const [supported, setSupported] = React.useState(false);
  const recogRef = React.useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    const SR = (window as Window & typeof globalThis & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      ?? (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    setSupported(!!SR);
    if (!SR) return;

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = ""; // uses the browser/device language

    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          onTranscript(res[0].transcript, true);
        } else {
          interim += res[0].transcript;
        }
      }
      if (interim) onTranscript(interim, false);
    };

    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = React.useCallback(() => {
    const r = recogRef.current;
    if (!r) return;
    if (listening) {
      r.stop();
      setListening(false);
    } else {
      try { r.start(); setListening(true); } catch { /* already started */ }
    }
  }, [listening]);

  return { listening, supported, toggle };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;       // local temp UUID
  dbId?: string;    // actual DB UUID — set after persistence, used for ratings
  role: "user" | "assistant";
  content: string;
  created_at?: string; // set for messages loaded from history
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

// ── ScriptBlock ───────────────────────────────────────────────────────────────

function ScriptBlock({
  content,
  blockId,
  playingId,
  loadingId,
  errorId,
  audioTime,
  onPlay,
  onStop,
  onSeekBy,
}: {
  content: string;
  blockId: string;
  playingId: string | null;
  loadingId: string | null;
  errorId: string | null;
  audioTime: { current: number; duration: number } | null;
  onPlay: (blockId: string, content: string) => void;
  onStop: () => void;
  onSeekBy: (delta: number) => void;
}) {
  const { t } = useT();
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [naming, setNaming] = React.useState(false);
  const [nameInput, setNameInput] = React.useState("");
  const isLoading = loadingId === blockId;
  const hasError = errorId !== null && (errorId === blockId || errorId.startsWith(blockId + "||"));
  const errorMsg = errorId?.startsWith(blockId + "||") ? errorId.split("||")[1] : "";

  // Extract title from first line if it's in [TITLE] format or ALL CAPS
  const lines = content.trim().split("\n");
  const firstLine = lines[0].trim();
  const hasTitle =
    (firstLine.startsWith("[") && firstLine.endsWith("]")) ||
    firstLine === firstLine.toUpperCase();
  const title = hasTitle ? firstLine.replace(/^\[|\]$/g, "") : "";
  const body = hasTitle ? lines.slice(1).join("\n").trim() : content.trim();

  const suggestedTitle = title || "Script";
  const playing = playingId === blockId;
  const pct = playing && audioTime && audioTime.duration > 0
    ? Math.min((audioTime.current / audioTime.duration) * 100, 100)
    : 0;

  const openNaming = () => {
    setNameInput(suggestedTitle);
    setNaming(true);
  };

  const handleSave = async () => {
    const name = nameInput.trim() || suggestedTitle;
    setNaming(false);
    setSaving(true);
    try {
      await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name, content }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-purple-500/20 bg-purple-500/5 rounded-2xl p-4 my-3">
      {title && (
        <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-400 mb-3">
          ✦ {title}
        </p>
      )}
      <p className="font-saira text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mb-4">
        {body}
      </p>

      {/* Player */}
      {isLoading ? (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin flex-shrink-0" />
            <span className="font-saira text-xs text-zinc-400">{t("chat.generatingAudio")}</span>
            <button
              type="button"
              onClick={onStop}
              className="ml-auto font-saira text-[10px] uppercase tracking-wider text-zinc-400 hover:text-zinc-400 transition"
            >
              {t("common.cancel")}
            </button>
          </div>
          <p className="font-saira text-[10px] text-zinc-400">
            {t("chat.keepScreenOpen")}
          </p>
        </div>
      ) : playing ? (
        <div className="space-y-2 mb-3">
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Time */}
          {audioTime && audioTime.duration > 0 && (
            <div className="flex justify-between font-saira text-[10px] text-zinc-400">
              <span>{fmtTime(audioTime.current)}</span>
              <span>{fmtTime(audioTime.duration)}</span>
            </div>
          )}
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSeekBy(-10)}
              className="rounded-lg border border-white/10 px-3 py-1.5 font-saira text-[11px] text-zinc-400 hover:text-white hover:border-white/30 transition"
            >
              ← 10s
            </button>
            <button
              type="button"
              onClick={onStop}
              className="flex-1 rounded-xl border border-purple-500/30 bg-purple-500/10 py-2 font-saira text-xs uppercase tracking-wider text-purple-300 hover:bg-purple-500/20 transition"
            >
              {t("chat.stop")}
            </button>
            <button
              type="button"
              onClick={() => onSeekBy(10)}
              className="rounded-lg border border-white/10 px-3 py-1.5 font-saira text-[11px] text-zinc-400 hover:text-white hover:border-white/30 transition"
            >
              10s →
            </button>
          </div>
          <p className="font-saira text-[10px] text-zinc-500 text-center">
            {t("chat.noSound")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onPlay(blockId, content)}
              className="border border-purple-500/30 bg-purple-500/10 text-purple-300 rounded-xl px-4 py-2 font-saira text-xs uppercase tracking-wider hover:bg-purple-500/20 transition"
            >
              {t("chat.play")}
            </button>
            <button
              type="button"
              onClick={saved ? undefined : openNaming}
              disabled={saving}
              className="border border-white/10 text-zinc-400 rounded-xl px-4 py-2 font-saira text-xs uppercase tracking-wider hover:text-white hover:border-white/30 transition disabled:opacity-50"
            >
              {saved ? t("chat.savedScript") : saving ? t("chat.savingScript") : t("chat.saveScript")}
            </button>
            {hasError && (
              <p className="w-full font-saira text-[10px] text-red-400 break-all">
                {errorMsg || t("chat.audioFailed")}
              </p>
            )}
          </div>
          {/* Inline naming dialog */}
          {naming && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setNaming(false); }}
                placeholder="Script name…"
                autoFocus
                className="flex-1 rounded-xl border border-white/10 bg-surface-card px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40"
              />
              <button type="button" onClick={handleSave} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-1.5 font-saira text-xs text-white transition">
                Save
              </button>
              <button type="button" onClick={() => setNaming(false)} className="font-saira text-xs text-zinc-500 hover:text-zinc-300 transition px-1">
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
// Renders **bold**, newlines → <br>, ```script blocks → ScriptBlock,
// and other fenced code blocks → <pre>.

function renderContent(
  text: string,
  scriptProps: {
    playingId: string | null;
    loadingId: string | null;
    errorId: string | null;
    audioTime: { current: number; duration: number } | null;
    onPlay: (blockId: string, content: string) => void;
    onStop: () => void;
    onSeekBy: (delta: number) => void;
  }
): React.ReactNode {
  // Split on fenced code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      // Determine language hint
      const afterFence = part.slice(3); // strip opening ```
      const newlineIdx = afterFence.indexOf("\n");
      const lang =
        newlineIdx >= 0 ? afterFence.slice(0, newlineIdx).trim() : "";
      const inner =
        newlineIdx >= 0 ? afterFence.slice(newlineIdx + 1) : afterFence;
      const body = inner.endsWith("```")
        ? inner.slice(0, -3)
        : inner;

      if (lang === "script") {
        return (
          <ScriptBlock
            key={i}
            content={body.trim()}
            blockId={`script-${i}`}
            playingId={scriptProps.playingId}
            loadingId={scriptProps.loadingId}
            errorId={scriptProps.errorId}
            audioTime={scriptProps.audioTime}
            onPlay={scriptProps.onPlay}
            onStop={scriptProps.onStop}
            onSeekBy={scriptProps.onSeekBy}
          />
        );
      }

      return (
        <pre
          key={i}
          className="bg-surface-panel rounded-lg p-3 text-[13px] sm:text-xs mt-2 whitespace-pre-wrap font-mono overflow-x-auto"
        >
          {body}
        </pre>
      );
    }

    // Process inline bold + line breaks
    const lines = part.split("\n");
    return lines.map((line, j) => {
      const segments = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = segments.map((seg, k) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return <strong key={k}>{seg.slice(2, -2)}</strong>;
        }
        return seg;
      });
      return (
        <React.Fragment key={`${i}-${j}`}>
          {rendered}
          {j < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  });
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-surface-card border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
        <div className="flex items-center gap-1.5 h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-400/70 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Welcome card ──────────────────────────────────────────────────────────────

function WelcomeCard({ onChip }: { onChip: (text: string) => void }) {
  const { t } = useT();
  const quickStarts = [
    t("chat.q1"),
    t("chat.q2"),
    t("chat.q3"),
    t("chat.q4"),
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-6 py-6 mb-4 text-center">
          <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-3">
            ✦ {t("chat.title")}
          </p>
          <p className="font-saira text-sm text-zinc-300 leading-relaxed">
            {t("chat.welcomeDesc")}
          </p>
        </div>
        <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-400 mb-3 text-center">
          {t("chat.quickStartsLabel")}
        </p>
        <div className="flex flex-col gap-2">
          {quickStarts.map((qs) => (
            <button
              key={qs}
              type="button"
              onClick={() => onChip(qs)}
              className="w-full text-left rounded-xl border border-white/8 bg-surface-card hover:border-purple-500/30 hover:bg-purple-500/5 px-4 py-3 font-saira text-sm text-zinc-400 hover:text-zinc-200 transition"
            >
              {qs}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const { t } = useT();

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  // Message ratings: dbId → "good" | "bad"
  const [ratings, setRatings] = React.useState<Record<string, "good" | "bad">>({});

  // ── Daily Coach AI feedback ────────────────────────────────────────────────
  const todayYmd = () => new Date().toISOString().slice(0, 10);
  const feedbackKey = () => `pf-chat-feedback-${todayYmd()}`;
  const [showFeedback, setShowFeedback]         = React.useState(false);
  const [userMsgCountToday, setUserMsgCountToday] = React.useState(0);
  const [fbLength, setFbLength]   = React.useState<"shorter"|"perfect"|"more_detail"|null>(null);
  const [fbStyle, setFbStyle]     = React.useState<"direct"|"good"|"warmer"|null>(null);
  const [fbStars, setFbStars]     = React.useState<number>(0);
  const [fbNote, setFbNote]       = React.useState("");
  const [fbSubmitting, setFbSubmitting] = React.useState(false);
  const [fbDone, setFbDone]       = React.useState(false);

  // On mount: check if already rated today (localStorage fast-path)
  React.useEffect(() => {
    if (localStorage.getItem(feedbackKey())) setFbDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count today's user messages from history (set once history loads)
  const initFeedbackCount = React.useCallback((history: ChatMessage[]) => {
    const todayPrefix = todayYmd();
    const count = history.filter(
      (m) => m.role === "user" && (m.created_at ?? "").startsWith(todayPrefix)
    ).length;
    setUserMsgCountToday(count);
  }, []);

  const dismissFeedback = () => {
    localStorage.setItem(feedbackKey(), "skipped");
    setShowFeedback(false);
    setFbDone(true);
  };

  const submitFeedback = async () => {
    if (fbSubmitting) return;
    setFbSubmitting(true);
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length_rating: fbLength,
          style_rating:  fbStyle,
          helpfulness:   fbStars || null,
          note:          fbNote || null,
        }),
      });
    } catch { /* ignore */ }
    localStorage.setItem(feedbackKey(), "done");
    setFbDone(true);
    setShowFeedback(false);
  };

  // ── Audio / script state ───────────────────────────────────────────────────
  const [playingScriptId, setPlayingScriptId] = React.useState<string | null>(null);
  const [loadingScriptId, setLoadingScriptId] = React.useState<string | null>(null);
  const [ttsErrorId, setTtsErrorId] = React.useState<string | null>(null);
  const [audioTime, setAudioTime] = React.useState<{ current: number; duration: number } | null>(null);
  // AudioContext + AudioBufferSourceNode engine:
  //   • decodeAudioData avoids HTMLAudio.play() so iOS autoplay never blocks it
  //   • AudioContext output bypasses the hardware silent/mute switch on iOS
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const audioSrcRef = React.useRef<AudioBufferSourceNode | null>(null);
  const audioBufRef = React.useRef<AudioBuffer | null>(null);
  const playStartRef = React.useRef<number>(0);   // ctx.currentTime when playback started
  const playOffsetRef = React.useRef<number>(0);  // buffer offset (for seeks)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // ── Speech recognition ────────────────────────────────────────────────────
  // interimRef holds the most recent non-final transcript so we can replace
  // it when a final result arrives for the same utterance.
  const interimRef = React.useRef("");
  const { listening, supported: micSupported, toggle: toggleMic } = useSpeechRecognition(
    (text, isFinal) => {
      if (isFinal) {
        setInput((prev) => {
          const base = prev.endsWith(interimRef.current)
            ? prev.slice(0, prev.length - interimRef.current.length)
            : prev;
          interimRef.current = "";
          const spacer = base.length && !base.endsWith(" ") ? " " : "";
          return base + spacer + text.trim();
        });
      } else {
        setInput((prev) => {
          const base = prev.endsWith(interimRef.current)
            ? prev.slice(0, prev.length - interimRef.current.length)
            : prev;
          interimRef.current = text;
          return base + text;
        });
      }
      // Keep textarea auto-growing while voice is active
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
      });
    }
  );

  // ── On mount: verify PR tier access + load history ────────────────────────

  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/chat/messages?limit=50").then((r) => r.json()),
    ])
      .then(([profile, history]) => {
        // ai_access is the authoritative gate — admin must enable it per user.
        // plan_tier alone is not sufficient.
        if (!profile?.ai_access) {
          router.replace("/upgrade");
          return;
        }
        if (Array.isArray(history) && history.length > 0) {
          const loaded = history.map(
            (m: { id: string; role: "user" | "assistant"; content: string; created_at: string }) => ({
              id: m.id,
              dbId: m.id, // from DB — they're the same
              role: m.role,
              content: m.content,
              created_at: m.created_at,
            })
          );
          setMessages(loaded);
          initFeedbackCount(loaded);

          // If the last message is from a previous day, trigger background summarization
          const lastDate = loaded[loaded.length - 1]?.created_at?.split("T")[0];
          const today = new Date().toISOString().split("T")[0];
          if (lastDate && lastDate < today) {
            fetch("/api/chat/summarize", { method: "POST" }).catch(() => {});
          }
        }
      })
      .catch(() => router.replace("/upgrade"))
      .finally(() => setLoadingHistory(false));
  }, [router]);

  // ── Scroll to bottom on new messages ──────────────────────────────────────

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ── Auto-focus input ───────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!loadingHistory) {
      inputRef.current?.focus();
    }
  }, [loadingHistory]);

  // ── Auto-grow textarea ─────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  // ── Stop audio on unmount (navigation away) ────────────────────────────────
  React.useEffect(() => {
    return () => { stopAudio(true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Audio engine ─────────────────────────────────────────────────────────────
  // Strategy: fetch TTS audio as ArrayBuffer → AudioContext.decodeAudioData →
  // AudioBufferSourceNode.start(). This completely avoids HTMLAudio.play() so
  // iOS autoplay policy never blocks us. The AudioContext is unlocked once by
  // the synchronous ctx.resume() call inside the user-gesture handler, and all
  // subsequent start() calls inherit that unlocked state.

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const stopAudio = React.useCallback((silent = false) => {
    clearTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioSrcRef.current) {
      try { audioSrcRef.current.stop(); } catch { /* already stopped */ }
      audioSrcRef.current.onended = null;
      audioSrcRef.current = null;
    }
    audioBufRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    if (!silent) { setPlayingScriptId(null); setLoadingScriptId(null); setAudioTime(null); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = async (blockId: string, content: string) => {
    const isActive = playingScriptId === blockId || loadingScriptId === blockId;
    stopAudio(true);
    setPlayingScriptId(null);
    setLoadingScriptId(null);
    setAudioTime(null);
    if (isActive) return; // toggle off

    setTtsErrorId(null);
    setLoadingScriptId(blockId); // show buffering indicator

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
    const ctx = new AudioCtx() as AudioContext;
    audioCtxRef.current = ctx;
    ctx.resume().catch(() => {});

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();
      if (audioCtxRef.current !== ctx) return; // stopped or superseded

      ctx.resume().catch(() => {});
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (audioCtxRef.current !== ctx) return;

      audioBufRef.current = audioBuffer;
      playOffsetRef.current = 0;
      playStartRef.current = ctx.currentTime;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      audioSrcRef.current = source;

      // Audio ready — swap loading → playing
      setLoadingScriptId(null);
      setPlayingScriptId(blockId);

      // Progress ticker
      timerRef.current = setInterval(() => {
        if (!audioSrcRef.current || audioCtxRef.current !== ctx) return;
        const elapsed = ctx.currentTime - playStartRef.current + playOffsetRef.current;
        const dur = audioBufRef.current?.duration ?? 0;
        setAudioTime({ current: Math.min(elapsed, dur), duration: dur });
      }, 250);

      source.onended = () => {
        if (audioSrcRef.current !== source) return;
        clearTimer();
        setPlayingScriptId(null);
        setAudioTime(null);
        audioSrcRef.current = null;
        audioBufRef.current = null;
        ctx.close().catch(() => {});
        if (audioCtxRef.current === ctx) audioCtxRef.current = null;
      };

      source.start(0, 0);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return; // user cancelled
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error("[TTS] error:", err);
      setPlayingScriptId(null);
      setLoadingScriptId(null);
      setAudioTime(null);
      setTtsErrorId(blockId + "||" + detail);
      stopAudio(true);
    }
  };

  const seekBy = (delta: number) => {
    const ctx = audioCtxRef.current;
    const buf = audioBufRef.current;
    if (!ctx || !buf) return;

    const elapsed = ctx.currentTime - playStartRef.current + playOffsetRef.current;
    const newOffset = Math.max(0, Math.min(elapsed + delta, buf.duration - 0.05));

    // Stop current source and restart from the new offset
    if (audioSrcRef.current) {
      try { audioSrcRef.current.stop(); } catch { /* already stopped */ }
      audioSrcRef.current.onended = null;
      audioSrcRef.current = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.connect(ctx.destination);
    playStartRef.current = ctx.currentTime;
    playOffsetRef.current = newOffset;
    audioSrcRef.current = source;

    source.onended = () => {
      if (audioSrcRef.current !== source) return;
      clearTimer();
      setPlayingScriptId(null);
      setAudioTime(null);
      audioSrcRef.current = null;
      audioBufRef.current = null;
      ctx.close().catch(() => {});
      if (audioCtxRef.current === ctx) audioCtxRef.current = null;
    };

    source.start(0, newOffset);
  };

  const handleStop = () => stopAudio();

  // ── Send message ───────────────────────────────────────────────────────────

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    // Stop mic if it's still recording when the user taps Send
    if (listening) toggleMic();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setInput("");
    interimRef.current = "";
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingContent("");

    // Track daily message count for feedback prompt (show after 3rd message today)
    if (!fbDone) {
      setUserMsgCountToday((prev) => {
        const next = prev + 1;
        if (next >= 3) setShowFeedback(true);
        return next;
      });
    }

    // Persist user message — capture DB id to enable ratings
    fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content: text }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((row) => {
        if (row?.id) setMessages((prev) => prev.map((m) => m.id === userMsg.id ? { ...m, dbId: row.id } : m));
      })
      .catch(() => {});

    // Build conversation history for the API
    const conversationHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      // Finalize the AI message
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullResponse,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingContent("");

      // Persist assistant message — capture DB id to enable ratings
      fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "assistant", content: fullResponse }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((row) => {
          if (row?.id) setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, dbId: row.id } : m));
        })
        .catch(() => {});
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: t("chat.errorMsg"),
        },
      ]);
      setStreamingContent("");
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  };

  // ── Clear conversation ─────────────────────────────────────────────────────

  const clearConversation = async () => {
    setClearing(true);
    try {
      await fetch("/api/chat/messages", { method: "DELETE" });
      setMessages([]);
      setStreamingContent("");
      setShowClearConfirm(false);
    } catch {
      // ignore
    } finally {
      setClearing(false);
    }
  };

  // ── Handle quick start chip ────────────────────────────────────────────────

  const handleChip = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
    // Trigger height adjust after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
      }
    }, 0);
  };

  // ── Rate an AI message ─────────────────────────────────────────────────────

  const handleRate = (dbId: string, rating: "good" | "bad") => {
    setRatings((prev) => {
      const next = { ...prev, [dbId]: rating };
      // Optimistic update — fire-and-forget persist
      fetch("/api/chat/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: dbId, rating }),
      }).catch(() => {});
      return next;
    });
  };

  // ── Script render props (stable references via useCallback) ────────────────

  const scriptRenderProps = {
    playingId: playingScriptId,
    loadingId: loadingScriptId,
    errorId: ttsErrorId,
    audioTime,
    onPlay: handlePlay,
    onStop: handleStop,
    onSeekBy: seekBy,
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  const hasMessages = messages.length > 0 || streaming;

  return (
    <div className="chat-screen flex flex-col bg-surface-base">

      {/* ── Sticky header ───────────────────────────────────────
          3-column grid keeps the centre title visually centred even when
          the side columns have different widths. On narrow phones we drop
          the "Scripts" label to just an emoji icon so the right column
          doesn't collide with the title. */}
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4 py-3 border-b border-white/6 bg-surface-base/95 backdrop-blur-sm">
        <div className="justify-self-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="font-saira text-[11px] text-zinc-300 hover:text-purple-300 uppercase tracking-[0.14em] sm:tracking-[0.18em] transition"
          >
            ← {t("common.back")}
          </button>
        </div>
        <div className="flex items-center gap-1.5 justify-self-center min-w-0">
          <span className="text-purple-400 text-sm">✦</span>
          <p className="font-saira text-sm font-semibold text-white uppercase tracking-[0.1em] sm:tracking-[0.14em] truncate">
            {t("chat.title")}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 justify-self-end">
          <Link
            href="/scripts"
            aria-label="Saved scripts"
            className="font-saira text-[11px] text-zinc-300 hover:text-purple-300 uppercase tracking-[0.14em] transition"
          >
            <span className="sm:hidden text-base leading-none">📜</span>
            <span className="hidden sm:inline">📜 {t("chat.scriptsLink")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={!hasMessages || streaming}
            className="font-saira text-[11px] text-zinc-400 hover:text-zinc-400 uppercase tracking-[0.14em] transition disabled:opacity-30"
          >
            {t("chat.clear")}
          </button>
        </div>
      </header>

      {/* ── Clear confirmation dialog ──────────────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-surface-card p-6 text-center">
            <p className="font-saira text-sm font-semibold text-white mb-2">
              {t("chat.clearTitle")}
            </p>
            <p className="font-saira text-xs text-zinc-300 mb-5">
              {t("chat.clearDesc")}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-surface-panel py-2.5 font-saira text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={clearConversation}
                disabled={clearing}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 py-2.5 font-saira text-xs font-semibold text-white transition"
              >
                {clearing ? t("chat.clearingBtn") : t("chat.clear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages area ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">

        {!hasMessages ? (
          <WelcomeCard onChip={handleChip} />
        ) : (
          <div className="max-w-lg mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                  <div
                    className={`font-saira text-sm text-zinc-200 px-4 py-3 w-full ${
                      msg.role === "user"
                        ? "bg-purple-500/20 border border-purple-500/30 rounded-2xl rounded-tr-sm"
                        : "bg-surface-card border border-white/8 rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant"
                      ? renderContent(msg.content, scriptRenderProps)
                      : msg.content}
                  </div>
                  {/* Rating buttons — only for persisted AI messages */}
                  {msg.role === "assistant" && msg.dbId && (
                    <div className="flex items-center gap-1.5 mt-1 ml-1">
                      <button
                        type="button"
                        onClick={() => handleRate(msg.dbId!, "good")}
                        className={`text-base leading-none transition-opacity ${
                          ratings[msg.dbId] === "good" ? "opacity-100" : "opacity-20 hover:opacity-50"
                        }`}
                        title="Helpful"
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRate(msg.dbId!, "bad")}
                        className={`text-base leading-none transition-opacity ${
                          ratings[msg.dbId] === "bad" ? "opacity-100" : "opacity-20 hover:opacity-50"
                        }`}
                        title="Not helpful"
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming AI response */}
            {streaming &&
              (streamingContent ? (
                <div className="flex justify-start mb-4">
                  <div className="bg-surface-card border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] font-saira text-sm text-zinc-200">
                    {renderContent(streamingContent, scriptRenderProps)}
                  </div>
                </div>
              ) : (
                <TypingIndicator />
              ))}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Daily feedback banner ─────────────────────────────── */}
      {showFeedback && !fbDone && (
        <div className="border-t border-purple-500/20 bg-surface-panel/95 px-4 py-4">
          <div className="max-w-lg mx-auto space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-300">
                Quick check-in — how&apos;s Coach AI doing?
              </p>
              <button
                type="button"
                onClick={dismissFeedback}
                className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition"
              >
                Skip
              </button>
            </div>

            {/* Row 1 — Length */}
            <div className="flex items-center gap-2">
              <span className="font-saira text-[10px] text-zinc-400 w-14 flex-shrink-0">Length</span>
              {(["shorter", "perfect", "more_detail"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFbLength(v)}
                  className={`flex-1 rounded-xl border py-1.5 font-saira text-[10px] transition ${
                    fbLength === v
                      ? "border-purple-500/60 bg-purple-500/20 text-purple-200"
                      : "border-white/10 text-zinc-400 hover:border-purple-500/30 hover:text-zinc-200"
                  }`}
                >
                  {v === "shorter" ? "Shorter" : v === "perfect" ? "Perfect" : "More detail"}
                </button>
              ))}
            </div>

            {/* Row 2 — Style */}
            <div className="flex items-center gap-2">
              <span className="font-saira text-[10px] text-zinc-400 w-14 flex-shrink-0">Style</span>
              {(["direct", "good", "warmer"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFbStyle(v)}
                  className={`flex-1 rounded-xl border py-1.5 font-saira text-[10px] transition ${
                    fbStyle === v
                      ? "border-purple-500/60 bg-purple-500/20 text-purple-200"
                      : "border-white/10 text-zinc-400 hover:border-purple-500/30 hover:text-zinc-200"
                  }`}
                >
                  {v === "direct" ? "More direct" : v === "good" ? "Just right" : "Warmer"}
                </button>
              ))}
            </div>

            {/* Row 3 — Stars */}
            <div className="flex items-center gap-2">
              <span className="font-saira text-[10px] text-zinc-400 w-14 flex-shrink-0">Overall</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFbStars(n)}
                    className={`text-lg leading-none transition ${
                      n <= fbStars ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={submitFeedback}
              disabled={fbSubmitting || (!fbLength && !fbStyle && !fbStars)}
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 py-2 font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition"
            >
              {fbSubmitting ? "Saving…" : "Send feedback"}
            </button>
          </div>
        </div>
      )}

      {/* ── Sticky input footer ────────────────────────────────── */}
      <footer className="sticky bottom-0 z-10 border-t border-white/6 bg-surface-base/95 backdrop-blur-sm px-3 py-2.5">
        {input.length > 400 && (
          <p className={`max-w-lg mx-auto font-saira text-[10px] text-right mb-1 ${
            input.length > 900 ? "text-rose-400" : input.length > 700 ? "text-amber-400" : "text-zinc-500"
          }`}>
            {input.length} / 1000
          </p>
        )}
        <div className="max-w-lg mx-auto flex items-end gap-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "Listening…" : t("chat.placeholder")}
            rows={1}
            disabled={streaming}
            // text-base on mobile (16px) prevents iOS Safari from auto-zooming
            // when the textarea is focused. Drops to text-sm at sm: breakpoint.
            className="flex-1 rounded-2xl border border-white/10 bg-surface-card px-4 py-2.5 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 resize-none overflow-hidden disabled:opacity-50 [color-scheme:dark]"
            style={{ minHeight: "44px", maxHeight: "200px" }}
          />
          {micSupported && (
            <button
              type="button"
              onClick={() => {
                if (!listening) {
                  // Reset interim tracker but keep any typed text — voice will append
                  interimRef.current = "";
                  if (inputRef.current) {
                    inputRef.current.style.height = "auto";
                    inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
                  }
                }
                toggleMic();
              }}
              disabled={streaming}
              aria-label={listening ? "Stop recording" : "Start voice input"}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition ${
                listening
                  ? "bg-rose-600 hover:bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.45)]"
                  : "border border-white/10 bg-surface-card hover:border-purple-500/40 hover:text-purple-300 text-zinc-400"
              } disabled:opacity-40`}
            >
              {listening ? (
                /* Stop icon */
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="white" aria-hidden>
                  <rect x="5" y="5" width="10" height="10" rx="1.5" />
                </svg>
              ) : (
                /* Mic icon */
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="7" y="2" width="6" height="10" rx="3" />
                  <path d="M4 10a6 6 0 0012 0" />
                  <line x1="10" y1="16" x2="10" y2="19" />
                  <line x1="7" y1="19" x2="13" y2="19" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || streaming}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 flex items-center justify-center transition"
            aria-label="Send"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 rotate-90" fill="white" aria-hidden>
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        {/* Desktop only — Cmd+Enter shortcut hint */}
        <p className="hidden sm:block font-saira text-[10px] text-zinc-500 text-center mt-1.5">
          {t("chat.sendHint")}
        </p>
      </footer>
    </div>
  );
}
