"use client";

/**
 * Shared note thread for coach-authored reflection sets. Renders the
 * accumulated conversation (text + voice notes from either party) and a
 * composer to add another note. Used by both the athlete's answering view
 * (`/reflections/[setId]`) and the coach's Profile-tab reflection section
 * (`app/coach/page.tsx`) — one implementation, two callers, so the thread
 * can never drift between the two sides.
 *
 * The voice recorder mirrors CheckinFeedbackPanel's approach in
 * app/coach/page.tsx (same MediaRecorder + cleanup-on-unmount pattern),
 * generalised so either an athlete or a coach can record here — do not add
 * a second, differently-shaped recorder elsewhere.
 */

import React from "react";
import { useT } from "@/lib/i18n";
import type { ReflectionNoteRow } from "@/lib/reflections";

interface Props {
  setId: string;
  initialNotes: ReflectionNoteRow[];
  currentUserId: string;
  /** Label for the other party in the thread — "Your coach" or the athlete's display name. */
  otherPartyLabel: string;
  /** Where to POST a new note — differs for athlete vs coach callers. */
  postNoteUrl: string;
  /** Always `/api/reflections/:setId/audio` — shared regardless of caller. */
  audioUploadUrl: string;
}

function formatTimestamp(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : locale, {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ReflectionNoteThread({
  setId, initialNotes, currentUserId, otherPartyLabel, postNoteUrl, audioUploadUrl,
}: Props) {
  const { t, locale } = useT();
  const [notes, setNotes] = React.useState<ReflectionNoteRow[]>(initialNotes);
  const [text, setText] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState("");
  const [recording, setRecording] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mediaRecRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  // Release the mic + recorder on unmount even mid-recording — mirrors
  // CheckinFeedbackPanel's cleanup effect exactly.
  React.useEffect(() => {
    return () => {
      const mr = mediaRecRef.current;
      if (mr) {
        mr.ondataavailable = null;
        mr.onstop = null;
        if (mr.state !== "inactive") {
          try { mr.stop(); } catch { /* already stopped */ }
        }
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      mediaRecRef.current = null;
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm");
        const res = await fetch(audioUploadUrl, { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json() as { url: string };
          setAudioUrl(url);
        }
      };
      mr.start();
      setRecording(true);
    } catch {
      setError(t("reflections.noteMicDenied"));
    }
  }

  function stopRecording() {
    mediaRecRef.current?.stop();
    setRecording(false);
  }

  async function send() {
    const body = text.trim();
    if (!body && !audioUrl) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(postNoteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body || undefined, audio_url: audioUrl || undefined }),
      });
      if (!res.ok) throw new Error(`send failed: ${res.status}`);
      const { id } = await res.json() as { id: string };
      setNotes((prev) => [...prev, {
        id, reflection_set_id: setId, author_id: currentUserId,
        body: body || null, audio_url: audioUrl || null, created_at: new Date().toISOString(),
      }]);
      setText("");
      setAudioUrl("");
    } catch (err) {
      console.error("[ReflectionNoteThread] send failed", err);
      setError(t("reflections.noteSendError"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-400 mb-3">
        {t("reflections.notesHeading")}
      </p>

      {notes.length === 0 ? (
        <p className="font-saira text-xs text-zinc-500 mb-3">{t("reflections.notesEmpty")}</p>
      ) : (
        <div className="space-y-2 mb-3">
          {notes.map((n) => {
            const isMine = n.author_id === currentUserId;
            return (
              <div
                key={n.id}
                className={`rounded-xl border px-3 py-2.5 ${
                  isMine ? "border-purple-500/25 bg-purple-500/[0.06]" : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-saira text-[10px] font-semibold uppercase tracking-[0.14em] ${isMine ? "text-purple-300" : "text-zinc-400"}`}>
                    {isMine ? t("reflections.you") : otherPartyLabel}
                  </span>
                  <span className="font-saira text-[10px] text-zinc-500">{formatTimestamp(n.created_at, locale)}</span>
                </div>
                {n.body && (
                  <p className="font-saira text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                )}
                {n.audio_url && (
                  <audio src={n.audio_url} controls className="h-8 w-full mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Composer */}
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("reflections.notePlaceholder")}
          rows={2}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-saira text-base lg:text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-400/40 transition resize-none"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-[11px] text-zinc-300 hover:text-white hover:border-white/20 transition"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
              {audioUrl ? t("reflections.noteReRecord") : t("reflections.noteRecordVoice")}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 font-saira text-[11px] text-rose-300 animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
              {t("reflections.noteStopRecording")}
            </button>
          )}
          {audioUrl && !recording && (
            <audio src={audioUrl} controls className="h-8 flex-1 min-w-0" />
          )}
        </div>
        {error && <p className="font-saira text-xs text-rose-400">{error}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={send}
            disabled={sending || (!text.trim() && !audioUrl)}
            className="rounded-lg border border-purple-400/30 bg-purple-500/15 px-4 py-1.5 font-saira text-[11px] font-bold text-purple-300 hover:bg-purple-500/25 transition disabled:opacity-40"
          >
            {sending ? t("reflections.noteSending") : t("reflections.noteSend")}
          </button>
        </div>
      </div>
    </div>
  );
}
