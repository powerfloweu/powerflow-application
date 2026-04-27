"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TabBar from "./TabBar";
import CheckinReminderScheduler from "./CheckinReminderScheduler";

interface Props {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/today",   label: "Home",    icon: HomeIcon    },
  { href: "/journal", label: "Journal", icon: JournalIcon },
  { href: "/course",  label: "Course",  icon: CourseIcon  },
  { href: "/library", label: "Tools",   icon: ToolsIcon   },
  { href: "/you",     label: "You",     icon: YouIcon     },
] as const;

/**
 * AppShell wraps all authenticated app routes.
 * Mobile  → fixed bottom TabBar
 * Desktop → fixed left sidebar (w-56)
 */
export default function AppShell({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050608] pt-[env(safe-area-inset-top)]">

      {/* ── Desktop left sidebar (hidden on mobile) ─────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 z-50 border-r border-white/5 bg-[#0D0B14]/95 backdrop-blur-md">
        {/* Brand */}
        <div className="px-5 pt-7 pb-6 border-b border-white/5">
          <span className="font-saira text-[11px] font-bold uppercase tracking-[0.32em] text-purple-300">
            PowerFlow
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-saira text-[11px] uppercase tracking-[0.16em] transition ${
                  active
                    ? "bg-purple-500/15 text-purple-300 font-semibold"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Version/footer */}
        <div className="px-5 pb-6 pt-3 border-t border-white/5">
          <p className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-700">
            Mental performance
          </p>
        </div>
      </aside>

      {/* ── Page content ────────────────────────────────────────── */}
      {/* Mobile: pad for bottom TabBar. Desktop: pad for left sidebar. */}
      <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-56">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ───────────────────────────────── */}
      <TabBar />

      {/* ── Daily check-in reminder (invisible, schedules notification) ── */}
      <CheckinReminderScheduler />
    </div>
  );
}

// ── Sidebar icons ─────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
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
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
      <rect x="4" y="2" width="12" height="16" rx="1.5"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M7 6h6M7 10h6M7 14h4"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function CourseIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
      <path d="M10 3L2 7l8 4 8-4-8-4z"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinejoin="round"
        fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M2 12l8 4 8-4"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function ToolsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
      <rect x="2" y="4" width="16" height="12" rx="2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M8 8l5 2.5L8 13V8z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={active ? 0 : 1.5}
        strokeLinejoin="round" />
    </svg>
  );
}

function YouIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
    </svg>
  );
}
