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

export interface TestimonialAnswer {
  question: string;
  /** Verbatim. Never tidied, shortened or paraphrased. */
  answer: string;
}

export interface Testimonial {
  /** How they want to be credited, e.g. "Marthe H." or a full name. */
  author: string;
  /** Optional context line: "IPF Worlds 2025", "coached since 2023". */
  context?: string;
  /**
   * A short standalone quote, in the athlete's own words.
   * Use for testimonials that arrived as a paragraph.
   */
  quote?: string;
  /**
   * Long-form interview answers, verbatim and in order.
   *
   * Exists so a long testimonial does not have to be cut down to a pull quote.
   * Choosing which sentence to feature is an editorial act, and doing it badly
   * puts words in someone's mouth — so where the athlete answered questions,
   * their answers are published as they wrote them.
   */
  answers?: TestimonialAnswer[];
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
    testimonials: [
      // Transcribed verbatim from the Testimonials highlight on @powerfloweu.
      // The rest of that highlight is video, which cannot be transcribed from a
      // still — those need pasting in by hand.
      {
        author: "Leah",
        context: "@leah_fitnuss",
        quote: "It turned out to be one of the best competition experiences I have ever had – because I learned to shift my mindset, accept my fear and still believe I could do it.",
      },
    ],
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
    testimonials: [
      {
        author: "Carole",
        quote: "Clarice has an amazing ability to identify patterns in my thinking, how these inform my behaviours, and how this impacts performance. She strikes exactly the right balance between support and challenge, and asks great questions, which help me reflect on my own strengths (keep doing) and development areas (stop doing, start doing, or change). Adding her expertise to my coaching team has increased self awareness, and contributed massively to my enjoyment of training and to my performance in the gym and on the platform.",
      },
      {
        author: "Aaron",
        answers: [
          {
            question: "What were you struggling with before that made you sign up for the service?",
            answer: "Coming off the back of 2025 nationals I was really struggling both with my enjoyment and confidence in my training. I was really having a hard time showing up as it felt like there was no pay off to all of the hard work I was putting in and it was seriously impacting my intent and desire going into every session. My coach had suggested speaking to a sports psychologist and after seeing that as part of the national team I could enlist the help of Clarice, it felt like a no brainer to give the service a try and see if it could bring my enjoyment of training and competing back to how I felt when I first started powerlifting.",
          },
          {
            question: "As a high level lifter, what was the most beneficial thing you got from the service?",
            answer: "I'd say there were 2 things that I would hold to equal importance, the first being the ability to take my wins in training and actually celebrate them as opposed to instantly disregarding them because I felt like I needed to focus on the next goal/step towards a goal. In doing so, it really helped me to feel some pride in the work I was doing which in turn improved my confidence and helped me to execute better.\n\nThe second thing was being able to take the negatives and process them quickly and effectively so that I wouldn't dwell on them. I feel like I can be quite a perfectionist when it comes to my training so when things weren't 100%, it would seriously mess with me and cause the quality of my session to drop. But now I'm able to take it for what it is and not let one small mishap define an otherwise excellent session/block of training.",
          },
          {
            question: "Is there anything that surprised you about it?",
            answer: "I wasn't entirely a big believer in affirmations but I found that whenever I was really struggling to get into the right headspace prior to a session, particularly as life started to get very messy heading into my peak for worlds, that going through the list provided for me within my check in sheet made a noticeable difference to my performance within those sessions.",
          },
          {
            question: "What tools, if any, will you take going forward into your training?",
            answer: "The affirmations will 100% be staying in the back pocket for the hard sessions going forward, with how theyve already made a difference to my confidence I cant see why I wouldnt dip back into them time and time again.",
          },
          {
            question: "Has this service changed how you handle mishaps in training or comp day?",
            answer: "I'd talked a little bit already about my attitude to training but with regards to comp, even though I had a day I wasnt wholly satisfied with in Lithuania, I've been able to bounce back extremely well and feel incredibly confident heading into nationals this year",
          },
          {
            question: "What was it like actually working with me? Anything in particular stand out about my approach or communication?",
            answer: "It was honestly a great experience working with Clarice, she was super responsive and adaptable to my needs especially when I had my injury in euros prep and had to majorly repivot my training and goals as I dealt with coming back to properly training again.",
          },
        ],
      },
    ],
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
