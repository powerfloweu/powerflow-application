import Link from "next/link";
import type { ReactNode } from "react";
import { BundleCta } from "./bundle/BundleCta";

export const metadata = {
  title: "PowerFlow — Mental Tests",
  description:
    "Psychology tests by PowerFlow. Take a test and get structured insights into your mental profile.",
};

// ── SAT visual: mini 11-point radar chart ─────────────────────────────────────

function SatRadarPreview() {
  const n = 11;
  const cx = 46;
  const cy = 37;
  const r = 26;
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

  // Decorative values — evocative of a real varied profile
  const vals = [0.82, 0.55, 0.48, 0.73, 0.91, 0.38, 0.68, 0.60, 0.85, 0.50, 0.76];

  const pt = (i: number, v: number) => {
    const a = angle(i);
    return `${(cx + v * r * Math.cos(a)).toFixed(1)},${(cy + v * r * Math.sin(a)).toFixed(1)}`;
  };

  const userPoints = vals.map((v, i) => pt(i, v)).join(" ");
  const avgPoints  = vals.map((_, i) => pt(i, 0.58)).join(" ");

  const ring = (lv: number) =>
    vals.map((_, i) => {
      const a = angle(i);
      return `${(cx + lv * r * Math.cos(a)).toFixed(1)},${(cy + lv * r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

  return (
    <svg viewBox="0 0 92 74" className="w-full h-full" aria-hidden>
      {/* Grid rings */}
      {[0.33, 0.67, 1].map((lv, i) => (
        <polygon key={i} points={ring(lv)} fill="none" stroke="rgba(168,85,247,0.20)" strokeWidth="0.7" />
      ))}
      {/* Axes */}
      {vals.map((_, i) => {
        const a = angle(i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={(cx + r * Math.cos(a)).toFixed(1)}
            y2={(cy + r * Math.sin(a)).toFixed(1)}
            stroke="rgba(168,85,247,0.18)"
            strokeWidth="0.6"
          />
        );
      })}
      {/* Population avg */}
      <polygon points={avgPoints} fill="rgba(255,255,255,0.04)" stroke="rgba(200,200,200,0.40)" strokeDasharray="2.5 2.5" strokeWidth="1" />
      {/* User polygon */}
      <polygon points={userPoints} fill="rgba(168,85,247,0.30)" stroke="rgb(192,132,252)" strokeWidth="1.4" />
      {/* Dots */}
      {vals.map((v, i) => {
        const a = angle(i);
        return (
          <circle
            key={i}
            cx={(cx + v * r * Math.cos(a)).toFixed(1)}
            cy={(cy + v * r * Math.sin(a)).toFixed(1)}
            r="1.8"
            fill="rgb(216,180,254)"
          />
        );
      })}
      <circle cx={cx} cy={cy} r="1.5" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}

// ── ACSI visual: mini 7-bar chart ─────────────────────────────────────────────

function AcsiBarPreview() {
  // Decorative scores for 7 subscales (coping, peaking, goals, conc, freedom, conf, coach)
  const vals = [0.72, 0.55, 0.88, 0.62, 0.44, 0.80, 0.66];
  const barW = 9;
  const gap  = 3.5;
  const maxH = 46;
  const totalW = vals.length * (barW + gap) - gap;
  const startX = (92 - totalW) / 2;
  const baseline = 62;

  return (
    <svg viewBox="0 0 92 74" className="w-full h-full" aria-hidden>
      {/* Horizontal grid lines */}
      {[0.33, 0.67, 1].map((lv, i) => (
        <line
          key={i}
          x1={startX - 2} y1={baseline - lv * maxH}
          x2={startX + totalW + 2} y2={baseline - lv * maxH}
          stroke="rgba(168,85,247,0.14)"
          strokeWidth="0.6"
        />
      ))}
      {/* Bars */}
      {vals.map((v, i) => {
        const h = v * maxH;
        const x = startX + i * (barW + gap);
        return (
          <rect
            key={i}
            x={x.toFixed(1)} y={(baseline - h).toFixed(1)}
            width={barW} height={h.toFixed(1)}
            rx="2.5"
            fill={`rgba(168,85,247,${(0.35 + v * 0.45).toFixed(2)})`}
          />
        );
      })}
      {/* Baseline */}
      <line
        x1={startX - 2} y1={baseline}
        x2={startX + totalW + 2} y2={baseline}
        stroke="rgba(168,85,247,0.35)"
        strokeWidth="0.8"
      />
    </svg>
  );
}

// ── CSAI visual: mini 3-spoke radar ───────────────────────────────────────────

function CsaiRadarPreview() {
  const n = 3;
  const cx = 46;
  const cy = 38;
  const r  = 26;
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

  // cognitive anxiety (moderate), somatic anxiety (low-ish), confidence (high)
  const vals = [0.60, 0.42, 0.84];

  const pt = (i: number, v: number) => {
    const a = angle(i);
    return `${(cx + v * r * Math.cos(a)).toFixed(1)},${(cy + v * r * Math.sin(a)).toFixed(1)}`;
  };

  const userPoints = vals.map((v, i) => pt(i, v)).join(" ");
  const ring = (lv: number) =>
    vals.map((_, i) => {
      const a = angle(i);
      return `${(cx + lv * r * Math.cos(a)).toFixed(1)},${(cy + lv * r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

  return (
    <svg viewBox="0 0 92 74" className="w-full h-full" aria-hidden>
      {/* Grid rings */}
      {[0.33, 0.67, 1].map((lv, i) => (
        <polygon key={i} points={ring(lv)} fill="none" stroke="rgba(56,189,248,0.20)" strokeWidth="0.7" />
      ))}
      {/* Axes */}
      {vals.map((_, i) => {
        const a = angle(i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={(cx + r * Math.cos(a)).toFixed(1)}
            y2={(cy + r * Math.sin(a)).toFixed(1)}
            stroke="rgba(56,189,248,0.20)"
            strokeWidth="0.8"
          />
        );
      })}
      {/* User polygon */}
      <polygon points={userPoints} fill="rgba(56,189,248,0.22)" stroke="rgb(125,211,252)" strokeWidth="1.5" />
      {/* Dots */}
      {vals.map((v, i) => {
        const a = angle(i);
        return (
          <circle
            key={i}
            cx={(cx + v * r * Math.cos(a)).toFixed(1)}
            cy={(cy + v * r * Math.sin(a)).toFixed(1)}
            r="2.5"
            fill="rgb(186,230,253)"
            stroke="rgb(14,165,233)"
            strokeWidth="0.8"
          />
        );
      })}
      <circle cx={cx} cy={cy} r="1.5" fill="rgba(255,255,255,0.20)" />
    </svg>
  );
}

// ── DAS visual: mini 7-bar diverging chart ────────────────────────────────────

function DasBarPreview() {
  // Decorative scores for 7 subscales (–10 to +10)
  // Showing a varied profile: some normal, some slightly elevated
  const vals = [3, -1, 6, 4, -3, 7, -2]; // raw value points
  const barW = 9;
  const gap  = 3.5;
  const maxH = 20; // half height for center-zero
  const totalW = vals.length * (barW + gap) - gap;
  const startX = (92 - totalW) / 2;
  const centerY = 37;

  return (
    <svg viewBox="0 0 92 74" className="w-full h-full" aria-hidden>
      {/* Normal zone shading */}
      <rect
        x={startX - 2} y={centerY - maxH * 0.5}
        width={totalW + 4} height={maxH}
        fill="rgba(168,85,247,0.07)"
        rx="2"
      />
      {/* Center line */}
      <line
        x1={startX - 2} y1={centerY}
        x2={startX + totalW + 2} y2={centerY}
        stroke="rgba(168,85,247,0.40)"
        strokeWidth="0.7"
      />
      {/* Bars */}
      {vals.map((v, i) => {
        const x = startX + i * (barW + gap);
        const dysfunctional = Math.abs(v) > 5;
        const h = (Math.abs(v) / 10) * maxH;
        const fill = dysfunctional
          ? "rgba(244,63,94,0.65)"
          : `rgba(168,85,247,${(0.35 + Math.abs(v) / 10 * 0.45).toFixed(2)})`;
        if (v >= 0) {
          return <rect key={i} x={x.toFixed(1)} y={(centerY - h).toFixed(1)} width={barW} height={h.toFixed(1)} rx="2" fill={fill} />;
        } else {
          return <rect key={i} x={x.toFixed(1)} y={centerY.toFixed(1)} width={barW} height={h.toFixed(1)} rx="2" fill="rgba(56,189,248,0.50)" />;
        }
      })}
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
            visual={<SatRadarPreview />}
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
            visual={<AcsiBarPreview />}
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
            visual={<CsaiRadarPreview />}
          />

          <TestCard
            slug="das"
            tier="Free + Paid"
            duration="~10 min · 35 items"
            title="Dysfunctional Attitude Scale"
            description="Seven deep-seated belief patterns — about approval, achievement, perfectionism, and control — shape how you respond to pressure, setbacks, and criticism. This test surfaces the ones working against you, so you can start to change them."
            href="/tests/das"
            cta="Examine your beliefs"
            available
            visual={<DasBarPreview />}
          />
        </div>

        {/* Bundle card */}
        <div className="mt-6 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-fuchsia-500/10 to-transparent p-7 shadow-[0_22px_60px_rgba(126,34,206,0.22)] sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            {/* Left: copy */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-0.5 font-saira text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                  Best value
                </span>
                <span className="font-saira text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  All three tests
                </span>
              </div>
              <h2 className="mt-3 font-saira text-xl font-extrabold uppercase tracking-[0.1em] sm:text-2xl">
                Full profile bundle
              </h2>
              <p className="mt-3 font-saira text-sm leading-relaxed text-zinc-300 max-w-xl">
                Get the complete picture — motivations, coping skills, and competitive state — in one purchase. All three full written reports unlocked the moment you pay.
              </p>

              {/* Included tests */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { label: "Self-Awareness Test", color: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300" },
                  { label: "Coping Skills Inventory", color: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
                  { label: "Competitive Anxiety Inventory", color: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
                ].map((t) => (
                  <span
                    key={t.label}
                    className={`rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.15em] ${t.color}`}
                  >
                    ✓ {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: price + CTA */}
            <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <p className="font-saira text-[11px] text-zinc-500 line-through">€57 separately</p>
                <p className="font-saira text-3xl font-extrabold text-white">€49</p>
              </div>
              <BundleCta />
            </div>
          </div>
        </div>

        {/* Journal CTA */}
        <div className="mt-10 flex items-center justify-between rounded-2xl border border-white/6 bg-[#0F1117] px-6 py-4">
          <div>
            <p className="font-saira text-xs font-semibold text-zinc-200">
              Already training mentally?
            </p>
            <p className="font-saira text-[11px] text-zinc-500 mt-0.5">
              Log your self-talk between sessions and track your thought patterns over time.
            </p>
          </div>
          <Link
            href="/journal"
            className="flex-shrink-0 ml-4 rounded-full border border-purple-500/40 px-5 py-2 font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-200 transition hover:bg-purple-500/15"
          >
            Open journal →
          </Link>
        </div>

        <p className="mt-8 text-center font-saira text-[11px] text-zinc-500">
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

      {/* Description + visual side by side */}
      <div className="mt-4 flex flex-1 items-start gap-5">
        <p className="flex-1 font-saira text-sm leading-relaxed text-zinc-300">
          {description}
        </p>
        {visual && (
          <div className="hidden sm:block flex-shrink-0 w-[96px] h-[76px] opacity-80">
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
