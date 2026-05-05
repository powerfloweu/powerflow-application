"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AthleteProfile } from "@/lib/athlete";
import { useT } from "@/lib/i18n";

// ── Section / Tip components ──────────────────────────────────────────────────

function GuideSection({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface-card p-5 mb-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="font-saira text-[10px] font-bold text-purple-400 pt-0.5 flex-shrink-0 tabular-nums">
          {num}
        </span>
        <h2 className="font-saira text-sm font-bold uppercase tracking-[0.16em] text-white">
          {title}
        </h2>
      </div>
      <div className="pl-6 space-y-2">{children}</div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 font-saira text-[10px] font-semibold text-purple-300">
      {children}
    </span>
  );
}

/**
 * Renders a tip string, turning [[text]] markers into <Highlight> spans.
 * Example: "Tap [[Sign in with Google]] to continue." →
 *   "Tap " <Highlight>Sign in with Google</Highlight> " to continue."
 */
function Tip({ text }: { text: string }) {
  const parts = text.split(/\[\[([^\]]+)\]\]/);
  return (
    <p className="font-saira text-xs text-zinc-400 leading-relaxed">
      {parts.map((part, i) =>
        i % 2 === 1 ? <Highlight key={i}>{part}</Highlight> : part
      )}
    </p>
  );
}

// ── Athlete guide ─────────────────────────────────────────────────────────────

function AthleteGuide() {
  const { t } = useT();
  const a = "guideAthlete";
  return (
    <>
      <GuideSection num="00" title={t(`${a}.s00.title`)}>
        <Tip text={t(`${a}.s00.t1`)} />
        <Tip text={t(`${a}.s00.t2`)} />
        <Tip text={t(`${a}.s00.t3`)} />
        <Tip text={t(`${a}.s00.t4`)} />
      </GuideSection>

      <GuideSection num="01" title={t(`${a}.s01.title`)}>
        <Tip text={t(`${a}.s01.t1`)} />
        <Tip text={t(`${a}.s01.t2`)} />
      </GuideSection>

      <GuideSection num="02" title={t(`${a}.s02.title`)}>
        <Tip text={t(`${a}.s02.t1`)} />
        <Tip text={t(`${a}.s02.t2`)} />
        <Tip text={t(`${a}.s02.t3`)} />
        <Tip text={t(`${a}.s02.t4`)} />
        <Tip text={t(`${a}.s02.t5`)} />
        <Tip text={t(`${a}.s02.t6`)} />
        <Tip text={t(`${a}.s02.t7`)} />
      </GuideSection>

      <GuideSection num="03" title={t(`${a}.s03.title`)}>
        <Tip text={t(`${a}.s03.t1`)} />
        <Tip text={t(`${a}.s03.t2`)} />
        <Tip text={t(`${a}.s03.t3`)} />
        <Tip text={t(`${a}.s03.t4`)} />
      </GuideSection>

      <GuideSection num="04" title={t(`${a}.s04.title`)}>
        <Tip text={t(`${a}.s04.t1`)} />
        <Tip text={t(`${a}.s04.t2`)} />
        <Tip text={t(`${a}.s04.t3`)} />
        <Tip text={t(`${a}.s04.t4`)} />
        <Tip text={t(`${a}.s04.t5`)} />
      </GuideSection>

      <GuideSection num="05" title={t(`${a}.s05.title`)}>
        <Tip text={t(`${a}.s05.t1`)} />
        <Tip text={t(`${a}.s05.t2`)} />
        <Tip text={t(`${a}.s05.t3`)} />
        <Tip text={t(`${a}.s05.t4`)} />
        <Tip text={t(`${a}.s05.t5`)} />
        <Tip text={t(`${a}.s05.t6`)} />
      </GuideSection>

      <GuideSection num="06" title={t(`${a}.s06.title`)}>
        <Tip text={t(`${a}.s06.t1`)} />
        <Tip text={t(`${a}.s06.t2`)} />
        <Tip text={t(`${a}.s06.t3`)} />
      </GuideSection>

      <GuideSection num="07" title={t(`${a}.s07.title`)}>
        <Tip text={t(`${a}.s07.t1`)} />
        <Tip text={t(`${a}.s07.t2`)} />
        <Tip text={t(`${a}.s07.t3`)} />
        <Tip text={t(`${a}.s07.t4`)} />
      </GuideSection>

      <GuideSection num="08" title={t(`${a}.s08.title`)}>
        <Tip text={t(`${a}.s08.t1`)} />
        <Tip text={t(`${a}.s08.t2`)} />
        <Tip text={t(`${a}.s08.t3`)} />
        <Tip text={t(`${a}.s08.t4`)} />
      </GuideSection>

      <GuideSection num="09" title={t(`${a}.s09.title`)}>
        <Tip text={t(`${a}.s09.t1`)} />
        <Tip text={t(`${a}.s09.t2`)} />
        <Tip text={t(`${a}.s09.t3`)} />
      </GuideSection>
    </>
  );
}

// ── Coach guide ───────────────────────────────────────────────────────────────

function CoachGuide() {
  const { t } = useT();
  const c = "guideCoach";
  return (
    <>
      <GuideSection num="01" title={t(`${c}.s01.title`)}>
        <Tip text={t(`${c}.s01.t1`)} />
        <Tip text={t(`${c}.s01.t2`)} />
      </GuideSection>

      <GuideSection num="02" title={t(`${c}.s02.title`)}>
        <Tip text={t(`${c}.s02.t1`)} />
        <Tip text={t(`${c}.s02.t2`)} />
        <Tip text={t(`${c}.s02.t3`)} />
      </GuideSection>

      <GuideSection num="03" title={t(`${c}.s03.title`)}>
        <Tip text={t(`${c}.s03.t1`)} />
        <Tip text={t(`${c}.s03.t2`)} />
        <Tip text={t(`${c}.s03.t3`)} />
        <Tip text={t(`${c}.s03.t4`)} />
        <Tip text={t(`${c}.s03.t5`)} />
      </GuideSection>

      <GuideSection num="04" title={t(`${c}.s04.title`)}>
        <Tip text={t(`${c}.s04.t1`)} />
        <Tip text={t(`${c}.s04.t2`)} />
        <Tip text={t(`${c}.s04.t3`)} />
        <Tip text={t(`${c}.s04.t4`)} />
        <Tip text={t(`${c}.s04.t5`)} />
      </GuideSection>

      <GuideSection num="05" title={t(`${c}.s05.title`)}>
        <Tip text={t(`${c}.s05.t1`)} />
        <Tip text={t(`${c}.s05.t2`)} />
        <Tip text={t(`${c}.s05.t3`)} />
      </GuideSection>

      <GuideSection num="06" title={t(`${c}.s06.title`)}>
        <Tip text={t(`${c}.s06.t1`)} />
        <Tip text={t(`${c}.s06.t2`)} />
        <Tip text={t(`${c}.s06.t3`)} />
        <Tip text={t(`${c}.s06.t4`)} />
      </GuideSection>

      <GuideSection num="07" title={t(`${c}.s07.title`)}>
        <Tip text={t(`${c}.s07.t1`)} />
        <Tip text={t(`${c}.s07.t2`)} />
      </GuideSection>

      <GuideSection num="08" title={t(`${c}.s08.title`)}>
        <Tip text={t(`${c}.s08.t1`)} />
        <Tip text={t(`${c}.s08.t2`)} />
      </GuideSection>

      <GuideSection num="09" title={t(`${c}.s09.title`)}>
        <Tip text={t(`${c}.s09.t1`)} />
        <Tip text={t(`${c}.s09.t2`)} />
      </GuideSection>

      <GuideSection num="10" title={t(`${c}.s10.title`)}>
        <Tip text={t(`${c}.s10.t1`)} />
        <Tip text={t(`${c}.s10.t2`)} />
      </GuideSection>

      <GuideSection num="11" title={t(`${c}.s11.title`)}>
        <Tip text={t(`${c}.s11.t1`)} />
        <Tip text={t(`${c}.s11.t2`)} />
      </GuideSection>

      <GuideSection num="12" title={t(`${c}.s12.title`)}>
        <Tip text={t(`${c}.s12.t1`)} />
        <Tip text={t(`${c}.s12.t2`)} />
        <Tip text={t(`${c}.s12.t3`)} />
      </GuideSection>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const router = useRouter();
  const { t } = useT();
  const [role, setRole] = React.useState<"athlete" | "coach" | null>(null);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { router.replace("/auth/sign-in"); return null; }
        return r.json();
      })
      .then((p: AthleteProfile | null) => {
        if (!p) return;
        setRole(p.role);
        setName(p.display_name?.split(" ")[0] ?? "");
      })
      .catch(() => {});
  }, [router]);

  const pdfHref = role === "coach" ? "/guide/coach" : "/guide/athlete";
  const isCoach = role === "coach";

  return (
    <div className="min-h-screen bg-surface-base pb-10">

      {/* ── Sticky back bar ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400 hover:text-purple-300 transition"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden>
              <path d="M12 4L6 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("guide.back")}
          </button>
          <span className="font-saira text-[10px] uppercase tracking-[0.22em] text-zinc-500">·</span>
          <span className="font-saira text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            {t("guide.pageTitle")}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8 sm:px-6">

      {/* Header */}
      <div className="mb-6">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · GUIDE
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          {isCoach ? t("guide.coachGuide") : t("guide.athleteGuide")}
        </h1>
        {name && (
          <p className="font-saira text-sm text-zinc-300">
            {t("guide.welcome", { name: `, ${name}` })}
          </p>
        )}
      </div>

      {/* PDF link — opens in same tab so PWA users can use the in-document
          "Back to app" button to return. (target="_blank" was unreliable in
          installed PWAs, leaving users stranded on the printable view.) */}
      <Link
        href={pdfHref}
        className="flex items-center justify-between rounded-2xl border border-purple-500/25 bg-purple-500/5 px-5 py-4 mb-6 hover:border-purple-400/50 transition group"
      >
        <div>
          <p className="font-saira text-sm font-semibold text-purple-300 group-hover:text-white transition mb-0.5">
            {t("guide.printable")}
          </p>
          <p className="font-saira text-[10px] text-zinc-300">
            {t("guide.printableHint")}
          </p>
        </div>
        <span className="text-purple-400 text-lg">→</span>
      </Link>

      {/* Role-specific guide */}
      {role === null ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
        </div>
      ) : isCoach ? (
        <CoachGuide />
      ) : (
        <AthleteGuide />
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="font-saira text-[10px] text-zinc-400">
          {t("guide.footer")}
        </p>
      </div>

      </div>{/* /inner scroll container */}
    </div>
  );
}
