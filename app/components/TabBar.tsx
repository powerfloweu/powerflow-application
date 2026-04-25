"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { isCheckinDone, checkinKey } from "@/lib/checkinReminder";

const TABS = [
  { href: "/today",   label: "Today",   icon: TodayIcon   },
  { href: "/journal", label: "Journal", icon: JournalIcon },
  { href: "/library", label: "Tools",   icon: LibraryIcon },
  { href: "/course",  label: "Course",  icon: CourseIcon  },
  { href: "/you",     label: "You",     icon: YouIcon     },
] as const;

export default function TabBar() {
  const pathname = usePathname();
  const [checkinDone, setCheckinDone] = React.useState(true); // optimistic: no badge flash on load

  // Read localStorage after mount (avoids SSR mismatch)
  React.useEffect(() => {
    setCheckinDone(isCheckinDone());

    // Update badge when check-in is saved (storage event fired by markCheckinDone)
    const onStorage = (e: StorageEvent) => {
      if (e.key === checkinKey()) {
        setCheckinDone(e.newValue === "1");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-[#0D0B14]/90 backdrop-blur-md border-t border-white/8" />

      <div className="relative flex items-stretch justify-around px-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const showBadge = href === "/today" && !checkinDone && !active;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-colors ${
                active ? "text-purple-300" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <div className="relative">
                <Icon active={active} />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-[#0D0B14]" />
                )}
              </div>
              <span className="font-saira text-[9px] uppercase tracking-[0.16em]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function TodayIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" aria-hidden>
      <rect x="3" y="4" width="14" height="13" rx="2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M7 2v4M13 2v4M3 9h14"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
      {active && <circle cx="10" cy="14" r="1.5" fill="currentColor" />}
    </svg>
  );
}

function JournalIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" aria-hidden>
      <rect x="4" y="2" width="12" height="16" rx="1.5"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M7 6h6M7 10h6M7 14h4"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" aria-hidden>
      <rect x="2" y="4" width="16" height="12" rx="2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M8 8l5 2.5L8 13V8z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={active ? 0 : 1.5}
        strokeLinejoin="round" />
    </svg>
  );
}

function CourseIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M10 6v4l3 2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function YouIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" aria-hidden>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
    </svg>
  );
}
