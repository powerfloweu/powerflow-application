"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TabBar from "./TabBar";

interface Props {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/today",   label: "Today"   },
  { href: "/journal", label: "Journal" },
  { href: "/library", label: "Tools"   },
  { href: "/course",  label: "Course"  },
  { href: "/you",     label: "You"     },
] as const;

/**
 * AppShell wraps all authenticated app routes.
 * Mobile  → fixed bottom TabBar
 * Desktop → fixed top nav bar (same links, different layout)
 */
export default function AppShell({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050608] pt-[env(safe-area-inset-top)]">

      {/* ── Desktop top nav (hidden on mobile) ────────────────── */}
      <header className="hidden md:flex fixed inset-x-0 top-0 z-50 h-12 items-center border-b border-white/5 bg-[#0D0B14]/90 backdrop-blur-md px-6 gap-6">
        <span className="font-saira text-[10px] font-semibold uppercase tracking-[0.32em] text-purple-300 mr-2">
          PowerFlow
        </span>
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`font-saira text-[11px] uppercase tracking-[0.18em] transition ${
                active
                  ? "text-white font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </header>

      {/* ── Page content ──────────────────────────────────────── */}
      {/* Mobile: pad for bottom TabBar. Desktop: pad for top nav. */}
      <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pt-12">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ─────────────────────────────── */}
      <TabBar />
    </div>
  );
}
