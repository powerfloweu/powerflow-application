import type { Dict } from "./en";

/**
 * French translations — stub file.
 *
 * This file intentionally starts empty. Translations are managed via the
 * /translate editor and stored as DB overrides. The compiled values here
 * serve as a static fallback when the DB is unreachable.
 *
 * Tone notes for translators:
 *   - Use "tu" form (not "vous") — informal, consistent with EN tone.
 *   - Powerlifting terms stay English where standard (Squat, Bench, Deadlift).
 *   - Keep brand "PowerFlow" in English.
 */
export const fr: Partial<Dict> = {
  nav: {
    home: "Accueil",
    journal: "Journal",
    course: "Cours",
    tools: "Outils",
    you: "Toi",
    coach: "Coach",
    coachHome: "Accueil",
    coachAthletes: "Athlètes",
    coachActivity: "Activité",
  },
};
