"use client";

import React from "react";

export interface PendingCheckin {
  week: number;
  year: number;
  weekStart: string;
}

interface WeeklyCheckinCtx {
  /** Non-null when there is a check-in window open that the athlete hasn't completed yet */
  pendingCheckin: PendingCheckin | null;
  /** True when the pending check-in is a monthly (deeper) review */
  isMonthly: boolean;
  /** Re-opens the modal after the athlete pressed "Later" */
  reopenCheckin: () => void;
}

export const WeeklyCheckinContext = React.createContext<WeeklyCheckinCtx>({
  pendingCheckin: null,
  isMonthly: false,
  reopenCheckin: () => {},
});

export function useWeeklyCheckin() {
  return React.useContext(WeeklyCheckinContext);
}
