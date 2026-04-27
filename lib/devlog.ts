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

export const CURRENT_DEVLOG_VERSION = "2026-04-27.2";

export const DEVLOG: DevLogEntry[] = [
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
