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
  voice_id: string | null;
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
  // Only phrases that unambiguously signal perfectionist pressure.
  // Removed: "better", "perfect", "mistake", "wrong", "failed" — all fire on
  // positive entries ("did better than ever", "felt perfect", "no mistakes today").
  { label: "Perfectionism",    keywords: ["should have", "not good enough", "can't execute", "too hard on myself", "never satisfied", "not happy with how", "not happy with my", "beating myself up", "should have done"], color: "rose"    },

  // "strong" alone is fine for confidence (kept). "trust" alone could match
  // "I don't trust…" but it's rare enough to leave in.
  { label: "Confidence",       keywords: ["believe in myself", "i can do", "feeling confident", "felt confident", "trust my", "trust the process", "nailed it", "nailed the", "i belong", "feel strong", "feeling strong"], color: "emerald" },

  // Removed "imagin" — matches mental imagery / visualization (neutral/positive).
  { label: "Pre-comp anxiety", keywords: ["nervous", "worried", "anxious", "scared", "afraid", "dreading", "worst case", "not ready for", "fear of"], color: "amber"   },

  // "locked" alone could be ambiguous; "locked in" is the meaningful phrase.
  { label: "Focus & flow",     keywords: ["in the zone", "zone out", "clicked", "locked in", "focused", "in a flow", "flow state", "sharp", "tunnel vision", "dialled in"], color: "purple"  },

  // "solid" and "progress" alone are fine. Removed nothing — these were clean.
  { label: "Motivation",       keywords: ["motivated", "excited", "look forward", "pay off", "great session", "solid session", "love training", "love this sport", "can't wait to train"], color: "sky"     },

  // Removed "can't" — fires on "can't wait for the meet", "can't believe how well it went".
  // Removed "not sure" — too vague, fires on "not sure which weight to open with".
  { label: "Self-doubt",       keywords: ["doubt myself", "doubting myself", "brain shuts", "overthinking", "don't think i can", "questioning myself", "not sure i can", "unable to", "losing confidence"], color: "orange"  },
];

export const THEME_CLS: Record<string, string> = {
  rose:    "border-rose-500/30 bg-rose-500/10 text-rose-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
  purple:  "border-purple-500/30 bg-purple-500/10 text-purple-300",
  sky:     "border-sky-500/30 bg-sky-500/10 text-sky-300",
  orange:  "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

// ── Auto sentiment detection ──────────────────────────────────────────────────

// Phrases only appear in genuinely negative contexts.
// Avoided: "pull"/"pulled" (fires on deadlifts), "sore" (normal training),
// "never" (fires on "never felt this good"), "bad" (fires on "not bad"),
// "miss"/"missed" (fires on "no missed lifts"), "hard" (fires on "worked hard"),
// single words that appear inside their own negation ("confident" in NEGATIVE
// so "not confident" adds negative AND "confident" adds positive — they wash out).
const NEGATIVE_SIGNALS = [
  // Emotions — specific enough to only appear in negative contexts
  "fear ", "afraid", "anxious", "anxiety", "nervous about", "worried about",
  "stressed out", "depressed", "hopeless", "overwhelmed", "dreading",
  "angry at", "anger",
  // Physical — injury language only (not normal soreness)
  "injury", "injured", "injure", "tore ", "torn ", "sprained", "fracture",
  "in pain", "sharp pain", "really hurting", "can't train",
  // Negation phrases — full phrase so they don't collide with positive use
  "not enjoying", "didn't enjoy", "do not enjoy",
  "can't do this", "couldn't do", "unable to complete",
  "don't want to train", "didn't want to",
  "not ready for", "not feeling good today", "not feeling well",
  // Performance failure — specific phrases
  "bombed out", "bomb out", "red-lighted all", "missed all",
  "couldn't execute", "failed to execute", "lost focus completely",
  "struggling badly", "struggling a lot", "really struggled",
  "no motivation", "unmotivated", "burned out", "burnt out",
  "hard time today", "really difficult today",
  // Explicit negativity
  "hate this", "hate training", "terrible session", "awful session",
  "horrible", "worst session", "pointless", "useless",
  "nothing is working", "nothing worked",
  // Doubt — specific phrases
  "self-doubt", "doubt myself", "don't believe in myself",
  "don't think i can", "questioning myself",
];

// Only phrases with a strong positive signal regardless of context.
// Avoided single words like "good" (fires inside "not good"), "trust"
// (fires in "don't trust my form"), "better" (fires in "could be better"),
// "hit" (fires in "didn't hit"), "best" (fires in "not my best").
const POSITIVE_SIGNALS = [
  "great session", "great training", "great day",
  "amazing session", "amazing training", "felt amazing",
  "solid session", "solid training", "felt solid",
  "feeling strong", "felt strong", "feeling confident", "felt confident",
  "feeling great", "felt great", "feeling good today",
  "new pr", "hit a pr", "set a pr", "personal record", "personal best",
  "nailed it", "nailed the", "crushed it", "crushed the",
  "locked in", "dialled in", "dialed in", "in the zone",
  "motivated", "excited for", "pumped for", "pumped up",
  "proud of", "feeling proud",
  "progressing", "making progress", "good progress",
  "can't wait for", "looking forward to",
  "love training", "love this sport", "love the process",
  "everything clicked", "everything felt right",
  "stoked", "fantastic",
];

export function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const neg = NEGATIVE_SIGNALS.filter((w) => lower.includes(w)).length;
  const pos = POSITIVE_SIGNALS.filter((w) => lower.includes(w)).length;
  if (neg > pos) return "negative";
  if (pos > neg) return "positive";
  return "neutral";
}

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
