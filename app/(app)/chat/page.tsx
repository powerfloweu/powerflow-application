"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// ── Markdown-lite renderer ────────────────────────────────────────────────────
// Renders **bold**, newlines → <br>, and fenced code blocks.

function renderContent(text: string): React.ReactNode {
  // Split on fenced code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3).replace(/^[^\n]*\n/, ""); // strip language hint
      return (
        <pre
          key={i}
          className="bg-[#0e0b15] rounded-lg p-3 text-xs mt-2 whitespace-pre-wrap font-mono overflow-x-auto"
        >
          {inner}
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
      <div className="bg-[#17131F] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
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

// ── Quick start chips ─────────────────────────────────────────────────────────

const QUICK_STARTS = [
  "I missed a lift today and can't stop thinking about it",
  "Help me prepare mentally for my meet",
  "I want to map a new internal voice",
  "Generate a visualization script for my squat",
];

// ── Welcome card ──────────────────────────────────────────────────────────────

function WelcomeCard({ onChip }: { onChip: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-6 py-6 mb-4 text-center">
          <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-3">
            ✦ Coach AI
          </p>
          <p className="font-saira text-sm text-zinc-300 leading-relaxed">
            Start a conversation. I know your profile, your recent journal
            entries, and your upcoming meet. Tell me what&apos;s on your
            mind&nbsp;&mdash; before training, after a tough session, or the
            night before competition.
          </p>
        </div>
        <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-3 text-center">
          Quick starts
        </p>
        <div className="flex flex-col gap-2">
          {QUICK_STARTS.map((qs) => (
            <button
              key={qs}
              type="button"
              onClick={() => onChip(qs)}
              className="w-full text-left rounded-xl border border-white/8 bg-[#17131F] hover:border-purple-500/30 hover:bg-purple-500/5 px-4 py-3 font-saira text-sm text-zinc-400 hover:text-zinc-200 transition"
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

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // ── On mount: verify ai_access + load history ──────────────────────────────

  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/chat/messages?limit=50").then((r) => r.json()),
    ])
      .then(([profile, history]) => {
        if (!profile?.ai_access) {
          router.replace("/library");
          return;
        }
        if (Array.isArray(history)) {
          setMessages(
            history.map((m: { id: string; role: "user" | "assistant"; content: string }) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            }))
          );
        }
      })
      .catch(() => router.replace("/library"))
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

  // ── Send message ───────────────────────────────────────────────────────────

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingContent("");

    // Persist user message
    fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content: text }),
    }).catch(() => {});

    // Build conversation history for the API
    const conversationHistory = [
      ...messages,
      userMsg,
    ].map((m) => ({ role: m.role, content: m.content }));

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

      // Persist assistant message
      fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "assistant", content: fullResponse }),
      }).catch(() => {});
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
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
    <div className="flex flex-col h-screen bg-[#050608]">

      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/6 bg-[#050608]/95 backdrop-blur-sm">
        <Link
          href="/library"
          className="font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="text-purple-400 text-sm">✦</span>
          <p className="font-saira text-sm font-semibold text-white uppercase tracking-[0.14em]">
            Coach AI
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          disabled={!hasMessages || streaming}
          className="font-saira text-[11px] text-zinc-600 hover:text-zinc-400 uppercase tracking-[0.14em] transition disabled:opacity-30"
        >
          Clear
        </button>
      </header>

      {/* ── Clear confirmation dialog ──────────────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#17131F] p-6 text-center">
            <p className="font-saira text-sm font-semibold text-white mb-2">
              Clear conversation?
            </p>
            <p className="font-saira text-xs text-zinc-500 mb-5">
              This will delete all messages permanently.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-[#0D0B14] py-2.5 font-saira text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearConversation}
                disabled={clearing}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 py-2.5 font-saira text-xs font-semibold text-white transition"
              >
                {clearing ? "Clearing…" : "Clear"}
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
                <div
                  className={`font-saira text-sm text-zinc-200 px-4 py-3 max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-purple-500/20 border border-purple-500/30 rounded-2xl rounded-tr-sm"
                      : "bg-[#17131F] border border-white/8 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Streaming AI response */}
            {streaming && (
              streamingContent ? (
                <div className="flex justify-start mb-4">
                  <div className="bg-[#17131F] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] font-saira text-sm text-zinc-200">
                    {renderContent(streamingContent)}
                  </div>
                </div>
              ) : (
                <TypingIndicator />
              )
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Sticky input footer ────────────────────────────────── */}
      <footer className="sticky bottom-0 z-10 border-t border-white/6 bg-[#050608]/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-lg mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind…"
            rows={1}
            disabled={streaming}
            className="flex-1 rounded-2xl border border-white/10 bg-[#17131F] px-4 py-3 font-saira text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 resize-none overflow-hidden disabled:opacity-50 [color-scheme:dark]"
            style={{ minHeight: "48px", maxHeight: "200px" }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || streaming}
            className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 flex items-center justify-center transition"
            aria-label="Send"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 rotate-90" fill="white" aria-hidden>
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="font-saira text-[10px] text-zinc-700 text-center mt-1.5">
          Cmd+Enter to send
        </p>
      </footer>
    </div>
  );
}
