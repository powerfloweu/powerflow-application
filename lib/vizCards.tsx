/**
 * Visualization reference cards — printed-card-style cue sheets an athlete can
 * open on a visualization tool whenever they want.
 *
 * Designs live here as components; *assignments* live in the database
 * (profiles.viz_cards, a map of toolId → card id). That split means a coach can
 * hand an existing card to another athlete, or move it to another lift, without
 * a code change — and nobody's personal card leaks to everyone by default.
 *
 * Cards deliberately keep their own light palette rather than inheriting the
 * app's dark theme: they're meant to read like a physical card you glance at
 * between sets, and the contrast makes them findable at a glance.
 */

import React from "react";

export interface VizCard {
  id: string;
  /** Shown on the tab that opens the card. */
  tabLabel: string;
  render: () => React.ReactElement;
}

// ── Shared pieces ────────────────────────────────────────────────────────────

const INK = "#141118";
const VIOLET = "#8E3FBE";
const CREAM = "#F7F4EF";
const BODY = "#4A4550";

function Wordmark() {
  return (
    <span className="font-saira text-[clamp(14px,5cqw,19px)] font-extrabold tracking-[-0.01em] leading-none whitespace-nowrap">
      <span style={{ color: VIOLET }}>POWER</span>
      <span style={{ color: INK }} className="italic">FLOW</span>
    </span>
  );
}

function Step({ n, title, lines }: { n: string; title: string; lines: string[] }) {
  return (
    <div className="flex gap-4">
      <span
        className="font-saira text-[11px] font-bold leading-none pt-[10px] tabular-nums"
        style={{ color: VIOLET }}
      >
        {n}
      </span>
      <div className="min-w-0">
        <h3
          className="font-saira text-[clamp(21px,7.4cqw,30px)] font-extrabold uppercase leading-none tracking-[0.16em] mb-2"
          style={{ color: INK }}
        >
          {title}
        </h3>
        {lines.map((l) => (
          <p
            key={l}
            className="font-saira text-[clamp(11.5px,3.6cqw,13px)] leading-[1.5]"
            style={{ color: BODY }}
          >
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── squat-stack-depth-drive ──────────────────────────────────────────────────

function SquatStackDepthDrive() {
  const steps = [
    { n: "01", title: "Stack", lines: ["Unrack. Walk out. Stack + brace.", "Focus on your setup — not the weight."] },
    { n: "02", title: "Depth", lines: ["Descend with control.", "Elbows toward the sides of your thighs."] },
    { n: "03", title: "Drive", lines: ["Drive with glutes + thighs.", "Elbows slightly forward. Chest + gaze up."] },
  ];

  return (
    // containerType lets every size below scale off the card's own width, so
    // the card reads the same in a narrow phone column as in a wide panel.
    <div
      className="overflow-hidden rounded-2xl"
      style={{ background: CREAM, containerType: "inline-size" }}
    >
      <div className="px-[6cqw] pt-[6cqw] pb-[7cqw]">
        {/* Header */}
        <div className="flex items-baseline justify-between gap-3 mb-[7cqw]">
          <Wordmark />
          <span
            className="font-saira text-[clamp(7px,2.3cqw,9px)] font-semibold uppercase tracking-[0.3em] text-right whitespace-nowrap"
            style={{ color: BODY }}
          >
            Mental rehearsal
          </span>
        </div>

        {/* Title */}
        <h2 className="font-saira text-[clamp(20px,8.1cqw,36px)] font-extrabold uppercase leading-[1.04] tracking-[0.05em] mb-3">
          <span style={{ color: INK }}>Squat </span>
          <span style={{ color: VIOLET }}>Visualization</span>
        </h2>
        <p
          className="font-saira text-[clamp(7px,2.4cqw,9px)] font-semibold uppercase tracking-[0.3em] mb-[6cqw]"
          style={{ color: INK }}
        >
          Before every top set
        </p>

        {/* Timing block */}
        <div className="flex overflow-hidden rounded-xl mb-[8cqw]">
          <div className="w-[5px] flex-shrink-0" style={{ background: VIOLET }} />
          <div
            className="flex flex-1 items-center gap-[4cqw] px-[5cqw] py-[4cqw] min-w-0"
            style={{ background: INK }}
          >
            {/* nowrap: "15–30" splitting across lines reads as two numbers */}
            <p className="font-saira font-extrabold leading-none text-white tabular-nums whitespace-nowrap">
              <span className="text-[clamp(22px,8.2cqw,34px)]">15–30</span>
              <span
                className="text-[clamp(8px,2.8cqw,11px)] ml-1.5 tracking-[0.2em]"
                style={{ color: VIOLET }}
              >
                SEC
              </span>
            </p>
            <div className="h-9 w-px bg-white/20 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-saira text-[clamp(7px,2.2cqw,8.5px)] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Eyes closed / first person
              </p>
              <p className="font-saira text-[clamp(11px,3.4cqw,13px)] font-bold text-white leading-tight">
                Up to 3 reps
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              {i > 0 && <div className="h-px" style={{ background: "rgba(20,17,24,0.14)" }} />}
              <Step {...s} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Closing line */}
      <div className="px-6 py-[7cqw] text-center" style={{ background: VIOLET }}>
        <p className="font-saira text-[clamp(16px,5.6cqw,21px)] font-extrabold text-white leading-none">
          &ldquo;I know what to do.&rdquo;
        </p>
      </div>
    </div>
  );
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const VIZ_CARDS: Record<string, VizCard> = {
  "squat-stack-depth-drive": {
    id: "squat-stack-depth-drive",
    tabLabel: "Card",
    render: () => <SquatStackDepthDrive />,
  },
};

/** The card assigned to `toolId` for this athlete, or null. */
export function cardFor(
  vizCards: Record<string, string> | null | undefined,
  toolId: string,
): VizCard | null {
  const id = vizCards?.[toolId];
  // An unknown id means the design was renamed or removed — show nothing
  // rather than crashing the tool it was attached to.
  return (id && VIZ_CARDS[id]) || null;
}
