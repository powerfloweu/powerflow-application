"use client";

/**
 * Invisible component mounted inside AppShell.
 * - Schedules a browser notification at 19:00 local time if today's
 *   check-in hasn't been completed.
 * - Does NOT prompt for notification permission immediately on page load
 *   (browsers block that). Instead it waits for a user gesture via the
 *   "Enable reminders" button in the Today page check-in card, or is
 *   triggered silently if permission is already granted.
 */

import React from "react";
import { scheduleCheckinNotification } from "@/lib/checkinReminder";

// Reminder hour (24-h local time). Default: 19 = 7 pm.
const REMINDER_HOUR = 19;

export default function CheckinReminderScheduler() {
  React.useEffect(() => {
    const cancel = scheduleCheckinNotification(REMINDER_HOUR);
    return cancel;
  }, []);

  return null; // renders nothing
}
