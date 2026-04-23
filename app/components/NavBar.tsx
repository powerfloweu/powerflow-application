"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Routes that render the app shell — suppress the marketing NavBar on these. */
const APP_ROUTES = ["/today", "/journal", "/library", "/course", "/you", "/coach", "/auth", "/join"];

export default function NavBar() {
  const pathname = usePathname();
  if (APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
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
        </div>
      </nav>
    </header>
  );
}
