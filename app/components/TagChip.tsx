import { THEME_CLS } from "@/lib/journal";

interface Props {
  label: string;
  /** Color key from THEME_CLS — rose/emerald/amber/purple/sky/orange */
  color: string;
  count?: number;
  /** Optional trend arrow prefix */
  trend?: "up" | "down" | "stable";
  className?: string;
}

const TREND_ICON: Record<string, string>  = { up: "↑", down: "↓", stable: "→" };
const TREND_COLOR: Record<string, string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  stable: "text-zinc-500",
};

export default function TagChip({ label, color, count, trend, className = "" }: Props) {
  const cls = THEME_CLS[color] ?? THEME_CLS["purple"];
  return (
    <span
      className={`rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.13em] ${cls} ${className}`}
    >
      {trend && (
        <span className={`mr-1 font-bold ${TREND_COLOR[trend]}`}>
          {TREND_ICON[trend]}
        </span>
      )}
      {label}
      {count !== undefined && (
        <span className="ml-1.5 opacity-50">×{count}</span>
      )}
    </span>
  );
}
