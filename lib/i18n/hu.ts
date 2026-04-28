import type { Dict } from "./en";
import { en } from "./en";

/**
 * Hungarian translations.
 *
 * Phase 1: keeps EN values so the HU language picker works without
 * showing missing keys. Phase 2 fills in real translations from the
 * original course material in the docx.
 */
export const hu: Dict = {
  ...en,
  brand: { ...en.brand, tagline: "Mentális teljesítmény" },
  nav: {
    home: "Főoldal",
    journal: "Napló",
    course: "Kurzus",
    tools: "Eszközök",
    you: "Te",
  },
};
