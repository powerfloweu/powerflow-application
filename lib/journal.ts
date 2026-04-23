/**
 * Shared journal types, constants, and helpers.
 * Imported by journal page, coach page, and all entry-related components.
 */

export type Sentiment = "positive" | "negative" | "neutral";

export type Context =
  | "pre-training"
  | "during-session"
  | "post-competition"
  | "rest-day"
  | "general";

export type JournalEntry = {
  id: string;
  content: string;
  sentiment: Sentiment;
  context: Context;
  themes: string[];
  created_at: string;
};

// ── Sentiment ─────────────────────────────────────────────────────────────────

export const SENT_CONFIG: Record<
  Sentiment,
  { label: string; icon: string; ring: string; bg: string; text: string; dot: string }
> = {
  positive: { label: "Positive", icon: "↑", ring: "border-emerald-500/60", bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
  negative: { label: "Negative", icon: "↓", ring: "border-rose-500/60",    bg: "bg-rose-500/15",    text: "text-rose-300",    dot: "bg-rose-400"    },
  neutral:  { label: "Neutral",  icon: "→", ring: "border-sky-500/60",     bg: "bg-sky-500/15",     text: "text-sky-300",     dot: "bg-sky-400"     },
};

// ── Context ───────────────────────────────────────────────────────────────────

export const CTX_CONFIG: Record<Context, { label: string; icon: string }> = {
  "pre-training":     { label: "Pre-training",    icon: "⚡" },
  "during-session":   { label: "During session",  icon: "🎯" },
  "post-competition": { label: "Post-competition", icon: "🏆" },
  "rest-day":         { label: "Rest day",         icon: "💤" },
  "general":          { label: "General",          icon: "💭" },
};

// ── Themes ────────────────────────────────────────────────────────────────────

export type ThemeDef = { label: string; keywords: string[]; color: string };

export const THEME_DEFS: ThemeDef[] = [
  { label: "Perfectionism",    keywords: ["should have", "not good enough", "perfect", "mistake", "wrong", "failed", "can't execute", "better"], color: "rose"    },
  { label: "Confidence",       keywords: ["believe", "can do", "strong", "confident", "trust", "coming back", "nailed", "belong"],                color: "emerald" },
  { label: "Pre-comp anxiety", keywords: ["nervous", "worried", "anxious", "scared", "fear", "worst case", "not ready", "imagin"],                color: "amber"   },
  { label: "Focus & flow",     keywords: ["zone", "clicked", "in the zone", "focused", "concentrate", "flow", "sharp", "locked"],                 color: "purple"  },
  { label: "Motivation",       keywords: ["motivated", "excited", "look forward", "pay off", "progress", "great session", "solid"],               color: "sky"     },
  { label: "Self-doubt",       keywords: ["can't", "unable", "brain shuts", "doubt", "overthinking", "not sure"],                                 color: "orange"  },
];

export const THEME_CLS: Record<string, string> = {
  rose:    "border-rose-500/30 bg-rose-500/10 text-rose-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
  purple:  "border-purple-500/30 bg-purple-500/10 text-purple-300",
  sky:     "border-sky-500/30 bg-sky-500/10 text-sky-300",
  orange:  "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

export function detectThemes(entries: Pick<JournalEntry, "content">[]): string[] {
  return THEME_DEFS
    .filter((def) =>
      entries.some((e) =>
        def.keywords.some((kw) => e.content.toLowerCase().includes(kw))
      )
    )
    .map((def) => def.label);
}

export function detectThemesWithCount(entries: Pick<JournalEntry, "content">[]) {
  return THEME_DEFS
    .map((def) => ({
      def,
      count: entries.filter((e) =>
        def.keywords.some((kw) => e.content.toLowerCase().includes(kw))
      ).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}
