// Deterministic scorer for the ACSI-28 (Athletic Coping Skills Inventory).
// 28 items, 4-point scale (1–4). 7 subscales of 4 items each.
// Reverse-scored items use (5 - raw). Subscale score range: 4–16.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AcsiSubscaleKey =
  | "coping"
  | "peaking"
  | "goalSetting"
  | "concentration"
  | "freedom"
  | "confidence"
  | "coachability";

export type Band = "low" | "average" | "high";

export type AcsiSubscaleResult = {
  key: AcsiSubscaleKey;
  score: number;
  band: Band;
  min: number;
  max: number;
};

export type AcsiReport = {
  subscales: AcsiSubscaleResult[];
  totalScore: number;
};

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export type AcsiItem = {
  id: number;
  en: string;
  hu: string;
  de: string;
  reversed: boolean;
};

const REVERSED_IDS = new Set([3, 7, 10, 12, 19, 23]);

export const ACSI_ITEMS: AcsiItem[] = [
  {
    id: 1,
    en: "I set clear, specific goals for myself each week and commit to them.",
    hu: "Hétről hétre jól meghatározott célokat tűzök ki magam elé, és azokhoz tartom magam.",
    de: "Woche für Woche setze ich mir klar definierte Ziele und halte sie ein.",
    reversed: false,
  },
  {
    id: 2,
    en: "I make the most of my talent and abilities.",
    hu: "Tehetségem és képességeim szerint a legtöbbet hozom ki magamból.",
    de: "Ich mache das Beste aus meinen Talenten und Fähigkeiten.",
    reversed: false,
  },
  {
    id: 3,
    en: "When a coach or manager tells me how to correct a mistake I've made, I tend to take it personally and get upset.",
    hu: "Ha az edző vagy a menedzser megmondja, hogyan javítsam ki a hibámat, hajlamos vagyok azt személyeskedésnek venni, és ideges leszek.",
    de: "Wenn mir ein Trainer oder Manager sagt, wie ich einen Fehler korrigieren kann, neige ich dazu, es persönlich zu nehmen und mich aufzuregen.",
    reversed: true,
  },
  {
    id: 4,
    en: "When I'm playing my sport, I can focus my attention and block out distractions.",
    hu: "Sportolás közben jól tudok koncentrálni, és ki tudom zárni a zavaró ingereket.",
    de: "Ich kann mich gut konzentrieren und ablenkende Reize ausblenden, wenn ich meinen Sport mache.",
    reversed: false,
  },
  {
    id: 5,
    en: "I remain confident and enthusiastic during competition, no matter how slim my chances of winning are.",
    hu: "Verseny közben bizakodó és lelkes maradok, függetlenül attól, hogy mennyire kicsi a nyerési esélyem.",
    de: "Während des Wettbewerbs bleibe ich zuversichtlich und enthusiastisch, egal wie gering meine Gewinnchancen sind.",
    reversed: false,
  },
  {
    id: 6,
    en: "Under pressure, I perform better because I think more clearly.",
    hu: "Tétversenyen jobb a teljesítményem, mert tisztább a fejem.",
    de: "In einer Drucksituation kann ich besser arbeiten, weil ich einen klareren Kopf habe.",
    reversed: false,
  },
  {
    id: 7,
    en: "I don't care how others evaluate my performance.",
    hu: "Hidegen hagy, hogy mások hogyan értékelik a teljesítményemet.",
    de: "Es ist mir egal, wie andere meine Leistung beurteilen.",
    reversed: true,
  },
  {
    id: 8,
    en: "I spend too much time thinking about how to achieve my goals.",
    hu: "Túl sokat töprengek azon, hogy miként érjem el céljaimat.",
    de: "Ich denke zu viel darüber nach, wie ich meine Ziele erreichen kann.",
    reversed: false,
  },
  {
    id: 9,
    en: "I'm confident that I'll perform well in competitions.",
    hu: "Bízom abban, hogy jól fogok szerepelni a versenyen.",
    de: "Ich bin zuversichtlich, dass ich im Wettbewerb gut abschneiden werde.",
    reversed: false,
  },
  {
    id: 10,
    en: "Criticism from a coach or manager is more annoying than helpful.",
    hu: "Az edző vagy a menedzser kritikája inkább idegesít, mint segít.",
    de: "Kritik von einem Trainer oder Manager ist eher lästig als hilfreich.",
    reversed: true,
  },
  {
    id: 11,
    en: "When I'm paying attention to something or listening, I can easily keep out distracting thoughts.",
    hu: "Amikor figyelek valamire vagy hallgatok valamit, könnyen távol tudom tartani a zavaró gondolatokat.",
    de: "Wenn ich einer Sache meine Aufmerksamkeit schenke oder zuhöre, kann ich ablenkende Gedanken leicht fernhalten.",
    reversed: false,
  },
  {
    id: 12,
    en: "Worries about my performance are too much of a burden on my mind.",
    hu: "A teljesítményemmel kapcsolatos aggodalmak túl nagy lelki terhet jelentenek számomra.",
    de: "Die Sorgen um meine Leistung sind eine zu große Last für meinen Geist.",
    reversed: true,
  },
  {
    id: 13,
    en: "I set goals for every practice session.",
    hu: "Minden edzésen célokat tűzök ki magam elé.",
    de: "Ich setze mir für jede Trainingseinheit Ziele.",
    reversed: false,
  },
  {
    id: 14,
    en: "I don't need to be encouraged to train or compete hard — I give 100% on my own.",
    hu: "Nincs szükségem arra, hogy edzésen vagy versenyen kemény munkára biztassanak ahhoz, hogy 100%-ot teljesítsek.",
    de: "Ich muss nicht ermutigt werden, im Training oder im Wettkampf hart zu arbeiten, um 100% Leistung zu bringen.",
    reversed: false,
  },
  {
    id: 15,
    en: "When my coach criticises or shouts at me, I correct my mistake without getting upset.",
    hu: "Ha az edző kritizál vagy kiabál velem, anélkül javítom ki a hibámat, hogy felidegesíteném magam.",
    de: "Wenn mein Trainer mich kritisiert oder anbrüllt, korrigiere ich meinen Fehler, ohne mich aufzuregen.",
    reversed: false,
  },
  {
    id: 16,
    en: "I deal well with unexpected situations that come up in my sport.",
    hu: "Jól oldom meg a sportágamban felmerülő váratlan helyzeteket.",
    de: "Ich kann mit unerwarteten Situationen in meinem Sport gut umgehen.",
    reversed: false,
  },
  {
    id: 17,
    en: "When things are going badly, I try to stay calm and it works.",
    hu: "Ha rosszul állok, igyekszem nyugodt maradni, és ez beválik.",
    de: "Wenn ich mich in einer schlechten Lage befinde, versuche ich, ruhig zu bleiben, und es funktioniert.",
    reversed: false,
  },
  {
    id: 18,
    en: "The bigger the competition stakes, the more I enjoy it.",
    hu: "Minél nagyobb a tét egy versenyen, annál jobban élvezem.",
    de: "Je mehr bei einem Wettbewerb auf dem Spiel steht, desto mehr Spaß macht er mir.",
    reversed: false,
  },
  {
    id: 19,
    en: "During a competition I worry about making mistakes or not succeeding.",
    hu: "Verseny alatt aggódom amiatt, hogy hibát vétek vagy nem leszek sikeres.",
    de: "Während eines Wettbewerbs habe ich Angst, einen Fehler zu machen oder nicht erfolgreich zu sein.",
    reversed: true,
  },
  {
    id: 20,
    en: "I decide well in advance of a competition which tactics I'm going to use.",
    hu: "Jóval a verseny kezdete előtt eldöntöm, hogy milyen taktikát alkalmazok.",
    de: "Ich entscheide lange vor Beginn des Wettbewerbs, welche Taktik ich anwenden werde.",
    reversed: false,
  },
  {
    id: 21,
    en: "When I feel myself getting too tense, I can quickly relax my body and calm myself down.",
    hu: "Amikor úgy érzem, hogy kezdek túlzottan feszültté válni, képes vagyok gyorsan ellazítani testemet, és megnyugtatni magamat.",
    de: "Wenn ich merke, dass ich zu angespannt bin, kann ich meinen Körper schnell entspannen und mich beruhigen.",
    reversed: false,
  },
  {
    id: 22,
    en: "I enjoy the challenges that high-stakes situations bring.",
    hu: "Szeretem a téthelyzetek nyújtotta kihívásokat.",
    de: "Ich mag die Herausforderungen, die ein Wettbewerb mit sich bringt.",
    reversed: false,
  },
  {
    id: 23,
    en: "I think about and imagine what will happen if I fail or make a mistake.",
    hu: "Gondolok arra és elképzelem, hogy mi fog történni, ha kudarcot vallok vagy hibázok.",
    de: "Ich denke darüber nach und stelle mir vor, was passieren wird, wenn ich versage oder einen Fehler mache.",
    reversed: true,
  },
  {
    id: 24,
    en: "Whatever happens, I can keep my emotions under control.",
    hu: "Bárhogyan is mennek a dolgok, uralkodni tudom érzelmeimen.",
    de: "Egal, wie die Dinge laufen, ich kann meine Gefühle kontrollieren.",
    reversed: false,
  },
  {
    id: 25,
    en: "I can easily direct my attention and concentrate on one thing or one person.",
    hu: "Figyelmemet könnyen tudom irányítani, és képes vagyok egyetlen dologra vagy személyre koncentrálni.",
    de: "Ich kann meine Aufmerksamkeit leicht kontrollieren und mich auf eine Sache oder Person konzentrieren.",
    reversed: false,
  },
  {
    id: 26,
    en: "When I fail to reach a goal, it just makes me try harder.",
    hu: "Ha nem sikerül elérnem a kitűzött célt, az csak további próbálkozásokra késztet.",
    de: "Wenn ich mein Ziel nicht erreiche, muss ich mich nur noch mehr anstrengen.",
    reversed: false,
  },
  {
    id: 27,
    en: "I improve my abilities by following the advice and instructions of coaches and managers.",
    hu: "Az edzők és menedzserek tanácsait és utasításait megfogadva fejlesztem képességeimet.",
    de: "Ich entwickle meine Fähigkeiten, indem ich die Ratschläge und Anweisungen von Trainern und Managern befolge.",
    reversed: false,
  },
  {
    id: 28,
    en: "In high-stakes situations I make fewer mistakes because I concentrate better.",
    hu: "Téthelyzetben kevesebb hibát vétek, mert jobban koncentrálok.",
    de: "In einer Wettkampfsituation mache ich weniger Fehler, weil ich mich besser konzentrieren kann.",
    reversed: false,
  },
];

// ---------------------------------------------------------------------------
// Subscales
// ---------------------------------------------------------------------------

export type AcsiSubscaleDefinition = {
  key: AcsiSubscaleKey;
  itemIds: number[];
};

export const ACSI_SUBSCALES: AcsiSubscaleDefinition[] = [
  { key: "coping",        itemIds: [5, 17, 21, 24] },
  { key: "peaking",       itemIds: [6, 18, 22, 28] },
  { key: "goalSetting",   itemIds: [1, 8, 13, 20] },
  { key: "concentration", itemIds: [4, 11, 16, 25] },
  { key: "freedom",       itemIds: [7, 12, 19, 23] },
  { key: "confidence",    itemIds: [2, 9, 14, 26] },
  { key: "coachability",  itemIds: [3, 10, 15, 27] },
];

// ---------------------------------------------------------------------------
// Answer labels (for the test UI)
// ---------------------------------------------------------------------------

export const ANSWER_LABELS: { en: string[]; hu: string[]; de: string[] } = {
  en: ["Almost never", "Sometimes", "Often", "Almost always"],
  hu: ["Szinte soha", "Néha", "Gyakran", "Majdnem mindig"],
  de: ["Fast nie", "Manchmal", "Oft", "Fast immer"],
};

// ---------------------------------------------------------------------------
// Band classification
// ---------------------------------------------------------------------------

function classifyBand(score: number): Band {
  if (score <= 8) return "low";
  if (score <= 12) return "average";
  return "high";
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score a complete set of ACSI-28 answers.
 * @param answers Record mapping item id (1–28) to the raw response (1–4).
 * @returns Full report with subscale scores, bands, and total score.
 */
export function scoreAcsi(answers: Record<number, 1 | 2 | 3 | 4>): AcsiReport {
  const missing: number[] = [];
  for (let i = 1; i <= 28; i++) {
    const v = answers[i];
    if (v === undefined || v < 1 || v > 4) missing.push(i);
  }
  if (missing.length > 0) {
    throw new Error(`Cannot score ACSI: ${missing.length} item(s) unanswered (${missing.join(", ")})`);
  }

  let totalScore = 0;

  const subscales: AcsiSubscaleResult[] = ACSI_SUBSCALES.map((sub) => {
    let score = 0;
    for (const itemId of sub.itemIds) {
      const raw = answers[itemId];
      score += REVERSED_IDS.has(itemId) ? 5 - raw : raw;
    }
    totalScore += score;
    return {
      key: sub.key,
      score,
      band: classifyBand(score),
      min: 4,
      max: 16,
    };
  });

  return { subscales, totalScore };
}
