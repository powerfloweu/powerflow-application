// Dysfunctional Attitude Scale (DAS) — sport psychology adaptation.
// 35 items, 5-point Likert (raw 1–5).
// Value point conversion: raw 1 → +2, 2 → +1, 3 → 0, 4 → -1, 5 → -2  (formula: 3 - raw)
// 7 subscales × 5 items each. Subscale range: -10 to +10.
// Normal: -5 ≤ score ≤ 5. Dysfunctional: outside that range.
// Total range: -70 to +70. Depression-prone flag: totalScore ≥ 18.

export type DasSubscaleKey =
  | "externalApproval"
  | "lovability"
  | "achievement"
  | "perfectionism"
  | "entitlement"
  | "omnipotence"
  | "externalControl";

export type DasBand = "normal" | "dysfunctional";

export type DasSubscaleResult = {
  key: DasSubscaleKey;
  score: number;
  band: DasBand;
  /** Only set for externalControl subscale */
  direction?: "externalControl" | "autonomy";
};

export type DasReport = {
  subscales: DasSubscaleResult[];
  totalScore: number;
  depressionProne: boolean;
};

export type DasItem = {
  id: number;
  en: string;
  hu: string;
  de: string;
};

export const DAS_ITEMS: DasItem[] = [
  { id: 1,  en: "My self-worth depends on what other people think of me.", hu: "Az értékemet az határozza meg, amit mások gondolnak rólam.", de: "Mein Selbstwert hängt davon ab, was andere über mich denken." },
  { id: 2,  en: "Everyone who is important to me must love me.", hu: "Mindenkinek szeretnie kell engem, aki fontos a számomra.", de: "Alle Menschen, die mir wichtig sind, müssen mich lieben." },
  { id: 3,  en: "External factors largely determine what happens to me.", hu: "Elsősorban külső tényezők döntik el, mi történik velem.", de: "Äußere Faktoren bestimmen hauptsächlich, was mit mir passiert." },
  { id: 4,  en: "I deserve special treatment because of who I am.", hu: "Különleges bánásmódot érdemlek azért, ami vagyok.", de: "Ich verdiene besondere Behandlung aufgrund dessen, was ich bin." },
  { id: 5,  en: "I should be able to control everything that affects my performance.", hu: "Mindent kontrollálnom kellene, ami befolyásolja a teljesítményemet.", de: "Ich sollte alles kontrollieren können, was meine Leistung beeinflusst." },
  { id: 6,  en: "I need other people's approval to feel satisfied with myself.", hu: "Mások elismerésére van szükségem ahhoz, hogy elégedett legyek magammal.", de: "Ich brauche die Anerkennung anderer, um mit mir selbst zufrieden zu sein." },
  { id: 7,  en: "To consider myself a worthy person, I must be successful in what matters to me.", hu: "Hogy értékes embernek tartsam magam, sikeresnek kell lennem abban, ami fontos.", de: "Um mich als wertvollen Menschen zu betrachten, muss ich in dem erfolgreich sein, was mir wichtig ist." },
  { id: 8,  en: "Making a mistake is almost as bad as failing completely.", hu: "Hibát véteni majdnem olyan rossz, mint teljesen kudarcot vallani.", de: "Einen Fehler zu machen ist fast genauso schlimm wie vollständig zu scheitern." },
  { id: 9,  en: "If I work hard for something, I deserve to get the results I want.", hu: "Ha megdolgozom érte, megérdemlem, hogy azokat az eredményeket kapjam, amiket szeretnék.", de: "Wenn ich hart dafür arbeite, verdiene ich es, die Ergebnisse zu erzielen, die ich möchte." },
  { id: 10, en: "My fate is mainly determined by factors outside my control.", hu: "A sorsomat főleg a befolyásom körén kívüli tényezők határozzák meg.", de: "Mein Schicksal wird hauptsächlich durch Faktoren bestimmt, die außerhalb meines Einflussbereichs liegen." },
  { id: 11, en: "I can achieve anything I set my mind to if I try hard enough.", hu: "Mindent elérhetek, amit kitűzök magam elé, ha elég keményen dolgozom.", de: "Ich kann alles erreichen, was ich mir vornehme, wenn ich hart genug arbeite." },
  { id: 12, en: "If I fail at something, it means I did not try hard enough.", hu: "Ha kudarcot vallok, az azt jelenti, nem dolgoztam elég keményen.", de: "Wenn ich bei etwas scheitere, bedeutet das, dass ich nicht hart genug versucht habe." },
  { id: 13, en: "I should be able to do everything at the highest level.", hu: "Képesnek kellene lennem arra, hogy mindent a legmagasabb szinten végezzek.", de: "Ich sollte in der Lage sein, alles auf höchstem Niveau zu tun." },
  { id: 14, en: "My value as a person depends on how well I perform.", hu: "Az értékem, mint emberé, attól függ, milyen jól teljesítek.", de: "Mein Wert als Mensch hängt davon ab, wie gut ich leiste." },
  { id: 15, en: "If an important person in my life does not love me, I am worth nothing.", hu: "Ha egy számomra fontos személy nem szeret, semmit sem érek.", de: "Wenn eine für mich wichtige Person mich nicht liebt, bin ich nichts wert." },
  { id: 16, en: "Others should notice and reward my efforts.", hu: "Másoknak észre kellene venniük és jutalmazniuk kellene az erőfeszítéseimet.", de: "Andere sollten meine Bemühungen wahrnehmen und belohnen." },
  { id: 17, en: "If I do not perform perfectly, I have failed.", hu: "Ha nem nyújtok tökéletes teljesítményt, akkor kudarcot vallottam.", de: "Wenn ich keine perfekte Leistung bringe, habe ich versagt." },
  { id: 18, en: "What we achieve in life depends more on luck or circumstances than on our own efforts.", hu: "Amit az életben elérünk, inkább a szerencsén vagy a körülményeken múlik, mint a saját erőfeszítéseinken.", de: "Was wir im Leben erreichen, hängt mehr von Glück oder Umständen ab als von unseren eigenen Bemühungen." },
  { id: 19, en: "I cannot be happy if the people around me do not love or accept me.", hu: "Nem lehetek boldog, ha a körülöttem lévők nem szeretnek vagy nem fogadnak el.", de: "Ich kann nicht glücklich sein, wenn die Menschen um mich herum mich nicht lieben oder akzeptieren." },
  { id: 20, en: "I have the right to expect more from others than most people do.", hu: "Jogom van többet elvárni másoktól, mint egy átlagembernek.", de: "Ich habe das Recht, mehr von anderen zu erwarten als die meisten Menschen." },
  { id: 21, en: "I cannot respect myself if I fail at things that are important to me.", hu: "Nem tudom tisztelni magam, ha kudarcot vallok olyasmiben, ami fontos.", de: "Ich kann mich nicht respektieren, wenn ich bei wichtigen Dingen scheitere." },
  { id: 22, en: "If someone I respect criticises me, I cannot feel good about myself.", hu: "Ha valaki, akit tisztelek, kritizál, nem tudom jól érezni magam a bőrömben.", de: "Wenn mich jemand, den ich respektiere, kritisiert, kann ich mich nicht wohlfühlen." },
  { id: 23, en: "I should be capable of solving any problem I face.", hu: "Képesnek kellene lennem megoldani minden problémát, amivel szembekerülök.", de: "Ich sollte in der Lage sein, jedes Problem zu lösen, dem ich gegenüberstehe." },
  { id: 24, en: "Without recognition from others, my achievements feel meaningless.", hu: "Mások elismerése nélkül az eredményeim értelmetlennek tűnnek.", de: "Ohne die Anerkennung anderer erscheinen meine Leistungen bedeutungslos." },
  { id: 25, en: "No matter what I do, outside circumstances determine whether I succeed.", hu: "Bármit is teszek, a külső körülmények döntik el, hogy sikerülök-e.", de: "Egal was ich tue, äußere Umstände entscheiden, ob ich erfolgreich bin." },
  { id: 26, en: "If I do not receive what I deserve, it is deeply unfair.", hu: "Ha nem kapom meg, amit megérdemlek, mélységesen igazságtalan.", de: "Wenn ich nicht bekomme, was ich verdiene, ist das zutiefst ungerecht." },
  { id: 27, en: "Any weakness or flaw in my work is unacceptable to me.", hu: "Munkámban semmilyen gyengeség vagy hiányosság nem elfogadható számomra.", de: "Jede Schwäche oder jeder Fehler in meiner Arbeit ist für mich inakzeptabel." },
  { id: 28, en: "I am mostly at the mercy of forces beyond my control.", hu: "Nagyobbrészt a befolyásom körén kívüli erők kegyére vagyok bízva.", de: "Ich bin größtenteils dem Wohlwollen von Kräften ausgeliefert, die ich nicht kontrollieren kann." },
  { id: 29, en: "My results are entirely within my control if I work hard enough.", hu: "Az eredményeim teljesen az én irányításom alatt állnak, ha elég keményen dolgozom.", de: "Meine Ergebnisse liegen vollständig in meiner Kontrolle, wenn ich hart genug arbeite." },
  { id: 30, en: "Failing at an important task means I am a failure as a person.", hu: "Ha kudarcot vallok egy fontos feladatban, az azt jelenti, hogy kudarcember vagyok.", de: "Bei einer wichtigen Aufgabe zu scheitern bedeutet, dass ich als Person ein Versager bin." },
  { id: 31, en: "If I cannot do something well, there is no point in doing it at all.", hu: "Ha nem tudok valamit jól csinálni, nem érdemes megpróbálni.", de: "Wenn ich etwas nicht gut kann, lohnt es sich nicht, es überhaupt zu versuchen." },
  { id: 32, en: "My happiness depends on being loved and accepted by others.", hu: "A boldogságom attól függ, hogy mások szeretnek-e és elfogadnak-e.", de: "Mein Glück hängt davon ab, ob andere mich lieben und akzeptieren." },
  { id: 33, en: "I am only truly valuable if I give my absolute best at all times.", hu: "Csak akkor vagyok igazán értékes, ha minden időben a legjobbat hozom ki magamból.", de: "Ich bin nur wirklich wertvoll, wenn ich zu jeder Zeit das Beste aus mir heraushole." },
  { id: 34, en: "Other people's opinion of me is the most important factor in how I feel about myself.", hu: "Mások véleménye a legfontosabb tényező abban, hogyan érzem magam saját magammal kapcsolatban.", de: "Die Meinung anderer über mich ist der wichtigste Faktor dafür, wie ich mich selbst fühle." },
  { id: 35, en: "Being rejected by someone important to me means I am fundamentally unlovable.", hu: "Ha valaki fontos elutasít, az azt jelenti, hogy alapvetően szerethetetlen vagyok.", de: "Von jemandem Wichtigem abgelehnt zu werden bedeutet, dass ich grundlegend ungeliebt bin." },
];

export type DasSubscaleDefinition = {
  key: DasSubscaleKey;
  itemIds: number[];
};

export const DAS_SUBSCALES: DasSubscaleDefinition[] = [
  { key: "externalApproval", itemIds: [1, 6, 22, 24, 34] },
  { key: "lovability",       itemIds: [2, 15, 19, 32, 35] },
  { key: "achievement",      itemIds: [7, 14, 21, 30, 31] },
  { key: "perfectionism",    itemIds: [8, 13, 17, 27, 33] },
  { key: "entitlement",      itemIds: [4, 9, 16, 20, 26] },
  { key: "omnipotence",      itemIds: [5, 11, 12, 23, 29] },
  { key: "externalControl",  itemIds: [3, 10, 18, 25, 28] },
];

export const ANSWER_LABELS: { en: string[]; hu: string[]; de: string[] } = {
  en: ["Completely agree", "Agree", "Neutral", "Disagree", "Completely disagree"],
  hu: ["Teljesen egyetértek", "Inkább egyetértek", "Semleges", "Inkább nem értek egyet", "Egyáltalán nem értek egyet"],
  de: ["Stimme vollständig zu", "Stimme eher zu", "Neutral", "Stimme eher nicht zu", "Stimme überhaupt nicht zu"],
};

function classifyBand(score: number): DasBand {
  return score >= -5 && score <= 5 ? "normal" : "dysfunctional";
}

/**
 * Score a complete set of DAS answers.
 * @param answers Record mapping item id (1–35) to raw response (1–5).
 * @returns Full report with subscale scores, bands, direction, total score, and depression-prone flag.
 */
export function scoreDas(answers: Record<number, 1 | 2 | 3 | 4 | 5>): DasReport {
  const missing: number[] = [];
  for (let i = 1; i <= 35; i++) {
    const v = answers[i];
    if (v === undefined || v < 1 || v > 5) missing.push(i);
  }
  if (missing.length > 0) {
    throw new Error(`Cannot score DAS: ${missing.length} item(s) unanswered (${missing.join(", ")})`);
  }

  let totalScore = 0;

  const subscales: DasSubscaleResult[] = DAS_SUBSCALES.map((sub) => {
    let score = 0;
    for (const itemId of sub.itemIds) {
      score += 3 - answers[itemId]; // raw 1→+2, 2→+1, 3→0, 4→-1, 5→-2
    }
    totalScore += score;

    const result: DasSubscaleResult = {
      key: sub.key,
      score,
      band: classifyBand(score),
    };

    if (sub.key === "externalControl") {
      result.direction = score > 0 ? "externalControl" : "autonomy";
    }

    return result;
  });

  return {
    subscales,
    totalScore,
    depressionProne: totalScore >= 18,
  };
}
