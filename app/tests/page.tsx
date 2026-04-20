import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "PowerFlow — Mental Tests",
  description:
    "Psychology tests by PowerFlow. Take a test and get structured insights into your mental profile.",
};

// ── Decorative honeycomb: 11 cells, one per factor ────────────────────────────

function HexMap() {
  const r = 11;
  const cells: { cx: number; cy: number; o: number }[] = [
    // row 0 — 3 cells
    { cx: 21.5, cy: 23,   o: 0.80 },
    { cx: 40.5, cy: 23,   o: 0.40 },
    { cx: 59.5, cy: 23,   o: 0.65 },
    // row 1 — 4 cells (offset left)
    { cx: 12,   cy: 39.5, o: 0.30 },
    { cx: 31,   cy: 39.5, o: 0.70 },
    { cx: 50,   cy: 39.5, o: 0.55 },
    { cx: 69,   cy: 39.5, o: 0.90 },
    // row 2 — 4 cells
    { cx: 21.5, cy: 56,   o: 0.60 },
    { cx: 40.5, cy: 56,   o: 0.25 },
    { cx: 59.5, cy: 56,   o: 0.75 },
    { cx: 78.5, cy: 56,   o: 0.45 },
  ];

  const hex = (cx: number, cy: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6; // pointy-top
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    });
    return `M${pts.join("L")}Z`;
  };

  return (
    <svg viewBox="0 0 92 70" className="w-full h-full" aria-hidden>
      {cells.map((c, i) => (
        <path
          key={i}
          d={hex(c.cx, c.cy)}
          fill={`rgba(168,85,247,${(c.o * 0.55).toFixed(2)})`}
          stroke="rgba(168,85,247,0.45)"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TestsIndexPage() {
  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
            PowerFlow · Mental Tests
          </p>
          <h1 className="mt-3 font-saira text-3xl font-extrabold uppercase tracking-[0.14em] sm:text-4xl">
            Know yourself before you train yourself
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-saira text-sm text-zinc-300 sm:text-base">
            Structured, evidence-based psychology tests built on our 1:1 coaching work.
            Complete the test online, see your profile immediately, and receive a full
            written report to keep.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <TestCard
            slug="self-awareness"
            tier="Free + Paid"
            duration="~30–45 min · 165 items"
            title="Self-Awareness Test"
            description="Most athletes know their physical limits. Few know their psychological ones. This test maps 11 core motivations — revealing what drives you to compete, what creates friction under pressure, and where your real growth edge is."
            href="/tests/self-awareness"
            cta="Discover your profile"
            available
            visual={<HexMap />}
          />

          <TestCard
            slug="acsi"
            tier="Free + Paid"
            duration="~10–15 min · 28 items"
            title="Coping Skills Inventory"
            description="Seven mental skills define how athletes perform when it matters most. This test profiles your coping ability, concentration, confidence, goal-setting discipline, and coachability — revealing your strengths and the gaps worth closing."
            href="/tests/acsi"
            cta="Assess your coping skills"
            available
          />

          <TestCard
            slug="csai"
            tier="Free + Paid"
            duration="~5 min · 27 items · Pre-competition"
            title="Competitive Anxiety Inventory"
            description="Taken right before you compete, this test captures your mental and physical readiness in real time — cognitive worry, somatic tension, and self-confidence — giving you an honest picture of where your head is before the bar goes up."
            href="/tests/csai"
            cta="Measure your readiness"
            available
          />
        </div>

        <p className="mt-12 text-center font-saira text-[11px] text-zinc-500">
          Our tests are screening and self-reflection tools, not clinical diagnoses.
          If you are looking for 1:1 coaching, see the{" "}
          <Link href="/" className="underline decoration-zinc-600 hover:text-white">
            PowerFlow Application
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

// ── TestCard ──────────────────────────────────────────────────────────────────

function TestCard({
  tier,
  duration,
  title,
  description,
  href,
  cta,
  available,
  visual,
}: {
  slug: string;
  tier: string;
  duration: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  available: boolean;
  visual?: ReactNode;
}) {
  const CardBody = (
    <div
      className={`flex h-full flex-col rounded-3xl border p-7 transition sm:p-9 ${
        available
          ? "border-purple-500/25 bg-gradient-to-br from-purple-600/15 via-fuchsia-500/10 to-transparent shadow-[0_22px_60px_rgba(126,34,206,0.18)] hover:border-purple-400/50"
          : "border-white/5 bg-white/[0.02] opacity-60"
      }`}
    >
      {/* Top meta row */}
      <div className="flex items-center justify-between">
        <span
          className={`font-saira text-[10px] font-semibold uppercase tracking-[0.28em] ${
            available ? "text-purple-200" : "text-zinc-400"
          }`}
        >
          {tier}
        </span>
        {duration ? (
          <span className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            {duration}
          </span>
        ) : null}
      </div>

      {/* Title */}
      <h2 className="mt-4 font-saira text-xl font-extrabold uppercase tracking-[0.1em] sm:text-2xl">
        {title}
      </h2>

      {/* Description + hex visual side by side */}
      <div className="mt-4 flex flex-1 items-start gap-5">
        <p className="flex-1 font-saira text-sm leading-relaxed text-zinc-300">
          {description}
        </p>
        {visual && (
          <div className="hidden sm:block flex-shrink-0 w-[88px] h-[68px] opacity-75">
            {visual}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-7">
        <span
          className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 font-saira text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
            available
              ? "bg-purple-500 text-white group-hover:bg-purple-400"
              : "border border-zinc-700/70 text-zinc-500"
          }`}
        >
          {cta}
        </span>
      </div>
    </div>
  );

  if (!available) return <div className="h-full">{CardBody}</div>;
  return (
    <Link href={href} className="group h-full">
      {CardBody}
    </Link>
  );
}
