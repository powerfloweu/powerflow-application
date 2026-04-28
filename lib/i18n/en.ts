/**
 * English (source-of-truth) dictionary.
 *
 * All other language dictionaries must match this shape exactly.
 * Add new keys here first, then translate in de.ts / hu.ts.
 */
export const en = {
  brand: {
    name: "PowerFlow",
    tagline: "Mental performance",
  },

  // Bottom tab bar + sidebar nav
  nav: {
    home: "Home",
    journal: "Journal",
    course: "Course",
    tools: "Tools",
    you: "You",
  },

  // Reused atoms
  common: {
    loading: "Loading…",
    saving: "Saving…",
    save: "Save",
    saved: "Saved ✓",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    back: "Back",
    next: "Next",
    open: "Open",
    submit: "Submit",
    sending: "Sending…",
    sent: "Sent",
    error: "Something went wrong",
    retry: "Try again",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    optional: "optional",
    required: "required",
    minutes: "min",
    skip: "Skip",
    continue: "Continue",
    done: "Done",
    select: "Select",
    upgradeArrow: "Upgrade →",
  },

  // Today / home page
  today: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    greetingNight: "Hey",
    daysToMeet: "days to meet",
    dayOfMeet: "Meet day",
    noMeet: "No meet scheduled",
    setMeet: "Set meet date",
    checkinTitle: "Daily check-in",
    checkinSubtitle: "Take 30 seconds before training",
    checkinDone: "Done for today ✓",
    todaysFocus: "Today's focus",
    nextModule: "Next in your course",
    keepGoing: "Keep going",
    quickTools: "Quick tools",
    recentJournal: "Recent journal entries",
    seeAll: "See all",
    noJournalYet: "No entries yet",
    startWriting: "Start writing",
  },

  // Journal page
  journal: {
    title: "Journal",
    subtitle: "Track sessions, vent, reflect",
    newEntry: "New entry",
    writePlaceholder: "What happened? How did it feel?",
    contextLabel: "Context",
    contextGeneral: "General",
    contextTraining: "Training",
    contextCompetition: "Competition",
    contextRecovery: "Recovery",
    sentimentLabel: "How was it?",
    sentimentPositive: "Good",
    sentimentNeutral: "Neutral",
    sentimentNegative: "Tough",
    tagsLabel: "Tags",
    addTag: "Add tag",
    saveEntry: "Save entry",
    entrySaved: "Entry saved",
    deleteEntry: "Delete entry",
    deleteConfirm: "Delete this entry? This cannot be undone.",
    empty: "Your journal is empty",
    emptyHint: "Start with a quick reflection — even one sentence helps.",
    filterAll: "All",
    voiceMode: "Voice",
    textMode: "Text",
    voiceComingSoon: "Voice entries coming soon",
  },

  // Course
  course: {
    title: "Course",
    subtitle: "Mental performance, week by week",
    yourPlan: "Your plan",
    generatePlan: "Generate my plan",
    regeneratePlan: "Regenerate plan",
    editPlan: "Edit plan",
    week: "Week",
    module: "Module",
    moduleInsight: "Insight",
    modulePractice: "Practice",
    afterMeet: "After your meet",
    bonusModule: "Bonus module",
    completed: "Complete ✓",
    inProgress: "In progress",
    locked: "Locked",
    unlocks: "Unlocks next",
    practiceCount: "{count}/{target} sessions",
    targetReached: "Target reached — keep going if you like",
    sessionsRemaining: "{count} more to complete this module",
    goalMet: "Goal met ✓",
    logPractice: "Log today's practice",
    logged: "Logged ✓",
    markContentComplete: "Mark content complete",
    markComplete: "Mark module complete",
    moduleComplete: "Module complete ✓",
    backToPlan: "Back to plan →",
    contentDoneKeepPracticing: "Content done — keep logging practice sessions.",
    greatWork: "Great work. Head back to your plan for the next module.",
    completeContentFirst: "Complete the video, exercise and reflections first",
    keepLoggingPractice: "Marking content complete unlocks the next module. Keep logging practice sessions in parallel.",

    // Section labels in module detail
    sectionWatch: "Watch",
    sectionReflect: "Reflect",
    sectionWorksheets: "Worksheets",
    sectionUseTool: "Use this tool",
    sectionPractise: "Practise",
    sectionDailyPractice: "Daily practice",

    // Reflection bottom sheet
    reflectionTextTab: "Text",
    reflectionVoiceTab: "Voice",
    reflectionPlaceholder: "Write your reflection…",
    saveReflection: "Save reflection",
    voiceAnswersComing: "Voice answers coming soon",
    voiceAnswersHint: "Audio recording will be available in the next update. Use text for now.",
    switchToText: "Switch to text",

    // Module not found / loading
    moduleNotFound: "Module not found.",
    backToCourse: "← Course",

    // Plan generation
    generatingPlan: "Generating your plan…",
    planError: "Couldn't generate plan. Please try again.",
    planTooFewWeeks: "A plan must contain at least 8 weeks",
  },

  // Library / Tools
  library: {
    title: "Mental Tools",
    subtitle: "Guided audio sessions · tap to expand",
    aiCoachTitle: "AI Coach",
    aiCoachDesc: "Talk to the coaching brain. Get personalized scripts and guidance.",
    aiCoachOpen: "Open →",
    savedScripts: "📜 My saved scripts →",
    sectionRelaxation: "Relaxation",
    sectionVisualizations: "Visualizations",
    sectionActivation: "Activation",
    sectionAffirmations: "Affirmations",
    sectionFocus: "Focus",
    sectionCompetition: "Competition",
    locked: "Locked",
    toolsCountSecond: "{count} tools · Second tier required",
    toolsCountPR: "{count} tools · PR tier required",
    suggestATool: "Suggest a Tool",
    suggestPlaceholder: "e.g. A pre-meet focus routine, self-talk scripts, handling nerves on the platform…",
    suggestQuestion: "Is there a mental skill or technique you'd like to see added? Let us know.",
    sendRequest: "Send request",
    requestSent: "Request sent",
    requestThanks: "Thank you — we review every suggestion and add the most-requested tools.",
    submitAnother: "Submit another",
    yourFocusCues: "Your focus cues",
    yourCues: "Your cues",
    addKeywordsHint: "(1–3 keywords)",
    audioComingSoon: "Recording coming soon",
    audioGuided: "Guided audio",
    audioLoadError: "Couldn't load audio",
    affirmationLabel: "Affirmation",
    affirmationPlaceholder1: "e.g. I am strong and prepared for this",
    affirmationPlaceholder2: "e.g. I trust my technique under pressure",
    affirmationPlaceholder3: "e.g. I control what I can control",
  },

  // You / Settings page
  you: {
    title: "You",
    profileSection: "Profile",
    statsSection: "Lift stats",
    goalsSection: "Goals",
    meetSection: "Meet",
    settingsSection: "Settings",
    coachSection: "Coach",

    name: "Name",
    email: "Email",

    // Settings rows
    languageRow: "Language",
    languageDesc: "Choose the app language",
    notificationsRow: "Notifications",
    accountRow: "Account",
    plan: "Plan",
    upgrade: "Upgrade",
    signOut: "Sign out",
    deleteAccount: "Delete account",
    deleteAccountWarn: "This permanently deletes your profile, journal and progress. Cannot be undone.",
    deleteConfirm: "Type DELETE to confirm",
    deleted: "Account deleted",

    // Stats
    bodyweight: "Bodyweight",
    weightCategory: "Weight category",
    squat: "Squat",
    bench: "Bench",
    deadlift: "Deadlift",
    current: "Current",
    goal: "Goal",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    trainingDaysWeek: "Training days per week",

    meetDate: "Meet date",
    daysToGo: "days to go",
    noMeetSet: "No meet set",

    coachLinked: "Linked to coach",
    noCoach: "No coach linked",
    enterCoachCode: "Enter coach code",
    linkCoach: "Link coach",
    unlinkCoach: "Unlink coach",
  },

  // Upgrade / pricing page
  upgrade: {
    title: "Choose your plan",
    subtitle: "Mental performance, scaled to where you are.",
    currentPlan: "Current plan",
    perMonth: "/mo",
    free: "Free",

    openerName: "Opener Tier",
    openerSubtitle: "Free",
    openerDesc: "Journal your sessions and track your training.",

    secondName: "Second Tier",
    secondSubtitle: "Tools",
    secondDesc: "The full mental performance toolkit.",

    prName: "PR Tier",
    prSubtitle: "All-access",
    prDesc: "Every tool, the full course, and your AI coach.",

    cta: "Choose plan",
    youHaveThis: "Your current plan",
    contactNote: "Stripe checkout coming soon. Email trainer.pod@gmail.com to upgrade in the meantime.",
    coachNote: "Coaches: billing handled separately — contact your account manager.",
  },

  // Paywall on a locked page
  paywall: {
    title: "Upgrade to unlock",
    onCurrent: "You're on",
    upgradeTo: "Upgrade to",
    seePlans: "See plans →",
  },

  // Auth
  auth: {
    signInTitle: "Sign in to PowerFlow",
    signInSubtitle: "Continue with the account you used before.",
    googleButton: "Continue with Google",
    emailButton: "Continue with email",
    emailPlaceholder: "your@email.com",
    sendMagic: "Send magic link",
    checkEmail: "Check your email",
    checkEmailHint: "We sent you a link to sign in.",
    backToSignIn: "← Back",
    signOut: "Sign out",
  },

  // Notifications modal
  notifications: {
    title: "What's new",
    devlogTitle: "Latest update",
    readMore: "Read more",
    dismiss: "Got it",
  },

  // Test bundle
  tests: {
    title: "Mental performance tests",
    subtitle: "Validated psychological tools",
    startTest: "Start",
    continueTest: "Continue",
    retake: "Retake",
    yourScore: "Your score",
    bundleComplete: "Bundle complete",
    bundleCompleteDesc: "All four tests done — well-balanced data on your mental performance.",
  },

  // Plan tier labels (used many places)
  tier: {
    opener: "Opener Tier",
    second: "Second Tier",
    pr: "PR Tier",
  },
} as const;

/** Recursively widen a const-asserted dict so other locales can supply any string. */
type Widen<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends object ? Widen<T[K]> : T[K];
};

export type Dict = Widen<typeof en>;
