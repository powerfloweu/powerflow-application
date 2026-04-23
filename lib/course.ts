/**
 * PowerFlow — 16-Week Mental Performance Course
 *
 * Week + question definitions live here (not in DB). This keeps content
 * versionable and editable without a migration. User state (progress +
 * reflection answers) lives in Supabase.
 *
 * The course is structured around 7 themes totalling 15 weeks (Week 0 is the
 * intake / baseline week → 16 total touchpoints).
 *
 *   Theme 1 — Self Knowledge               (2 weeks)
 *   Theme 2 — Goal Setting                 (1 week)
 *   Theme 3 — Athlete-Coach Relationship   (1 week)
 *   Theme 4 — Altered State of Mind        (4 weeks)
 *   Theme 5 — Visualization & Mental Train (4 weeks)
 *   Theme 6 — Focus                        (2 weeks)
 *   Theme 7 — Performance                  (1 week)
 */

import type { TrainingPhase } from "@/app/components/PhaseBadge";

// ── Types ────────────────────────────────────────────────────────────────────

export type CourseTheme =
  | "Self Knowledge"
  | "Goal Setting"
  | "Athlete-Coach Relationship"
  | "Altered State of Mind"
  | "Visualization & Mental Training"
  | "Focus"
  | "Performance";

export type CourseQuestion = {
  id: string;
  prompt: string;
  placeholder?: string;
  /**
   * If true, saving this answer also creates/updates a journal entry
   * with the "general" context and a `#course` theme tag, so reflections
   * flow into the athlete's journal automatically.
   */
  journalMirror?: boolean;
};

export type CourseWeek = {
  /** Stable URL-safe identifier, used in routes & DB */
  slug: string;
  /** 1-indexed week number shown in the UI */
  weekNumber: number;
  theme: CourseTheme;
  /** Short headline ("Me & Powerlifting") */
  title: string;
  /** Subtitle / tagline shown under title */
  subtitle?: string;
  /** Training phase this week is designed for (rough mapping) */
  suggestedPhase: TrainingPhase;
  /** 1-2 sentence overview of what this week is about */
  overview: string;
  /** Optional Vidyard video UUID (from share URL) */
  vidyardUuid?: string;
  /** Optional audio URL (mp3/wav) — player is rendered if set */
  audioUrl?: string;
  /** ≤ 3 practical takeaways, shown as a bullet list */
  keyPoints: string[];
  /** The reflection prompts for this week */
  questions: CourseQuestion[];
  /** Optional practical exercise — shown in the "Practise" block */
  exercise?: { title: string; body: string };
};

// ── Data ─────────────────────────────────────────────────────────────────────
//
// Vidyard UUIDs below are placeholders drawn from the 14 share URLs
// originally provided. Replace individual `vidyardUuid` values as the real
// assignments are confirmed — the player accepts any valid Vidyard UUID.

export const COURSE_WEEKS: CourseWeek[] = [
  // ── Theme 1 — Self Knowledge ────────────────────────────────────────────
  {
    slug: "w01-me-and-powerlifting",
    weekNumber: 1,
    theme: "Self Knowledge",
    title: "Me & Powerlifting",
    subtitle: "Where you're starting from",
    suggestedPhase: "Foundation",
    overview:
      "Before we can train the mind, we have to map it. This week is an honest audit of why you lift, what the sport gives you, and what it costs you.",
    vidyardUuid: "uzfLhVxMTKLmwnuQ9haJFS",
    keyPoints: [
      "Your relationship with the sport shapes every session you step into.",
      "Naming what draws you to powerlifting clarifies what's worth protecting.",
      "The costs are real — acknowledging them is how you stay in the sport long-term.",
    ],
    questions: [
      {
        id: "why-powerlifting",
        prompt: "Why did you start powerlifting, and what keeps you in it today?",
        placeholder: "Write honestly — this is just for you.",
        journalMirror: true,
      },
      {
        id: "what-it-gives",
        prompt: "What does powerlifting give you that nothing else does?",
        placeholder: "Identity, discipline, community, control…",
      },
      {
        id: "what-it-costs",
        prompt: "What does powerlifting cost you? (time, relationships, energy, mood)",
        placeholder: "Be specific. No judgement.",
      },
    ],
    exercise: {
      title: "Two-column audit",
      body:
        "Open a blank page. Left column: 'What the sport gives me.' Right column: 'What it costs me.' Spend 10 minutes. Come back tomorrow and add one more item to each side.",
    },
  },
  {
    slug: "w02-who-am-i",
    weekNumber: 2,
    theme: "Self Knowledge",
    title: "Who Am I As An Athlete?",
    subtitle: "Strengths, triggers, and the story you tell yourself",
    suggestedPhase: "Foundation",
    overview:
      "Athletes with accurate self-knowledge recover faster from bad sessions and capitalise on good ones. This week you build that map.",
    vidyardUuid: "8s5ALpWJ388ZQJS7pQfSFV",
    keyPoints: [
      "Your biggest mental strengths are usually invisible to you — others see them first.",
      "Triggers are specific, not general. 'I get nervous' isn't actionable; 'I freeze on my opener' is.",
      "The story you tell yourself about being an athlete becomes the ceiling on what you attempt.",
    ],
    questions: [
      {
        id: "mental-strengths",
        prompt: "What are your three biggest mental strengths as an athlete?",
        placeholder: "Composure under the bar, stubbornness, recovery from a bad lift…",
      },
      {
        id: "triggers",
        prompt: "Name a specific situation where you reliably lose composure. What triggers it?",
      },
      {
        id: "identity-story",
        prompt: "Finish the sentence: 'I am the kind of lifter who…'",
        journalMirror: true,
      },
    ],
  },

  // ── Theme 2 — Goal Setting ──────────────────────────────────────────────
  {
    slug: "w03-goals",
    weekNumber: 3,
    theme: "Goal Setting",
    title: "Goals That Actually Pull You",
    subtitle: "Outcome, performance, and process",
    suggestedPhase: "Foundation",
    overview:
      "Most lifters set outcome goals (a number on the bar). Champions set all three layers — outcome, performance, process — and know which one to focus on today.",
    vidyardUuid: "QHTXHxz61eEGGosXzHH7Pa",
    keyPoints: [
      "Outcome goals motivate the block; process goals survive the session.",
      "If a goal doesn't scare you a little, it's probably not pulling you.",
      "Write goals down. Unwritten goals are wishes.",
    ],
    questions: [
      {
        id: "outcome-goal",
        prompt: "What's the one outcome goal you'd be proud of in the next 12 months?",
        journalMirror: true,
      },
      {
        id: "performance-goal",
        prompt: "What performance goal supports it? (e.g. 'hit 9/9 attempts at my next meet')",
      },
      {
        id: "process-goal",
        prompt: "What is one process goal you can hit this week? Something in your control every single session.",
      },
    ],
    exercise: {
      title: "Write. Post. Review.",
      body:
        "Write all three goals on an index card. Stick it where you see it before you train. At the end of the week, come back and rate honestly how aligned your sessions were.",
    },
  },

  // ── Theme 3 — Athlete-Coach Relationship ────────────────────────────────
  {
    slug: "w04-coach-relationship",
    weekNumber: 4,
    theme: "Athlete-Coach Relationship",
    title: "The Athlete-Coach Relationship",
    subtitle: "Trust, communication, autonomy",
    suggestedPhase: "Foundation",
    overview:
      "Whether you're coached or self-coached, the quality of your working relationship with whoever programs your training is the single biggest predictor of long-term progress.",
    vidyardUuid: "ewTR1eickVpzMtNQWoPpmk",
    keyPoints: [
      "Trust is built by small promises kept, not big ones made.",
      "Clear communication beats polite communication every time.",
      "Your job is to be a great athlete to coach — specific, honest, coachable.",
    ],
    questions: [
      {
        id: "coach-strengths",
        prompt: "What do you most value about your coach (or your self-coaching)?",
      },
      {
        id: "coach-friction",
        prompt: "Where is there friction? What have you been avoiding saying?",
      },
      {
        id: "coachable",
        prompt: "On a scale of 1–10, how coachable are you right now? Why that number?",
      },
    ],
  },

  // ── Theme 4 — Altered State of Mind ─────────────────────────────────────
  {
    slug: "w05-arousal-control",
    weekNumber: 5,
    theme: "Altered State of Mind",
    title: "Arousal Control",
    subtitle: "Finding your optimal state",
    suggestedPhase: "Build",
    overview:
      "Every lifter has an optimal arousal zone. Too low, you're flat. Too high, you're shaky. This week you learn to read and adjust it.",
    vidyardUuid: "9kAdtx7bQ52CCaheAJRUcY",
    keyPoints: [
      "Arousal is a dial, not a switch — you can turn it up or down.",
      "Breathing is the fastest lever you have.",
      "Your optimal zone is personal. Know your number.",
    ],
    questions: [
      {
        id: "optimal-state",
        prompt: "Describe your best lift ever — what was your mental state 60 seconds before?",
      },
      {
        id: "worst-state",
        prompt: "Describe your worst miss — what was your state then?",
      },
      {
        id: "my-dial",
        prompt: "Do you tend to be too high or too low before a big lift? What works to adjust it?",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Box breathing (4-4-4-4)",
      body:
        "Before your next top set: inhale 4s, hold 4s, exhale 4s, hold 4s. Four rounds. Notice whether it dialled you up or down, and log it.",
    },
  },
  {
    slug: "w06-breath-and-body",
    weekNumber: 6,
    theme: "Altered State of Mind",
    title: "Breath & Body",
    subtitle: "Using the body to change the mind",
    suggestedPhase: "Build",
    overview:
      "The fastest way into a state is through the body. Posture, breath, and face all send signals the brain obeys.",
    vidyardUuid: "FQEvTLER7oZdDRj6aXGFXF",
    keyPoints: [
      "Shallow chest breathing tells your brain you're in danger.",
      "A clenched jaw leaks tension into your grip and lockout.",
      "Posture in the walkout sets the tone for the attempt.",
    ],
    questions: [
      {
        id: "body-tell",
        prompt: "What does your body do when you're anxious under the bar? (jaw, shoulders, grip, breathing)",
      },
      {
        id: "body-reset",
        prompt: "What's one physical cue that reliably brings you back to centre?",
      },
    ],
  },
  {
    slug: "w07-pressure",
    weekNumber: 7,
    theme: "Altered State of Mind",
    title: "Training Under Pressure",
    subtitle: "Make the room smaller",
    suggestedPhase: "Build",
    overview:
      "Pressure exists on the platform. If you never train it, meet day is the first time you meet it — and that's too late.",
    vidyardUuid: "BeiAtWCyo4f2uDmcfV9DhC",
    keyPoints: [
      "You can manufacture pressure: single-attempt PRs, commanded lifts, filmed openers.",
      "Performing under fatigue is a skill. So is performing while bored.",
      "The only way out is through.",
    ],
    questions: [
      {
        id: "pressure-history",
        prompt: "When have you performed your best under pressure? What was different?",
      },
      {
        id: "pressure-practice",
        prompt: "How will you manufacture pressure in training this week?",
      },
    ],
  },
  {
    slug: "w08-flow",
    weekNumber: 8,
    theme: "Altered State of Mind",
    title: "Finding Flow",
    subtitle: "When the bar feels light",
    suggestedPhase: "Build",
    overview:
      "Flow isn't magic — it's the intersection of skill and challenge when attention is fully engaged. You can set the conditions for it.",
    vidyardUuid: "oqYyALnSkD7mpWBD5ANuz6",
    keyPoints: [
      "Flow requires clear goals and immediate feedback.",
      "Ritual narrows attention. That's why champions have them.",
      "You can't force flow, but you can invite it.",
    ],
    questions: [
      {
        id: "flow-moment",
        prompt: "Describe a training session where time disappeared. What were the ingredients?",
        journalMirror: true,
      },
      {
        id: "flow-ritual",
        prompt: "What's your pre-lift ritual? (walk-up, breath, cue) Is it consistent?",
      },
    ],
  },

  // ── Theme 5 — Visualization & Mental Training ───────────────────────────
  {
    slug: "w09-visualization-basics",
    weekNumber: 9,
    theme: "Visualization & Mental Training",
    title: "Visualization Basics",
    subtitle: "Rehearsing the lift before it happens",
    suggestedPhase: "Build",
    overview:
      "Elite athletes visualise. Not because it's magic, but because the brain partially can't tell the difference between vivid rehearsal and real reps.",
    vidyardUuid: "2mizuQmGN1jcmvFsfm7jYo",
    keyPoints: [
      "First-person, not third-person — see it through your own eyes.",
      "Use all senses: sight, sound, breath, the chalk, the hum of the room.",
      "Rehearse the successful execution, not the anxiety around it.",
    ],
    questions: [
      {
        id: "vis-current",
        prompt: "Do you currently visualise? If yes, when and how?",
      },
      {
        id: "vis-detail",
        prompt: "Close your eyes and visualise your opener squat. What details are vivid? What's blurry?",
      },
    ],
    exercise: {
      title: "Nightly walk-through",
      body:
        "Every night this week, 2 minutes: visualise tomorrow's heaviest set from the walkout to rack. First person. Include the breath.",
    },
  },
  {
    slug: "w10-mental-rehearsal",
    weekNumber: 10,
    theme: "Visualization & Mental Training",
    title: "Mental Rehearsal",
    subtitle: "From session to meet day",
    suggestedPhase: "Peak",
    overview:
      "Mental rehearsal is visualisation applied to a specific performance moment — a session, an attempt, a whole meet — with full sensory detail.",
    vidyardUuid: "eosWqyDenTbc9C2SYZhHi7",
    keyPoints: [
      "Rehearse the boring parts too — weigh-in, waiting, chalk up.",
      "Include contingencies: what will you do if an opener is missed?",
      "Repeat the same rehearsal. Familiarity is the point.",
    ],
    questions: [
      {
        id: "rehearsal-target",
        prompt: "What specific moment do you want to rehearse this week?",
      },
      {
        id: "contingency",
        prompt: "What's one thing that might go wrong on meet day, and how will you respond?",
      },
    ],
  },
  {
    slug: "w11-cues",
    weekNumber: 11,
    theme: "Visualization & Mental Training",
    title: "Cues That Stick",
    subtitle: "One word, one execution",
    suggestedPhase: "Peak",
    overview:
      "Under load there's no time for a paragraph. One short cue, anchored to one correct feeling, is worth more than a whole technique lecture.",
    vidyardUuid: "TF5sVvNTRZddYKfmzBmWtQ",
    keyPoints: [
      "Cues should be action-oriented, not corrective. 'Drive' beats 'don't round'.",
      "One cue per lift. More than one is noise.",
      "Test cues in training. Don't invent them on meet day.",
    ],
    questions: [
      {
        id: "cue-squat",
        prompt: "What's your one cue for squat?",
      },
      {
        id: "cue-bench",
        prompt: "What's your one cue for bench?",
      },
      {
        id: "cue-deadlift",
        prompt: "What's your one cue for deadlift?",
      },
    ],
  },
  {
    slug: "w12-self-talk",
    weekNumber: 12,
    theme: "Visualization & Mental Training",
    title: "Self-Talk",
    subtitle: "The voice in your head is coachable",
    suggestedPhase: "Peak",
    overview:
      "You talk to yourself constantly. Most of it you don't notice. This week you audit it and rewrite the worst lines.",
    vidyardUuid: "YYMSKvZF1nfm1Dy3m1SQsW",
    keyPoints: [
      "Noticing is 80% of the work — you can't edit what you don't see.",
      "Second person ('you've got this') often lands better than first person.",
      "Replace, don't suppress. A vacuum fills with the old voice.",
    ],
    questions: [
      {
        id: "inner-critic",
        prompt: "What does your inner critic sound like in a bad session? Quote it exactly.",
        journalMirror: true,
      },
      {
        id: "inner-coach",
        prompt: "What would a trusted coach say to you instead?",
        journalMirror: true,
      },
    ],
  },

  // ── Theme 6 — Focus ─────────────────────────────────────────────────────
  {
    slug: "w13-attention",
    weekNumber: 13,
    theme: "Focus",
    title: "Attention Under Pressure",
    subtitle: "What you look at, you become",
    suggestedPhase: "Peak",
    overview:
      "Focus isn't effort — it's direction. Under stress, attention narrows. The question is: does it narrow onto the right thing, or the wrong one?",
    vidyardUuid: "YyHSt8pUVdW3fn4YUCHF5K",
    keyPoints: [
      "Narrow internal focus = cues. Narrow external = object. Both are useful.",
      "Wide attention between attempts; narrow just before.",
      "Your warm-ups are a focus rehearsal, not just a physical one.",
    ],
    questions: [
      {
        id: "attention-drift",
        prompt: "Where does your attention drift during a long session? (phone, scoreboard, other lifters…)",
      },
      {
        id: "attention-anchor",
        prompt: "What's your anchor — one thing you can return attention to, reliably?",
      },
    ],
  },
  {
    slug: "w14-refocus",
    weekNumber: 14,
    theme: "Focus",
    title: "Refocus Routines",
    subtitle: "Coming back after a miss",
    suggestedPhase: "Meet week",
    overview:
      "Every lifter loses focus sometimes. Champions have a pre-built routine for getting it back that doesn't require willpower in the moment.",
    vidyardUuid: "BJHkBRWhpUEyUweLfHsjuu",
    keyPoints: [
      "Missed lift ≠ ruined meet, unless you let it become that.",
      "Physical reset → breath → cue → walk up. Same every time.",
      "Write it down. Practise it in training. Own it by meet day.",
    ],
    questions: [
      {
        id: "last-miss",
        prompt: "Describe your last missed attempt. What did your mind do in the 60 seconds after?",
      },
      {
        id: "refocus-plan",
        prompt: "Write your 3-step refocus routine. Short. Specific.",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Missed-lift drill",
      body:
        "In training this week, after any failed rep, run your 3-step routine before touching the bar again. Build it into muscle memory.",
    },
  },

  // ── Theme 7 — Performance ───────────────────────────────────────────────
  {
    slug: "w15-meet-day",
    weekNumber: 15,
    theme: "Performance",
    title: "Meet Day",
    subtitle: "Trust the work. Execute.",
    suggestedPhase: "Meet week",
    overview:
      "The work is done. Meet day isn't where you build — it's where you express. This week is about protecting what you've built.",
    // No video for final week — "the work is done"
    keyPoints: [
      "Your only job is to execute openers well. The rest follows.",
      "Protect your attention: phone down, eyes on your own lane.",
      "Whatever happens, you are more than your total.",
    ],
    questions: [
      {
        id: "meet-day-plan",
        prompt: "Walk yourself through meet day, hour by hour. What time do you wake? What do you eat? When do you warm up?",
      },
      {
        id: "meet-day-mantra",
        prompt: "What's the one sentence you'll say to yourself before each opener?",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Full dress rehearsal",
      body:
        "Two weeks out: simulate meet timing as closely as you can. Same breakfast, same warm-up timing, same order of lifts with commands. One opener, one second attempt per lift.",
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Lookup a single week by slug. */
export function getWeek(slug: string): CourseWeek | undefined {
  return COURSE_WEEKS.find((w) => w.slug === slug);
}

/** Group weeks by theme, preserving the order defined above. */
export function weeksByTheme(): Array<{ theme: CourseTheme; weeks: CourseWeek[] }> {
  const themeOrder: CourseTheme[] = [
    "Self Knowledge",
    "Goal Setting",
    "Athlete-Coach Relationship",
    "Altered State of Mind",
    "Visualization & Mental Training",
    "Focus",
    "Performance",
  ];
  return themeOrder.map((theme) => ({
    theme,
    weeks: COURSE_WEEKS.filter((w) => w.theme === theme),
  }));
}

/** How many weeks total in the course */
export const TOTAL_WEEKS = COURSE_WEEKS.length;

/**
 * Pick a suggested "current" week for an athlete based on days-to-meet.
 * Rough heuristic — the user can always override by tapping any week.
 *
 *   Foundation (57+ d) → W1 (or most recent unfinished early week)
 *   Build      (22–56) → ~W5 (arousal/breath/pressure/flow)
 *   Peak       (7–21)  → ~W10 (rehearsal/cues/self-talk)
 *   Meet week  (1–6)   → W14–15 (refocus, meet day)
 *   Meet day / no date → W1
 */
export function suggestedWeek(daysUntilMeet: number | null): CourseWeek {
  if (daysUntilMeet === null || daysUntilMeet < 0) return COURSE_WEEKS[0];
  if (daysUntilMeet <= 6) return getWeek("w15-meet-day") ?? COURSE_WEEKS[0];
  if (daysUntilMeet <= 21) return getWeek("w10-mental-rehearsal") ?? COURSE_WEEKS[0];
  if (daysUntilMeet <= 56) return getWeek("w05-arousal-control") ?? COURSE_WEEKS[0];
  return COURSE_WEEKS[0];
}

export type CourseProgressRow = {
  id: string;
  user_id: string;
  week_slug: string;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
};

export type CourseAnswerRow = {
  id: string;
  user_id: string;
  week_slug: string;
  question_id: string;
  answer: string;
  journal_entry_id: string | null;
  created_at: string;
  updated_at: string;
};
