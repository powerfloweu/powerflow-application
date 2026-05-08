/**
 * View-mode utility for coaches who also train as athletes.
 *
 * A coach profile can switch between:
 *   "coach"   — full UI with Coach dashboard tab + sidebar link
 *   "athlete" — athlete-only tabs, no coach dashboard visible
 *
 * Mode is persisted in localStorage and broadcast via a custom DOM event
 * so AppShell can react without a full page reload.
 */

export const VIEW_MODE_KEY = "pf_view_mode";
export const VIEW_MODE_EVENT = "pf_view_mode_change";

export type ViewMode = "coach" | "athlete";

/** Read current mode from localStorage (SSR-safe, defaults to "coach"). */
export function getViewMode(): ViewMode {
  if (typeof window === "undefined") return "coach";
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  return stored === "athlete" || stored === "coach" ? stored : "coach";
}

/** Persist new mode and notify any listeners in the same tab. */
export function setViewMode(mode: ViewMode): void {
  localStorage.setItem(VIEW_MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent(VIEW_MODE_EVENT, { detail: mode }));
}
