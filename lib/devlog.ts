/**
 * PowerFlow dev log — in-app changelog shown to coaches on login
 * and available to athletes in the You section.
 *
 * Add a new entry at the TOP of the array each release.
 * Update CURRENT_VERSION to match the latest entry's version.
 */

export type DevLogEntry = {
  version: string;   // e.g. "2026-04-27" — used for seen-tracking
  date: string;      // human-readable
  title: string;
  items: string[];
};

export const CURRENT_DEVLOG_VERSION = "2026-05-15";

export const DEVLOG: DevLogEntry[] = [
  {
    version: "2026-05-15",
    date: "15 May 2026",
    title: "@mentions · background audio · coach fixes",
    items: [
      "@mention your coach in journal entries — type @ in the quick-entry box, pick your coach from the dropdown, and they get a push notification straight away.",
      "Relaxation and visualisation audio now keeps playing when your phone screen locks — no more tracks cutting out mid-session.",
      "Playback speed button added to both the Scripts and Library audio players: cycle between 0.75×, 1×, and 1.25× while playing.",
      "Coach activity feed: tapping any card now takes you directly to that athlete's profile sheet.",
      "Athlete profile sheet (coach side): scrolling on iOS is fixed — the card no longer gets stuck.",
      "Coach interface: athlete-only tabs and banners no longer flash briefly on load for coach accounts.",
    ],
  },
  {
    version: "2026-05-01",
    date: "1 May 2026",
    title: "Visualisation modes · polish & quality of life",
    items: [
      "Three visualisation modes now available in the Tools section — choose between a guided audio session, a live real-time session with on-screen cues, or recording your own voice note to play back during training.",
      "Dozens of small UX improvements across the whole app: cleaner navigation, better feedback when actions are loading or disabled, wider layouts on desktop, and skeleton screens instead of blank spinners while pages load.",
      "Multilingual polish — several strings that were previously English-only are now fully translated into German and Hungarian.",
    ],
  },
  {
    version: "2026-04-30.3",
    date: "30 Apr 2026",
    title: "Monthly check-in · weekly check-in nudge",
    items: [
      "Monthly check-in — every fourth week the regular check-in is replaced by a deeper monthly review. It includes the same five ratings and weekly reflection, plus an overall monthly progress rating and three deeper prompts: biggest breakthrough, key lesson, and intention for next month.",
      "Weekly check-in nudge on Today — if you pressed Later on the check-in modal, a card now appears at the top of your Today page so you can jump back in at any time without waiting for the next login.",
    ],
  },
  {
    version: "2026-04-30.2",
    date: "30 Apr 2026",
    title: "Voice input · tests · Coach AI feedback",
    items: [
      "Voice input in Coach AI — tap the mic button next to the send field, speak, and your words appear in real time. Tap again to stop. Works on Chrome, Edge, and Safari.",
      "Mental Tests now accessible from the Home screen — a Tests card at the bottom of your Today page links directly to all four tests.",
      "Coaches can assign a test to an athlete — open any athlete's Test scores tab and use the Assign panel at the bottom. Assigned tests appear as an amber prompt on the athlete's Home screen.",
      "When an athlete completes a test while logged in, results are automatically linked to their profile so the coach sees them instantly.",
      "Coach AI daily feedback — after your third message of the day, a quick check-in appears: rate response length, style, and overall helpfulness. Takes five seconds and helps improve the AI over time.",
    ],
  },
  {
    version: "2026-04-30",
    date: "30 Apr 2026",
    title: "Light mode · logo · readability",
    items: [
      "Light mode added — switch between dark and light with the sun/moon button in the sidebar (desktop) or You → Appearance (mobile). PowerFlow colours: black, violet, and white.",
      "PowerFlow logo now appears in the sidebar on desktop and in the top bar on mobile, with the athlete silhouette and barbell — theme-adaptive (white on dark, colour on light).",
      "All grey text across the app has been brightened significantly for better readability on dark backgrounds.",
      "Weekly check-in: coaches can now see athletes' weekly check-ins in a dedicated tab on the coach dashboard.",
      "Dev Tools tab added to the admin panel for testing features like the weekly check-in modal on any day of the week.",
    ],
  },
  {
    version: "2026-04-29",
    date: "29 Apr 2026",
    title: "Back-date your training log",
    items: [
      "Forgot to log yesterday? Both the Home and Journal pages now have a date switcher — tap Yesterday or 2 days ago to log for a missed day.",
      "Home page: mark a past day as Training or Rest, just like you would for today.",
      "Journal page: if that day was a training day you can fill in all five training-log questions for it; if it wasn't logged yet, you can mark it right there.",
      "Instagram handles on coach and admin dashboards are now clickable links.",
      "Admin panel: plan tier (Opener / Second / PR) is now editable directly from the user row.",
    ],
  },
  {
    version: "2026-04-27.2",
    date: "27 Apr 2026",
    title: "In-app broadcasts · dev log",
    items: [
      "Broadcasts are now delivered inside the app — you'll see them as a modal on your next login, no email needed.",
      "Broadcast body supports links: write [Guide →](/guide) and it becomes a clickable link.",
      "Dev log added — coaches see it on login after any broadcast, athletes find it in You → What's new.",
      "Admin panel broadcast tab rebuilt: publish to everyone, athletes only, or coaches only; deactivate old broadcasts without deleting them.",
    ],
  },
  {
    version: "2026-04-27",
    date: "27 Apr 2026",
    title: "Modular course · unified activity feed",
    items: [
      "Course redesigned as a modular system — each module has its own type (insight or practice) with individual completion tracking.",
      "Training day logs now appear in the journal feed alongside quick thoughts, for both athletes and coaches.",
      "Coach activity tab now counts training logs in the 'entries this week' and 'last active' stats.",
      "Sequential soft-gate unlock: athletes move through modules in order; completed modules stay accessible.",
      "Core modules highlighted in the plan view so athletes know what matters most.",
      "Old /course/w/[week] URLs redirect automatically to the new /course/m/[slug] routes.",
    ],
  },
];
