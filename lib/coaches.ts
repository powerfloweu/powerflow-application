/**
 * The PowerFlow coach roster — single source of truth for /coaches, the
 * per-coach landing pages at /coaches/[slug], and the seminar host cards.
 *
 * Everything here is public marketing copy. Two rules:
 *
 *   1. Facts must be true and attributable. No invented credentials, results
 *      or affiliations.
 *   2. `testimonials` must be real, quoted with the athlete's permission, and
 *      attributed. An empty array renders no section at all — that is the
 *      correct state until someone has actually said something. Never fill it
 *      with plausible-sounding placeholder quotes: a fabricated review is
 *      indistinguishable from a real one to a reader.
 */

export interface Testimonial {
  /** The athlete's own words. */
  quote: string;
  /** How they want to be credited, e.g. "Marthe H." or a full name. */
  author: string;
  /** Optional context line: "IPF Worlds 2025", "coached since 2023". */
  context?: string;
}

export interface CoachPhoto {
  src: string;
  /** Real alt text — what is happening, not "photo of X". */
  alt: string;
}

export interface Coach {
  slug: string;
  /**
   * "founder" is David and is shown on its own; "affiliate" coaches are the
   * ones an athlete picks between. Drives the sections on /coaches.
   */
  role: "founder" | "affiliate";
  /**
   * Kept in the roster but not shown anywhere and not routable. Use this
   * rather than deleting a coach — the record, photo and copy survive, and
   * bringing them back is one line.
   */
  hidden?: boolean;
  name: string;
  /** Fallback when `photo` is null. */
  initials: string;
  title: string;
  /** One-paragraph version, used on the roster card. */
  bio: string;
  /**
   * Longer version for the landing page, one string per paragraph. Falls back
   * to `[bio]` when absent — thin, but honest.
   */
  longBio?: string[];
  instagram: string | null;
  photo: string | null;
  /** What they work on. Shown as chips. */
  tags: string[];
  /** Coaches who work outside PowerFlow's own system. */
  external?: boolean;
  /** External application form; when absent the in-app onboarding is used. */
  applyUrl?: string;
  gallery: CoachPhoto[];
  testimonials: Testimonial[];
}

export const COACHES: readonly Coach[] = [
  {
    slug: "david",
    role: "founder",
    name: "David Sipos",
    initials: "DS",
    title: "Sport Psychologist (MSc) · Founder",
    bio: "David built PowerFlow after 600+ hours of practice with powerlifters, distilling sport psychology into tools any athlete can apply: visualization scripts, pre-meet routines, competition anxiety work and individualized mental skill sets. Works with athletes across IPF, USAPL and EPF.",
    longBio: [
      "David built PowerFlow after 600+ hours of practice with powerlifters, distilling sport psychology into tools any athlete can apply: visualization scripts, pre-meet routines, competition anxiety work and individualized mental skill sets.",
      "He works with athletes across IPF, USAPL and EPF — from first meets to international platforms.",
    ],
    instagram: "powerfloweu",
    photo: "/coaches/david.jpg",
    tags: ["Visualization", "Competition anxiety", "Goal setting", "Meet-day prep"],
    gallery: [],
    testimonials: [],
  },
  {
    slug: "jay",
    role: "affiliate",
    name: "Jacqueline Ulrich",
    initials: "JU",
    title: "Mental Performance Coach",
    bio: "Having participated in international-level powerlifting competitions, Jay knows what it feels like to deal with pressure, doubt, and expectations. As a powerlifting coach she realised long-term development takes more than training plans — and went deeper into the mental side. She helps athletes understand their own thoughts and experiences and find their way toward more clarity and confidence in themselves.",
    longBio: [
      "Having participated in international-level powerlifting competitions, Jay knows what it feels like to deal with pressure, doubt, and expectations — not as theory, but from the warm-up room.",
      "As a powerlifting coach she realised long-term development takes more than training plans, and went deeper into the mental side. She helps athletes understand their own thoughts and experiences, and find their way toward more clarity and confidence in themselves.",
    ],
    instagram: "omgitsjacqueline",
    photo: "/coaches/jay.jpg",
    tags: ["Mental resilience", "Confidence", "Performance routines", "Consistency"],
    gallery: [
      { src: "/coaches/jay/euros-walkout.jpg",  alt: "Jay walking out to the platform at the European Championships" },
      { src: "/coaches/jay/euros-deadlift.jpg", alt: "Jay setting up for a deadlift in competition" },
      { src: "/coaches/jay/coaching.jpg",       alt: "Jay coaching an athlete between attempts" },
      { src: "/coaches/jay/medal.jpg",          alt: "Jay after a competition, medal around her neck" },
    ],
    testimonials: [],
  },
  {
    slug: "clarice",
    role: "affiliate",
    name: "Clarice Tighe",
    initials: "CT",
    title: "Sport Psychologist (MSc)",
    bio: "Full-time performance mentality coach at Odyssey Strength and competing powerlifter based in Ireland. Having navigated life with Multiple Sclerosis while continuing to compete — returning to the platform at the 2024 IrishPF Open after what she describes as her lowest points — Clarice brings a depth of lived resilience to her coaching. She specialises in the self-talk and mental habits that keep athletes together when conditions are hardest.",
    longBio: [
      "Full-time performance mentality coach at Odyssey Strength and a competing powerlifter based in Ireland.",
      "Having navigated life with Multiple Sclerosis while continuing to compete — returning to the platform at the 2024 IrishPF Open after what she describes as her lowest points — Clarice brings a depth of lived resilience to her coaching.",
      "She specialises in the self-talk and mental habits that keep athletes together when conditions are hardest.",
    ],
    instagram: "clarice_odyssey",
    photo: "/coaches/clarice.jpg",
    tags: ["Self-talk", "Cognitive patterns", "Pressure performance", "Mindset"],
    applyUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdeIVKKhkAn5SZgBuJZWm2SigpHBeCR__RwyWaQPcKrkJO20Q/viewform",
    gallery: [
      { src: "/coaches/clarice/meet.jpg",          alt: "Clarice with her team at a competition" },
      { src: "/coaches/clarice/warmup-room.jpg",   alt: "Clarice in the warm-up room during a meet" },
      { src: "/coaches/clarice/platform-side.jpg", alt: "Clarice watching from the side of the platform" },
    ],
    testimonials: [],
  },
  {
    slug: "kate",
    role: "affiliate",
    // Hidden until the affiliate roster is ready to include her.
    hidden: true,
    name: "Dr. Kate Cohen-Maher",
    initials: "KC",
    title: "Sport Psychologist (PhD)",
    bio: "Sport psychologist (PhD, Florida State University), 48 kg pro powerlifter and 2× USAPL National Champion. Former Raw American junior and collegiate record holder in squat, bench and deadlift. Works with D1 and elite athletes on confidence, attention control, anxiety regulation and performing under pressure. Affiliated with The Strength Guys.",
    longBio: [
      "Sport psychologist (PhD, Florida State University), 48 kg pro powerlifter and 2× USAPL National Champion. Former Raw American junior and collegiate record holder in squat, bench and deadlift.",
      "She works with D1 and elite athletes on confidence, attention control, anxiety regulation and performing under pressure, and is affiliated with The Strength Guys.",
    ],
    instagram: "kateco220",
    photo: "/coaches/kate.jpg",
    tags: ["Confidence", "Anxiety regulation", "Focus & attention", "Elite performance"],
    external: true,
    applyUrl: "https://docs.google.com/forms/d/e/1FAIpQLSepNr4SC7zIy40wUV_nTohd06a8bXEXD8dJsYJ03BUzIxhVgw/viewform",
    gallery: [],
    testimonials: [],
  },
] as const;

/** Everyone shown to the public. Hidden coaches are excluded everywhere. */
export const VISIBLE_COACHES: readonly Coach[] = COACHES.filter((c) => !c.hidden);

export const FOUNDER: Coach | undefined = VISIBLE_COACHES.find((c) => c.role === "founder");

export const AFFILIATE_COACHES: readonly Coach[] =
  VISIBLE_COACHES.filter((c) => c.role === "affiliate");

/**
 * Public lookup — never returns a hidden coach, so their landing page 404s
 * rather than staying reachable by URL once they are taken off the roster.
 */
export function coachBySlug(slug: string): Coach | undefined {
  return VISIBLE_COACHES.find((c) => c.slug === slug);
}

/** Paragraphs for the landing page — the long version when there is one. */
export function coachBioParagraphs(coach: Coach): string[] {
  return coach.longBio?.length ? coach.longBio : [coach.bio];
}

/** First name, for CTAs like "Apply for 1:1 coaching with Jay". */
export function coachFirstName(coach: Coach): string {
  return coach.slug === "jay" ? "Jay" : coach.name.replace(/^Dr\.\s*/, "").split(" ")[0];
}
