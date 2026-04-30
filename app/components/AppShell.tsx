"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TabBar from "./TabBar";
import CheckinReminderScheduler from "./CheckinReminderScheduler";
import NotificationModal, { type NotificationState } from "./NotificationModal";
import WeeklyCheckinModal from "./WeeklyCheckinModal";
import { canAccessTools, canAccessPR, type PlanTier } from "@/lib/plan";
import { useT } from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/today",   labelKey: "nav.home",    icon: HomeIcon    },
  { href: "/journal", labelKey: "nav.journal", icon: JournalIcon },
  { href: "/course",  labelKey: "nav.course",  icon: CourseIcon  },
  { href: "/library", labelKey: "nav.tools",   icon: ToolsIcon   },
  { href: "/you",     labelKey: "nav.you",     icon: YouIcon     },
] as const;

const SIDEBAR_KEY = "pf-athlete-sidebar";

/**
 * AppShell wraps all authenticated app routes.
 * Mobile  → fixed bottom TabBar
 * Desktop → fixed left sidebar (w-56), collapsible for coach accounts
 */
export default function AppShell({ children }: Props) {
  const pathname = usePathname();
  const { t } = useT();
  const [notifications, setNotifications] = React.useState<NotificationState | null>(null);
  const [planTier, setPlanTier] = React.useState<PlanTier>("pr");
  const [role, setRole] = React.useState<string | null>(null);
  // Weekly check-in popup
  const [weeklyCheckinTarget, setWeeklyCheckinTarget] = React.useState<{
    week: number; year: number; weekStart: string;
  } | null>(null);

  const isCoachPage = pathname === "/coach" || pathname.startsWith("/coach/");

  // Sidebar open/closed — coaches default to collapsed on the coach page
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sidebarReady, setSidebarReady] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved !== null) {
      setSidebarOpen(saved === "1");
    } else if (isCoachPage) {
      setSidebarOpen(false);
    }
    setSidebarReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((v) => {
      localStorage.setItem(SIDEBAR_KEY, v ? "0" : "1");
      return !v;
    });
  };

  // Fetch notifications + plan tier + role + weekly check-in status on mount
  React.useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && (data.broadcast || data.devlogNew)) {
          setNotifications(data as NotificationState);
        }
      })
      .catch(() => {});

    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        if (p?.plan_tier) setPlanTier(p.plan_tier as PlanTier);
        if (p?.role) setRole(p.role as string);
      })
      .catch(() => {});

    // Show weekly check-in popup if window is open and not yet submitted
    // Use sessionStorage so it only fires once per browser session
    const skippedThisSession = sessionStorage.getItem("weekly-checkin-skipped");
    if (!skippedThisSession) {
      fetch("/api/weekly-checkin")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.windowOpen && !data.currentSubmitted && data.targetWeek) {
            setWeeklyCheckinTarget(data.targetWeek);
          }
        })
        .catch(() => {});
    }
  }, []);

  const canCollapse = role === "coach";

  return (
    <div className="min-h-screen bg-[#050608] pt-[env(safe-area-inset-top)]">

      {/* ── Desktop left sidebar (hidden on mobile) ─────────────── */}
      {/* Outer wrapper keeps the sidebar in the fixed-position flow */}
      <div
        className={`hidden md:block fixed left-0 top-0 bottom-0 z-50 transition-[width] duration-200 ease-in-out overflow-hidden ${
          !sidebarReady || sidebarOpen ? "w-56" : "w-0"
        }`}
      >
        <aside className="flex flex-col w-56 h-full border-r border-white/5 bg-[#0D0B14]/95 backdrop-blur-md">
          {/* Brand */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <span className="font-saira text-[11px] font-bold uppercase tracking-[0.22em] text-purple-300">
              PowerFlow · Athlete
            </span>
            {/* Collapse button — only for coaches */}
            {canCollapse && (
              <button
                onClick={toggleSidebar}
                aria-label="Collapse athlete panel"
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 transition"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 flex flex-col">
            {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              const locked =
                (href === "/library" && !canAccessTools(planTier)) ||
                (href === "/course" && !canAccessPR(planTier));
              const dest = locked ? "/upgrade" : href;
              return (
                <Link
                  key={href}
                  href={dest}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-saira text-[11px] uppercase tracking-[0.16em] transition ${
                    active
                      ? "bg-purple-500/15 text-purple-300 font-semibold"
                      : locked
                      ? "text-zinc-700 hover:text-zinc-500 hover:bg-white/5"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <Icon active={active} />
                  {t(labelKey)}
                  {locked && (
                    <svg viewBox="0 0 16 16" className="w-3 h-3 ml-auto text-zinc-600" fill="none">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                </Link>
              );
            })}

            {/* Coach dashboard link — only for coach accounts */}
            {role === "coach" && (
              <div className="mt-auto pt-3 border-t border-white/5">
                <Link
                  href="/coach"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-saira text-[11px] uppercase tracking-[0.16em] transition ${
                    pathname === "/coach" || pathname.startsWith("/coach/")
                      ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                      : "text-emerald-700 hover:text-emerald-400 hover:bg-white/5"
                  }`}
                >
                  <CoachSidebarIcon active={pathname === "/coach" || pathname.startsWith("/coach/")} />
                  {t("nav.coach")}
                </Link>
              </div>
            )}
          </nav>

          {/* Version/footer */}
          <div className="px-5 pb-6 pt-3 border-t border-white/5">
            <p className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-700">
              {t("brand.tagline")}
            </p>
          </div>
        </aside>
      </div>

      {/* Re-open tab — fixed at left edge when sidebar is collapsed (coaches only) */}
      {canCollapse && sidebarReady && !sidebarOpen && (
        <button
          onClick={toggleSidebar}
          aria-label="Expand athlete panel"
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 flex-col items-center justify-center w-5 h-12 rounded-r-lg bg-[#0D0B14]/95 border border-l-0 border-white/10 text-zinc-600 hover:text-purple-300 hover:border-purple-400/30 transition"
        >
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ── Page content ────────────────────────────────────────── */}
      <main
        className={`pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 transition-[padding] duration-200 ease-in-out ${
          !sidebarReady || sidebarOpen ? "md:pl-56" : "md:pl-0"
        }`}
      >
        {children}
      </main>

      {/* ── Mobile bottom tab bar ───────────────────────────────── */}
      <TabBar planTier={planTier} role={role ?? undefined} />

      {/* ── Daily check-in reminder (invisible, schedules notification) ── */}
      <CheckinReminderScheduler />

      {/* ── In-app broadcast + devlog modal ────────────────────────── */}
      {notifications && (
        <NotificationModal
          state={notifications}
          onDone={() => setNotifications(null)}
        />
      )}

      {/* ── Weekly check-in popup ────────────────────────────────── */}
      {weeklyCheckinTarget && !notifications && (
        <WeeklyCheckinModal
          targetWeek={weeklyCheckinTarget}
          onDone={() => setWeeklyCheckinTarget(null)}
          onSkip={() => {
            sessionStorage.setItem("weekly-checkin-skipped", "1");
            setWeeklyCheckinTarget(null);
          }}
        />
      )}
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

function CoachSidebarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M1.5 16c0-2.485 2.462-4.5 5.5-4.5" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
      <circle cx="14" cy="7" r="2.5" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} />
      <path d="M18.5 16c0-2.485-2.462-4.5-5.5-4.5" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" />
    </svg>
  );
}
