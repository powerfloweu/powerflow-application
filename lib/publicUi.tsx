"use client";

/**
 * Shared presentational bits for the public, unauthenticated pages — /seminar,
 * /seminar/manage/[token] and the coach landing pages. These all sit outside
 * the app shell and share one visual language, so the selection indicator,
 * section headings and the light/dark helper live here rather than being
 * copied per page and drifting apart.
 */

import React from "react";

export function tc(d: boolean, dark: string, light: string) { return d ? dark : light; }

/**
 * Tick / dot indicator. Driven by a prop rather than :checked so the card and
 * the box can never disagree about what is selected — the native input is
 * kept in the DOM (sr-only) for keyboard and screen-reader behaviour.
 */
export function Check({ on, radio, dark }: { on: boolean; radio?: boolean; dark: boolean }) {
  return (
    <span
      aria-hidden="true"
      // The native input next to this is sr-only, so keyboard focus has to
      // become visible here instead — hence the peer-focus-visible ring.
      className={`mt-0.5 h-[22px] w-[22px] flex-shrink-0 flex items-center justify-center border-2 transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-transparent ${
        radio ? "rounded-full" : "rounded-[7px]"
      } ${
        on
          ? "border-violet-500 bg-violet-500"
          : tc(dark, "border-white/25 bg-transparent", "border-gray-300 bg-white")
      }`}
    >
      {on && (radio
        ? <span className="h-2 w-2 rounded-full bg-white" />
        : (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-white" fill="none"
               stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
        ))}
    </span>
  );
}

/** Section heading with a rule running off to the right. */
export function Eyebrow({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p className={`text-[10px] font-bold uppercase tracking-[0.22em] whitespace-nowrap ${tc(dark, "text-violet-400", "text-violet-600")}`}>
        {children}
      </p>
      <span className={`h-px flex-1 ${tc(dark, "bg-white/10", "bg-gray-200")}`} />
    </div>
  );
}
