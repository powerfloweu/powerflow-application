/**
 * PowerFlow — Modular Mental Performance Course
 *
 * Module definitions live here (not in DB). This keeps content versionable
 * and editable without a migration. User state (progress + reflection answers)
 * lives in Supabase, keyed on module slug.
 *
 * Two module types:
 *
 *   "insight"  — one focused session: watch, reflect, complete. No daily
 *                practice required. Next module unlocks immediately after.
 *
 *   "practice" — content done once, then a daily practice log until the
 *                athlete hits practiceTarget sessions. Next module becomes
 *                accessible immediately (soft gate) but the module stays
 *                "in progress" until the target is reached.
 *
 * 8-week core structure:
 *   1 — Self Knowledge               insight
 *   2 — Goal Setting                 insight
 *   3 — Athlete-Coach Relationship   insight
 *   4 — Altered State of Mind        practice × 14
 *   5 — Squat Visualization          practice × 14
 *   6 — Bench Visualization          practice × 14
 *   7 — Deadlift Visualization       practice × 14
 *   8 — All You (self-talk, focus, competition prep)  practice × 10
 *   + bonus: Post-Meet Reflection    insight
 */

import type { TrainingPhase } from "@/app/components/PhaseBadge";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CourseTheme =
  | "Self Knowledge"
  | "Goal Setting"
  | "Athlete-Coach Relationship"
  | "Altered State of Mind"
  | "Visualization & Mental Training"
  | "Performance";

export type CourseQuestion = {
  id: string;
  prompt: string;
  placeholder?: string;
  /**
   * If true, saving this answer also creates/updates a journal entry
   * with the "general" context and a `#course` theme tag.
   */
  journalMirror?: boolean;
};

export type ModuleType = "insight" | "practice";

export type CourseDownload = {
  label: string;
  url: string;
  description?: string;
};

export type CourseToolLink = {
  label: string;
  href: string;
  description?: string;
};

export type CourseModule = {
  slug: string;
  bonus?: boolean;
  /** @deprecated kept for legacy data migration only */
  weekNumber: number;
  theme: CourseTheme;
  title: string;
  subtitle?: string;
  suggestedPhase: TrainingPhase;
  overview: string;
  moduleType: ModuleType;
  practiceTarget?: number;
  vidyardUuid?: string;
  audioUrl?: string;
  keyPoints: string[];
  questions: CourseQuestion[];
  exercise?: { title: string; body: string };
  downloads?: CourseDownload[];
  toolLinks?: CourseToolLink[];
};

/** @deprecated Use CourseModule */
export type CourseWeek = CourseModule;

// ── Data ──────────────────────────────────────────────────────────────────────

export const COURSE_MODULES: CourseModule[] = [
  // ── 1 · Know Thyself ──────────────────────────────────────────────────────
  {
    slug: "know-thyself",
    weekNumber: 1,
    theme: "Self Knowledge",
    title: "Know Thyself",
    subtitle: "Who you are as an athlete — inside and out",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "Before training the mind, you have to map it. This module is a two-part audit: first through your own eyes, then through the eyes of people who know your lifting. Self-awareness corrects blind spots and sharpens the foundation everything else gets built on.",
    vidyardUuid: "uzfLhVxMTKLmwnuQ9haJFS",
    keyPoints: [
      "How you perceive yourself shapes how you approach the barbell under pressure.",
      "Your biggest mental strengths are usually invisible to you — others see them first.",
      "Feedback isn't criticism. It's data.",
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
        id: "mental-strengths",
        prompt: "What are your biggest mental strengths as an athlete? What's still a work in progress?",
        placeholder: "Composure under the bar, stubborn consistency, fast recovery from a miss…",
      },
      {
        id: "swot-strengths",
        prompt: "SWOT — Strengths: What did your coach and training partners say are your best qualities as an athlete?",
        placeholder: "Share the SWOT template with your coach and 2–3 training partners, then record their answers here.",
      },
      {
        id: "swot-weaknesses",
        prompt: "SWOT — Weaknesses: What do they say you need to work on most?",
      },
      {
        id: "swot-opportunities",
        prompt: "SWOT — Opportunities: What could you be doing that you aren't doing yet?",
      },
      {
        id: "swot-threats",
        prompt: "SWOT — Threats: What happens if you don't address those weaknesses?",
      },
    ],
    exercise: {
      title: "Moment of Success",
      body:
        "Listen to the Moment of Success audio. Relive your best powerlifting memory — record yourself or write it down in detail. Afterwards, read back what you wrote and find at least 2–3 recurring themes. Keep those close when doubt creeps in.",
    },
    downloads: [
      {
        label: "Download SWOT template",
        url: "/downloads/swot.pdf",
        description: "Share with your coach and 2–3 training partners. Collect their answers before filling in the questions above.",
      },
    ],
    toolLinks: [
      {
        label: "Moment of Success",
        href: "/library#resource-activation",
        description: "Guided audio to relive your best powerlifting memory and anchor the feeling to a physical cue.",
      },
    ],
  },

  // ── 2 · Goal Setting ──────────────────────────────────────────────────────
  {
    slug: "goal-setting",
    weekNumber: 2,
    theme: "Goal Setting",
    title: "Goals That Actually Pull You",
    subtitle: "Outcome, performance, and process",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "Most lifters set outcome goals — a number on the bar. Champions set all three layers: outcome, performance, process — and know which one to focus on today. We start at the endpoint and break the path into pieces you can act on this week.",
    vidyardUuid: "QHTXHxz61eEGGosXzHH7Pa",
    keyPoints: [
      "Outcome goals motivate the block; process goals survive the session.",
      "If a goal doesn't scare you a little, it's probably not pulling you.",
      "Write it down. Unwritten goals are wishes.",
    ],
    questions: [
      {
        id: "outcome-goal",
        prompt: "What's the one outcome goal you'd be proud of in the next 12 months?",
        placeholder: "Be specific — a total, a lift, a meet placement.",
        journalMirror: true,
      },
      {
        id: "performance-goal",
        prompt: "What performance goal supports it?",
        placeholder: "e.g. 'Hit 9/9 attempts at my next meet', 'Open at 92% every session'",
      },
      {
        id: "process-goal",
        prompt: "What is one process goal you can act on this week — something entirely in your control?",
        placeholder: "Sleep, technique cue, pre-lift routine…",
      },
    ],
    exercise: {
      title: "Write. Post. Review.",
      body:
        "Write all three goals on an index card or in your notes. Keep it somewhere you'll see it before you train. At the end of the week, honestly rate how aligned your sessions were with each goal.",
    },
    downloads: [
      {
        label: "Download SMART worksheet",
        url: "/downloads/smart.pdf",
        description: "Fill it out, post somewhere visible, bring to coach check-ins.",
      },
    ],
  },

  // ── 3 · Coach Relationship ────────────────────────────────────────────────
  {
    slug: "coach-relationship",
    weekNumber: 3,
    theme: "Athlete-Coach Relationship",
    title: "Common Ground",
    subtitle: "Building a relationship worth having",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "Everyone needs at least one person to hold them accountable. Whether that's a coach or a trusted training partner, formalising the relationship through a written commitment creates mutual clarity — and removes the awkward guesswork on both sides.",
    vidyardUuid: "ewTR1eickVpzMtNQWoPpmk",
    keyPoints: [
      "You cannot be fully objective with yourself. That's not a weakness — it's anatomy.",
      "Clear communication beats polite communication every time.",
      "A signed commitment changes the psychological weight of a promise.",
    ],
    questions: [
      {
        id: "ideal-coach",
        prompt: "What makes someone an ideal coach for you? What role do they play in your success?",
        placeholder: "Think about what's non-negotiable vs. nice-to-have.",
      },
      {
        id: "relationship-score",
        prompt: "On a scale of 1–10, how well does your current coach relationship work? What would move it one point higher?",
      },
      {
        id: "unsaid",
        prompt: "What have you been meaning to say to your coach but haven't yet?",
        journalMirror: true,
      },
      {
        id: "contract-goals",
        prompt: "Contract — Goals: What are the specific outcomes you want your coach to support?",
        placeholder: "Totals, attempts, milestones — be as specific as possible.",
      },
      {
        id: "contract-communication",
        prompt: "Contract — Communication: How often, on which platform, and in what style will you communicate?",
        placeholder: "e.g. Weekly voice note after sessions, written program update every 3 weeks…",
      },
      {
        id: "contract-accountability",
        prompt: "Contract — Accountability: What does each of you commit to? How will you review progress?",
      },
    ],
    downloads: [
      {
        label: "Download contract template",
        url: "/downloads/contract.pdf",
        description: "Print, fill out together with your coach, and sign. Keep a copy each.",
      },
    ],
  },

  // ── 4 · Relaxation ────────────────────────────────────────────────────────
  {
    slug: "relaxation",
    weekNumber: 4,
    theme: "Altered State of Mind",
    title: "Altered State",
    subtitle: "Training your nervous system to switch off",
    suggestedPhase: "Build",
    moduleType: "practice",
    practiceTarget: 14,
    overview:
      "The brain operates at different frequencies. Visualization — which comes next — requires an alpha state: calm, focused, receptive. This module teaches you to access that state on demand. Listen to both techniques, choose the one that connects, then build the daily habit over the next two weeks.",
    vidyardUuid: "9kAdtx7bQ52CCaheAJRUcY",
    keyPoints: [
      "You can't force relaxation. You allow it — which is a trainable skill.",
      "The technique matters less than the consistency. Daily practice beats perfect sessions.",
      "This is the foundation visualization gets built on. Don't skip it.",
    ],
    questions: [
      {
        id: "technique-choice",
        prompt: "After trying both techniques — which one connects better for you, and why?",
        placeholder: "PMR (active tension-release) or Autogenic Training (passive body scan)…",
      },
      {
        id: "relaxation-signal",
        prompt: "What physical sensations tell you that you've genuinely switched off?",
        placeholder: "Heaviness, warmth, slow breath, jaw dropping…",
      },
      {
        id: "safe-place",
        prompt: "What place feels safest to you? Describe it in as much sensory detail as you can.",
        placeholder: "This becomes an anchor you can return to anytime.",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Daily practice — 14 sessions",
      body:
        "Listen to both recordings this week and decide which one works better for you. Then listen to that recording every day for the next two weeks. Log each session here. It takes time — don't judge the first few.",
    },
    toolLinks: [
      {
        label: "Progressive Muscle Relaxation",
        href: "/library#pmr",
        description: "Active tension-and-release technique — good if you're someone who needs physical engagement to wind down.",
      },
      {
        label: "Autogenic Training",
        href: "/library#autogenic-training",
        description: "Passive body scan using warmth and heaviness — closer to meditation. Ideal for the night before a heavy session.",
      },
    ],
  },

  // ── 5 · Squat ─────────────────────────────────────────────────────────────
  {
    slug: "squat",
    weekNumber: 5,
    theme: "Visualization & Mental Training",
    title: "Squat Visualization",
    subtitle: "Your lift, in your own words",
    suggestedPhase: "Build",
    moduleType: "practice",
    practiceTarget: 14,
    overview:
      "Elite athletes visualize in first person, using their own sensory cues — not a generic script. This week you build your personal squat visualization: a detailed recording of how the lift feels and then compressed into three key points you can run through in under 10 seconds before any top set.",
    vidyardUuid: "2mizuQmGN1jcmvFsfm7jYo",
    keyPoints: [
      "First person, not third — see the lift through your own eyes.",
      "Your cues, your words. The more specific the rehearsal, the stronger the transfer.",
      "Compress to three sentences: before, during, after. That's what you'll use under the bar.",
    ],
    questions: [
      {
        id: "squat-love",
        prompt: "What do you love about the squat?",
        placeholder: "The setup, the depth, the drive, the feeling of a smooth walk-out…",
      },
      {
        id: "squat-work",
        prompt: "What's the one technical thing you're still working on?",
      },
      {
        id: "squat-cues",
        prompt: "Describe your squat in three sentences: what matters before, during, and after?",
        placeholder: "This becomes your compact visualization. Make it yours.",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Visualize before every top set",
      body:
        "This week, before every competition-style squat set, run your 3-sentence visualization. Log how each set felt in your training diary. After 2 weeks you'll notice the pattern.",
    },
    toolLinks: [
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Guided first-person squat rehearsal — set your personal cues and run it before top sets.",
      },
      {
        label: "Moment of Success",
        href: "/library#resource-activation",
        description: "Use your anchor before the visualization to prime the right mental state.",
      },
    ],
  },

  // ── 6 · Bench ─────────────────────────────────────────────────────────────
  {
    slug: "bench",
    weekNumber: 6,
    theme: "Visualization & Mental Training",
    title: "Bench Visualization",
    subtitle: "Tightness from foot to fingertip",
    suggestedPhase: "Build",
    moduleType: "practice",
    practiceTarget: 14,
    overview:
      "Bench is a technique lift first. Foot position, bridge, shoulder blade setup, bar path — each has to be automatic before load matters. This week you build your bench visualization using the same three-point format, paying particular attention to setup and tightness.",
    vidyardUuid: "eosWqyDenTbc9C2SYZhHi7",
    keyPoints: [
      "Setup is everything. A shaky setup produces a shaky lift.",
      "Tightness starts before you unrack, not after.",
      "Your body knows what a good touch feels like. Rehearse that, not the anxiety around it.",
    ],
    questions: [
      {
        id: "bench-love",
        prompt: "What do you love about bench?",
      },
      {
        id: "bench-work",
        prompt: "What's the one technical thing you're still working on?",
        placeholder: "Bridge, leg drive, receiving the command, bar path…",
      },
      {
        id: "bench-cues",
        prompt: "Describe your bench in three sentences: what matters before, during, and after?",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Visualize before every top set",
      body:
        "Before every competition-style bench set this week, run your 3-sentence visualization. Log how it felt. Note any difference compared to sets where you skipped it.",
    },
    toolLinks: [
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
        description: "Guided first-person bench rehearsal with setup, tightness, and execution cues.",
      },
    ],
  },

  // ── 7 · Deadlift ──────────────────────────────────────────────────────────
  {
    slug: "deadlift",
    weekNumber: 7,
    theme: "Visualization & Mental Training",
    title: "Deadlift Visualization",
    subtitle: "Setup wins the pull",
    suggestedPhase: "Peak",
    moduleType: "practice",
    practiceTarget: 14,
    overview:
      "A great deadlift starts before the bar moves. Stance, grip, lat tension, bracing — your setup determines the ceiling of the pull. This week you build your deadlift visualization and, with all three lifts mapped, start running a full SBD mental training day on rest days.",
    vidyardUuid: "TF5sVvNTRZddYKfmzBmWtQ",
    keyPoints: [
      "Setup is not a formality. It's where the lift is won or lost.",
      "Lat engagement before the pull takes tension off your lower back and into the bar.",
      "A full SBD visualization day on rest days keeps the motor patterns sharp without loading the body.",
    ],
    questions: [
      {
        id: "deadlift-love",
        prompt: "What do you love about the deadlift?",
      },
      {
        id: "deadlift-work",
        prompt: "What's the one technical thing you're still working on?",
        placeholder: "Stance, grip, lat tension, the lockout, staying over the bar…",
      },
      {
        id: "deadlift-cues",
        prompt: "Describe your deadlift in three sentences: what matters before, during, and after?",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Visualize before top sets + SBD rest day",
      body:
        "Run your visualization before every deadlift top set. On a day you don't train, listen to the SBD Training Day audio and run all three lifts mentally in competition order.",
    },
    toolLinks: [
      {
        label: "Deadlift Visualization",
        href: "/library#viz-deadlift",
        description: "Guided first-person deadlift rehearsal with setup, tension, and execution cues.",
      },
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Run all three lifts in sequence on rest days to simulate a full competition day mentally.",
      },
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
      },
      {
        label: "Error Correction",
        href: "/library#hibajavitas",
        description: "If a lift has a recurring technical fault, use this movie-theater technique to correct it mentally before the next session.",
      },
    ],
  },

  // ── 8 · All You ───────────────────────────────────────────────────────────
  {
    slug: "all-you",
    weekNumber: 8,
    theme: "Performance",
    title: "All You",
    subtitle: "Self-talk, focus, and the competition plan",
    suggestedPhase: "Meet week",
    moduleType: "practice",
    practiceTarget: 10,
    overview:
      "The last block before the platform. You know how to relax, how to visualize, how your lifts should feel. Now it's about protecting all of that under competitive conditions: managing your inner voice, blocking out distractions, and having a competition day plan so routine that your brain treats the meet as familiar.",
    vidyardUuid: "YYMSKvZF1nfm1Dy3m1SQsW",
    keyPoints: [
      "You can't silence the inner critic — but you can give it a better script.",
      "Distraction is only a threat if you haven't already decided what you're focused on.",
      "Familiarity reduces anxiety. The more you've mentally rehearsed the competition day, the less it surprises you.",
    ],
    questions: [
      {
        id: "inner-critic",
        prompt: "What does your inner critic say in a bad session? Quote it exactly.",
        placeholder: "Don't soften it — write what it actually says.",
        journalMirror: true,
      },
      {
        id: "inner-coach",
        prompt: "What would a trusted coach say to you instead?",
        placeholder: "Rewrite each critic line with the coach's voice.",
        journalMirror: true,
      },
      {
        id: "distractions",
        prompt: "What distracts you most in competition — and what commands must you hear above everything else?",
        placeholder: "Crowd, music, other lifters, scoreboard, nerves…",
      },
      {
        id: "comp-day-plan",
        prompt: "Walk yourself through your competition day, hour by hour. What does your routine look like?",
        placeholder: "Wake time, food, travel, weigh-in, warm-up, first attempt…",
      },
      {
        id: "opener-mantra",
        prompt: "What's the one sentence you'll say to yourself before each opener?",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Top sets with commands + Barrier",
      body:
        "From now until the meet, every top set gets competition commands from a training partner or coach. After your visualization, stop the music — silence before the lift. Use the Barrier audio this week to train the mental block against distractions. Run the Competition Day visualization at least three times.",
    },
    toolLinks: [
      {
        label: "Self-Talk Affirmations",
        href: "/library#affirmations",
        description: "Turn your inner-coach rewrites into daily affirmations and rehearse them before every session.",
      },
      {
        label: "Barrier",
        href: "/library#barrier",
        description: "Build a mental veil that lets competition commands through and blocks everything else out.",
      },
      {
        label: "Competition Day",
        href: "/library#comp-day-viz",
        description: "12-minute guided walkthrough of your entire meet — from wake-up to final deadlift. Run it three times before meet day.",
      },
      {
        label: "Error Correction",
        href: "/library#hibajavitas",
        description: "Use the movie-theater technique to mentally fix any technical issue that surfaced in final prep.",
      },
      {
        label: "Moment of Success",
        href: "/library#resource-activation",
        description: "Access your peak state between attempts with your anchor cue.",
      },
    ],
  },

  // ── Bonus · Post-Meet ─────────────────────────────────────────────────────
  {
    slug: "post-meet",
    weekNumber: 9,
    bonus: true,
    theme: "Performance",
    title: "Post-Meet Reflection",
    subtitle: "Close the loop. Start the next one.",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "The meet is over. This is where the real learning happens. Without deliberate reflection, competitions become experiences. With it, they become data. What you write here becomes the foundation of your next prep.",
    keyPoints: [
      "The gap between what you expected and what happened is your most valuable feedback.",
      "Good performances and bad ones both deserve honest analysis.",
      "What you write down now becomes the first page of your next prep.",
    ],
    questions: [
      {
        id: "post-meet-honest",
        prompt: "How do you honestly feel about your competition? First reaction — don't edit it.",
        journalMirror: true,
      },
      {
        id: "post-meet-win",
        prompt: "What was your biggest win — on the platform or off it?",
      },
      {
        id: "post-meet-score",
        prompt: "Rate your mental preparation out of 10. What specifically earned that score?",
      },
      {
        id: "post-meet-next",
        prompt: "What is the one thing you'll do differently in the next prep?",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "Post-meet letter",
      body:
        "Write a short letter to yourself before your next competition. Based on what you've just learned, what do you want future-you to remember when it matters most?",
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** @deprecated Use COURSE_MODULES in new code */
export const COURSE_WEEKS = COURSE_MODULES;

/** Only the modules that belong in a plan (no bonus modules). */
export const PLAN_MODULES = COURSE_MODULES.filter((m) => !m.bonus);

/** Lookup a module by slug — includes bonus modules */
export function getModule(slug: string): CourseModule | undefined {
  return COURSE_MODULES.find((m) => m.slug === slug);
}

/** @deprecated Use getModule(slug) instead */
export function getWeek(slug: string): CourseModule | undefined {
  return getModule(slug);
}

/** @deprecated Lookup by legacy week number — only for migrating old data */
export function getWeekByNum(weekNum: number): CourseModule | undefined {
  return COURSE_MODULES.find((m) => m.weekNumber === weekNum);
}

/** Group non-bonus modules by theme */
export function weeksByTheme(): Array<{ theme: CourseTheme; weeks: CourseModule[] }> {
  const themeOrder: CourseTheme[] = [
    "Self Knowledge",
    "Goal Setting",
    "Athlete-Coach Relationship",
    "Altered State of Mind",
    "Visualization & Mental Training",
    "Performance",
  ];
  return themeOrder
    .map((theme) => ({
      theme,
      weeks: COURSE_MODULES.filter((m) => m.theme === theme && !m.bonus),
    }))
    .filter((g) => g.weeks.length > 0);
}

/** Total non-bonus modules */
export const TOTAL_WEEKS = PLAN_MODULES.length;

/**
 * Suggest which module to start based on weeks until next meet.
 * Maps an 8-week window: 8+ weeks out → module 1, meet week → module 8.
 */
export function suggestedWeekNum(daysUntilMeet: number | null): number {
  if (daysUntilMeet === null || daysUntilMeet < 0) return 1;
  const weeksOut = Math.ceil(daysUntilMeet / 7);
  return Math.max(1, Math.min(8, 9 - weeksOut));
}

/** @deprecated Use getWeekByNum + suggestedWeekNum instead */
export function suggestedWeek(daysUntilMeet: number | null): CourseWeek {
  return getWeekByNum(suggestedWeekNum(daysUntilMeet)) ?? COURSE_WEEKS[0];
}

// ── Course Plan ───────────────────────────────────────────────────────────────

export type CoursePlan = {
  type: "ai" | "coach" | "default";
  slugs: string[];
  rationale?: string;
  highlights?: string[];
  generatedAt: string;
  generatedBy?: string;
};

// ── DB row types (must match migration_course_v2.sql) ─────────────────────────

export type CourseProgressRow = {
  user_id: string;
  module_slug: string;
  /** @deprecated kept for migration only */
  week_num: number;
  video_done_at: string | null;
  exercise_done_at: string | null;
  quiz_done_at: string | null;
  completed_at: string | null;
  practice_count: number;
  updated_at: string;
};

export type CourseAnswerRow = {
  id: string;
  user_id: string;
  module_slug: string;
  /** @deprecated kept for migration only */
  week_num: number;
  question_id: string;
  text: string | null;
  audio_url: string | null;
  audio_duration_s: number | null;
  created_at: string;
  updated_at: string;
};

// ── Step helpers ──────────────────────────────────────────────────────────────

export type ProgressStep = "video" | "exercise" | "quiz" | "practice";

export function stepsComplete(
  row: CourseProgressRow | undefined,
  mod?: CourseModule,
): {
  video: boolean;
  exercise: boolean;
  quiz: boolean;
  practiceGoal: boolean;
  practiceCount: number;
  practiceTarget: number;
  contentDone: boolean;
  all: boolean;
} {
  const video    = !!row?.video_done_at;
  const exercise = !!row?.exercise_done_at;
  const quiz     = !!row?.quiz_done_at;
  const contentDone = video && exercise && quiz;

  const practiceCount  = row?.practice_count ?? 0;
  const practiceTarget = mod?.practiceTarget ?? 0;
  const practiceGoal   = mod?.moduleType === "practice"
    ? practiceCount >= practiceTarget
    : true;

  return {
    video,
    exercise,
    quiz,
    practiceGoal,
    practiceCount,
    practiceTarget,
    contentDone,
    all: contentDone && practiceGoal,
  };
}
