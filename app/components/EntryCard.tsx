"use client";

import React from "react";
import Link from "next/link";
import { SENT_CONFIG, detectSentiment, type JournalEntry } from "@/lib/journal";
import type { Voice } from "@/lib/voices";
import VoiceGlyph from "@/app/components/VoiceGlyph";

/** Clock time for same-day entries; relative label for older ones */
function smartTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH  = Math.floor(diffMs / 3600000);
  if (diffH < 20) {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD === 1) return "Yesterday";
  return `${diffD}d ago`;
}

interface Props {
  entry: JournalEntry;
  /** Omit to render in read-only mode (coach view) */
  onDelete?: (id: string) => Promise<void> | void;
  /** Voice linked to this entry — shows glyph + name when provided */
  voice?: Pick<Voice, "id" | "name" | "shape" | "color" | "size"> | null;
}

export default function EntryCard({ entry, onDelete, voice }: Props) {
  const [confirm, setConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // Re-detect from content so old entries stored with wrong sentiment are corrected
  const s = SENT_CONFIG[detectSentiment(entry.content)];

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete?.(entry.id);
  };

  return (
    <div className={`rounded-2xl border ${s.ring} ${s.bg} p-4 group transition hover:brightness-110`}>
      <p className="font-saira text-sm leading-relaxed text-zinc-200">
        {entry.content}
      </p>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {/* Voice tag */}
        {voice && (
          <Link
            href={`/voices/${voice.id}`}
            className="flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 pl-1 pr-2 py-0.5 hover:border-purple-500/40 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <VoiceGlyph shape={voice.shape} color={voice.color} size={voice.size} className="w-4 h-4" />
            <span className="font-saira text-[10px] text-purple-300">{voice.name}</span>
          </Link>
        )}

        {/* Time */}
        <span className="ml-auto font-saira text-[10px] text-zinc-400">
          {smartTime(entry.created_at)}
        </span>

        {/* Delete — only when onDelete is provided */}
        {onDelete && (
          confirm ? (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="font-saira text-[10px] text-red-400">Remove?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="font-saira text-[10px] text-red-300 hover:text-red-200 underline disabled:opacity-50"
              >
                {deleting ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="font-saira text-[10px] text-zinc-300 hover:text-zinc-300 underline"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="ml-1 font-saira text-[10px] text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          )
        )}
      </div>
    </div>
  );
}

export type { JournalEntry };
