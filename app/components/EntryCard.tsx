"use client";

import React from "react";
import { SENT_CONFIG, detectSentiment, type JournalEntry } from "@/lib/journal";

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
}

export default function EntryCard({ entry, onDelete }: Props) {
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
        {/* Time */}
        <span className="ml-auto font-saira text-[10px] text-zinc-600">
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
                className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 underline"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="ml-1 font-saira text-[10px] text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
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
