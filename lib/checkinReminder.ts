/**
 * Utilities for the daily check-in reminder.
 *
 * State is stored in localStorage under a date-keyed entry so it
 * resets automatically at midnight without any cleanup logic.
 *
 * Key: `pf-checkin-<YYYY-MM-DD>` = "1"
 */

import { ymdLocal } from "@/lib/date";

export function checkinKey(): string {
  return `pf-checkin-${ymdLocal()}`;
}

/** True if today's check-in has already been logged (per localStorage). */
export function isCheckinDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(checkinKey()) === "1";
}

/** Mark today's check-in as done in localStorage. */
export function markCheckinDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(checkinKey(), "1");
  // Notify other tabs / components listening on storage events
  window.dispatchEvent(new StorageEvent("storage", {
    key: checkinKey(),
    newValue: "1",
    storageArea: localStorage,
  }));
}

/**
 * Request notification permission and, if granted, schedule a browser
 * notification at `reminderHour:00` (24-h local time) for today — but only
 * if the check-in hasn't been done yet.
 *
 * Returns a cleanup function that cancels the scheduled timeout.
 */
export function scheduleCheckinNotification(reminderHour = 19): () => void {
  if (typeof window === "undefined") return () => {};
  if (!("Notification" in window)) return () => {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  async function setup() {
    // Don't re-notify if already done
    if (isCheckinDone()) return;

    // Only schedule if permission is already granted.
    // The NotificationPermissionBanner handles requesting permission via a
    // user gesture — calling requestPermission() here (on mount, without a
    // gesture) is suppressed by modern browsers and races the banner.
    if (Notification.permission !== "granted") return;

    // Calculate ms until reminderHour:00 today
    const now = new Date();
    const target = new Date(now);
    target.setHours(reminderHour, 0, 0, 0);

    const delay = target.getTime() - now.getTime();
    if (delay <= 0) return; // Already past the reminder time today

    timeoutId = setTimeout(() => {
      // Re-check in case they logged in while the tab was open
      if (isCheckinDone()) return;
      new Notification("PowerFlow · Daily check-in", {
        body: "Don't forget to log your training or rest day today.",
        icon: "/fm_powerflow_logo_verziok_01_negatív.png",
        badge: "/fm_powerflow_logo_verziok_01_negatív.png",
        tag: "daily-checkin", // Prevents duplicate notifications
      });
    }, delay);
  }

  setup();

  return () => {
    if (timeoutId !== null) clearTimeout(timeoutId);
  };
}
