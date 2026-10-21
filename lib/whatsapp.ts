import { THEME_DEFS, detectSentiment, type Sentiment } from "@/lib/journal";

export type WhatsAppSenderRole = "athlete" | "coach" | "unknown";

export type WhatsAppParsedMessage = {
  sent_at: string | null;
  sender_name: string;
  sender_role: WhatsAppSenderRole;
  content: string;
};

export type WhatsAppAnalysis = {
  source: "ai" | "heuristic";
  summary: string;
  themes: { label: string; count?: number; evidence?: string[] }[];
  recurring_beliefs: string[];
  emotional_patterns: string[];
  risk_flags: string[];
  suggested_interventions: string[];
  session_questions: string[];
};

export type WhatsAppParseResult = {
  messages: WhatsAppParsedMessage[];
  participant_names: string[];
  period_start: string | null;
  period_end: string | null;
};

const MAX_STORED_MESSAGES = 1000;
const MAX_MESSAGE_CHARS = 1200;

const MESSAGE_PATTERNS = [
  /^\[(\d{1,2}[/.]\d{1,2}[/.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]\s([^:]+):\s?(.*)$/i,
  /^(\d{1,2}[/.]\d{1,2}[/.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s[-–]\s([^:]+):\s?(.*)$/i,
];

function normaliseName(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function inferSenderRole(sender: string, athleteName: string): WhatsAppSenderRole {
  const s = normaliseName(sender);
  const a = normaliseName(athleteName);
  if (!s || !a) return "unknown";
  if (s === a || a.includes(s) || s.includes(a)) return "athlete";
  const first = a.split(" ")[0];
  return first.length >= 3 && s.includes(first) ? "athlete" : "unknown";
}

function parseTimestamp(datePart: string, timePart: string): string | null {
  const pieces = datePart.split(/[/.]/).map((p) => Number(p));
  if (pieces.length !== 3 || pieces.some((n) => !Number.isFinite(n))) return null;
  const [first, second, rawYear] = pieces;
  const dayFirst = first > 12 || second <= 12;
  const day = dayFirst ? first : second;
  const month = dayFirst ? second : first;
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;

  const time = timePart.trim().toUpperCase();
  const ampm = time.endsWith("AM") || time.endsWith("PM") ? time.slice(-2) : null;
  const raw = ampm ? time.slice(0, -2).trim() : time;
  const [h, m, s = 0] = raw.split(":").map((p) => Number(p));
  if (![day, month, year, h, m, s].every((n) => Number.isFinite(n))) return null;
  let hour = h;
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const d = new Date(year, month - 1, day, hour, m, s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function truncateMessage(content: string): string {
  const text = content.trim();
  return text.length > MAX_MESSAGE_CHARS ? text.slice(0, MAX_MESSAGE_CHARS).trimEnd() : text;
}

export function parseWhatsAppExport(raw: string, athleteName: string): WhatsAppParseResult {
  const messages: WhatsAppParsedMessage[] = [];
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const line of lines) {
    let match: RegExpMatchArray | null = null;
    for (const pattern of MESSAGE_PATTERNS) {
      match = line.match(pattern);
      if (match) break;
    }

    if (match) {
      const sender = match[3].trim();
      messages.push({
        sent_at: parseTimestamp(match[1], match[2]),
        sender_name: sender,
        sender_role: inferSenderRole(sender, athleteName),
        content: truncateMessage(match[4]),
      });
      continue;
    }

    const last = messages[messages.length - 1];
    if (last && line.trim()) {
      last.content = truncateMessage(`${last.content}\n${line.trim()}`);
    }
  }

  const storedMessages = messages.slice(-MAX_STORED_MESSAGES);
  const participant_names = Array.from(new Set(storedMessages.map((m) => m.sender_name))).sort();
  const dated = storedMessages.map((m) => m.sent_at).filter(Boolean) as string[];
  return {
    messages: storedMessages,
    participant_names,
    period_start: dated[0] ?? null,
    period_end: dated[dated.length - 1] ?? null,
  };
}

function snippet(content: string): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  return oneLine.length > 160 ? `${oneLine.slice(0, 157)}...` : oneLine;
}

function athleteMessages(messages: WhatsAppParsedMessage[]): WhatsAppParsedMessage[] {
  const own = messages.filter((m) => m.sender_role === "athlete");
  return own.length ? own : messages;
}

export function analyseWhatsAppHeuristically(messages: WhatsAppParsedMessage[]): WhatsAppAnalysis {
  const source = athleteMessages(messages);
  const text = source.map((m) => m.content).join("\n").toLowerCase();
  const sentiments = source.map((m) => detectSentiment(m.content));
  const sentimentCounts: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  for (const s of sentiments) sentimentCounts[s]++;

  const themes = THEME_DEFS.map((def) => {
    const hits = source.filter((m) => def.keywords.some((kw) => m.content.toLowerCase().includes(kw)));
    return {
      label: def.label,
      count: hits.length,
      evidence: hits.slice(0, 2).map((m) => snippet(m.content)),
    };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  const beliefs: string[] = [];
  if (/not ready|not good enough|don't think i can|not sure i can/.test(text)) beliefs.push("Readiness is being treated as a feeling that has to be present before trust.");
  if (/should have|never satisfied|beating myself up/.test(text)) beliefs.push("Performance is being evaluated through a perfectionistic standard.");
  if (/one bad|bad session|terrible session|worst session/.test(text)) beliefs.push("A difficult session may be getting overgeneralised into a larger story.");

  const risk_flags: string[] = [];
  if (/hopeless|pointless|useless|nothing is working/.test(text)) risk_flags.push("Hopelessness language appears in the export. Review directly rather than treating this as a normal performance dip.");
  if (/binge|purge|starv|laxative|make weight|weight cut/.test(text)) risk_flags.push("Weight-cut or eating-control language appears. Check whether this is sport planning or a health risk.");
  if (/injur|sharp pain|can't train|couldn't train/.test(text)) risk_flags.push("Injury or pain language appears and may be affecting confidence.");

  const dominant = themes.slice(0, 2).map((t) => t.label.toLowerCase());
  const summary = dominant.length
    ? `WhatsApp themes are currently led by ${dominant.join(" and ")} across ${source.length} athlete-side messages. Sentiment reads ${sentimentCounts.negative > sentimentCounts.positive ? "more negative than positive" : sentimentCounts.positive > sentimentCounts.negative ? "more positive than negative" : "mixed or neutral"}.`
    : `Imported ${source.length} athlete-side messages. There are not enough clear keyword signals yet, so use the conversation as context rather than a diagnosis.`;

  return {
    source: "heuristic",
    summary,
    themes,
    recurring_beliefs: beliefs,
    emotional_patterns: [
      `${sentimentCounts.positive} positive, ${sentimentCounts.neutral} neutral, ${sentimentCounts.negative} negative message signals`,
    ],
    risk_flags,
    suggested_interventions: suggestInterventions(themes.map((t) => t.label), risk_flags),
    session_questions: suggestQuestions(themes.map((t) => t.label), beliefs, risk_flags),
  };
}

function suggestQuestions(themeLabels: string[], beliefs: string[], riskFlags: string[]): string[] {
  if (riskFlags.length) return ["What part of this feels like normal sport stress, and what part feels bigger than sport right now?"];
  const questions = new Set<string>();
  if (themeLabels.includes("Self-doubt")) questions.add("What evidence are you discounting when you say you are not ready?");
  if (themeLabels.includes("Pre-comp anxiety")) questions.add("When the anxiety shows up, where does your attention go first?");
  if (themeLabels.includes("Perfectionism")) questions.add("What would be a good-enough session that still moves you forward?");
  if (beliefs.length) questions.add("What is the story underneath this reaction, and when did it start feeling true?");
  questions.add("What should we protect in the next training week: confidence, attention, recovery, or execution?");
  return Array.from(questions).slice(0, 4);
}

function suggestInterventions(themeLabels: string[], riskFlags: string[]): string[] {
  if (riskFlags.length) return ["Coach-led check-in before technique or performance work"];
  const out = new Set<string>();
  if (themeLabels.includes("Self-doubt")) out.add("Evidence log before heavy sessions");
  if (themeLabels.includes("Pre-comp anxiety")) out.add("Pre-attempt breathing plus attention cue");
  if (themeLabels.includes("Perfectionism")) out.add("Good-enough criteria for the next block");
  if (themeLabels.includes("Focus & flow")) out.add("Short guided imagery for the first working set");
  out.add("One-question weekly reflection");
  return Array.from(out).slice(0, 4);
}

export function buildWhatsAppAnalysisPrompt(athleteName: string, messages: WhatsAppParsedMessage[]): string {
  const body = athleteMessages(messages)
    .slice(-160)
    .map((m, i) => {
      const date = m.sent_at ? m.sent_at.slice(0, 10) : "unknown date";
      return `${i + 1}. [${date}] ${m.sender_name}: ${m.content}`;
    })
    .join("\n");

  return `Athlete: ${athleteName}
Source: WhatsApp export, athlete-side messages where identifiable.

Read this as coach-only preparation context for a powerlifting sport-psychology session. Extract psychological themes, not gossip. Do not diagnose.

Return ONLY valid JSON matching this shape:
{"summary":"2-4 coach-only sentences","themes":[{"label":"short theme","count":3,"evidence":["short paraphrase or brief quote"]}],"recurring_beliefs":["..."],"emotional_patterns":["..."],"risk_flags":["..."],"suggested_interventions":["..."],"session_questions":["..."]}

Messages:
${body}`;
}

export function parseWhatsAppAnalysis(raw: string): WhatsAppAnalysis | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<WhatsAppAnalysis>;
    if (typeof parsed.summary !== "string" || !Array.isArray(parsed.themes)) return null;
    return {
      source: "ai",
      summary: parsed.summary.trim(),
      themes: parsed.themes.filter((t) => t && typeof t.label === "string").slice(0, 8).map((t) => ({
        label: t.label,
        count: typeof t.count === "number" ? t.count : undefined,
        evidence: Array.isArray(t.evidence) ? t.evidence.filter((e) => typeof e === "string").slice(0, 3) : [],
      })),
      recurring_beliefs: stringArray(parsed.recurring_beliefs, 6),
      emotional_patterns: stringArray(parsed.emotional_patterns, 6),
      risk_flags: stringArray(parsed.risk_flags, 4),
      suggested_interventions: stringArray(parsed.suggested_interventions, 6),
      session_questions: stringArray(parsed.session_questions, 6),
    };
  } catch {
    return null;
  }
}

function stringArray(value: unknown, limit: number): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, limit) : [];
}

/**
 * A wa.me deep link for `phone`, or null when the number can't be one.
 *
 * This is the no-infrastructure half of "message an athlete from the app": the
 * coach taps, WhatsApp opens with the chat and the text already in the box,
 * and they press send themselves. Nothing is sent on their behalf, so it needs
 * no Meta business verification, no approved templates and no dedicated API
 * number.
 *
 * wa.me wants a bare international number — digits only, no "+", spaces,
 * brackets or dashes. Anything shorter than 8 digits is a local or short
 * number wa.me cannot route, so we return null rather than opening WhatsApp on
 * a chat that does not exist.
 */
export function waLink(phone: string | null | undefined, text?: string | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null; // E.164 bounds
  const body = (text ?? "").trim();
  return `https://wa.me/${digits}${body ? `?text=${encodeURIComponent(body)}` : ""}`;
}
