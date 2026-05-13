import type { Dict } from "./en";

/**
 * Spanish translations — stub file.
 *
 * This file intentionally starts empty. Translations are managed via the
 * /translate editor and stored as DB overrides. The compiled values here
 * serve as a static fallback when the DB is unreachable.
 *
 * Tone notes for translators:
 *   - Use "tú" form (not "usted") — informal, consistent with EN tone.
 *   - Powerlifting terms stay English where standard (Squat, Bench, Deadlift).
 *   - Keep brand "PowerFlow" in English.
 */
export const es: Partial<Dict> = {
  nav: {
    home: "Inicio",
    journal: "Diario",
    course: "Curso",
    tools: "Herramientas",
    you: "Tú",
    coach: "Entrenador",
    coachHome: "Inicio",
    coachAthletes: "Atletas",
    coachActivity: "Actividad",
  },
};
