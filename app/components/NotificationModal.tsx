"use client";

/**
 * NotificationModal — shows pending broadcast and/or devlog on login.
 *
 * Order: broadcast first → on dismiss → devlog (if new) → on dismiss → done.
 * Links inside broadcast body: [Link text](/path) → rendered as <a>.
 */

import React from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "./BottomSheet";
import { DEVLOG, CURRENT_DEVLOG_VERSION } from "@/lib/devlog";
import type { BroadcastRow } from "@/app/api/notifications/route";
import { useT } from "@/lib/i18n";

// ── Link renderer ─────────────────────────────────────────────────────────────

function renderBody(text: string, onLinkClick?: (href: string) => void): React.ReactNode[] {
  // Convert [Link text](/path) → <a> elements; split on newlines for paragraphs
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  const lines = text.split("\n").filter((l) => l.trim());

  return lines.map((line, li) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    linkRe.lastIndex = 0;

    while ((match = linkRe.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      const href = match[2];
      parts.push(
        <a
          key={match.index}
          href={href}
          onClick={onLinkClick ? (e) => { e.preventDefault(); onLinkClick(href); } : undefined}
          className="text-purple-300 underline underline-offset-2 hover:text-purple-200 transition"
        >
          {match[1]}
        </a>,
      );
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));

    return (
      <p key={li} className="font-saira text-sm text-zinc-300 leading-relaxed">
        {parts}
      </p>
    );
  });
}

// ── Broadcast panel ───────────────────────────────────────────────────────────

function BroadcastPanel({
  broadcast,
  onDismiss,
}: {
  broadcast: BroadcastRow;
  onDismiss: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const [dismissing, setDismissing] = React.useState(false);

  async function dismiss() {
    setDismissing(true);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "broadcast", id: broadcast.id }),
    });
    onDismiss();
  }

  // Dismiss then navigate — so the modal doesn't reappear on the next page
  async function handleLinkClick(href: string) {
    await dismiss();
    router.push(href);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📣</span>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-300">
          {t("notifications.announcement")}
        </p>
      </div>

      <h2 className="font-saira text-xl font-extrabold uppercase tracking-tight text-white">
        {broadcast.title}
      </h2>

      <div className="space-y-2">{renderBody(broadcast.body, handleLinkClick)}</div>

      <button
        onClick={dismiss}
        disabled={dismissing}
        className="w-full mt-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition"
      >
        {t("notifications.gotIt")}
      </button>
    </div>
  );
}

// ── Dev log panel ─────────────────────────────────────────────────────────────

function DevLogPanel({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useT();
  const [dismissing, setDismissing] = React.useState(false);
  const latest = DEVLOG[0];

  async function handleDismiss() {
    setDismissing(true);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "devlog" }),
    });
    onDismiss();
  }

  if (!latest) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">✦</span>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-300">
          {t("notifications.whatsNewWith")} · {latest.date}
        </p>
      </div>

      <h2 className="font-saira text-xl font-extrabold uppercase tracking-tight text-white">
        {latest.title}
      </h2>

      <ul className="space-y-2">
        {latest.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            <p className="font-saira text-sm text-zinc-300 leading-relaxed">{item}</p>
          </li>
        ))}
      </ul>

      <button
        onClick={handleDismiss}
        disabled={dismissing}
        className="w-full mt-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition"
      >
        Got it →
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export type NotificationState = {
  broadcast: BroadcastRow | null;
  devlogNew: boolean;
};

export default function NotificationModal({
  state,
  onDone,
}: {
  state: NotificationState;
  onDone: () => void;
}) {
  // Track which panel we're on: broadcast → devlog → done
  const [phase, setPhase] = React.useState<"broadcast" | "devlog" | "done">(() => {
    if (state.broadcast) return "broadcast";
    if (state.devlogNew) return "devlog";
    return "done";
  });

  React.useEffect(() => {
    if (phase === "done") onDone();
  }, [phase, onDone]);

  function afterBroadcast() {
    if (state.devlogNew) setPhase("devlog");
    else { setPhase("done"); }
  }

  function afterDevlog() {
    setPhase("done");
  }

  const open = phase === "broadcast" || phase === "devlog";

  // Allow X / backdrop to dismiss — marks item as seen then advances so it
  // won't appear again on the next load.
  const handleClose = React.useCallback(async () => {
    if (phase === "broadcast" && state.broadcast) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "broadcast", id: state.broadcast.id }),
      }).catch(() => {});
      afterBroadcast();
    } else if (phase === "devlog") {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "devlog" }),
      }).catch(() => {});
      afterDevlog();
    }
  // afterBroadcast / afterDevlog are stable closures — deps covered by phase
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state.broadcast]);

  return (
    <BottomSheet open={open} onClose={handleClose}>
      {phase === "broadcast" && state.broadcast && (
        <BroadcastPanel broadcast={state.broadcast} onDismiss={afterBroadcast} />
      )}
      {phase === "devlog" && (
        <DevLogPanel onDismiss={afterDevlog} />
      )}
    </BottomSheet>
  );
}

// ── Standalone devlog viewer (for You page) ───────────────────────────────────

export function DevLogViewer() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      {DEVLOG.map((entry) => (
        <div key={entry.version}>
          <div className="flex items-center gap-2 mb-3">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300">
              {entry.date}
            </p>
            {entry.version === CURRENT_DEVLOG_VERSION && (
              <span className="font-saira text-[8px] font-bold uppercase tracking-[0.2em] text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-1.5 py-0.5">
                {t("notifications.latestBadge")}
              </span>
            )}
          </div>
          <p className="font-saira text-sm font-semibold text-white mb-2">{entry.title}</p>
          <ul className="space-y-1.5">
            {entry.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-400/60 flex-shrink-0" />
                <p className="font-saira text-xs text-zinc-400 leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
