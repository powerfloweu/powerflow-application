// ── Coach view helpers ────────────────────────────────────────────────────────
// Pure, JSX-free helper functions extracted from page.tsx.

import type { Flag, EntryRow, Client } from "./model";

export type TFn = (key: string) => string;
export type SortKey = "flag" | "positive" | "entries" | "name";

export function computeSentimentTrajectory(allEntries: EntryRow[]): { labelKey: string; rate: number }[] {
  const now = new Date();
  const result: { labelKey: string; rate: number }[] = [];
  const labelKeys = ["coach.weekLabels0", "coach.weekLabels1", "coach.weekLabels2"];
  for (let w = 2; w >= 0; w--) {
    const start = new Date(now); start.setDate(now.getDate() - (w + 1) * 7); start.setHours(0, 0, 0, 0);
    const end   = new Date(now); end.setDate(now.getDate() - w * 7); end.setHours(0, 0, 0, 0);
    const weekE = allEntries.filter((e) => {
      const d = new Date(e.created_at);
      return d >= start && d < end;
    });
    const rate = weekE.length
      ? Math.round((weekE.filter((e) => e.sentiment === "positive").length / weekE.length) * 100)
      : 0;
    result.push({ labelKey: labelKeys[2 - w], rate });
  }
  return result;
}

export function timeSince(iso: string, t: TFn): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return t("coach.timeSinceJustNow");
  if (diffMin < 60) return t("coach.timeSinceMinAgo").replace("{n}", String(diffMin));
  if (diffH   < 24) return t("coach.timeSinceHAgo").replace("{n}", String(diffH));
  return t("coach.timeSinceDayAgo").replace("{n}", String(diffD));
}

export const STOP_WORDS = new Set([
  "a","the","is","it","and","i","my","to","of","was","that","were","with","for",
  "so","not","but","in","on","at","be","by","as","an","or","if","do","no","we",
  "up","out","had","have","has","did","get","got","just","its","im","me","they",
  "our","he","she","us","you","your","this","from","are","all","can","when",
  "what","how","really","very","too","also","about","their","there","then",
]);

export function extractTopics(texts: string[]): string[] {
  const freq: Record<string, number> = {};
  for (const t of texts) {
    for (const word of t.toLowerCase().split(/\W+/)) {
      if (word.length < 3 || STOP_WORDS.has(word)) continue;
      freq[word] = (freq[word] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

export function sortClients(clients: Client[], sort: SortKey): Client[] {
  const flagOrder: Record<Flag, number> = { attention: 0, monitor: 1, stable: 2 };
  return [...clients].sort((a, b) => {
    if (sort === "flag")     return flagOrder[a.flag] - flagOrder[b.flag];
    if (sort === "positive") return a.positiveRate - b.positiveRate;
    if (sort === "entries")  return b.entriesThisWeek - a.entriesThisWeek;
    if (sort === "name")     return a.name.localeCompare(b.name);
    return 0;
  });
}
