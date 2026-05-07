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
 * Themes:
 *   1 — Self Knowledge               insight  × 2
 *   2 — Goal Setting                 insight  × 1
 *   3 — Athlete-Coach Relationship   insight  × 1
 *   4 — Altered State of Mind        practice × 4
 *   5 — Visualization & Mental Train practice × 4
 *   6 — Focus                        practice × 2
 *   7 — Performance                  insight  × 1
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

/**
 * "insight"  — complete in one session; next module unlocks immediately.
 * "practice" — content done once, then log daily practice until practiceTarget.
 *              Next module is accessible (soft gate) but this stays in-progress.
 */
export type ModuleType = "insight" | "practice";

/** A downloadable worksheet attached to a module */
export type CourseDownload = {
  /** Button label */
  label: string;
  /** Path under /public — e.g. "/downloads/swot.pdf" */
  url: string;
  /** One-line description shown below the button */
  description?: string;
};

/** A link from a course module to a library tool */
export type CourseToolLink = {
  /** Display name of the tool */
  label: string;
  /** Route — e.g. "/library#pmr" */
  href: string;
  /** One-line context for why this tool is relevant here */
  description?: string;
};

export type CourseModule = {
  /** Stable URL-safe identifier — used in routes & DB (replaces week_num) */
  slug: string;
  /**
   * If true, this module is outside the main plan sequence.
   * It won't appear in plan generation, plan editor, or the plan week list.
   * Accessed directly via /course/m/[slug].
   */
  bonus?: boolean;
  /**
   * Legacy week number — kept only for migrating existing progress rows.
   * Do not use for routing or display.
   * @deprecated use slug
   */
  weekNumber: number;
  theme: CourseTheme;
  /** Short headline */
  title: string;
  /** Subtitle / tagline */
  subtitle?: string;
  /** Training phase this module is designed for */
  suggestedPhase: TrainingPhase;
  /** 1-2 sentence overview */
  overview: string;
  /** Module type — drives the completion model */
  moduleType: ModuleType;
  /**
   * For practice modules: number of logged sessions before the module is
   * considered complete. Undefined for insight modules.
   */
  practiceTarget?: number;
  /**
   * Mux public playback ID — preferred video source.
   * Obtain from the Mux dashboard: Asset → Playback IDs (public).
   */
  muxPlaybackId?: string;
  /**
   * @deprecated Replaced by muxPlaybackId. Kept for reference only.
   * Vidyard video UUID — no longer used in the player.
   */
  vidyardUuid?: string;
  /** Optional audio URL */
  audioUrl?: string;
  /** ≤ 3 practical takeaways */
  keyPoints: string[];
  /** Reflection prompts */
  questions: CourseQuestion[];
  /** Optional practical exercise */
  exercise?: { title: string; body: string };
  /** Optional downloadable worksheets (PDFs hosted in /public) */
  downloads?: CourseDownload[];
  /** Optional links to library tools relevant to this module */
  toolLinks?: CourseToolLink[];
};

/** @deprecated Use CourseModule */
export type CourseWeek = CourseModule;

// ── Data ─────────────────────────────────────────────────────────────────────
//
// Vidyard UUIDs below are placeholders drawn from the 14 share URLs
// originally provided. Replace individual `vidyardUuid` values as the real
// assignments are confirmed — the player accepts any valid Vidyard UUID.

export const COURSE_MODULES: CourseModule[] = [
  // ── Theme 1 — Self Knowledge ────────────────────────────────────────────
  {
    slug: "w01-me-and-powerlifting",
    weekNumber: 1,
    theme: "Self Knowledge",
    title: "Me & Powerlifting",
    subtitle: "Where you're starting from",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "Before we can train the mind, we have to map it. This week is an honest audit of why you lift, what the sport gives you, and what it costs you.",
    muxPlaybackId: "UFbBTEgcpZ8gLW00b00S01XP01LEXeGKz2XrSGbePyPqmVU",
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
    moduleType: "insight",
    overview:
      "Athletes with accurate self-knowledge recover faster from bad sessions and capitalise on good ones. This week you build that map — through your own eyes and through the eyes of people who know your lifting.",
    muxPlaybackId: "SGNg2JM5AUnfYPY3dHRlgByq9zN9GYSNL72q4VEmTgs",
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
      {
        id: "swot-strengths",
        prompt: "SWOT — Strengths: What did others say are your best qualities as an athlete? (personality, physical, mentality)",
        placeholder: "Share the SWOT template with your coach and 2–3 training partners, then record their answers here.",
      },
      {
        id: "swot-weaknesses",
        prompt: "SWOT — Weaknesses: What did they say you should work on most to become better?",
      },
      {
        id: "swot-opportunities",
        prompt: "SWOT — Opportunities: What are you not doing that would potentially help you become a stronger athlete?",
      },
      {
        id: "swot-threats",
        prompt: "SWOT — Threats: What happens if you don't work on those weaknesses?",
      },
    ],
    downloads: [
      {
        label: "Download SWOT template",
        url: "/downloads/swot.pdf",
        description: "Share with your coach and 2–3 people who know your lifting. Collect their answers before filling in the questions above.",
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
    moduleType: "insight",
    overview:
      "Most lifters set outcome goals (a number on the bar). Champions set all three layers — outcome, performance, process — and know which one to focus on today.",
    muxPlaybackId: "6ZLWadiD6rrAu00W4FwtSfx9xhpW01bsl4nXc8mtn5fjw",
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
    downloads: [
      {
        label: "Download SMART worksheet",
        url: "/downloads/smart.pdf",
        description: "A printable version to fill out, post somewhere visible, and bring to coach check-ins.",
      },
    ],
  },

  // ── Theme 3 — Athlete-Coach Relationship ────────────────────────────────
  {
    slug: "w04-coach-relationship",
    weekNumber: 4,
    theme: "Athlete-Coach Relationship",
    title: "The Athlete-Coach Relationship",
    subtitle: "Trust, communication, autonomy",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "Whether you're coached or self-coached, the quality of your working relationship with whoever programs your training is the single biggest predictor of long-term progress.",
    muxPlaybackId: "bF6VDlMozLIBLQGxRG00CPQZvy95cxKBiET49cWHYauE",
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
      {
        id: "contract-results",
        prompt: "Contract — Results: What are the SMART goal(s) you want to work towards with your coach's support?",
        placeholder: "Be as specific as possible — totals, attempts, milestones.",
      },
      {
        id: "contract-communication",
        prompt: "Contract — Communication: How often, on which platform, and in what style will you communicate with your coach?",
        placeholder: "e.g. Weekly WhatsApp voice note after sessions, written program update every 3 weeks…",
      },
      {
        id: "contract-actions",
        prompt: "Contract — Actions: What is required of each party for this to work?",
        placeholder: "What do you commit to? What do you need from your coach?",
      },
      {
        id: "contract-accountability",
        prompt: "Contract — Accountability: How often do you need feedback, and what are the key milestones to review together?",
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

  // ── Theme 4 — Altered State of Mind ─────────────────────────────────────
  {
    slug: "w05-arousal-control",
    weekNumber: 5,
    theme: "Altered State of Mind",
    title: "Arousal Control",
    subtitle: "Finding your optimal state",
    suggestedPhase: "Build",
    moduleType: "practice",
    practiceTarget: 10,
    overview:
      "Every lifter has an optimal arousal zone. Too low, you're flat. Too high, you're shaky. This week you learn to read and adjust it.",
    muxPlaybackId: "I84NwpMzDNVbJndHfxK014QkFrV6GlOoy8302DqN2b2Lc",
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
    toolLinks: [
      {
        label: "Progressive Muscle Relaxation",
        href: "/library#pmr",
        description: "Use PMR to dial down pre-lift tension and regulate your arousal state before heavy attempts.",
      },
      {
        label: "Autogenic Training",
        href: "/library#autogenic-training",
        description: "Self-induced deep relaxation — ideal for resetting between sessions or the night before a meet.",
      },
    ],
  },
  {
    slug: "w06-breath-and-body",
    weekNumber: 6,
    theme: "Altered State of Mind",
    title: "Breath & Body",
    subtitle: "Using the body to change the mind",
    suggestedPhase: "Build",
    moduleType: "practice",
    practiceTarget: 10,
    overview:
      "The fastest way into a state is through the body. Posture, breath, and face all send signals the brain obeys.",
    muxPlaybackId: "I84NwpMzDNVbJndHfxK014QkFrV6GlOoy8302DqN2b2Lc",
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
    toolLinks: [
      {
        label: "Progressive Muscle Relaxation",
        href: "/library#pmr",
        description: "Combines breath and body — systematically tense and release to reset your physical state.",
      },
      {
        label: "Autogenic Training",
        href: "/library#autogenic-training",
        description: "Use warmth and heaviness formulas to anchor body-based calm on demand.",
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
    moduleType: "practice",
    practiceTarget: 10,
    overview:
      "Pressure exists on the platform. If you never train it, meet day is the first time you meet it — and that's too late.",
    muxPlaybackId: "I84NwpMzDNVbJndHfxK014QkFrV6GlOoy8302DqN2b2Lc",
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
    toolLinks: [
      {
        label: "Barrier",
        href: "/library#barrier",
        description: "Build a psychological barrier to external distractions — essential for performing under competition pressure.",
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
    moduleType: "practice",
    practiceTarget: 10,
    overview:
      "Flow isn't magic — it's the intersection of skill and challenge when attention is fully engaged. You can set the conditions for it.",
    muxPlaybackId: "I84NwpMzDNVbJndHfxK014QkFrV6GlOoy8302DqN2b2Lc",
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
    toolLinks: [
      {
        label: "Resource Activation",
        href: "/library#resource-activation",
        description: "Anchor your peak flow state to a physical cue — access it on demand before any attempt.",
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
    moduleType: "practice",
    practiceTarget: 14,
    overview:
      "Elite athletes visualise. Not because it's magic, but because the brain partially can't tell the difference between vivid rehearsal and real reps.",
    muxPlaybackId: "DFmalLyijNWfYcbD00PCxvtLcSBWlDf7zdAVjHidaeAw",
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
    toolLinks: [
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Guided 6-minute first-person squat rehearsal — set your keywords to personalise it.",
      },
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
        description: "Guided 6-minute first-person bench press rehearsal.",
      },
      {
        label: "Deadlift Visualization",
        href: "/library#viz-deadlift",
        description: "Guided 6-minute first-person deadlift rehearsal.",
      },
    ],
  },
  {
    slug: "w10-mental-rehearsal",
    weekNumber: 10,
    theme: "Visualization & Mental Training",
    title: "Mental Rehearsal",
    subtitle: "From session to meet day",
    suggestedPhase: "Peak",
    moduleType: "practice",
    practiceTarget: 14,
    overview:
      "Mental rehearsal is visualisation applied to a specific performance moment — a session, an attempt, a whole meet — with full sensory detail.",
    muxPlaybackId: "JIH7MwwmNM00o01kDqf01imivDciszY2jVUm5z4H8y5cgQ",
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
    toolLinks: [
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Apply meet-day scenario rehearsal — walk through weigh-in, warm-ups, and each attempt in sequence.",
      },
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
      },
      {
        label: "Deadlift Visualization",
        href: "/library#viz-deadlift",
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
    moduleType: "practice",
    practiceTarget: 21,
    overview:
      "Under load there's no time for a paragraph. One short cue, anchored to one correct feeling, is worth more than a whole technique lecture.",
    muxPlaybackId: "Wy8oNEM87Vl3GG5xuZym9a6MXi4eSzKSw6QSM7Vfn5s",
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
    toolLinks: [
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Embed your new cues directly into guided visualization — repetition locks them in under load.",
      },
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
      },
      {
        label: "Deadlift Visualization",
        href: "/library#viz-deadlift",
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
    moduleType: "practice",
    practiceTarget: 10,
    overview:
      "You talk to yourself constantly. Most of it you don't notice. This week you audit it and rewrite the worst lines.",
    muxPlaybackId: "F6L2yLRwaKQzeKOmA4JOLLrUN4ryOnd700hcsSFJYa018",
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
    toolLinks: [
      {
        label: "Self-Talk Affirmations",
        href: "/library#affirmations",
        description: "Write your inner-coach statements as personal affirmations and rehearse them before every session.",
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
    moduleType: "practice",
    practiceTarget: 14,
    overview:
      "Focus isn't effort — it's direction. Under stress, attention narrows. The question is: does it narrow onto the right thing, or the wrong one?",
    muxPlaybackId: "rGQoBFBDgwY46hQlfFRTd3GPGcGz6zyG2IkLns5Nk1U",
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
    toolLinks: [
      {
        label: "Barrier",
        href: "/library#barrier",
        description: "Train selective attention with a guided audio that builds an internal boundary against distractions.",
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
    moduleType: "practice",
    practiceTarget: 14,
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
    toolLinks: [
      {
        label: "Barrier",
        href: "/library#barrier",
        description: "Use the Barrier audio to train rapid re-focus — build the habit before you need it on the platform.",
      },
    ],
  },

  // ── Theme 7 — Performance ───────────────────────────────────────────────
  {
    slug: "w15-meet-day",
    weekNumber: 15,
    theme: "Performance",
    title: "Meet Day",
    subtitle: "Trust the work. Execute.",
    suggestedPhase: "Meet week",
    moduleType: "insight",
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
    toolLinks: [
      {
        label: "Competition Day Mental Training",
        href: "/library#comp-day-viz",
        description: "12-minute guided walkthrough of your entire meet — from wake-up to final deadlift — personalized to your focus cues.",
      },
      {
        label: "Resource Activation",
        href: "/library#resource-activation",
        description: "Access your peak performance state between attempts with a single anchor cue.",
      },
    ],
  },

  // ── Bonus — Post-Meet Reflection (not part of the plan sequence) ────────
  {
    slug: "w16-post-meet",
    weekNumber: 16,
    bonus: true,
    theme: "Performance",
    title: "Post-Meet Reflection",
    subtitle: "Close the loop. Start the next one.",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "The competition is over. This is where the real learning happens. Without deliberate reflection, meets become experiences. With it, they become data.",
    keyPoints: [
      "The gap between what you expected and what happened is the most valuable feedback you have.",
      "Good performances and bad ones both deserve honest analysis.",
      "What you write down here becomes the foundation of your next prep.",
    ],
    questions: [
      {
        id: "post-meet-overall",
        prompt: "How do you feel about your competition overall? What's your honest first reaction?",
        journalMirror: true,
      },
      {
        id: "post-meet-win",
        prompt: "What was your biggest victory — on the platform or off it?",
      },
      {
        id: "post-meet-lesson",
        prompt: "What is the single most valuable thing you learned about yourself in this prep?",
        journalMirror: true,
      },
      {
        id: "post-meet-mental",
        prompt: "Rate your mental preparation out of 10. What earned that score?",
      },
      {
        id: "post-meet-next",
        prompt: "What is the one thing you'll do differently next prep?",
      },
    ],
    exercise: {
      title: "Post-meet letter",
      body:
        "Write a short letter to yourself before your next competition. Based on what you've just learned, what do you want future-you to remember when it matters most?",
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Backward-compat alias — prefer COURSE_MODULES in new code */
export const COURSE_WEEKS = COURSE_MODULES;

/**
 * Only the modules that belong in a plan (no bonus modules).
 * Use this everywhere plan generation and plan editing happens.
 */
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

/** Group modules by theme */
export function weeksByTheme(): Array<{ theme: CourseTheme; weeks: CourseModule[] }> {
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
    weeks: COURSE_MODULES.filter((m) => m.theme === theme),
  }));
}

/** Total modules in the library */
export const TOTAL_WEEKS = COURSE_MODULES.length;

/**
 * Pick the suggested week number based on days-to-meet.
 * Delegates to computeCourseWeek from lib/phase.ts where possible;
 * falls back to W1 when no meet is set.
 *
 * Kept here (in addition to computeCourseWeek) so course UI components only
 * need to import from lib/course.
 */
export function suggestedWeekNum(daysUntilMeet: number | null): number {
  if (daysUntilMeet === null || daysUntilMeet < 0) return 1;
  const weeksOut = Math.ceil(daysUntilMeet / 7);
  return Math.max(1, Math.min(16, 17 - weeksOut));
}

/** @deprecated Use getWeekByNum + suggestedWeekNum instead */
export function suggestedWeek(daysUntilMeet: number | null): CourseWeek {
  return getWeekByNum(suggestedWeekNum(daysUntilMeet)) ?? COURSE_WEEKS[0];
}

// ── Course Plan ───────────────────────────────────────────────────────────────

/**
 * A personalised course plan stored in profiles.course_plan (JSONB).
 * Contains an ordered list of week slugs drawn from COURSE_WEEKS.
 */
export type CoursePlan = {
  /** How the plan was created */
  type: "ai" | "coach" | "default";
  /** Ordered array of week slugs from COURSE_WEEKS */
  slugs: string[];
  /** AI-generated explanation personalised to the athlete (type === 'ai') */
  rationale?: string;
  /** Slugs that should be visually emphasised as priority/anchor weeks */
  highlights?: string[];
  /** ISO timestamp */
  generatedAt: string;
  /** Coach user id, present when type === 'coach' */
  generatedBy?: string;
};

// ── DB row types (must match migration_course_v2.sql) ────────────────────────

export type CourseProgressRow = {
  user_id: string;
  /** Primary key — module slug (replaces week_num) */
  module_slug: string;
  /** @deprecated kept for migration only */
  week_num: number;
  video_done_at: string | null;
  exercise_done_at: string | null;
  quiz_done_at: string | null;
  completed_at: string | null;
  /** Number of practice sessions logged (practice modules only) */
  practice_count: number;
  updated_at: string;
};

export type CourseAnswerRow = {
  id: string;
  user_id: string;
  /** Module slug (replaces week_num) */
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

// ── Step helpers ─────────────────────────────────────────────────────────────

export type ProgressStep = "video" | "exercise" | "quiz" | "practice";

export function stepsComplete(
  row: CourseProgressRow | undefined,
  mod?: CourseModule,
): {
  video: boolean;
  exercise: boolean;
  quiz: boolean;
  /** For practice modules: have they hit the practiceTarget? */
  practiceGoal: boolean;
  practiceCount: number;
  practiceTarget: number;
  /** Content steps (video + exercise + quiz) all done */
  contentDone: boolean;
  /** Fully done: content + practice (for insight = same as contentDone) */
  all: boolean;
} {
  // A module with no muxPlaybackId has no video — treat the step as automatically done.
  const video    = !!row?.video_done_at || (!!mod && !mod.muxPlaybackId);
  // A module with no exercise field has no exercise step — treat as automatically done.
  const exercise = !!row?.exercise_done_at || (!!mod && !mod.exercise);
  const quiz     = !!row?.quiz_done_at;
  const contentDone = video && exercise && quiz;

  const practiceCount  = row?.practice_count ?? 0;
  const practiceTarget = mod?.practiceTarget ?? 0;
  const practiceGoal   = mod?.moduleType === "practice"
    ? practiceCount >= practiceTarget
    : true; // insight modules have no practice requirement

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
