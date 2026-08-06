"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Public marketing/pre-auth pages that should show this NavBar. Every other
 * route is suppressed by default — inverted on purpose so a new page added
 * anywhere (in particular under `app/(app)/`, which already gets AppShell's
 * own fixed header + sidebar) can never end up with duplicate fixed chrome
 * just because someone forgot to list it here. Only add a route to this
 * allowlist if it's a genuinely public, unauthenticated-friendly page.
 */
const MARKETING_ROUTES = ["/", "/tests", "/coaches"];

export default function NavBar() {
  const pathname = usePathname();
  const isMarketing = MARKETING_ROUTES.some(
    (r) => pathname === r || (r !== "/" && pathname.startsWith(r + "/")),
  );
  if (!isMarketing) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-md print:hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/fm_powerflow_logo_verziok_01_negative.png"
            alt="PowerFlow"
            width={120}
            height={120}
            className="h-8 w-8"
            priority
          />
          <span className="hidden font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/90 sm:inline">
            PowerFlow
          </span>
        </Link>
        <div className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/"
            className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-200 transition hover:text-white"
          >
            Application
          </Link>
          <Link
            href="/tests"
            className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-200 transition hover:text-white"
          >
            Mental Tests
          </Link>
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(pathname)}`}
            className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3.5 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-300 transition hover:bg-purple-500/20 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
