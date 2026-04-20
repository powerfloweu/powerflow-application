// Deterministic scorer for the CSAI-2 (Competitive State Anxiety Inventory-2).
// 27 items, 4-point scale (1--4). 3 subscales of 9 items each.
// Only one reverse-scored item: Q14 (score = 5 - raw). Subscale score range: 9--36.

import { getBandForSubscale } from "./norms";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CsaiSubscaleKey = "cognitive" | "somatic" | "confidence";

export type Band = "low" | "average" | "high";

export type CsaiSubscaleResult = {
  key: CsaiSubscaleKey;
  score: number;
  band: Band;
  min: number;
  max: number;
};

export type CsaiReport = {
  subscales: CsaiSubscaleResult[];
};

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export type CsaiItem = {
  id: number;
  en: string;
  hu: string;
  de: string;
  reversed: boolean;
};

const REVERSED_IDS = new Set([14]);

export const CSAI_ITEMS: CsaiItem[] = [
  {
    id: 1,
    en: "I am very concerned about this competition",
    hu: "Nagyon foglalkoztat ez a verseny",
    de: "Dieser Wettkampf beschäftigt mich sehr",
    reversed: false,
  },
  {
    id: 2,
    en: "I am nervous",
    hu: "Ideges vagyok",
    de: "Ich bin nervös",
    reversed: false,
  },
  {
    id: 3,
    en: "I feel carefree",
    hu: "Gondtalannak érzem magam",
    de: "Ich fühle mich sorglos",
    reversed: false,
  },
  {
    id: 4,
    en: "I have little self-confidence",
    hu: "Kevés az önbizalmam",
    de: "Mein Selbstvertrauen ist gering",
    reversed: false,
  },
  {
    id: 5,
    en: "I feel restless",
    hu: "Nyugtalannak érzem magam",
    de: "Ich fühle mich unruhig",
    reversed: false,
  },
  {
    id: 6,
    en: "I feel comfortable",
    hu: "Kellemesen érzem magam",
    de: "Ich fühle mich wohl",
    reversed: false,
  },
  {
    id: 7,
    en: "I am worried I will not perform as well as I would like in this competition",
    hu: "Aggódom amiatt, hogy ezen a versenyen nem fogok úgy szerepelni, ahogy szeretnék",
    de: "Ich mache mir Sorgen, dass ich in diesem Wettkampf nicht so gut abschneiden werde, wie ich möchte",
    reversed: false,
  },
  {
    id: 8,
    en: "I feel tense inside",
    hu: "Feszültséget érzek magamban",
    de: "Ich spüre Anspannung in mir",
    reversed: false,
  },
  {
    id: 9,
    en: "I feel confident",
    hu: "Elég önbizalmat érzek magamban",
    de: "Ich fühle mich selbstsicher",
    reversed: false,
  },
  {
    id: 10,
    en: "I am afraid of losing",
    hu: "Félek a vesztéstől",
    de: "Ich habe Angst zu verlieren",
    reversed: false,
  },
  {
    id: 11,
    en: "My stomach feels tight / I have butterflies",
    hu: "Összeszorul / remeg a gyomrom",
    de: "Mein Magen zieht sich zusammen / ich habe Schmetterlinge im Bauch",
    reversed: false,
  },
  {
    id: 12,
    en: "I feel secure",
    hu: "Biztonságban érzem magam",
    de: "Ich fühle mich sicher",
    reversed: false,
  },
  {
    id: 13,
    en: "I am concerned about freezing up under pressure",
    hu: "Arra gondolok, hogy túlzottan izgatott leszek",
    de: "Ich denke daran, dass ich unter Druck einfrieren könnte",
    reversed: false,
  },
  {
    id: 14,
    en: "My body feels relaxed",
    hu: "A testem ellazul",
    de: "Mein Körper fühlt sich entspannt an",
    reversed: true,
  },
  {
    id: 15,
    en: "I am confident I can meet the challenge",
    hu: "Bízom abban, hogy kiállom a próbát",
    de: "Ich bin zuversichtlich, dass ich die Herausforderung meistern kann",
    reversed: false,
  },
  {
    id: 16,
    en: "I am worried I will perform badly",
    hu: "Félek attól, hogy rosszul fogok szerepelni",
    de: "Ich habe Angst, schlecht abzuschneiden",
    reversed: false,
  },
  {
    id: 17,
    en: "My heart is racing",
    hu: "A szokásosnál gyorsabban ver a szívem",
    de: "Mein Herz schlägt schneller als gewöhnlich",
    reversed: false,
  },
  {
    id: 18,
    en: "I am confident I will perform well",
    hu: "Bízom abban, hogy jól fogok szerepelni",
    de: "Ich bin zuversichtlich, dass ich gut abschneiden werde",
    reversed: false,
  },
  {
    id: 19,
    en: "I am concerned about reaching my goal",
    hu: "Arra gondolok, hogy elérem-e a célomat",
    de: "Ich mache mir Sorgen, ob ich mein Ziel erreichen werde",
    reversed: false,
  },
  {
    id: 20,
    en: "I feel a nervous feeling in my stomach",
    hu: "Valami furcsa émelygést érzek a gyomromban",
    de: "Ich spüre ein nervöses Kribbeln in meinem Magen",
    reversed: false,
  },
  {
    id: 21,
    en: "I feel at ease",
    hu: "Nyugalmat érzem magamban",
    de: "Ich fühle mich gelassen",
    reversed: false,
  },
  {
    id: 22,
    en: "I am worried my performance will disappoint others",
    hu: "Félek attól, hogy teljesítményem csalódást okoz másoknak",
    de: "Ich habe Angst, dass meine Leistung andere enttäuscht",
    reversed: false,
  },
  {
    id: 23,
    en: "My hands are sweaty",
    hu: "Nedves a tenyerem / izzad a kezem",
    de: "Meine Hände schwitzen",
    reversed: false,
  },
  {
    id: 24,
    en: "I am confident because I can visualise myself reaching my goal",
    hu: "Bizakodó vagyok, el tudom képzelni, hogy elérem a célomat, nyerni fogok",
    de: "Ich bin zuversichtlich, weil ich mir vorstellen kann, wie ich mein Ziel erreiche",
    reversed: false,
  },
  {
    id: 25,
    en: "I am worried I won't be able to concentrate",
    hu: "Félek attól, hogy nem fogok tudni koncentrálni",
    de: "Ich habe Angst, dass ich mich nicht konzentrieren kann",
    reversed: false,
  },
  {
    id: 26,
    en: "My muscles feel tight",
    hu: "Megfeszülnek az izmaim",
    de: "Meine Muskeln fühlen sich angespannt an",
    reversed: false,
  },
  {
    id: 27,
    en: "I am confident I will perform successfully",
    hu: "Bízom abban, hogy sikeresen szerepelek",
    de: "Ich bin zuversichtlich, dass ich erfolgreich abschneiden werde",
    reversed: false,
  },
];

// ---------------------------------------------------------------------------
// Subscales
// ---------------------------------------------------------------------------

export type CsaiSubscaleDefinition = {
  key: CsaiSubscaleKey;
  itemIds: number[];
};

export const CSAI_SUBSCALES: CsaiSubscaleDefinition[] = [
  { key: "cognitive",   itemIds: [1, 4, 7, 10, 13, 16, 19, 22, 25] },
  { key: "somatic",     itemIds: [2, 5, 8, 11, 14, 17, 20, 23, 26] },
  { key: "confidence",  itemIds: [3, 6, 9, 12, 15, 18, 21, 24, 27] },
];

// ---------------------------------------------------------------------------
// Answer labels (for the test UI)
// ---------------------------------------------------------------------------

export const ANSWER_LABELS: { en: string[]; hu: string[]; de: string[] } = {
  en: ["Not at all", "Somewhat", "Quite a bit", "Very much"],
  hu: ["Egyáltalán nem", "Valamennyire", "Eléggé", "Nagyon / teljesen"],
  de: ["Überhaupt nicht", "Etwas", "Ziemlich", "Sehr / völlig"],
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score a complete set of CSAI-2 answers.
 * @param answers Record mapping item id (1--27) to the raw response (1--4).
 * @returns Full report with subscale scores and bands.
 */
export function scoreCsai(answers: Record<number, 1 | 2 | 3 | 4>): CsaiReport {
  const missing: number[] = [];
  for (let i = 1; i <= 27; i++) {
    const v = answers[i];
    if (v === undefined || v < 1 || v > 4) missing.push(i);
  }
  if (missing.length > 0) {
    throw new Error(
      `Cannot score CSAI-2: ${missing.length} item(s) unanswered (${missing.join(", ")})`
    );
  }

  const subscales: CsaiSubscaleResult[] = CSAI_SUBSCALES.map((sub) => {
    let score = 0;
    for (const itemId of sub.itemIds) {
      const raw = answers[itemId];
      score += REVERSED_IDS.has(itemId) ? 5 - raw : raw;
    }
    return {
      key: sub.key,
      score,
      band: getBandForSubscale(sub.key, score),
      min: 9,
      max: 36,
    };
  });

  return { subscales };
}
