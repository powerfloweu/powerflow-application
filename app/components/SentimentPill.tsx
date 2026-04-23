import { SENT_CONFIG, type Sentiment } from "@/lib/journal";

interface Props {
  sentiment: Sentiment;
  /** Show as a small dot only (for compact views) */
  dot?: boolean;
}

export default function SentimentPill({ sentiment, dot = false }: Props) {
  const cfg = SENT_CONFIG[sentiment];
  if (dot) {
    return <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />;
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.16em] ${cfg.ring} ${cfg.text}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

export { SENT_CONFIG };
export type { Sentiment };
