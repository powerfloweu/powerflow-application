"use client";

import type { VoiceShape } from "@/lib/voices";

export interface VoiceGlyphProps {
  shape: VoiceShape;
  color: string; // hex
  size?: 1 | 2 | 3 | 4 | 5; // 1=XS, 5=XL — affects visual weight only
  className?: string;
}

/**
 * Renders a simple SVG glyph for each of the 8 voice shapes.
 * The parent controls the rendered size via `className` (e.g. "w-10 h-10").
 * All paths/fills use the `color` prop directly so the glyph is colour-aware.
 */
export default function VoiceGlyph({ shape, color, size = 3, className = "w-10 h-10" }: VoiceGlyphProps) {
  // Visual weight derived from size: stroke width, opacity, fill intensity
  const sw = 1 + size * 0.35; // 1.35 … 2.75
  const alpha = 0.25 + size * 0.1; // 0.35 … 0.75 for glow/fill opacity

  const shared = {
    stroke: color,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: sw,
  };

  let glyph: React.ReactNode;

  switch (shape) {
    case "cloud": {
      // Soft rounded blob with 3 bumps
      glyph = (
        <>
          <path
            d="M18 34 C10 34 6 28 6 23 C6 18 10 14 15 14 C16 10 20 7 25 7 C31 7 36 12 36 18 C40 18 44 22 44 27 C44 31 41 34 37 34 Z"
            fill={color}
            fillOpacity={alpha}
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
      break;
    }

    case "orb": {
      // Filled circle with a subtle glow ring
      glyph = (
        <>
          {/* Glow ring */}
          <circle cx="25" cy="25" r="19" fill={color} fillOpacity={alpha * 0.4} stroke="none" />
          {/* Main orb */}
          <circle cx="25" cy="25" r="13" fill={color} fillOpacity={alpha + 0.1} stroke={color} strokeWidth={sw} />
        </>
      );
      break;
    }

    case "beam": {
      // Thick diagonal rectangle rotated 45°
      glyph = (
        <rect
          x="16"
          y="8"
          width="18"
          height="34"
          rx="4"
          fill={color}
          fillOpacity={alpha}
          stroke={color}
          strokeWidth={sw}
          transform="rotate(45 25 25)"
        />
      );
      break;
    }

    case "blade": {
      // Narrow tall triangle, sharp
      glyph = (
        <polygon
          points="25,6 31,44 25,40 19,44"
          fill={color}
          fillOpacity={alpha}
          stroke={color}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
      break;
    }

    case "fog": {
      // Three overlapping semi-transparent ellipses
      glyph = (
        <>
          <ellipse cx="18" cy="26" rx="12" ry="8" fill={color} fillOpacity={alpha * 0.6} stroke={color} strokeWidth={sw * 0.7} />
          <ellipse cx="27" cy="22" rx="13" ry="9" fill={color} fillOpacity={alpha * 0.7} stroke={color} strokeWidth={sw * 0.7} />
          <ellipse cx="22" cy="31" rx="11" ry="7" fill={color} fillOpacity={alpha * 0.5} stroke={color} strokeWidth={sw * 0.7} />
        </>
      );
      break;
    }

    case "spike": {
      // Circle with 8 radiating points
      const points8 = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
        const innerR = 9;
        const outerR = 20;
        const tipX = 25 + Math.cos(angle) * outerR;
        const tipY = 25 + Math.sin(angle) * outerR;
        const baseAngleL = angle - 0.25;
        const baseAngleR = angle + 0.25;
        const blX = 25 + Math.cos(baseAngleL) * innerR;
        const blY = 25 + Math.sin(baseAngleL) * innerR;
        const brX = 25 + Math.cos(baseAngleR) * innerR;
        const brY = 25 + Math.sin(baseAngleR) * innerR;
        return `${blX},${blY} ${tipX},${tipY} ${brX},${brY}`;
      });
      glyph = (
        <>
          <circle cx="25" cy="25" r="9" fill={color} fillOpacity={alpha} stroke={color} strokeWidth={sw} />
          {points8.map((pts, i) => (
            <polygon key={i} points={pts} fill={color} fillOpacity={alpha * 0.8} stroke={color} strokeWidth={sw * 0.5} />
          ))}
        </>
      );
      break;
    }

    case "thread": {
      // Sinuous wavy line
      glyph = (
        <path
          d="M8 20 C12 12 18 12 22 20 C26 28 32 28 36 20 C38 16 41 14 44 16"
          fill="none"
          stroke={color}
          strokeWidth={sw * 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
      break;
    }

    case "custom":
    default: {
      // Question mark inside a dashed circle
      glyph = (
        <>
          <circle
            cx="25"
            cy="25"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray="4 3"
          />
          <text
            x="25"
            y="31"
            textAnchor="middle"
            fill={color}
            fontSize="18"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            ?
          </text>
        </>
      );
      break;
    }
  }

  return (
    <svg
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      role="img"
    >
      {glyph}
    </svg>
  );
}
