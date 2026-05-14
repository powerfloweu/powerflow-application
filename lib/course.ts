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
   * Mux public playback ID — English (default) video.
   * Obtain from the Mux dashboard: Asset → Playback IDs (public).
   */
  muxPlaybackId?: string;
  /**
   * German (DE) version of the video. Falls back to muxPlaybackId if absent.
   * Add these as videos are uploaded to Mux.
   */
  muxPlaybackId_de?: string;
  /**
   * Hungarian (HU) version of the video. Falls back to muxPlaybackId if absent.
   * Add these as videos are uploaded to Mux.
   */
  muxPlaybackId_hu?: string;
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

/**
 * Returns the best available Mux playback ID for the given locale.
 * Falls back to the English ID if no locale-specific version exists yet.
 */
export function getPlaybackId(mod: CourseModule, locale: string): string | undefined {
  if (locale === "de" && mod.muxPlaybackId_de) return mod.muxPlaybackId_de;
  if (locale === "hu" && mod.muxPlaybackId_hu) return mod.muxPlaybackId_hu;
  return mod.muxPlaybackId;
}

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
    muxPlaybackId_de: "lTqoZD01q7P7l7vvX3SlF01Kn73XuvzIIgH01t02Y01HQsQQ",
    muxPlaybackId_hu: "3otW5RY802ilCtDhIlM02nItZ00AxN8sj7DRcYWU00lRS01M",
    vidyardUuid: "uzfLhVxMTKLmwnuQ9haJFS",
    keyPoints: [
      "Your relationship with the sport shapes every session you step into.",
      "Naming what draws you to powerlifting clarifies what's worth protecting.",
      "The costs are real — acknowledging them is how you stay in the sport long-term.",
    ],
    toolLinks: [
      {
        label: "Resource Activation",
        href: "/library#resource-activation",
        description: "Start here — use your moment of success as the anchor before answering the first question.",
      },
    ],
    questions: [
      {
        id: "success-moment",
        prompt: "Go to the Resource Activation tool in your library and complete a session using your best moment of success as the anchor. When you're done, come back here and describe that moment.",
        placeholder: "What happened? Where were you? What did it feel like?",
        journalMirror: true,
      },
      {
        id: "why-powerlifting",
        prompt: "Why did you start powerlifting, and what keeps you in it today?",
        placeholder: "Write honestly — this is just for you.",
        journalMirror: true,
      },
      {
        id: "what-it-means",
        prompt: "What does powerlifting mean to you?",
        placeholder: "Identity, discipline, community, control…",
      },
      {
        id: "how-evolved",
        prompt: "In which qualities have you evolved the most since starting this sport?",
      },
      {
        id: "what-it-costs",
        prompt: "What does powerlifting cost you? (time, relationships, energy, mood)",
        placeholder: "Be specific. No judgement.",
      },
    ],
    exercise: {
      title: "Resource Activation",
      body:
        "Before answering the first question above, open the Resource Activation tool in your library. Use your moment of success as the anchor. Complete the session, then return here to describe it.",
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
    muxPlaybackId_de: "FCThOxjrdxD22En02R02nh8rbv800R2jAvaw01YV00hhU500g",
    muxPlaybackId_hu: "6l3xacJqP5ooeWwkf1WIvsycsIkCJQdJPtsTEPirzDE",
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
    muxPlaybackId_de: "02koCOd3VHPTOt2gMez29sb7qcBiMSzHJmCnMt8UxvfM",
    muxPlaybackId_hu: "00pR7Xsq2PuwkZmfasMF02Fb2O2lyOL007QqK02mXOWksIA",
    vidyardUuid: "QHTXHxz61eEGGosXzHH7Pa",
    keyPoints: [
      "Outcome goals motivate the block; process goals survive the session.",
      "If a goal doesn't scare you a little, it's probably not pulling you.",
      "Write goals down. Unwritten goals are wishes.",
    ],
    questions: [
      {
        id: "smart-goals",
        prompt: "Download and complete the SMART goal worksheet below. Work through each section — it covers your outcome, performance, and process goals in full.",
        placeholder: "Use the worksheet. Come back here to note anything that surprised you or felt hard to answer.",
      },
      {
        id: "next-comp-goal",
        prompt: "What do you want to achieve in your next competition?",
        placeholder: "Be specific — attempts, total, a personal milestone.",
        journalMirror: true,
      },
      {
        id: "five-year-goal",
        prompt: "What is your goal in powerlifting in 5 years?",
        journalMirror: true,
      },
    ],
    exercise: {
      title: "SMART worksheet",
      body:
        "Download the SMART goal worksheet below. Fill it in fully — outcome, performance, and process goals. Post it somewhere you'll see it before you train.",
    },
    downloads: [
      {
        label: "Download SMART worksheet",
        url: "/downloads/smart.pdf",
        description: "Work through this before answering the questions above. It structures your goals across all three layers.",
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
    muxPlaybackId_de: "J00QheBC4q9JT1bt5BeI7kx63xeTAbFdPcdwcn4sFdWE",
    muxPlaybackId_hu: "02UAJgCmR02PDPz01esm1yoBLcaeWSaFaLvM98dfZ402Kdk",
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
    muxPlaybackId_de: "jILvWcEAJRPrvPZLgJlTRvR01YhvzOcBF2b01ZUD1NpDA", // DE
    muxPlaybackId_hu: "4bQ100fING8wKK9UMptcETeUdSViTmVO00oVyX2f3fu00c",
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
    muxPlaybackId_de: "jILvWcEAJRPrvPZLgJlTRvR01YhvzOcBF2b01ZUD1NpDA", // DE
    muxPlaybackId_hu: "4bQ100fING8wKK9UMptcETeUdSViTmVO00oVyX2f3fu00c",
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
    muxPlaybackId_de: "jILvWcEAJRPrvPZLgJlTRvR01YhvzOcBF2b01ZUD1NpDA", // DE
    muxPlaybackId_hu: "4bQ100fING8wKK9UMptcETeUdSViTmVO00oVyX2f3fu00c",
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
    muxPlaybackId_de: "jILvWcEAJRPrvPZLgJlTRvR01YhvzOcBF2b01ZUD1NpDA", // DE
    muxPlaybackId_hu: "4bQ100fING8wKK9UMptcETeUdSViTmVO00oVyX2f3fu00c",
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
    muxPlaybackId_de: "rC01brolQZA1h4WH4zplkpvzVWmWdGqY6BrZEeX6ZJvM", // DE
    muxPlaybackId_hu: "3RarYkmzVrzVglzwjMxfCjRVVEh99IADnQxQqPBAX3A",
    vidyardUuid: "2mizuQmGN1jcmvFsfm7jYo",
    keyPoints: [
      "First-person, not third-person — see it through your own eyes.",
      "Use all senses: sight, sound, breath, the chalk, the hum of the room.",
      "Rehearse the successful execution, not the anxiety around it.",
    ],
    questions: [
      {
        id: "viz-keywords",
        prompt: "Open the Squat, Bench, and Deadlift visualization tools in your library and complete a session for each. As you go, pay attention to which words and cues feel most accurate for your lifts — then set your keywords inside each tool so they stay with you.",
        placeholder: "Squat keywords: …  Bench keywords: …  Deadlift keywords: …",
      },
    ],
    exercise: {
      title: "Use the guided visualizations",
      body:
        "This week, run through the squat, bench, and deadlift visualization tools before your top sets. Keep refining your keywords in each tool as they become more precise — you'll see them every time you open a session.",
    },
    toolLinks: [
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Start here — complete a session and set your squat keywords.",
      },
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
        description: "Complete a session and set your bench keywords.",
      },
      {
        label: "Deadlift Visualization",
        href: "/library#viz-deadlift",
        description: "Complete a session and set your deadlift keywords.",
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
    muxPlaybackId_de: "oyYdjJNln9kPYElz009uHzUTiMab01LB9imwylZIpZ01zo", // DE
    muxPlaybackId_hu: "5vcprpfNZ9VgDl9C2AK2CnOl5kPVNEW3qGGJW2RRd9M",
    vidyardUuid: "eosWqyDenTbc9C2SYZhHi7",
    keyPoints: [
      "Rehearse the boring parts too — weigh-in, waiting, chalk up.",
      "Include contingencies: what will you do if an opener is missed?",
      "Repeat the same rehearsal. Familiarity is the point.",
    ],
    questions: [
      {
        id: "rehearsal-feel",
        prompt: "After running through the visualization tools this week, what parts of your meet-day scenario felt unclear or unfamiliar? Note them here and run those moments again.",
        placeholder: "Warm-up timing, rack height, commands, between-attempt routine…",
        journalMirror: true,
      },
    ],
    toolLinks: [
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Run your full squat sequence — opener through third attempt. Update keywords if they've sharpened.",
      },
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
        description: "Run your full bench sequence. Update keywords.",
      },
      {
        label: "Deadlift Visualization",
        href: "/library#viz-deadlift",
        description: "Run your full deadlift sequence. Update keywords.",
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
    muxPlaybackId_de: "02jA01gp1q015VyWWIecP1LLgPM01H2p17db01D00MYlcfF1I", // DE
    muxPlaybackId_hu: "EKuP02uHKDSdbnvBRRr02eH4xrd4tMH3a4fadPgnrD8Ok",
    vidyardUuid: "TF5sVvNTRZddYKfmzBmWtQ",
    keyPoints: [
      "Cues should be action-oriented, not corrective. 'Drive' beats 'don't round'.",
      "One cue per lift. More than one is noise.",
      "Test cues in training. Don't invent them on meet day.",
    ],
    questions: [
      {
        id: "cue-squat",
        prompt: "What's your one cue for squat? Update it as a keyword in the Squat Visualization tool so it's baked into every guided session.",
      },
      {
        id: "cue-bench",
        prompt: "What's your one cue for bench? Update it in the Bench Visualization tool.",
      },
      {
        id: "cue-deadlift",
        prompt: "What's your one cue for deadlift? Update it in the Deadlift Visualization tool.",
      },
    ],
    toolLinks: [
      {
        label: "Squat Visualization",
        href: "/library#viz-squat",
        description: "Update your squat keyword now so it appears in every guided session going forward.",
      },
      {
        label: "Bench Visualization",
        href: "/library#viz-bench",
        description: "Update your bench keyword.",
      },
      {
        label: "Deadlift Visualization",
        href: "/library#viz-deadlift",
        description: "Update your deadlift keyword.",
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
    muxPlaybackId_de: "9Y5edt00ANAN3v02EAd1YrEKRYNnYtsiS2qE695xNiz01Q", // DE
    muxPlaybackId_hu: "9GnS7CdaAVNdeFPw1vl13GhvjjuZILFVS88Y0000E32PI",
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
    muxPlaybackId_de: "sHu02SO01tDjk3uZDv1kTdy1200Fkajo97ApBcbLfozggw", // DE
    muxPlaybackId_hu: "gH6sCGRBI2CdRd1Dx2izd9wSgKEObRyGxlSrZlixizs",
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
      {
        id: "pre-lift-selftalk",
        prompt: "What do you say to yourself before initiating a lift? Go to the Affirmations tool and set it there so it's always accessible — then write it here too.",
        placeholder: "Short, personal, present tense.",
      },
      {
        id: "emotional-control",
        prompt: "What do you do during a session or at a competition to avoid getting carried away by your emotions?",
      },
    ],
    toolLinks: [
      {
        label: "Barrier",
        href: "/library#barrier",
        description: "Train selective attention with a guided audio that builds an internal boundary against distractions.",
      },
      {
        label: "Self-Talk Affirmations",
        href: "/library#affirmations",
        description: "Set your pre-lift statement here so you can access it quickly before every attempt.",
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
    muxPlaybackId: "K6baomfCm1gXBrLwdKup7AurpP2kTkjjvsC9wSj00w6Y",
    muxPlaybackId_de: "7FaMa4U801FwSIjR5phoccOoHyrNwQqgqJV9KWzZcrFE", // DE
    muxPlaybackId_hu: "xsiPM3XaI4A02DMmkjMbou5u6W9xtUMSBEZke2s7xqic",
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
    muxPlaybackId: "K6baomfCm1gXBrLwdKup7AurpP2kTkjjvsC9wSj00w6Y",
    muxPlaybackId_de: "7FaMa4U801FwSIjR5phoccOoHyrNwQqgqJV9KWzZcrFE",
    muxPlaybackId_hu: "StHeqnnAiBE54cVFdQQMViXVgLDuc4WCabqt3PdNb02U",
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

  // ── Theme 8 — Competition Week ──────────────────────────────────────────
  {
    slug: "w16-competition-week",
    weekNumber: 16,
    theme: "Performance",
    title: "The Final Push",
    subtitle: "Competition week — execute what you've built",
    suggestedPhase: "Meet week",
    moduleType: "insight",
    overview:
      "This is it — the final week of the method and your last days before the platform. Great execution starts with detailed planning. Everything you've done for 15 weeks has led here. Trust it.",
    muxPlaybackId: "li3zG461hiJ6DB02qjPu0200Ed1I9PmB00JGoXz02V3Z3mQo",
    muxPlaybackId_de: "hx0200Hsp802sYZjzX8OT9XKPfGdZx4M56InYS01DHPF02W4",
    muxPlaybackId_hu: "BQs4ON02ryIQBVTbf25tX9IhIyu00CPDFKlktHyGmC5Ek",
    keyPoints: [
      "Your pre-comp ritual starts this week — lock in your sleep, nutrition, and warm-up timing now, not on meet day.",
      "Use the competition day visualization daily: it runs 12 minutes and takes you from arriving at the venue through every attempt.",
      "Only do things you routinely do. This week is not the time to try anything new — food, equipment, or otherwise.",
    ],
    questions: [
      {
        id: "precomp-ritual",
        prompt: "Walk through your competition day hour by hour — from the moment you wake up to your first attempt. What does the ideal version look like?",
        placeholder: "Wake-up time, breakfast, warm-up timing, singlet, music…",
        journalMirror: true,
      },
      {
        id: "anchor-points",
        prompt: "What anchor point will you fix your gaze on for squat, bench, and deadlift? Be specific — the lights, a mark on the wall, the bar itself.",
        placeholder: "Squat: … Bench: … Deadlift: …",
      },
      {
        id: "one-thing",
        prompt: "What's the one mental cue you want to carry into every attempt this week?",
        placeholder: "Short, personal, actionable.",
      },
    ],
    exercise: {
      title: "Full comp-day rehearsal",
      body:
        "At your last training session before the meet, run through your exact pre-attempt routine for each lift — same music, same self-talk cue, same anchor point. Treat it like the real thing so your nervous system recognizes it on the day.",
    },
    toolLinks: [
      {
        label: "Competition Day Mental Training",
        href: "/library#comp-day-viz",
        description: "12-minute guided walkthrough of your entire meet — from arriving at the venue to your final deadlift.",
      },
      {
        label: "Barrier",
        href: "/library#barrier",
        description: "Lock in your focus and block out distractions before each attempt.",
      },
    ],
  },

  // ── Bonus — Post-Meet Reflection (not part of the plan sequence) ────────
  {
    slug: "w16-post-meet",
    weekNumber: 17,
    bonus: true,
    theme: "Performance",
    title: "Post-Meet Reflection",
    subtitle: "Close the loop. Start the next one.",
    suggestedPhase: "Foundation",
    moduleType: "insight",
    overview:
      "The competition is over. This is where the real learning happens. Without deliberate reflection, meets become experiences. With it, they become data.",
    muxPlaybackId: "bGFTDZRLAg5Pv7v01wwZmiMvqaen2tRDM2f5QuXUNJzw",
    muxPlaybackId_de: "Otpg6a6IdHm6BvsknszlwIfsFUU3dB8mV1BX02008Fb3A", // DE
    muxPlaybackId_hu: "", // ← paste HU Mux ID here
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
