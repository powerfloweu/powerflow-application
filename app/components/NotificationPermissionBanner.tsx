"use client";

/**
 * NotificationPermissionBanner
 *
 * A subtle, dismissible banner shown to athletes who haven't yet
 * granted or denied browser notification permission.
 *
 * Rules:
 * - Only renders if Notification API is available AND permission === "default"
 * - Hidden once the user dismisses (localStorage: pf-notif-dismissed = "1")
 * - "Enable" button triggers Notification.requestPermission() via user gesture
 * - Automatically hides after grant or deny
 */

import React from "react";
import { useT } from "@/lib/i18n";

const DISMISSED_KEY = "pf-notif-dismissed";

export default function NotificationPermissionBanner() {
  const { t } = useT();

  // Three-state machine: null = loading (don't flash), false = hidden, true = visible
  const [visible, setVisible] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return; // API not supported
    if (Notification.permission !== "default") return; // already granted or denied
    if (localStorage.getItem(DISMISSED_KEY) === "1") return; // user dismissed before
    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const enable = async () => {
    const permission = await Notification.requestPermission();
    // Whether granted or denied, hide the banner — no point showing again
    dismiss();
    if (permission === "granted") {
      // Trigger the scheduler so the first notification is set up right away
      // (CheckinReminderScheduler already ran on mount and no-opped because
      //  permission was "default" at that point.)
      const { scheduleCheckinNotification } = await import("@/lib/checkinReminder");
      scheduleCheckinNotification(19);
    }
  };

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-live="polite"
      className={[
        // Mobile: fixed above the tab bar; Desktop: floating card bottom-right
        "fixed z-40",
        "bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] inset-x-3",
        "md:bottom-6 md:inset-x-auto md:right-6 md:left-auto md:w-80",
        // Card styles
        "rounded-2xl border border-purple-500/25 bg-surface-panel/95 backdrop-blur-md",
        "shadow-xl shadow-black/30 px-4 py-3",
        // Subtle left accent
        "border-l-2 border-l-purple-500",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* Bell icon */}
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" aria-hidden>
            <path
              d="M10 2a6 6 0 0 0-6 6v2.586l-1.707 1.707A1 1 0 0 0 3 14h14a1 1 0 0 0 .707-1.707L16 10.586V8a6 6 0 0 0-6-6z"
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            />
            <path
              d="M8 14a2 2 0 0 0 4 0"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 leading-tight">
            {t("notifBanner.title")}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400 leading-snug">
            {t("notifBanner.body")}
          </p>

          {/* Action buttons */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={enable}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              {t("notifBanner.enable")}
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
            >
              {t("notifBanner.later")}
            </button>
          </div>
        </div>

        {/* Close ×  */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 -mt-0.5 -mr-1 w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
