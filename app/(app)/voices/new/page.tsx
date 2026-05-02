"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VoiceGlyph from "@/app/components/VoiceGlyph";
import type { BodyRegion, VoiceShape, DistanceBucket, SideBucket } from "@/lib/voices";
import { VOICE_SHAPES, DISTANCE_LABELS, HELPS_WHEN_PRESETS } from "@/lib/voices";
import { useT } from "@/lib/i18n";

// ── Constants ─────────────────────────────────────────────────────────────────

const SHAPE_COLORS = [
  "#A78BFA", // purple
  "#60A5FA", // blue
  "#67E8F9", // cyan
  "#4ADE80", // green
  "#FCD34D", // yellow
  "#FB923C", // orange
  "#F87171", // red
  "#E4E4E7", // white
] as const;

const SIZE_LABELS = ["XS", "S", "M", "L", "XL"] as const;

// ── Body region layout (200×260 viewBox) ──────────────────────────────────────

type RegionKind =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "poly"; points: string };

type RegionDef = {
  id: BodyRegion;
  label: string;
  shape: RegionKind;
  lx: number; // number label center x
  ly: number; // number label center y
};

const BODY_REGIONS: RegionDef[] = [
  {
    id: "head",
    label: "Head",
    shape: { kind: "circle", cx: 100, cy: 38, r: 25 },
    lx: 100, ly: 38,
  },
  {
    id: "neck",
    label: "Neck",
    shape: { kind: "rect", x: 89, y: 63, w: 22, h: 13, rx: 5 },
    lx: 100, ly: 70,
  },
  {
    id: "left_shoulder",
    label: "L. Shoulder",
    shape: { kind: "ellipse", cx: 68, cy: 86, rx: 19, ry: 15 },
    lx: 68, ly: 86,
  },
  {
    id: "right_shoulder",
    label: "R. Shoulder",
    shape: { kind: "ellipse", cx: 132, cy: 86, rx: 19, ry: 15 },
    lx: 132, ly: 86,
  },
  {
    id: "chest",
    label: "Chest",
    shape: { kind: "rect", x: 81, y: 76, w: 38, h: 30, rx: 4 },
    lx: 100, ly: 91,
  },
  {
    id: "back",
    label: "Back",
    shape: { kind: "rect", x: 81, y: 106, w: 38, h: 24, rx: 4 },
    lx: 100, ly: 118,
  },
  {
    id: "core",
    label: "Core",
    shape: { kind: "rect", x: 83, y: 130, w: 34, h: 22, rx: 4 },
    lx: 100, ly: 141,
  },
  {
    id: "left_arm",
    label: "L. Arm",
    shape: { kind: "rect", x: 44, y: 98, w: 22, h: 60, rx: 10 },
    lx: 55, ly: 128,
  },
  {
    id: "right_arm",
    label: "R. Arm",
    shape: { kind: "rect", x: 134, y: 98, w: 22, h: 60, rx: 10 },
    lx: 145, ly: 128,
  },
  {
    id: "left_hand",
    label: "L. Hand",
    shape: { kind: "ellipse", cx: 55, cy: 167, rx: 14, ry: 10 },
    lx: 55, ly: 167,
  },
  {
    id: "right_hand",
    label: "R. Hand",
    shape: { kind: "ellipse", cx: 145, cy: 167, rx: 14, ry: 10 },
    lx: 145, ly: 167,
  },
  {
    id: "legs",
    label: "Legs",
    shape: {
      kind: "poly",
      points: "83,152 117,152 113,245 104,218 96,218 87,245",
    },
    lx: 100, ly: 195,
  },
];

// ── SVG helpers ───────────────────────────────────────────────────────────────

function RegionShape({
  def,
  selected,
}: {
  def: RegionDef;
  selected: boolean;
}) {
  const fill   = selected ? "rgba(167,139,250,0.30)" : "rgba(255,255,255,0.04)";
  const stroke = selected ? "#A78BFA" : "rgba(255,255,255,0.12)";
  const sw     = selected ? 1.5 : 1;

  const s = def.shape;
  switch (s.kind) {
    case "circle":
      return <circle cx={s.cx} cy={s.cy} r={s.r} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "rect":
      return (
        <rect
          x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
    case "poly":
      return (
        <polygon
          points={s.points}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
  }
}

function BodyMap({
  selected,
  onToggle,
}: {
  selected: BodyRegion[];
  onToggle: (r: BodyRegion) => void;
}) {
  return (
    <svg
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[180px] mx-auto select-none"
      aria-label="Body map"
    >
      {/* Decorative background silhouette */}
      <circle cx={100} cy={38} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <path
        d="M 89 64 h 22 v 13 h -22 Z
           M 62 76 Q 48 90 44 100 L 44 158 Q 48 178 55 178 L 66 178 L 66 158 L 56 158 L 56 100 Q 60 90 68 80 Z
           M 138 76 Q 152 90 144 100 L 144 158 L 134 158 L 134 178 L 145 178 Q 152 178 156 158 L 156 100 Q 152 90 138 76 Z
           M 80 76 h 40 v 76 h -40 Z
           M 83 152 L 87 245 L 96 218 L 100 245 L 104 218 L 113 245 L 117 152 Z"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
        strokeLinejoin="round"
      />

      {/* Clickable regions */}
      {BODY_REGIONS.map((def) => {
        const isSelected = selected.includes(def.id);
        const idx = selected.indexOf(def.id);
        return (
          <g
            key={def.id}
            onClick={() => onToggle(def.id)}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={def.label}
            aria-pressed={isSelected}
          >
            <RegionShape def={def} selected={isSelected} />
            {isSelected && (
              <>
                <circle cx={def.lx} cy={def.ly} r={7} fill="#7C3AED" />
                <text
                  x={def.lx}
                  y={def.ly + 3.5}
                  textAnchor="middle"
                  fill="white"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {idx + 1}
                </text>
              </>
            )}
            {/* Invisible hit target for small shapes */}
            <rect
              x={def.lx - 16}
              y={def.ly - 16}
              width={32}
              height={32}
              fill="transparent"
              style={{ pointerEvents: "all" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3, 4, 5].map((n) => (
        <React.Fragment key={n}>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-saira text-[10px] font-bold ${
              n < current
                ? "bg-purple-600/50 text-purple-300 border border-purple-500/30"
                : n === current
                ? "bg-purple-600 text-white"
                : "bg-white/5 border border-white/10 text-zinc-400"
            }`}
          >
            {n < current ? "✓" : n}
          </div>
          {n < 5 && (
            <div
              className={`flex-1 h-px ${n < current ? "bg-purple-500/40" : "bg-white/5"}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Range slider ──────────────────────────────────────────────────────────────

function Slider({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
          {label}
        </span>
        <span className="font-saira text-[10px] text-zinc-400">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-saira text-[10px] text-zinc-400 w-14 text-right shrink-0">{lowLabel}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1 accent-purple-500 cursor-pointer"
        />
        <span className="font-saira text-[10px] text-zinc-400 w-14 shrink-0">{highLabel}</span>
      </div>
    </div>
  );
}

// ── Spatial canvas (Step 4) ───────────────────────────────────────────────────

const CX = 130, CY = 130;
const RING_R: Record<DistanceBucket, number> = { on: 20, close: 50, arm: 82, meters: 112, gone: 126 };
const SIDE_ANGLE: Record<SideBucket, number> = { front: -90, right: 0, back: 90, left: 180 };

function toXY(d: DistanceBucket, s: SideBucket) {
  const r = RING_R[d];
  const a = (SIDE_ANGLE[s] * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function fromXY(x: number, y: number): { d: DistanceBucket; s: SideBucket } {
  const dx = x - CX, dy = y - CY;
  const r = Math.sqrt(dx * dx + dy * dy);
  let d: DistanceBucket;
  if (r <= 28) d = "on";
  else if (r <= 62) d = "close";
  else if (r <= 94) d = "arm";
  else if (r <= 118) d = "meters";
  else d = "gone";

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let s: SideBucket;
  if (r < 6) s = "front";
  else if (angle >= -135 && angle < -45) s = "front";
  else if (angle >= -45 && angle < 45) s = "right";
  else if (angle >= 45 && angle < 135) s = "back";
  else s = "left";

  return { d, s };
}

function SpatialCanvas({
  currentDistance, currentSide,
  desiredDistance, desiredSide,
  onChange,
}: {
  currentDistance: DistanceBucket;
  currentSide: SideBucket;
  desiredDistance: DistanceBucket;
  desiredSide: SideBucket;
  onChange: (which: "current" | "desired", d: DistanceBucket, s: SideBucket) => void;
}) {
  const [activePuck, setActivePuck] = React.useState<"current" | "desired">("current");
  const svgRef = React.useRef<SVGSVGElement>(null);

  const getSVGCoords = React.useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = 260 / rect.width;
    const scaleY = 260 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const placePuck = (clientX: number, clientY: number) => {
    const coords = getSVGCoords(clientX, clientY);
    if (!coords) return;
    const dx = coords.x - CX, dy = coords.y - CY;
    const r = Math.sqrt(dx * dx + dy * dy);
    const scale = r > 126 ? 126 / r : 1;
    const { d, s } = fromXY(CX + dx * scale, CY + dy * scale);
    onChange(activePuck, d, s);
  };

  const currentPos = toXY(currentDistance, currentSide);
  const desiredPos = toXY(desiredDistance, desiredSide);

  const rings: [DistanceBucket, number][] = [
    ["meters", RING_R.meters],
    ["arm", RING_R.arm],
    ["close", RING_R.close],
    ["on", RING_R.on],
  ];

  return (
    <div>
      {/* Puck selector */}
      <div className="flex gap-2 mb-4">
        {(["current", "desired"] as const).map((which) => {
          const isActive = activePuck === which;
          const color = which === "current" ? "purple" : "blue";
          return (
            <button
              key={which}
              type="button"
              onClick={() => setActivePuck(which)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-saira text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                isActive
                  ? color === "purple"
                    ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                    : "border-blue-400/50 bg-blue-500/15 text-blue-300"
                  : "border-white/8 bg-white/3 text-zinc-400 hover:border-white/15"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  color === "purple" ? "bg-purple-400" : "bg-blue-400"
                }`}
              />
              {which === "current" ? "Now" : "Want"}
            </button>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="rounded-2xl border border-white/5 bg-surface-card p-2 mb-4">
        <svg
          ref={svgRef}
          viewBox="0 0 260 260"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full select-none touch-none"
          style={{ cursor: "crosshair" }}
          onClick={(e) => placePuck(e.clientX, e.clientY)}
        >
          {/* Background fill */}
          <circle cx={CX} cy={CY} r={128} fill="rgba(255,255,255,0.015)" />

          {/* Distance rings */}
          {rings.map(([label, r]) => (
            <circle
              key={label}
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          ))}
          {/* Outer solid ring */}
          <circle cx={CX} cy={CY} r={126} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1} />

          {/* Crosshair lines */}
          <line x1={CX} y1={4} x2={CX} y2={256} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          <line x1={4} y1={CY} x2={256} y2={CY} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />

          {/* Direction labels */}
          <text x={CX} y={14} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize={9} fontFamily="sans-serif">Front</text>
          <text x={CX} y={255} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize={9} fontFamily="sans-serif">Back</text>
          <text x={6}   y={CY + 4} textAnchor="start" fill="rgba(255,255,255,0.22)" fontSize={9} fontFamily="sans-serif">Left</text>
          <text x={254} y={CY + 4} textAnchor="end"   fill="rgba(255,255,255,0.22)" fontSize={9} fontFamily="sans-serif">Right</text>

          {/* Ring distance labels (at ~45° NE) */}
          {rings.map(([label, r]) => {
            const lx = CX + r * 0.707 + 3;
            const ly = CY - r * 0.707 - 3;
            return (
              <text key={label} x={lx} y={ly} fill="rgba(255,255,255,0.18)" fontSize={7} fontFamily="sans-serif">
                {DISTANCE_LABELS[label]}
              </text>
            );
          })}

          {/* Connection line between pucks */}
          <line
            x1={currentPos.x} y1={currentPos.y}
            x2={desiredPos.x} y2={desiredPos.y}
            stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} strokeDasharray="4 3"
          />

          {/* Desired puck */}
          <g style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setActivePuck("desired"); }}>
            <circle cx={desiredPos.x} cy={desiredPos.y} r={15}
              fill="rgba(96,165,250,0.15)" stroke="#60A5FA" strokeWidth={activePuck === "desired" ? 2 : 1.5}
              strokeDasharray={activePuck === "desired" ? undefined : "3 2"}
            />
            <text x={desiredPos.x} y={desiredPos.y + 3.5}
              textAnchor="middle" fill="#93C5FD" fontSize={7} fontFamily="sans-serif" fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >WANT</text>
          </g>

          {/* Current puck */}
          <g style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setActivePuck("current"); }}>
            <circle cx={currentPos.x} cy={currentPos.y} r={15}
              fill="rgba(167,139,250,0.25)" stroke="#A78BFA" strokeWidth={activePuck === "current" ? 2 : 1.5}
            />
            <text x={currentPos.x} y={currentPos.y + 3.5}
              textAnchor="middle" fill="white" fontSize={7} fontFamily="sans-serif" fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >NOW</text>
          </g>
        </svg>
      </div>

      {/* Status summary */}
      <div className="flex gap-3 text-center">
        <div className="flex-1 rounded-xl border border-purple-500/15 bg-purple-500/5 px-3 py-2">
          <p className="font-saira text-[9px] uppercase tracking-[0.14em] text-purple-300/70 mb-0.5">Now</p>
          <p className="font-saira text-[11px] font-semibold text-white capitalize">
            {DISTANCE_LABELS[currentDistance]}
          </p>
          <p className="font-saira text-[9px] text-zinc-400 capitalize">{currentSide}</p>
        </div>
        <div className="flex items-center text-zinc-500">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M11 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 rounded-xl border border-blue-400/15 bg-blue-500/5 px-3 py-2">
          <p className="font-saira text-[9px] uppercase tracking-[0.14em] text-blue-300/70 mb-0.5">Want</p>
          <p className="font-saira text-[11px] font-semibold text-white capitalize">
            {DISTANCE_LABELS[desiredDistance]}
          </p>
          <p className="font-saira text-[9px] text-zinc-400 capitalize">{desiredSide}</p>
        </div>
      </div>
    </div>
  );
}

// ── Wizard draft state ────────────────────────────────────────────────────────

type WizardState = {
  draftId: string | null;
  name: string;
  bodyLocations: BodyRegion[];
  tone: number;
  volume: number;
  shape: VoiceShape;
  color: string;
  size: 1 | 2 | 3 | 4 | 5;
  currentDistance: DistanceBucket;
  currentSide: SideBucket;
  desiredDistance: DistanceBucket;
  desiredSide: SideBucket;
  helpsWhen: string[];
  helpsNote: string;
};

// ── Wizard content ────────────────────────────────────────────────────────────

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();

  const rawStep = Number(searchParams.get("step") ?? "1");
  const step = Number.isFinite(rawStep) && rawStep >= 1 ? Math.min(rawStep, 5) : 1;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [customShape, setCustomShape] = React.useState("");
  const [existingVoices, setExistingVoices] = React.useState<
    { id: string; name: string; shape: VoiceShape; color: string; size: number }[]
  >([]);

  const [helpsError, setHelpsError] = React.useState<string | null>(null);

  const [wizard, setWizard] = React.useState<WizardState>({
    draftId: null,
    name: "",
    bodyLocations: [],
    tone: 50,
    volume: 50,
    shape: "cloud",
    color: SHAPE_COLORS[0],
    size: 3,
    currentDistance: "close",
    currentSide: "front",
    desiredDistance: "arm",
    desiredSide: "front",
    helpsWhen: [],
    helpsNote: "",
  });

  React.useEffect(() => {
    (async () => {
      const [draftRes, voicesRes] = await Promise.all([
        fetch("/api/voice-drafts"),
        fetch("/api/voices"),
      ]);

      let draftId: string | null = null;

      if (draftRes.ok) {
        let d = await draftRes.json();
        // No draft yet — create one
        if (!d?.id) {
          const createRes = await fetch("/api/voice-drafts", { method: "POST" });
          if (createRes.ok) d = await createRes.json();
        }
        if (d?.id) {
          draftId = d.id;
          const s = d.state ?? {};
          setWizard((prev) => ({
            ...prev,
            draftId: d.id,
            name: s.name ?? "",
            bodyLocations: s.body_locations ?? [],
            tone:            typeof s.tone   === "number" ? s.tone   : 50,
            volume:          typeof s.volume === "number" ? s.volume : 50,
            shape:           s.shape ?? "cloud",
            color:           s.color ?? SHAPE_COLORS[0],
            size:            s.size  ?? 3,
            currentDistance: s.current_distance ?? "close",
            currentSide:     s.current_side     ?? "front",
            desiredDistance: s.desired_distance ?? "arm",
            desiredSide:     s.desired_side     ?? "front",
            helpsWhen:       s.helps_when       ?? [],
            helpsNote:       s.helps_note       ?? "",
          }));
          if (s.shape === "custom" && s.shape_custom_description) {
            setCustomShape(s.shape_custom_description);
          }
        }
      }

      // If still no draftId (auth not configured / offline), generate a client-side stub
      if (!draftId) {
        setWizard((prev) => ({ ...prev, draftId: "offline" }));
      }

      if (voicesRes.ok) {
        const data = await voicesRes.json();
        if (Array.isArray(data.voices)) {
          setExistingVoices(
            data.voices.map((v: { id: string; name: string; shape: VoiceShape; color: string; size: number }) => ({
              id: v.id, name: v.name, shape: v.shape, color: v.color, size: v.size,
            }))
          );
        }
      }

      setLoading(false);
    })();
  }, []);

  const patchDraft = async (patch: Record<string, unknown>) => {
    if (!wizard.draftId) return;
    await fetch(`/api/voice-drafts/${wizard.draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: patch }),
    });
  };

  const goBack = () => {
    if (step > 1) {
      router.push(`/voices/new?step=${step - 1}`);
    } else {
      router.push("/voices");
    }
  };

  // ── Step 1 ─────────────────────────────────────────────────────────────────

  const handleStep1Continue = async () => {
    const trimmed = wizard.name.trim();
    if (trimmed.length < 1) { setNameError(t("voices.nameRequired")); return; }
    if (trimmed.length > 60) { setNameError(t("voices.nameTooLong")); return; }
    setNameError(null);
    setSaving(true);
    await patchDraft({ name: trimmed, current_step: 2 });
    setSaving(false);
    router.push("/voices/new?step=2");
  };

  // ── Step 2 ─────────────────────────────────────────────────────────────────

  const toggleRegion = (region: BodyRegion) => {
    setWizard((prev) => ({
      ...prev,
      bodyLocations: prev.bodyLocations.includes(region)
        ? prev.bodyLocations.filter((r) => r !== region)
        : [...prev.bodyLocations, region],
    }));
  };

  const handleStep2Continue = async () => {
    setSaving(true);
    await patchDraft({
      body_locations: wizard.bodyLocations,
      tone: wizard.tone,
      volume: wizard.volume,
      current_step: 3,
    });
    setSaving(false);
    router.push("/voices/new?step=3");
  };

  // ── Step 3 ─────────────────────────────────────────────────────────────────

  const handleStep3Continue = async () => {
    setSaving(true);
    await patchDraft({
      shape: wizard.shape,
      shape_custom_description: wizard.shape === "custom" ? customShape : null,
      color: wizard.color,
      size: wizard.size,
      current_step: 4,
    });
    setSaving(false);
    router.push("/voices/new?step=4");
  };

  // ── Step 4 ─────────────────────────────────────────────────────────────────

  const handleStep4Continue = async () => {
    setSaving(true);
    await patchDraft({
      current_distance: wizard.currentDistance,
      current_side:     wizard.currentSide,
      desired_distance: wizard.desiredDistance,
      desired_side:     wizard.desiredSide,
      current_step: 5,
    });
    setSaving(false);
    router.push("/voices/new?step=5");
  };

  // ── Step 5 ─────────────────────────────────────────────────────────────────

  const handleStep5Save = async () => {
    const noteOk = wizard.helpsNote.trim().length >= 10;
    if (wizard.helpsWhen.length === 0 && !noteOk) {
      setHelpsError(t("voices.step5MinChars"));
      return;
    }
    setHelpsError(null);
    setSaving(true);
    try {
      const body = {
        name:                     wizard.name,
        shape:                    wizard.shape,
        shape_custom_description: wizard.shape === "custom" ? customShape : null,
        color:                    wizard.color,
        size:                     wizard.size,
        tone:                     wizard.tone,
        volume:                   wizard.volume,
        body_locations:           wizard.bodyLocations,
        current_distance:         wizard.currentDistance,
        current_side:             wizard.currentSide,
        desired_distance:         wizard.desiredDistance,
        desired_side:             wizard.desiredSide,
        helps_when:               wizard.helpsWhen,
        helps_note:               wizard.helpsNote.trim(),
      };
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const voice = await res.json();
      // Clean up draft
      if (wizard.draftId && wizard.draftId !== "offline") {
        await fetch(`/api/voice-drafts/${wizard.draftId}`, { method: "DELETE" });
      }
      router.push(`/voices/${voice.id}`);
    } catch {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ── Shell ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400 hover:text-purple-300 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {step > 1 ? t("voices.back") : t("voices.yourVoices")}
          </button>
          <span className="text-zinc-500">·</span>
          <span className="font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400">
            {t("voices.mapTitle")}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8 pb-16">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-400 mb-1">
          {t("voices.voicesBeta")}
        </p>
        <p className="font-saira text-[10px] text-zinc-500 mb-6">
          {t("voices.stepLabel", { n: step })}
        </p>

        <StepIndicator current={step} />

        {/* ── Step 1: Name ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-2">
              {t("voices.step1Title")}
            </h1>
            <p className="font-saira text-xs text-zinc-400 leading-relaxed mb-8">
              {t("voices.step1Hint")}
            </p>

            {/* Existing voices shortcut */}
            {existingVoices.length > 0 && (
              <div className="mb-8">
                <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-3">
                  {t("voices.step1ExistingTitle")}
                </p>
                <div className="space-y-2">
                  {existingVoices.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={async () => {
                        setSaving(true);
                        await patchDraft({ existing_voice_id: v.id, current_step: 5 });
                        setSaving(false);
                        router.push("/voices/new?step=5");
                      }}
                      disabled={saving}
                      className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-surface-card px-4 py-3 hover:border-purple-500/20 hover:bg-[#1e1830] transition text-left disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <VoiceGlyph
                          shape={v.shape}
                          color={v.color}
                          size={v.size as 1 | 2 | 3 | 4 | 5}
                          className="w-6 h-6"
                        />
                        <span className="font-saira text-sm text-white">{v.name}</span>
                      </div>
                      <span className="font-saira text-[10px] text-purple-400 uppercase tracking-[0.12em]">
                        {t("voices.step1UseThis")}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="font-saira text-[10px] text-zinc-400 uppercase tracking-[0.14em]">
                    {t("voices.step1Or")}
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
              </div>
            )}

            {/* Name input */}
            <div className="mb-8">
              <label className="block font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-2">
                {t("voices.step1NameLabel")}
              </label>
              <input
                type="text"
                value={wizard.name}
                onChange={(e) => {
                  setWizard((p) => ({ ...p, name: e.target.value }));
                  setNameError(null);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleStep1Continue(); }}
                placeholder={t("voices.step1NamePlaceholder")}
                maxLength={60}
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-white placeholder:text-zinc-500 focus:border-purple-500/40 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition"
              />
              {nameError && (
                <p className="mt-1.5 font-saira text-xs text-red-400">{nameError}</p>
              )}
              <p className="mt-1.5 font-saira text-[10px] text-zinc-500 text-right">
                {wizard.name.length}/60
              </p>
            </div>

            <button
              type="button"
              onClick={handleStep1Continue}
              disabled={saving}
              className="w-full rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 py-4 font-saira text-sm font-bold uppercase tracking-[0.18em] text-white transition"
            >
              {saving ? t("voices.saving") : t("voices.continueBtn")}
            </button>
          </>
        )}

        {/* ── Step 2: Body ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-2">
              {t("voices.step2Title")}
            </h1>
            <p className="font-saira text-xs text-zinc-400 leading-relaxed mb-6">
              {t("voices.step2BodyHint")}
            </p>

            {/* Voice name chip */}
            {wizard.name && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 mb-6">
                <span className="font-saira text-[10px] text-purple-300 font-semibold">
                  {wizard.name}
                </span>
              </div>
            )}

            {/* Body silhouette */}
            <div className="rounded-2xl border border-white/5 bg-surface-card p-4 mb-4">
              <BodyMap selected={wizard.bodyLocations} onToggle={toggleRegion} />
            </div>

            {/* Selected region tags */}
            {wizard.bodyLocations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {wizard.bodyLocations.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRegion(r)}
                    className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 font-saira text-[10px] text-purple-300 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 transition"
                  >
                    {r.replace(/_/g, " ")} ×
                  </button>
                ))}
              </div>
            )}

            {/* Sliders */}
            <div className="rounded-2xl border border-white/5 bg-surface-card p-5 mb-8 space-y-6">
              <Slider
                label={t("voices.sliderTone")}
                lowLabel={t("voices.toneLow")}
                highLabel={t("voices.toneHigh")}
                value={wizard.tone}
                onChange={(v) => setWizard((p) => ({ ...p, tone: v }))}
              />
              <Slider
                label={t("voices.sliderVolume")}
                lowLabel={t("voices.volumeLow")}
                highLabel={t("voices.volumeHigh")}
                value={wizard.volume}
                onChange={(v) => setWizard((p) => ({ ...p, volume: v }))}
              />
            </div>

            <button
              type="button"
              onClick={handleStep2Continue}
              disabled={saving}
              className="w-full rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 py-4 font-saira text-sm font-bold uppercase tracking-[0.18em] text-white transition"
            >
              {saving ? t("voices.saving") : t("voices.continueBtn")}
            </button>
          </>
        )}

        {/* ── Step 3: Shape / colour / size ────────────────────────────────── */}
        {step === 3 && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-2">
              {t("voices.step3Title")}
            </h1>
            <p className="font-saira text-xs text-zinc-400 leading-relaxed mb-8">
              {t("voices.step3Hint")}
            </p>

            {/* Shape picker */}
            <div className="mb-6">
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-3">
                {t("voices.step3ShapeLabel")}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {VOICE_SHAPES.map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => setWizard((p) => ({ ...p, shape }))}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-1 transition ${
                      wizard.shape === shape
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/5 bg-surface-card hover:border-white/10"
                    }`}
                  >
                    <VoiceGlyph
                      shape={shape}
                      color={wizard.color}
                      size={wizard.size}
                      className="w-8 h-8"
                    />
                    <span className="font-saira text-[9px] text-zinc-400 capitalize leading-none">
                      {shape}
                    </span>
                  </button>
                ))}
              </div>
              {wizard.shape === "custom" && (
                <div className="mt-3">
                  <textarea
                    value={customShape}
                    onChange={(e) => setCustomShape(e.target.value)}
                    placeholder={t("voices.step3CustomPrompt")}
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-white placeholder:text-zinc-500 focus:border-purple-500/40 focus:outline-none resize-none transition"
                  />
                </div>
              )}
            </div>

            {/* Colour swatch */}
            <div className="mb-6">
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-3">
                {t("voices.step3ColorLabel")}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {SHAPE_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setWizard((p) => ({ ...p, color: hex }))}
                    style={{ backgroundColor: hex }}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      wizard.color === hex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e0c1a] scale-110"
                        : "opacity-60 hover:opacity-90 hover:scale-105"
                    }`}
                    aria-label={hex}
                    aria-pressed={wizard.color === hex}
                  />
                ))}
              </div>
            </div>

            {/* Size scale */}
            <div className="mb-8">
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-4">
                {t("voices.step3SizeLabel")}
              </p>
              <div className="flex items-end gap-5">
                {([1, 2, 3, 4, 5] as const).map((s, i) => {
                  const dim = 12 + i * 8; // 12 → 44
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setWizard((p) => ({ ...p, size: s }))}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        style={{
                          width:  dim,
                          height: dim,
                          borderRadius: "50%",
                          background: wizard.size === s ? wizard.color : "rgba(255,255,255,0.08)",
                          border:  wizard.size === s ? `2px solid ${wizard.color}` : "2px solid rgba(255,255,255,0.12)",
                          transition: "all 0.15s",
                          opacity: wizard.size === s ? 1 : 0.45,
                        }}
                      />
                      <span
                        className={`font-saira text-[9px] ${
                          wizard.size === s ? "text-white font-semibold" : "text-zinc-500"
                        }`}
                      >
                        {SIZE_LABELS[i]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live preview */}
            <div className="flex items-center gap-4 rounded-2xl border border-purple-500/15 bg-purple-500/5 px-5 py-4 mb-8">
              <VoiceGlyph
                shape={wizard.shape}
                color={wizard.color}
                size={wizard.size}
                className="w-14 h-14 shrink-0"
              />
              <div>
                <p className="font-saira text-sm font-bold text-white leading-tight">
                  {wizard.name || t("voices.step3PreviewName")}
                </p>
                <p className="font-saira text-[11px] text-zinc-400 capitalize mt-0.5">
                  {wizard.shape} · {SIZE_LABELS[wizard.size - 1]}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStep3Continue}
              disabled={saving}
              className="w-full rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 py-4 font-saira text-sm font-bold uppercase tracking-[0.18em] text-white transition"
            >
              {saving ? t("voices.saving") : t("voices.continueBtn")}
            </button>
          </>
        )}

        {/* ── Step 4: Spatial canvas ───────────────────────────────────────── */}
        {step === 4 && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-2">
              {t("voices.step4Title")}
            </h1>
            <p className="font-saira text-xs text-zinc-400 leading-relaxed mb-6">
              {t("voices.step4Hint")}
            </p>

            {wizard.name && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 mb-6">
                <VoiceGlyph shape={wizard.shape} color={wizard.color} size={wizard.size} className="w-4 h-4" />
                <span className="font-saira text-[10px] text-purple-300 font-semibold">{wizard.name}</span>
              </div>
            )}

            <SpatialCanvas
              currentDistance={wizard.currentDistance}
              currentSide={wizard.currentSide}
              desiredDistance={wizard.desiredDistance}
              desiredSide={wizard.desiredSide}
              onChange={(which, d, s) => {
                if (which === "current") {
                  setWizard((p) => ({ ...p, currentDistance: d, currentSide: s }));
                } else {
                  setWizard((p) => ({ ...p, desiredDistance: d, desiredSide: s }));
                }
              }}
            />

            <button
              type="button"
              onClick={handleStep4Continue}
              disabled={saving}
              className="w-full mt-8 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 py-4 font-saira text-sm font-bold uppercase tracking-[0.18em] text-white transition"
            >
              {saving ? t("voices.saving") : t("voices.continueBtn")}
            </button>
          </>
        )}

        {/* ── Step 5: Purpose ──────────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-2">
              {t("voices.step5Title")}
            </h1>
            <p className="font-saira text-xs text-zinc-400 leading-relaxed mb-8">
              {t("voices.step5Hint")}
            </p>

            {/* Preview chip */}
            {wizard.name && (
              <div className="flex items-center gap-3 rounded-2xl border border-purple-500/15 bg-purple-500/5 px-4 py-3 mb-8">
                <VoiceGlyph shape={wizard.shape} color={wizard.color} size={wizard.size} className="w-10 h-10 shrink-0" />
                <div>
                  <p className="font-saira text-sm font-bold text-white">{wizard.name}</p>
                  <p className="font-saira text-[10px] text-zinc-400 capitalize mt-0.5">
                    {wizard.shape} · {SIZE_LABELS[wizard.size - 1]} · {DISTANCE_LABELS[wizard.currentDistance]}
                  </p>
                </div>
              </div>
            )}

            {/* Preset checklist */}
            <div className="space-y-2 mb-6">
              {HELPS_WHEN_PRESETS.map((preset) => {
                const checked = wizard.helpsWhen.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setHelpsError(null);
                      setWizard((p) => ({
                        ...p,
                        helpsWhen: checked
                          ? p.helpsWhen.filter((w) => w !== preset)
                          : [...p.helpsWhen, preset],
                      }));
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      checked
                        ? "border-purple-500/40 bg-purple-500/10"
                        : "border-white/5 bg-surface-card hover:border-white/10"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 shrink-0 rounded-[4px] border flex items-center justify-center transition ${
                        checked
                          ? "border-purple-500 bg-purple-600"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`font-saira text-[12px] ${checked ? "text-white" : "text-zinc-300"}`}>
                      {preset}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Free-text */}
            <div className="mb-8">
              <label className="block font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-2">
                {t("voices.step5InYourWords")}
              </label>
              <textarea
                value={wizard.helpsNote}
                onChange={(e) => {
                  setHelpsError(null);
                  setWizard((p) => ({ ...p, helpsNote: e.target.value }));
                }}
                placeholder={t("voices.step5InYourWordsPlaceholder")}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-white placeholder:text-zinc-500 focus:border-purple-500/40 focus:outline-none resize-none transition"
              />
              {helpsError && (
                <p className="mt-1.5 font-saira text-xs text-red-400">{helpsError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleStep5Save}
              disabled={saving}
              className="w-full rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 py-4 font-saira text-sm font-bold uppercase tracking-[0.18em] text-white transition"
            >
              {saving ? t("voices.saving") : t("voices.step5SaveBtn")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page export (Suspense required for useSearchParams in Next.js 15) ─────────

export default function VoicesNewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-surface-base">
          <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
        </div>
      }
    >
      <WizardContent />
    </React.Suspense>
  );
}
