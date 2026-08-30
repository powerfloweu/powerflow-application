"use client";

/**
 * Temporary floating CTA pointing at /seminar.
 *
 * Nothing else on the site links to the seminar page, so without this it is
 * reachable only by people who are sent the URL.
 *
 * "Temporary" is enforced rather than remembered: it renders nothing once the
 * seminar has started, so it disappears on 3 October without anyone having to
 * take it down. Delete this component and its two call sites when the seminar
 * is over and done with.
 */

import React from "react";
import Link from "next/link";
import { SEMINAR } from "@/lib/seminar";

export default function SeminarBanner() {
  // Rendered on the client only: the server has no way to know "now" relative
  // to the viewer, and a server/client mismatch here would be a hydration error.
  const [visible, setVisible] = React.useState(false);
  const [daysLeft, setDaysLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    const startsAt = new Date(SEMINAR.startsAt).getTime();
    const msLeft = startsAt - Date.now();
    if (msLeft <= 0) return;
    setVisible(true);
    setDaysLeft(Math.ceil(msLeft / 86_400_000));
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-none print:hidden">
      <Link
        href="/seminar"
        className="group pointer-events-auto relative flex max-w-full items-center gap-3 rounded-full bg-violet-600 pl-4 pr-3.5 sm:pl-5 sm:pr-4 py-3 shadow-[0_10px_40px_-10px_rgba(124,58,237,0.9)] transition hover:bg-violet-500"
      >
        {/* The flash. Stops for anyone who has asked for reduced motion — a
            permanently pulsing element is hostile to some vestibular conditions. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-60 motion-reduce:animate-none motion-reduce:hidden"
        />
        <span className="relative flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* The eyebrow is the first thing to go at phone widths — the title
              already carries the meaning, and a wrapped pill looks broken. */}
          <span className="hidden sm:inline font-saira text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-200 whitespace-nowrap">
            Free seminar
          </span>
          <span className="font-saira text-[13px] sm:text-sm font-bold text-white truncate">
            <span className="sm:hidden">Free seminar for coaches</span>
            <span className="hidden sm:inline">Mental Performance for Coaches</span>
          </span>
          {daysLeft !== null && (
            <span className="font-saira text-[10px] font-bold uppercase tracking-wider text-violet-100/90 tabular-nums whitespace-nowrap flex-shrink-0">
              {daysLeft}d
            </span>
          )}
          <span className="font-saira text-sm text-white/80 flex-shrink-0 group-hover:translate-x-0.5 transition">→</span>
        </span>
      </Link>
    </div>
  );
}
