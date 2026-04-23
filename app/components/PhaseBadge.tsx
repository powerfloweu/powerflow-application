export type TrainingPhase =
  | "Foundation"
  | "Build"
  | "Peak"
  | "Meet week"
  | "Meet day";

const PHASE_STYLES: Record<TrainingPhase, { bg: string; text: string; border: string }> = {
  Foundation: { bg: "bg-sky-500/10",    text: "text-sky-300",    border: "border-sky-500/30"    },
  Build:      { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30" },
  Peak:       { bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/30"  },
  "Meet week":{ bg: "bg-rose-500/10",   text: "text-rose-300",   border: "border-rose-500/30"   },
  "Meet day": { bg: "bg-rose-600/20",   text: "text-rose-200",   border: "border-rose-500/50"   },
};

interface Props {
  phase: TrainingPhase;
  weekNum?: number;
  className?: string;
}

export default function PhaseBadge({ phase, weekNum, className = "" }: Props) {
  const s = PHASE_STYLES[phase];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-saira text-[10px] uppercase tracking-[0.16em] ${s.bg} ${s.text} ${s.border} ${className}`}
    >
      {weekNum !== undefined && (
        <span className="opacity-60">W{weekNum}</span>
      )}
      {phase}
    </span>
  );
}
