// Narrative interpretations for the ACSI-28 (Athletic Coping Skills Inventory).
// 7 subscales x 3 bands x 3 languages (en, hu, de).
// Tone: direct, practical sport-psychology voice for competitive strength/combat athletes.

import type { AcsiSubscaleKey, Band } from "./scoring";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type LocalizedParagraphs = { en: string[]; hu: string[]; de: string[] };

export type SubscaleInterpretation = {
  name: { en: string; hu: string; de: string };
  definition: { en: string; hu: string; de: string };
  bands: Record<Band, LocalizedParagraphs>;
};

// ---------------------------------------------------------------------------
// General intro
// ---------------------------------------------------------------------------

export const ACSI_INTRO: LocalizedParagraphs = {
  en: [
    "The Athletic Coping Skills Inventory measures seven distinct psychological skills that play a central role in competitive sport performance. These are not fixed traits -- they are learnable capacities that you can strengthen with deliberate practice, just as you train any physical quality. Your profile shows where your mental game is already solid and where targeted work will yield the biggest return.",
    "The seven scales -- Coping with Adversity, Peaking Under Pressure, Goal Setting and Mental Preparation, Concentration, Freedom from Worry, Confidence and Achievement Motivation, and Coachability -- interact with one another. A strong ability to set goals, for example, supports confidence, while freedom from worry makes it easier to concentrate under pressure. Read your results as a system, not as seven isolated numbers.",
    "Higher scores indicate stronger coping resources. Where you score in the low range, the narrative will point to concrete areas for development. Where you score high, it will highlight how to protect and leverage that strength. Be honest with yourself as you read -- self-awareness is the foundation everything else is built on.",
  ],
  hu: [
    "A Sportolói Megküzdési Készségek Kérdőíve hét pszichológiai képességet mér, amelyek központi szerepet játszanak a versenyteljesítményben. Ezek nem veleszületett, megváltoztathatatlan tulajdonságok -- tanulható készségek, amelyeket tudatos gyakorlással fejleszthetsz, pont úgy, ahogyan bármely fizikai képességedet edzenéd. A profilod megmutatja, hol áll már szilárdan a mentális felkészültséged, és hol hozna a legtöbbet a célzott munka.",
    "A hét skála -- Csapásokkal való megküzdés, Csúcsteljesítmény téthelyzetben, Célkitűzés és mentális felkészülés, Koncentráció, Szorongásmentesség, Önbizalom és teljesítménymotiváció, valamint Irányíthatóság -- kölcsönhatásban áll egymással. A jó célkitűzési képesség például erősíti az önbizalmat, a szorongásmentesség pedig megkönnyíti a nyomás alatti koncentrációt. Az eredményeidet rendszerként olvasd, ne hét különálló számként.",
    "A magasabb pontszámok erősebb megküzdési forrásokat jeleznek. Ahol az alacsony sávba esel, a szöveges értékelés konkrét fejlesztendő területekre mutat rá. Ahol magasan pontoznál, ott kiemeli, hogyan védd és hasznosítsd ezt az erősségedet. Légy őszinte magaddal olvasás közben -- az önismeret az az alap, amelyre minden más épül.",
  ],
  de: [
    "Das Athletic Coping Skills Inventory misst sieben psychologische Fähigkeiten, die eine zentrale Rolle in der Wettkampfleistung spielen. Es handelt sich nicht um unveränderliche Eigenschaften -- es sind erlernbare Fähigkeiten, die du durch gezieltes Training stärken kannst, genauso wie du jede physische Eigenschaft trainierst. Dein Profil zeigt, wo dein mentales Spiel bereits stark ist und wo gezielte Arbeit den grössten Nutzen bringt.",
    "Die sieben Skalen -- Umgang mit Widrigkeiten, Höchstleistung unter Druck, Zielsetzung und mentale Vorbereitung, Konzentration, Freiheit von Sorgen, Selbstvertrauen und Leistungsmotivation sowie Coachbarkeit -- wirken zusammen. Eine starke Fähigkeit zur Zielsetzung stärkt beispielsweise das Selbstvertrauen, während Freiheit von Sorgen die Konzentration unter Druck erleichtert. Lies deine Ergebnisse als System, nicht als sieben isolierte Zahlen.",
    "Höhere Werte zeigen stärkere Bewältigungsressourcen an. Wo du im niedrigen Bereich liegst, weist der Text auf konkrete Entwicklungsbereiche hin. Wo du hoch punktest, wird hervorgehoben, wie du diese Stärke schützen und nutzen kannst. Sei ehrlich mit dir selbst beim Lesen -- Selbstkenntnis ist das Fundament, auf dem alles andere aufgebaut wird.",
  ],
};

// ---------------------------------------------------------------------------
// Subscale interpretations
// ---------------------------------------------------------------------------

export const SUBSCALE_INTERPRETATIONS: Record<AcsiSubscaleKey, SubscaleInterpretation> = {
  // =========================================================================
  // COPING WITH ADVERSITY
  // =========================================================================
  coping: {
    name: {
      en: "Coping with Adversity",
      hu: "Csapásokkal való megküzdés",
      de: "Umgang mit Widrigkeiten",
    },
    definition: {
      en: "The ability to stay composed, positive, and energised when things go wrong in training or competition -- bad calls, missed lifts, injuries, poor conditions.",
      hu: "Az a képesség, hogy higgadt, pozitív és energikus maradj, amikor az edzésen vagy a versenyen rosszul mennek a dolgok -- rossz bírói döntések, elrontott emelések, sérülések, kedvezőtlen körülmények.",
      de: "Die Fähigkeit, gelassen, positiv und energiegeladen zu bleiben, wenn im Training oder Wettkampf Dinge schieflaufen -- schlechte Entscheidungen, verfehlte Versuche, Verletzungen, ungünstige Bedingungen.",
    },
    bands: {
      low: {
        en: [
          "When setbacks hit -- a failed attempt, an injury scare, equipment problems -- you tend to lose emotional footing quickly. The frustration takes hold before you can process what happened, and that emotional spiral often costs you more than the original setback did. In a strength sport context, this means one bad lift can derail the remaining attempts because your mind stays stuck on what went wrong rather than resetting for what comes next.",
          "This is not about being mentally weak. It is about not yet having a reliable internal process for regaining composure under pressure. The good news is that this is one of the most trainable mental skills. Start building a personal reset routine: a physical cue (clapping your hands, adjusting your belt), a short breathing pattern, and one clear thought about the next task. Practise it in training so it becomes automatic when it matters.",
          "Pay attention to the stories you tell yourself after a bad moment. If your inner dialogue catastrophises -- \"the whole session is ruined,\" \"I always choke\" -- you are feeding the problem. Replace those narratives with factual assessments: what specifically went wrong, what can I control right now, what is my next action? Building this habit will change how adversity lands on you.",
        ],
        hu: [
          "Amikor visszaesés ér -- elrontott kísérlet, sérülésgyanú, felszerelésprobléma --, hajlamos vagy gyorsan elveszíteni az érzelmi egyensúlyodat. A frusztráció hamarabb eluralkodik, mint hogy feldolgozhatnád, mi történt, és ez az érzelmi spirál gyakran nagyobb kárt okoz, mint maga az eredeti probléma. Erősportban ez azt jelenti, hogy egyetlen rossz emelés képes kisiklatni az összes további kísérletedet, mert a fejed a hibán ragad ahelyett, hogy a következő feladatra állna rá.",
          "Ez nem a mentális gyengeségről szól. Arról van szó, hogy még nincs megbízható belső folyamatod a higgadtság visszaszerzéséhez nyomás alatt. A jó hír az, hogy ez az egyik legjobban fejleszthető mentális készség. Kezdj el kiépíteni egy személyes \"reset\" rutint: egy fizikai jel (tapssal, övcsattal), egy rövid légzésminta és egy tiszta gondolat a következő feladatról. Gyakorold edzésen, hogy automatikussá váljon, amikor igazán számít.",
          "Figyelj arra, milyen történeteket mesélsz magadnak egy rossz pillanat után. Ha a belső párbeszéded katasztrofizál -- \"az egész edzés tönkrement,\" \"mindig befagyok\" --, akkor a problémát táplálod. Cseréld le ezeket tényszerű értékelésekre: konkrétan mi ment rosszul, mit tudok most irányítani, mi a következő lépés? Ennek a szokásnak a kialakítása megváltoztatja, hogyan hat rád a nehézség.",
        ],
        de: [
          "Wenn Rückschläge eintreten -- ein misslungener Versuch, eine Verletzungsgefahr, Ausrüstungsprobleme --, neigst du dazu, schnell das emotionale Gleichgewicht zu verlieren. Die Frustration greift schneller, als du verarbeiten kannst, was passiert ist, und diese emotionale Spirale kostet dich oft mehr als der eigentliche Rückschlag. Im Kraftsport bedeutet das, dass ein schlechter Versuch die restlichen Versuche entgleisen lassen kann, weil dein Kopf bei dem Fehler hängen bleibt, anstatt sich auf die nächste Aufgabe einzustellen.",
          "Das hat nichts mit mentaler Schwäche zu tun. Es bedeutet, dass du noch keinen zuverlässigen inneren Prozess hast, um unter Druck die Fassung wiederzugewinnen. Die gute Nachricht: Dies ist eine der am besten trainierbaren mentalen Fähigkeiten. Baue dir eine persönliche Reset-Routine auf: ein physisches Signal (Klatschen, Gürtel richten), ein kurzes Atemmuster und ein klarer Gedanke an die nächste Aufgabe. Übe das im Training, damit es automatisch wird, wenn es darauf ankommt.",
          "Achte auf die Geschichten, die du dir nach einem schlechten Moment erzählst. Wenn dein innerer Dialog katastrophisiert -- \"die ganze Einheit ist ruiniert,\" \"ich versage immer\" --, fütterst du das Problem. Ersetze diese Narrative durch sachliche Einschätzungen: Was genau ist schiefgelaufen, was kann ich jetzt kontrollieren, was ist meine nächste Aktion? Diese Gewohnheit aufzubauen wird verändern, wie Widrigkeiten auf dich wirken.",
        ],
      },
      average: {
        en: [
          "You handle adversity reasonably well most of the time. You can bounce back from a bad lift or a frustrating training day, though there are moments when the setback hits harder than you would like and your recovery takes longer than it should. You know what a composed response looks like, but you do not always access it consistently.",
          "The distinction between average and high on this scale often comes down to consistency. On your good days, you look like someone who copes brilliantly. On your rough days, you look more like someone who is still learning. The key developmental step is closing that gap -- building a reset process that works even when you are tired, frustrated, or under real competitive pressure.",
          "Identify the specific situations that knock you off balance most reliably -- is it judging decisions, personal errors, equipment issues, or something else? Once you know your triggers, you can prepare targeted responses for each one. Mental rehearsal of these scenarios before competitions will give you a ready-made plan rather than having to invent one on the spot.",
        ],
        hu: [
          "A legtöbbször elfogadhatóan kezeled a nehézségeket. Képes vagy visszapattanni egy rossz emelés vagy egy frusztráló edzésnap után, bár vannak pillanatok, amikor a visszaesés keményebben üt, mint szeretnéd, és a felépülés tovább tart a kelleténél. Tudod, hogyan néz ki a higgadt reakció, de nem mindig tudod következetesen elérni.",
          "Az átlagos és a magas szint közötti különbség ezen a skálán gyakran a következetességen múlik. Jó napjaidon úgy nézel ki, mint aki brilliánsan megküzd. Rossz napjaidon inkább úgy, mint aki még tanul. A kulcsfontosságú fejlődési lépés ennek a résnek a bezárása -- egy olyan reset-folyamat kiépítése, ami akkor is működik, amikor fáradt, frusztrált vagy valódi versenynyomás alatt vagy.",
          "Azonosítsd azokat a konkrét helyzeteket, amelyek a legmegbízhatóbban kibillentenek az egyensúlyodból -- bírói döntések, saját hibák, felszerelésproblémák vagy valami más? Ha ismered a kiváltó okaidat, célzott válaszokat készíthetsz mindegyikre. Ezeknek a forgatókönyveknek a mentális begyakorlása versenyek előtt kész tervet ad ahelyett, hogy a helyszínen kelljen egyet kitalálnod.",
        ],
        de: [
          "Du gehst die meiste Zeit angemessen mit Widrigkeiten um. Du kannst dich von einem schlechten Versuch oder einem frustrierenden Trainingstag erholen, auch wenn es Momente gibt, in denen der Rückschlag härter trifft als gewünscht und die Erholung länger dauert als nötig. Du weisst, wie eine besonnene Reaktion aussieht, aber du kannst sie nicht immer konsequent abrufen.",
          "Der Unterschied zwischen durchschnittlich und hoch auf dieser Skala hängt oft von der Konstanz ab. An guten Tagen siehst du aus wie jemand, der brillant damit umgeht. An schwierigen Tagen eher wie jemand, der noch lernt. Der entscheidende Entwicklungsschritt ist, diese Lücke zu schliessen -- einen Reset-Prozess aufzubauen, der auch funktioniert, wenn du müde, frustriert oder unter echtem Wettkampfdruck stehst.",
          "Identifiziere die spezifischen Situationen, die dich am zuverlässigsten aus dem Gleichgewicht bringen -- sind es Kampfrichterentscheidungen, eigene Fehler, Ausrüstungsprobleme oder etwas anderes? Sobald du deine Auslöser kennst, kannst du gezielte Reaktionen für jeden einzelnen vorbereiten. Mentales Durchspielen dieser Szenarien vor Wettkämpfen gibt dir einen fertigen Plan, anstatt vor Ort einen erfinden zu müssen.",
        ],
      },
      high: {
        en: [
          "You have a genuine ability to stay composed and constructive when things go wrong. Bad lifts, unfavourable conditions, unexpected problems -- you process them quickly, extract what is useful, and move on to the next task without dragging emotional baggage with you. This is a significant competitive advantage, especially in strength sports where competitions unfold over hours and a single emotional dip can cascade through remaining attempts.",
          "Your composure under adversity likely comes from experience, from having faced enough setbacks that you have built an internal library of recovery responses. Protect this skill by continuing to expose yourself to controlled adversity in training -- attempt weights that might not go, train under fatigue, simulate competition conditions that are less than ideal. Comfort erodes coping skills.",
          "Be aware that your composure can sometimes be misread by others as indifference. Teammates or coaches may not realise that your calm exterior reflects disciplined processing, not a lack of caring. Communicate your internal state when it matters -- especially when others around you are struggling, because your steadiness can be a stabilising force for the entire team.",
        ],
        hu: [
          "Valódi képességgel rendelkezel ahhoz, hogy higgadt és konstruktív maradj, amikor rosszul mennek a dolgok. Rossz emelések, kedvezőtlen körülmények, váratlan problémák -- gyorsan feldolgozod őket, kivonod, ami hasznos, és továbblépsz a következő feladatra anélkül, hogy érzelmi terheket cipelnél magaddal. Ez jelentős versenyelőny, különösen az erősportokban, ahol a versenyek órák alatt bontakoznak ki, és egyetlen érzelmi hullámvölgy végiggyűrűzhet a fennmaradó kísérleteken.",
          "A nehézségek alatti higgadtságod valószínűleg a tapasztalatból fakad -- elég visszaesést éltél már meg ahhoz, hogy kiépíts egy belső könyvtárat a helyreállási válaszokból. Védd ezt a készséget azzal, hogy edzésen is kontrollált nehézségeknek teszed ki magad -- próbálj meg súlyokat, amelyek nem biztos, hogy mennek, eddzél fáradtan, szimulálj nem ideális versenyhelyzeteket. A kényelem erodálja a megküzdési készségeket.",
          "Légy tudatában annak, hogy a higgadtságodat mások néha közönyként értelmezhetik. A csapattársak vagy edzők esetleg nem veszik észre, hogy a nyugodt külsőd fegyelmezett feldolgozást tükröz, nem a törődés hiányát. Kommunikáld a belső állapotodat, amikor számít -- különösen, amikor körülötted mások küzdenek, mert a stabilitásod stabilizáló erő lehet az egész csapat számára.",
        ],
        de: [
          "Du hast eine echte Fähigkeit, gelassen und konstruktiv zu bleiben, wenn die Dinge schieflaufen. Schlechte Versuche, ungünstige Bedingungen, unerwartete Probleme -- du verarbeitest sie schnell, ziehst das Nützliche heraus und gehst zur nächsten Aufgabe über, ohne emotionalen Ballast mitzuschleppen. Das ist ein erheblicher Wettkampfvorteil, besonders im Kraftsport, wo Wettkämpfe sich über Stunden erstrecken und ein einziger emotionaler Einbruch die restlichen Versuche durchziehen kann.",
          "Deine Gelassenheit unter Widrigkeiten kommt wahrscheinlich aus Erfahrung -- du hast genug Rückschläge erlebt, um eine innere Bibliothek von Erholungsreaktionen aufgebaut zu haben. Schütze diese Fähigkeit, indem du dich im Training weiterhin kontrollierten Widrigkeiten aussetzt -- versuche Gewichte, die möglicherweise nicht gehen, trainiere unter Ermüdung, simuliere nicht ideale Wettkampfbedingungen. Komfort erodiert Bewältigungsfähigkeiten.",
          "Sei dir bewusst, dass deine Gelassenheit von anderen manchmal als Gleichgültigkeit missverstanden werden kann. Teamkollegen oder Trainer erkennen möglicherweise nicht, dass dein ruhiges Äusseres disziplinierte Verarbeitung widerspiegelt, nicht mangelndes Interesse. Kommuniziere deinen inneren Zustand, wenn es darauf ankommt -- besonders wenn andere um dich herum kämpfen, denn deine Stabilität kann eine stabilisierende Kraft für das gesamte Team sein.",
        ],
      },
    },
  },

  // =========================================================================
  // PEAKING UNDER PRESSURE
  // =========================================================================
  peaking: {
    name: {
      en: "Peaking Under Pressure",
      hu: "Csúcsteljesítmény téthelyzetben",
      de: "Höchstleistung unter Druck",
    },
    definition: {
      en: "The degree to which you experience high-pressure situations as exciting and challenging rather than threatening, and your ability to perform at your best when the stakes are highest.",
      hu: "Az a mérték, amennyire a nagy nyomást jelentő helyzeteket izgalmasnak és kihívásnak éled meg fenyegetés helyett, valamint az a képességed, hogy a legjobbat nyújtsd, amikor a tét a legnagyobb.",
      de: "Das Mass, in dem du Hochdrucksituationen als aufregend und herausfordernd erlebst statt als bedrohlich, und deine Fähigkeit, dein Bestes zu geben, wenn am meisten auf dem Spiel steht.",
    },
    bands: {
      low: {
        en: [
          "High-stakes situations tend to constrict your performance rather than elevate it. When the pressure rises -- competition day, a decisive attempt, an audience -- you are more likely to tighten up, second-guess yourself, or play it safe. The physiological arousal that comes with pressure (elevated heart rate, adrenaline, muscle tension) feels threatening rather than useful, and your body and mind respond accordingly.",
          "This pattern is extremely common among athletes who have not yet learned to reinterpret arousal signals. The pounding heart before a big lift is not a sign that something is wrong -- it is your body preparing to perform. The key intervention is cognitive reappraisal: deliberately relabelling those sensations as excitement and readiness rather than fear. Pair this with pressure simulation in training: lift in front of people, set personal records on camera, create artificial stakes.",
          "Consider how your pre-competition routine either helps or hurts. If you spend the hours before a meet dwelling on what could go wrong, you are priming yourself for a threat response. Replace that with a clear warm-up protocol, task-focused cues, and process goals for each attempt. You do not need to feel calm to perform well -- you need to channel arousal into the task.",
        ],
        hu: [
          "A téthelyzetekben a teljesítményed hajlamos összeszűkülni ahelyett, hogy emelkedne. Amikor nő a nyomás -- versenynap, döntő kísérlet, közönség --, nagyobb valószínűséggel görcsölsz be, kérdőjelezed meg magad, vagy biztonságra játszol. A nyomással járó fiziológiai izgalom (emelkedett pulzus, adrenalin, izomfeszültség) fenyegetőnek tűnik hasznosnak helyett, és a tested és az elméd ennek megfelelően reagál.",
          "Ez a minta rendkívül gyakori azoknál a sportolóknál, akik még nem tanulták meg átértelmezni az izgalmi jeleket. A nagy emelés előtti szívdobogás nem annak a jele, hogy valami baj van -- a tested felkészül a teljesítményre. A kulcsbeavatkozás a kognitív újraértékelés: tudatosan címkézd át ezeket az érzéseket izgalomnak és készenlétnek félelem helyett. Párosítsd ezt nyomásszimulációval az edzésen: emelj emberek előtt, állíts be személyes rekordokat kamera előtt, teremts mesterséges téteket.",
          "Gondold végig, hogyan segít vagy árt a verseny előtti rutinod. Ha a verseny előtti órákat azzal töltöd, hogy azon gondolkodsz, mi romolhat el, fenyegetettségi válaszra hangolod magad. Cseréld le ezt egy világos bemelegítési protokollra, feladat-fókuszú jelzésekre és folyamatcélokra minden egyes kísérlethez. Nem kell nyugodtnak érezned magad ahhoz, hogy jól teljesíts -- az izgalmat kell a feladatba csatornáznod.",
        ],
        de: [
          "In Hochdrucksituationen neigt deine Leistung dazu, sich zu verengen, anstatt sich zu steigern. Wenn der Druck steigt -- Wettkampftag, ein entscheidender Versuch, Publikum --, ist es wahrscheinlicher, dass du verkrampfst, dich selbst in Frage stellst oder auf Nummer sicher gehst. Die physiologische Erregung, die mit Druck einhergeht (erhöhte Herzfrequenz, Adrenalin, Muskelspannung), fühlt sich bedrohlich an statt nützlich, und dein Körper und Geist reagieren entsprechend.",
          "Dieses Muster ist extrem häufig bei Athleten, die noch nicht gelernt haben, Erregungssignale umzudeuten. Das Herzrasen vor einem grossen Versuch ist kein Zeichen, dass etwas falsch läuft -- dein Körper bereitet sich auf Leistung vor. Die entscheidende Intervention ist kognitive Neubewertung: Diese Empfindungen bewusst als Aufregung und Bereitschaft umbenennen statt als Angst. Kombiniere dies mit Drucksimulation im Training: Hebe vor Leuten, stelle persönliche Rekorde vor der Kamera auf, schaffe künstliche Wettkampfbedingungen.",
          "Überlege, ob deine Vorwettkampf-Routine hilft oder schadet. Wenn du die Stunden vor einem Wettkampf damit verbringst, darüber nachzudenken, was schiefgehen könnte, programmierst du dich auf eine Bedrohungsreaktion. Ersetze das durch ein klares Aufwärmprotokoll, aufgabenbezogene Hinweise und Prozessziele für jeden Versuch. Du musst dich nicht ruhig fühlen, um gut zu leisten -- du musst die Erregung in die Aufgabe kanalisieren.",
        ],
      },
      average: {
        en: [
          "You have a mixed relationship with pressure. Some competitions bring out the best in you -- the adrenaline sharpens your focus and you hit performances that surprise even you. Other times the pressure feels heavier than helpful, and you leave knowing you left something on the platform. The inconsistency itself is the signature of this range.",
          "The athletes who move from average to high on this scale typically do two things. First, they develop a repeatable pre-attempt routine that anchors them in the present task regardless of what the scoreboard says. Second, they accumulate positive pressure experiences by deliberately seeking out competitive situations -- mock meets, lifting with an audience, entering competitions slightly above their usual level.",
          "Think about the competitions where you did perform well under pressure and identify what was different. Was it your warm-up? Your mindset going in? The people around you? Understanding what enables your best pressure performances lets you replicate those conditions more deliberately. You have the raw capacity -- the goal now is consistency.",
        ],
        hu: [
          "Vegyes kapcsolatod van a nyomással. Egyes versenyeken a legjobbat hozza ki belőled -- az adrenalin élesíti a fókuszodat, és olyan teljesítményeket hozol, amelyek még téged is meglepnek. Máskor a nyomás nehezebben nehezedik rád, mint amennyire hasznos lenne, és úgy jössz el, hogy tudod, maradt benned. Maga az egyenetlenség a jellemzője ennek a sávnak.",
          "Azok a sportolók, akik átlagosból magasra lépnek ezen a skálán, jellemzően két dolgot csinálnak. Először is kialakítanak egy ismételhető kísérlet-előtti rutint, amely a jelen feladathoz horgonyozza őket, függetlenül attól, mit mutat az eredménytábla. Másodszor, pozitív nyomásélményeket gyűjtenek azáltal, hogy tudatosan keresik a versenyhelyzeteket -- szimulált versenyeket, közönség előtti emelést, a megszokott szintjük feletti versenyeket.",
          "Gondolj azokra a versenyekre, ahol jól teljesítettél nyomás alatt, és azonosítsd, mi volt más. A bemelegítésed? A gondolkodásmódod? A körülötted lévő emberek? Ha megérted, mi teszi lehetővé a legjobb nyomás alatti teljesítményedet, tudatosabban reprodukálhatod ezeket a feltételeket. Megvan a nyers kapacitásod -- a cél most a következetesség.",
        ],
        de: [
          "Du hast ein gemischtes Verhältnis zum Druck. Manche Wettkämpfe bringen das Beste in dir hervor -- das Adrenalin schärft deinen Fokus und du erzielst Leistungen, die selbst dich überraschen. Andere Male fühlt sich der Druck schwerer an als hilfreich, und du gehst mit dem Wissen, dass du etwas auf der Plattform gelassen hast. Die Inkonstanz selbst ist das Kennzeichen dieses Bereichs.",
          "Athleten, die auf dieser Skala von durchschnittlich zu hoch wechseln, tun typischerweise zwei Dinge. Erstens entwickeln sie eine wiederholbare Routine vor dem Versuch, die sie in der aktuellen Aufgabe verankert, unabhängig davon, was die Anzeigetafel sagt. Zweitens sammeln sie positive Druckerfahrungen, indem sie bewusst Wettkampfsituationen suchen -- Probewettkämpfe, Heben vor Publikum, Teilnahme an Wettkämpfen leicht über ihrem üblichen Niveau.",
          "Denke an die Wettkämpfe, bei denen du unter Druck gut abgeschnitten hast, und identifiziere, was anders war. War es dein Aufwärmen? Deine Einstellung? Die Menschen um dich herum? Zu verstehen, was deine besten Leistungen unter Druck ermöglicht, lässt dich diese Bedingungen gezielter replizieren. Du hast die Grundkapazität -- das Ziel ist jetzt Konstanz.",
        ],
      },
      high: {
        en: [
          "Pressure brings out your best. You genuinely enjoy the heightened stakes of competition, and your performance tends to rise when it matters most. The adrenaline and intensity of big moments sharpen your focus rather than clouding it. This is one of the most valuable psychological assets in competitive sport -- many athletes train brilliantly but cannot access that level when it counts.",
          "Your ability to peak under pressure likely means you have learned to interpret arousal as facilitative. Where others feel the pounding heart and see danger, you feel it and see opportunity. Protect this skill by continuing to compete regularly and by not allowing long gaps between high-pressure exposures. Athletes who take extended breaks from competition sometimes find that their comfort with pressure has quietly eroded.",
          "One thing to watch: your enjoyment of pressure situations might lead you to underperform in low-stakes training or early-round attempts where the excitement is not there. Make sure you have strategies for staying engaged and technically sharp even when the environment does not naturally spike your arousal. Process goals and internal standards can substitute for external pressure on those days.",
        ],
        hu: [
          "A nyomás hozza ki belőled a legjobbat. Őszintén élvezed a verseny megnövekedett tétjét, és a teljesítményed hajlamos emelkedni, amikor a legtöbbet számít. A nagy pillanatok adrenalinja és intenzitása élesíti a fókuszodat ahelyett, hogy elhomályosítaná. Ez az egyik legértékesebb pszichológiai erőforrás a versenysportban -- sok sportoló brilliánsan edz, de nem tudja elérni azt a szintet, amikor számít.",
          "A nyomás alatti csúcsteljesítmény képessége valószínűleg azt jelenti, hogy megtanultad az izgalmat segítőnek értelmezni. Ahol mások érzik a dobogó szívet és veszélyt látnak, te érzed és lehetőséget látsz. Védd ezt a készséget azzal, hogy rendszeresen versenyzel, és nem hagysz hosszú szüneteket a nagy nyomású kitettségek között. Azok a sportolók, akik hosszabb szünetet tartanak a versenyezéstől, néha azon kapják magukat, hogy a nyomással való komfortjuk csendben erodálódott.",
          "Egy dolog, amire figyelj: a téthelyzetekben érzett örömöd ahhoz vezethet, hogy alulteljesítesz alacsony tétű edzéseken vagy korai körös kísérleteken, ahol nincs meg az izgalom. Győződj meg róla, hogy vannak stratégiáid arra, hogy elkötelezett és technikailag éles maradj, még ha a környezet nem is hozza természetesen az izgalmi szintedet. Folyamatcélok és belső mércék helyettesíthetik a külső nyomást ezeken a napokon.",
        ],
        de: [
          "Druck bringt dein Bestes zum Vorschein. Du geniesst die erhöhten Einsätze des Wettkampfs wirklich, und deine Leistung neigt dazu zu steigen, wenn es am meisten zählt. Das Adrenalin und die Intensität grosser Momente schärfen deinen Fokus, anstatt ihn zu trüben. Dies ist eine der wertvollsten psychologischen Ressourcen im Wettkampfsport -- viele Athleten trainieren brillant, können dieses Niveau aber nicht abrufen, wenn es zählt.",
          "Deine Fähigkeit, unter Druck Höchstleistungen zu bringen, bedeutet wahrscheinlich, dass du gelernt hast, Erregung als förderlich zu interpretieren. Wo andere das Herzrasen spüren und Gefahr sehen, spürst du es und siehst Gelegenheit. Schütze diese Fähigkeit, indem du regelmässig an Wettkämpfen teilnimmst und keine langen Pausen zwischen Hochdruckexpositionen zulässt. Athleten, die längere Wettkampfpausen einlegen, stellen manchmal fest, dass ihr Wohlbefinden unter Druck still erodiert ist.",
          "Etwas, worauf du achten solltest: Deine Freude an Drucksituationen könnte dazu führen, dass du in Trainingseinheiten mit niedrigem Einsatz oder in frühen Runden unterperformst, wenn die Aufregung fehlt. Stelle sicher, dass du Strategien hast, um engagiert und technisch scharf zu bleiben, auch wenn die Umgebung dein Erregungsniveau nicht natürlich anhebt. Prozessziele und interne Standards können an solchen Tagen den externen Druck ersetzen.",
        ],
      },
    },
  },

  // =========================================================================
  // GOAL SETTING & MENTAL PREPARATION
  // =========================================================================
  goalSetting: {
    name: {
      en: "Goal Setting & Mental Preparation",
      hu: "Célkitűzés és mentális felkészülés",
      de: "Zielsetzung und mentale Vorbereitung",
    },
    definition: {
      en: "The extent to which you set specific performance goals, plan strategies in advance, and mentally prepare for training and competition.",
      hu: "Az a mérték, amennyire konkrét teljesítménycélokat tűzöl ki, előre tervezed a stratégiáidat, és mentálisan felkészülsz az edzésekre és versenyekre.",
      de: "Das Mass, in dem du dir spezifische Leistungsziele setzt, Strategien im Voraus planst und dich mental auf Training und Wettkampf vorbereitest.",
    },
    bands: {
      low: {
        en: [
          "You tend to approach training and competition without clearly defined goals or a deliberate mental preparation plan. You may show up and work hard, but the direction of that effort is not always intentional. In strength sports this often looks like training by feel -- loading whatever seems right on the day, without connecting today's session to a larger trajectory. The result is inconsistent progress and a sense that you are working hard without always knowing what you are working toward.",
          "Goal setting does not need to be complicated. Start with three levels: a long-term target (competition result or strength milestone 6-12 months out), a medium-term process goal (a technical improvement or training volume target for the current block), and a session goal (one specific thing you want to execute well today). Write them down. The act of writing creates commitment and makes the goal concrete rather than vague.",
          "Mental preparation is the other half of this scale. Before a competition or important training session, do you have a plan, or do you figure it out as you go? Decide your attempt selection, warm-up structure, and tactical decisions before you arrive. Walk through them in your mind. Athletes who plan ahead are not just better prepared -- they are calmer, because uncertainty is one of the main drivers of anxiety.",
        ],
        hu: [
          "Hajlamos vagy edzésekhez és versenyekhez világosan meghatározott célok vagy tudatos mentális felkészülési terv nélkül közelíteni. Lehet, hogy megjelensz és keményen dolgozol, de az erőfeszítés iránya nem mindig szándékos. Az erősportban ez gyakran úgy néz ki, mint érzésre edzeni -- annyit pakolsz a rúdra, amennyi azon a napon jónak tűnik, anélkül, hogy a mai edzést egy nagyobb ívhez kötnéd. Az eredmény egyenetlen fejlődés és az az érzés, hogy keményen dolgozol anélkül, hogy mindig tudnád, miért.",
          "A célkitűzésnek nem kell bonyolultnak lennie. Kezdd három szinttel: egy hosszú távú cél (versenyeredmény vagy erőnléti mérföldkő 6-12 hónapra előre), egy középtávú folyamatcél (technikai fejlesztés vagy edzésmennyiségi cél a jelenlegi blokkra), és egy edzéscél (egy konkrét dolog, amit ma jól akarsz végrehajtani). Írd le őket. A leírás aktusa elköteleződést teremt, és a célt konkréttá teszi homályos helyett.",
          "A mentális felkészülés ennek a skálának a másik fele. Verseny vagy fontos edzés előtt van terved, vagy menet közben találod ki? Döntsd el a kísérletválasztásodat, a bemelegítési struktúrádat és a taktikai döntéseidet, mielőtt megérkezel. Járd végig őket a fejedben. Azok a sportolók, akik előre terveznek, nem csak felkészültebbek -- nyugodtabbak is, mert a bizonytalanság a szorongás egyik fő mozgatórugója.",
        ],
        de: [
          "Du neigst dazu, Training und Wettkampf ohne klar definierte Ziele oder einen bewussten mentalen Vorbereitungsplan anzugehen. Du erscheinst vielleicht und arbeitest hart, aber die Richtung dieser Anstrengung ist nicht immer beabsichtigt. Im Kraftsport sieht das oft so aus, als würdest du nach Gefühl trainieren -- du lädst auf, was am Tag richtig erscheint, ohne die heutige Einheit mit einer grösseren Entwicklung zu verbinden. Das Ergebnis ist unbeständiger Fortschritt und das Gefühl, hart zu arbeiten, ohne immer zu wissen, wofür.",
          "Zielsetzung muss nicht kompliziert sein. Beginne mit drei Ebenen: ein langfristiges Ziel (Wettkampfergebnis oder Kraftmeilenstein in 6-12 Monaten), ein mittelfristiges Prozessziel (eine technische Verbesserung oder ein Trainingsvolumenziel für den aktuellen Block) und ein Einheitsziel (eine bestimmte Sache, die du heute gut ausführen willst). Schreibe sie auf. Das Aufschreiben erzeugt Verbindlichkeit und macht das Ziel konkret statt vage.",
          "Mentale Vorbereitung ist die andere Hälfte dieser Skala. Hast du vor einem Wettkampf oder einer wichtigen Trainingseinheit einen Plan, oder findest du es unterwegs heraus? Entscheide deine Versuchswahl, Aufwärmstruktur und taktischen Entscheidungen, bevor du ankommst. Gehe sie in Gedanken durch. Athleten, die vorausplanen, sind nicht nur besser vorbereitet -- sie sind ruhiger, denn Unsicherheit ist einer der Haupttreiber von Angst.",
        ],
      },
      average: {
        en: [
          "You set goals and prepare mentally some of the time, but the practice is not fully consistent. You might plan your competition attempts but neglect to set clear training targets, or you might set outcome goals (\"I want to total X\") without defining the process steps that will get you there. The framework exists in your mind but it is not yet a systematic habit.",
          "The next step for you is to formalise what you already do informally. If you sometimes visualise your lifts before a competition, do it every time and make it structured -- see the setup, feel the weight, hear the commands, complete the lift. If you sometimes set weekly goals, write them down every Sunday and review them every Saturday. Consistency of practice matters more than sophistication.",
          "Consider adding a brief mental preparation block to your pre-training routine. Five minutes spent reviewing your goals for the session, visualising key technical cues, and setting a focus intention will compound over months into significantly sharper performance. The athletes who score high on this scale do not necessarily have more talent -- they have more direction.",
        ],
        hu: [
          "Az idő egy részében tűzöl ki célokat és készülsz fel mentálisan, de a gyakorlat nem teljesen következetes. Lehet, hogy megtervezed a versenykísérleteidet, de elhanyagolod a világos edzéscélok kitűzését, vagy kitűzöl eredménycélokat (\"X összteljesítményt akarok\") anélkül, hogy meghatároznád a folyamatlépéseket, amelyek odavisznek. A keret létezik a fejedben, de még nem rendszeres szokás.",
          "A következő lépés számodra az, hogy formalizáld, amit már informálisan csinálsz. Ha néha vizualizálod az emeléseidet verseny előtt, csináld minden alkalommal és tedd strukturálttá -- lásd a felállást, érezd a súlyt, halld a parancsokat, hajtsd végre az emelést. Ha néha kitűzöl heti célokat, írd le őket minden vasárnap és tekintsd át minden szombaton. A gyakorlat következetessége fontosabb, mint a kifinomultság.",
          "Fontold meg egy rövid mentális felkészülési blokk hozzáadását az edzés előtti rutinodhoz. Öt perc a napos célok áttekintésével, a kulcsfontosságú technikai jelzések vizualizálásával és egy fókuszszándék kitűzésével hónapok alatt összeadódik és jelentősen élesebb teljesítményt eredményez. Azok a sportolók, akik magasan pontoznak ezen a skálán, nem feltétlenül tehetségesebbek -- iránytudatosabbak.",
        ],
        de: [
          "Du setzt dir manchmal Ziele und bereitest dich mental vor, aber die Praxis ist nicht vollständig konsequent. Du planst vielleicht deine Wettkampfversuche, versäumst es aber, klare Trainingsziele zu setzen, oder du setzt Ergebnisziele (\"Ich will ein Total von X\") ohne die Prozessschritte zu definieren, die dich dorthin bringen. Das Grundgerüst existiert in deinem Kopf, aber es ist noch keine systematische Gewohnheit.",
          "Der nächste Schritt für dich ist, das zu formalisieren, was du bereits informell tust. Wenn du manchmal deine Versuche vor einem Wettkampf visualisierst, tue es jedes Mal und mache es strukturiert -- sieh den Aufbau, spüre das Gewicht, höre die Kommandos, führe den Versuch durch. Wenn du manchmal wöchentliche Ziele setzt, schreibe sie jeden Sonntag auf und überprüfe sie jeden Samstag. Konsistenz der Praxis ist wichtiger als Ausgereiftheit.",
          "Erwäge, einen kurzen mentalen Vorbereitungsblock zu deiner Vor-Training-Routine hinzuzufügen. Fünf Minuten, in denen du deine Ziele für die Einheit durchgehst, wichtige technische Hinweise visualisierst und eine Fokusabsicht setzt, summieren sich über Monate zu deutlich schärferer Leistung. Athleten, die auf dieser Skala hoch punkten, haben nicht unbedingt mehr Talent -- sie haben mehr Richtung.",
        ],
      },
      high: {
        en: [
          "You are disciplined about setting goals and preparing mentally for training and competition. You plan your attempts, rehearse strategies, set specific targets for training blocks, and use mental rehearsal as a regular tool. This systematic approach gives you a clear sense of direction and makes your training purposeful rather than haphazard.",
          "Athletes who score high here tend to be organised, planful, and detail-oriented in their approach to sport. You probably keep a training log, review your performances, and adjust your plans based on what you learn. This is a genuine competitive edge -- many athletes train as hard as you do, but fewer train as deliberately.",
          "The one risk with very high goal-setting orientation is rigidity. If you set goals and then circumstances change -- an injury alters your timeline, a competition does not go to plan, your training capacity shifts -- you need to be able to adapt without experiencing it as failure. Goals are tools, not verdicts. Make sure you build flexibility into your planning: set ranges rather than single numbers, have backup plans, and practice adjusting goals without losing motivation.",
        ],
        hu: [
          "Fegyelmezetten tűzöl ki célokat és készülsz fel mentálisan az edzésekre és versenyekre. Megtervezed a kísérleteidet, begyakorlod a stratégiákat, konkrét célokat tűzöl ki edzésblokkokra, és rendszeresen használod a mentális gyakorlást. Ez a rendszeres megközelítés világos iránytudatot ad, és céltudatossá teszi az edzésedet a véletlenszerűség helyett.",
          "Azok a sportolók, akik itt magasan pontoznak, általában szervezettek, tervszerűek és részletorientáltak a sporthoz való hozzáállásukban. Valószínűleg vezetsz edzésnaplót, áttekinted a teljesítményeidet, és a tanultak alapján módosítod a terveidet. Ez valódi versenyelőny -- sok sportoló edz olyan keményen, mint te, de kevesebben edznek ilyen tudatosan.",
          "Az egyetlen kockázat a nagyon magas célkitűzés-orientációval a merevség. Ha kitűzöl célokat, majd megváltoznak a körülmények -- sérülés módosítja az időtervedet, egy verseny nem a terv szerint alakul, az edzéskapacitásod változik --, képesnek kell lenned alkalmazkodni anélkül, hogy kudarcként élnéd meg. A célok eszközök, nem ítéletek. Győződj meg róla, hogy rugalmasságot építesz a tervezésedbe: tűzz ki tartományokat egyetlen szám helyett, legyenek tartalékterveid, és gyakorold a célok módosítását a motiváció elvesztése nélkül.",
        ],
        de: [
          "Du bist diszipliniert beim Setzen von Zielen und bei der mentalen Vorbereitung auf Training und Wettkampf. Du planst deine Versuche, übst Strategien, setzt spezifische Ziele für Trainingsblöcke und nutzt mentales Rehearsal als regelmässiges Werkzeug. Dieser systematische Ansatz gibt dir ein klares Richtungsgefühl und macht dein Training zielgerichtet statt planlos.",
          "Athleten, die hier hoch punkten, sind in der Regel organisiert, planvoll und detailorientiert in ihrem Ansatz zum Sport. Du führst wahrscheinlich ein Trainingstagebuch, überprüfst deine Leistungen und passt deine Pläne basierend auf dem an, was du lernst. Das ist ein echter Wettbewerbsvorteil -- viele Athleten trainieren so hart wie du, aber weniger trainieren so bewusst.",
          "Das einzige Risiko bei sehr hoher Zielsetzungsorientierung ist Starrheit. Wenn du Ziele setzt und sich dann die Umstände ändern -- eine Verletzung ändert deinen Zeitplan, ein Wettkampf läuft nicht nach Plan, deine Trainingskapazität verschiebt sich --, musst du in der Lage sein, dich anzupassen, ohne es als Scheitern zu erleben. Ziele sind Werkzeuge, keine Urteile. Stelle sicher, dass du Flexibilität in deine Planung einbaust: Setze Bereiche statt einzelner Zahlen, habe Alternativpläne und übe, Ziele anzupassen, ohne die Motivation zu verlieren.",
        ],
      },
    },
  },

  // =========================================================================
  // CONCENTRATION
  // =========================================================================
  concentration: {
    name: {
      en: "Concentration",
      hu: "Koncentráció",
      de: "Konzentration",
    },
    definition: {
      en: "The ability to focus attention on the task at hand, block out distractions, and sustain that focus when it matters -- during training, in competition, and while receiving instructions.",
      hu: "Az a képesség, hogy a figyelem a kéz alatt lévő feladatra összpontosuljon, kizárja a zavaró tényezőket, és fenntartsa ezt a fókuszt, amikor számít -- edzésen, versenyen és utasítások fogadásakor.",
      de: "Die Fähigkeit, die Aufmerksamkeit auf die aktuelle Aufgabe zu richten, Ablenkungen auszublenden und diesen Fokus aufrechtzuerhalten, wenn es darauf ankommt -- im Training, im Wettkampf und beim Empfangen von Anweisungen.",
    },
    bands: {
      low: {
        en: [
          "You find it genuinely difficult to maintain focus on a single task for extended periods, especially when there are competing stimuli in the environment. During training you might drift between thoughts, check your phone, get pulled into conversations, or lose track of where you are in your programme. In competition the crowd, other competitors, or your own internal chatter can pull your attention away from the specific technical cues you need to execute well.",
          "Weak concentration is often less about an inability to focus and more about not having trained the skill deliberately. Concentration is a mental muscle. Start small: during your next training session, commit to full presence for one set at a time. No phone, no conversation, no wandering thoughts -- just the setup, the lift, and the execution. After the set, you can relax. Gradually extend these windows of focused work.",
          "External cues can help enormously. Use a specific physical ritual before each attempt (chalk up, belt on, deep breath) as a concentration trigger. When you notice your mind wandering, simply bring it back -- no judgment, no frustration, just a redirect. Over time, the time between wanderings will lengthen. Consider whether your training environment is set up for focus or for socialising, and adjust accordingly.",
        ],
        hu: [
          "Valóban nehéznek találod egyetlen feladatra koncentrálni hosszabb ideig, különösen, amikor versengő ingerek vannak a környezetben. Edzésen gondolatok között sodródhatsz, telefonodat nézed, beszélgetésekbe keveredsz, vagy elveszíted a fonalat a programodban. Versenyen a tömeg, más versenyzők vagy a saját belső csevegésed elvonhatja a figyelmedet azoktól a technikai jelzésektől, amelyekre szükséged van a jó végrehajtáshoz.",
          "A gyenge koncentráció gyakran kevésbé a fókuszálásra való képtelenségről szól, és inkább arról, hogy nem edzettéd tudatosan ezt a készséget. A koncentráció mentális izom. Kezdd kicsiben: a következő edzéseden vállald a teljes jelenlétet egy sorozatra egyszerre. Nincs telefon, nincs beszélgetés, nincsenek kalandozó gondolatok -- csak a felállás, az emelés és a végrehajtás. A sorozat után lazíthatsz. Fokozatosan nyújtsd ki ezeket a fókuszált munka ablakait.",
          "Külső jelzések rengeteget segíthetnek. Használj egy konkrét fizikai rituálét minden kísérlet előtt (magnézia, öv, mély levegő) koncentrációs kiváltóként. Amikor észreveszed, hogy elkalandozik az elméd, egyszerűen hozd vissza -- ítélkezés nélkül, frusztráció nélkül, csak egy átirányítás. Idővel az elkalandozások közötti idő megnyúlik. Fontold meg, hogy az edzéskörnyezeted a fókuszra vagy a társasági életre van-e berendezve, és igazítsd ennek megfelelően.",
        ],
        de: [
          "Du findest es wirklich schwierig, den Fokus über längere Zeiträume auf eine einzelne Aufgabe aufrechtzuerhalten, besonders wenn es konkurrierende Reize in der Umgebung gibt. Im Training driftest du vielleicht zwischen Gedanken, schaust auf dein Handy, wirst in Gespräche hineingezogen oder verlierst den Überblick, wo du in deinem Programm bist. Im Wettkampf können die Zuschauer, andere Teilnehmer oder dein eigenes inneres Geplapper deine Aufmerksamkeit von den spezifischen technischen Hinweisen ablenken, die du für eine gute Ausführung brauchst.",
          "Schwache Konzentration hat oft weniger mit einer Unfähigkeit zu fokussieren zu tun als damit, dass die Fähigkeit nicht bewusst trainiert wurde. Konzentration ist ein mentaler Muskel. Fang klein an: Verpflichte dich in deiner nächsten Trainingseinheit zu voller Präsenz für jeweils einen Satz. Kein Handy, kein Gespräch, keine wandernden Gedanken -- nur der Aufbau, das Heben und die Ausführung. Nach dem Satz kannst du dich entspannen. Erweitere diese Fenster fokussierter Arbeit schrittweise.",
          "Externe Hinweise können enorm helfen. Verwende ein bestimmtes physisches Ritual vor jedem Versuch (Magnesia, Gürtel, tiefer Atemzug) als Konzentrationsauslöser. Wenn du merkst, dass dein Geist wandert, bringe ihn einfach zurück -- ohne Urteil, ohne Frustration, nur eine Umleitung. Mit der Zeit wird die Zeit zwischen den Abschweifungen länger. Überlege, ob deine Trainingsumgebung auf Fokus oder auf Geselligkeit ausgerichtet ist, und passe sie entsprechend an.",
        ],
      },
      average: {
        en: [
          "Your concentration is functional but not exceptional. You can focus when the task demands it -- during a heavy set, during a competition attempt -- but in the spaces between, your attention tends to scatter. You might find it easier to concentrate when the stakes are high but harder during routine training or long warm-ups. This is a normal pattern, but it leaves performance gains on the table.",
          "The most effective improvement at your level is pre-set routines. Create a short, repeatable sequence of actions you perform before every working set (not just competition lifts). This anchors your attention on the present task and creates a psychological boundary between distraction and focus. Over weeks, the routine becomes a focus switch you can flip on demand.",
          "Also consider how you manage the time between sets. If you spend rest periods scrolling your phone or chatting, you are training your brain to fragment attention. Use inter-set time for brief visualisation of the next set, technical cueing, or simply quiet breathing. The quality of your rest periods directly affects the quality of your work sets.",
        ],
        hu: [
          "A koncentrációd funkcionális, de nem kivételes. Képes vagy fókuszálni, amikor a feladat megkívánja -- nehéz sorozat alatt, versenykísérletkor --, de a köztes időkben a figyelmed hajlamos szétszóródni. Lehet, hogy könnyebbnek találod a koncentrálást, amikor nagy a tét, de nehezebbnek a rutinedzésen vagy hosszú bemelegítések során. Ez normális mintázat, de teljesítménynövekedést hagy az asztalon.",
          "A leghatékonyabb fejlesztés a te szinteden a sorozat előtti rutin. Hozz létre egy rövid, ismételhető cselekvéssorozatot, amelyet minden munkasorozat előtt végrehajtasz (nem csak versenyelmeléseknél). Ez a jelenlegi feladathoz horgonyozza a figyelmedet, és pszichológiai határt hoz létre a szórakozás és a fókusz között. Hetek alatt a rutin fókuszkapcsolóvá válik, amelyet igény szerint bekapcsolhatsz.",
          "Azt is fontold meg, hogyan kezeled a sorozatok közötti időt. Ha a pihenőket telefonozással vagy csevegéssel töltöd, arra edzenéd az agyad, hogy szétdarabolja a figyelmet. Használd a sorozatok közötti időt a következő sorozat rövid vizualizálására, technikai jelzésekre vagy egyszerű csendes légzésre. A pihenőid minősége közvetlenül befolyásolja a munkasorozataid minőségét.",
        ],
        de: [
          "Deine Konzentration ist funktional, aber nicht aussergewöhnlich. Du kannst dich fokussieren, wenn die Aufgabe es erfordert -- während eines schweren Satzes, während eines Wettkampfversuchs --, aber in den Zwischenräumen neigt deine Aufmerksamkeit zum Abschweifen. Du findest es vielleicht leichter, dich zu konzentrieren, wenn viel auf dem Spiel steht, aber schwieriger während des Routinetrainings oder langer Aufwärmphasen. Das ist ein normales Muster, aber es lässt Leistungsgewinne auf dem Tisch.",
          "Die effektivste Verbesserung auf deinem Niveau sind Vor-Satz-Routinen. Erstelle eine kurze, wiederholbare Abfolge von Handlungen, die du vor jedem Arbeitssatz ausführst (nicht nur bei Wettkampfversuchen). Dies verankert deine Aufmerksamkeit auf der aktuellen Aufgabe und schafft eine psychologische Grenze zwischen Ablenkung und Fokus. Über Wochen wird die Routine zu einem Fokusschalter, den du auf Abruf umlegen kannst.",
          "Überlege auch, wie du die Zeit zwischen den Sätzen managst. Wenn du Pausen mit Handyscrollen oder Plaudern verbringst, trainierst du dein Gehirn, die Aufmerksamkeit zu fragmentieren. Nutze die Zeit zwischen den Sätzen für kurze Visualisierung des nächsten Satzes, technische Hinweise oder einfach ruhiges Atmen. Die Qualität deiner Ruhepausen beeinflusst direkt die Qualität deiner Arbeitssätze.",
        ],
      },
      high: {
        en: [
          "You have a strong ability to lock in and maintain focus when it counts. Distractions do not easily pull you off task, and you can sustain attention through long training sessions and multi-hour competitions without significant lapses. This is a fundamental athletic skill that underpins everything else -- technical execution, tactical decision-making, and performance under pressure all depend on the ability to direct attention deliberately.",
          "Your concentration strength means you are likely getting more out of each repetition than athletes who train with fragmented attention. Every lift where you are fully present is a chance to refine technique and build movement patterns, while a lift done on autopilot is merely exercise. Continue to protect this advantage by guarding your training environment and being intentional about how you spend inter-set time.",
          "One thing to be mindful of: high concentration can sometimes tip into tunnel vision. Make sure you stay open to relevant external information -- coaching cues, changing conditions, tactical adjustments your coach wants to communicate mid-competition. The ideal is a flexible focus that can widen to take in new information and then narrow again to the task. Practise shifting between broad and narrow attention intentionally.",
        ],
        hu: [
          "Erős képességed van arra, hogy bekapcsolódj és fenntartsd a fókuszt, amikor számít. A zavaró tényezők nem könnyen vonják el a figyelmedet a feladatról, és képes vagy fenntartani a figyelmet hosszú edzéseken és többórás versenyeken jelentős kimaradás nélkül. Ez egy alapvető sportolói készség, amely minden mást alátámaszt -- a technikai végrehajtás, a taktikai döntéshozatal és a nyomás alatti teljesítmény mind a figyelem tudatos irányításának képességétől függ.",
          "A koncentrációs erősséged azt jelenti, hogy valószínűleg többet hozol ki minden ismétlésből, mint azok a sportolók, akik szétszórt figyelemmel edzenek. Minden emelés, amelynél teljesen jelen vagy, esély a technika finomítására és a mozgásminták kiépítésére, míg az autopilótán végzett emelés csupán testgyakorlat. Védd ezt az előnyt továbbra is az edzéskörnyezeted őrzésével és azzal, hogy tudatosan kezeled a sorozatok közötti időt.",
          "Egy dolog, amire figyelj: a magas koncentráció néha alagútlátássá válhat. Győződj meg róla, hogy nyitott maradsz a releváns külső információkra -- edzői jelzések, változó körülmények, taktikai módosítások, amelyeket az edződ a verseny közben akar kommunikálni. Az ideális a rugalmas fókusz, amely kitágulhat az új információ befogadására, majd újra szűkülhet a feladatra. Gyakorold a széles és szűk figyelem közötti szándékos váltást.",
        ],
        de: [
          "Du hast eine starke Fähigkeit, dich einzuklinken und den Fokus aufrechtzuerhalten, wenn es zählt. Ablenkungen ziehen dich nicht leicht von der Aufgabe ab, und du kannst die Aufmerksamkeit durch lange Trainingseinheiten und mehrstündige Wettkämpfe ohne wesentliche Aussetzer aufrechterhalten. Dies ist eine grundlegende athletische Fähigkeit, die alles andere untermauert -- technische Ausführung, taktische Entscheidungsfindung und Leistung unter Druck hängen alle von der Fähigkeit ab, die Aufmerksamkeit bewusst zu lenken.",
          "Deine Konzentrationsstärke bedeutet, dass du wahrscheinlich mehr aus jeder Wiederholung herausholst als Athleten, die mit fragmentierter Aufmerksamkeit trainieren. Jeder Versuch, bei dem du voll präsent bist, ist eine Chance, die Technik zu verfeinern und Bewegungsmuster aufzubauen, während ein Versuch auf Autopilot nur Übung ist. Schütze diesen Vorteil weiterhin, indem du deine Trainingsumgebung behütest und bewusst damit umgehst, wie du die Zeit zwischen den Sätzen verbringst.",
          "Etwas, worauf du achten solltest: Hohe Konzentration kann manchmal in Tunnelblick kippen. Stelle sicher, dass du offen für relevante externe Informationen bleibst -- Coaching-Hinweise, sich ändernde Bedingungen, taktische Anpassungen, die dein Trainer mitten im Wettkampf kommunizieren will. Das Ideal ist ein flexibler Fokus, der sich erweitern kann, um neue Informationen aufzunehmen, und sich dann wieder auf die Aufgabe verengt. Übe bewusst das Wechseln zwischen breiter und enger Aufmerksamkeit.",
        ],
      },
    },
  },

  // =========================================================================
  // FREEDOM FROM WORRY
  // =========================================================================
  freedom: {
    name: {
      en: "Freedom from Worry",
      hu: "Szorongásmentesség",
      de: "Freiheit von Sorgen",
    },
    definition: {
      en: "The degree to which you are free from excessive worry about performing poorly, making mistakes, or being negatively evaluated by others. Higher scores mean less worry, not more.",
      hu: "Az a mérték, amennyire mentes vagy a túlzott aggódástól a gyenge teljesítmény, a hibázás vagy mások negatív értékelése miatt. A magasabb pontszám kevesebb aggódást jelent, nem többet.",
      de: "Das Mass, in dem du frei bist von übermässiger Sorge um schlechte Leistung, Fehler oder negative Bewertung durch andere. Höhere Werte bedeuten weniger Sorge, nicht mehr.",
    },
    bands: {
      low: {
        en: [
          "You carry a significant mental burden of worry around your performance. Before competitions your mind fills with images of what could go wrong -- missed lifts, embarrassing failures, the judgment of coaches and spectators. This worry is not just unpleasant; it actively undermines performance by consuming the attentional resources you need for execution and by creating the very muscle tension and hesitation that lead to the mistakes you fear.",
          "Performance anxiety at this level often has roots in how you define your self-worth. If your identity is tightly fused with your sport results -- if a bad competition makes you feel like a bad person, not just an athlete who had a bad day -- then every competition becomes an existential test rather than a sporting event. Begin to separate who you are from what you lift. You are not your total.",
          "Practical steps: build a pre-competition thought management routine. When a worry thought appears, label it (\"there is the failure thought again\"), acknowledge it without engaging it, and redirect to a task cue (\"focus on the setup\"). This is not positive thinking -- it is attentional control. You are not trying to believe the worry is wrong; you are choosing not to give it your attention. Combined with breathing techniques and progressive muscle relaxation, this can meaningfully reduce the performance impact of worry.",
        ],
        hu: [
          "Jelentős mentális terhet hordozol a teljesítményeddel kapcsolatos aggódásban. Versenyek előtt az elméd megtelik képekkel arról, mi romolhat el -- elrontott emelések, kínos kudarcok, edzők és nézők ítélete. Ez az aggódás nem csak kellemetlen; aktívan aláássa a teljesítményt azáltal, hogy felemészti azokat a figyelmi erőforrásokat, amelyekre a végrehajtáshoz szükséged van, és megteremti azt az izomfeszültséget és habozást, amely éppen azokhoz a hibákhoz vezet, amelyektől félsz.",
          "A teljesítményszorongás ezen a szinten gyakran abban gyökerezik, hogyan határozod meg az önértékelésed. Ha az identitásod szorosan összeforrt a sporteredményeiddel -- ha egy rossz verseny rossz embernek érzeted magad, nem csak egy sportolónak, akinek rossz napja volt --, akkor minden verseny egzisztenciális próbává válik sporteseménnyé helyett. Kezdd el szétválasztani, ki vagy, attól, amit emelsz. Nem vagy egyenlő az összteljesítményeddel.",
          "Gyakorlati lépések: építs ki egy verseny előtti gondolatkezelési rutint. Amikor megjelenik egy aggódó gondolat, címkézd fel (\"itt van megint a kudarc-gondolat\"), ismerd el anélkül, hogy bevonnád, és irányítsd át egy feladat-jelzésre (\"fókusz a felállásra\"). Ez nem pozitív gondolkodás -- ez figyelemkontroll. Nem arról van szó, hogy elhidd, az aggodalom téves; arról döntesz, hogy nem adod neki a figyelmedet. Légzéstechnikákkal és progresszív izomrelaxációval kombinálva ez érdemben csökkentheti az aggódás teljesítményre gyakorolt hatását.",
        ],
        de: [
          "Du trägst eine erhebliche mentale Last der Sorge um deine Leistung. Vor Wettkämpfen füllt sich dein Geist mit Bildern dessen, was schiefgehen könnte -- verfehlte Versuche, peinliche Misserfolge, das Urteil von Trainern und Zuschauern. Diese Sorge ist nicht nur unangenehm; sie untergräbt aktiv die Leistung, indem sie die Aufmerksamkeitsressourcen verbraucht, die du für die Ausführung brauchst, und genau die Muskelspannung und das Zögern erzeugt, die zu den Fehlern führen, die du fürchtest.",
          "Leistungsangst auf diesem Niveau hat oft Wurzeln darin, wie du deinen Selbstwert definierst. Wenn deine Identität eng mit deinen Sportergebnissen verschmolzen ist -- wenn ein schlechter Wettkampf dich als schlechten Menschen fühlen lässt, nicht nur als Athleten, der einen schlechten Tag hatte --, dann wird jeder Wettkampf zu einer existenziellen Prüfung statt zu einem Sportereignis. Beginne damit, wer du bist von dem zu trennen, was du hebst. Du bist nicht dein Total.",
          "Praktische Schritte: Baue eine Vorwettkampf-Gedankenmanagement-Routine auf. Wenn ein Sorgengedanke auftaucht, benenne ihn (\"da ist wieder der Versagensgedanke\"), nimm ihn zur Kenntnis, ohne dich darauf einzulassen, und lenke auf einen Aufgabenhinweis um (\"Fokus auf den Aufbau\"). Das ist kein positives Denken -- es ist Aufmerksamkeitskontrolle. Du versuchst nicht zu glauben, dass die Sorge falsch ist; du entscheidest dich, ihr nicht deine Aufmerksamkeit zu geben. Kombiniert mit Atemtechniken und progressiver Muskelentspannung kann dies die Leistungsauswirkungen der Sorge deutlich reduzieren.",
        ],
      },
      average: {
        en: [
          "You experience some worry around performance, but it does not usually dominate your mental space. Before competitions you might have passing thoughts about things going wrong, but you can generally manage them well enough to perform. The worry is present in the background rather than at the centre of your attention. Still, on your harder days or at more important competitions, the worry volume can turn up enough to interfere.",
          "At this level, the key distinction is between productive concern and unproductive worry. Productive concern drives preparation -- it makes you train harder, plan better, take the competition seriously. Unproductive worry is repetitive rumination that does not lead to action: replaying imagined failures, comparing yourself to others, obsessing over things you cannot control. Learn to recognise which type is active in your mind and disengage from the unproductive kind.",
          "Build a pre-competition mental checklist that you trust. When you have done everything on the list -- prepared your equipment, warmed up properly, reviewed your attempt plan -- give yourself permission to let go of the worry. The thought \"I have done everything I can to be ready\" is a powerful antidote to the nagging feeling that you have forgotten something or are not good enough.",
        ],
        hu: [
          "Tapasztalsz némi aggódást a teljesítménnyel kapcsolatban, de általában nem uralja a mentális teredet. Versenyek előtt lehetnek futó gondolataid arról, hogy rosszul mennek a dolgok, de általában elég jól tudod kezelni őket ahhoz, hogy teljesíts. Az aggódás a háttérben van, nem a figyelem középpontjában. Mégis, nehezebb napjaidon vagy fontosabb versenyeken az aggódás hangja annyira felerősödhet, hogy zavarjon.",
          "Ezen a szinten a kulcsfontosságú különbségtétel a produktív aggodalom és az improduktív aggódás között van. A produktív aggodalom hajtja a felkészülést -- keményebben edz, jobban tervez, komolyan veszi a versenyt. Az improduktív aggódás ismétlődő rágódás, amely nem vezet cselekvéshez: elképzelt kudarcok visszajátszása, másokhoz való hasonlítgatás, olyan dolgokkal való mániákus foglalkozás, amelyeket nem tudsz irányítani. Tanuld meg felismerni, melyik típus aktív az elmédben, és kapcsolódj le az improduktívról.",
          "Építs ki egy verseny előtti mentális ellenőrzőlistát, amelyben megbízol. Ha mindent megtettél a listán -- előkészítetted a felszerelésed, rendesen bemelegítettél, átnézted a kísérlettervedet --, engedd meg magadnak, hogy elengedjed az aggódást. Az a gondolat, hogy \"mindent megtettem, ami tőlem telt a felkészülés érdekében\" erős ellenszere annak a nyaggatő érzésnek, hogy valamit elfelejtettél vagy nem vagy elég jó.",
        ],
        de: [
          "Du erlebst etwas Sorge um deine Leistung, aber sie dominiert normalerweise nicht deinen mentalen Raum. Vor Wettkämpfen hast du vielleicht flüchtige Gedanken darüber, dass Dinge schiefgehen könnten, aber du kannst sie im Allgemeinen gut genug bewältigen, um zu performen. Die Sorge ist eher im Hintergrund als im Zentrum deiner Aufmerksamkeit. An schwierigeren Tagen oder bei wichtigeren Wettkämpfen kann die Sorge jedoch laut genug werden, um zu stören.",
          "Auf diesem Niveau liegt die entscheidende Unterscheidung zwischen produktiver Besorgnis und unproduktiver Sorge. Produktive Besorgnis treibt die Vorbereitung an -- sie lässt dich härter trainieren, besser planen, den Wettkampf ernst nehmen. Unproduktive Sorge ist repetitives Grübeln, das nicht zu Handlung führt: Vorgestellte Misserfolge durchspielen, sich mit anderen vergleichen, über Dinge obsessieren, die du nicht kontrollieren kannst. Lerne zu erkennen, welcher Typ in deinem Kopf aktiv ist, und löse dich vom unproduktiven.",
          "Baue eine Vorwettkampf-Checkliste auf, der du vertraust. Wenn du alles auf der Liste erledigt hast -- Ausrüstung vorbereitet, ordentlich aufgewärmt, Versuchsplan überprüft --, gib dir die Erlaubnis, die Sorge loszulassen. Der Gedanke \"Ich habe alles getan, um bereit zu sein\" ist ein starkes Gegenmittel gegen das nagende Gefühl, etwas vergessen zu haben oder nicht gut genug zu sein.",
        ],
      },
      high: {
        en: [
          "You compete with a remarkably clear mind. Worries about failure, mistakes, or others' opinions do not occupy much of your mental bandwidth before or during competition. You can step onto the platform focused on execution rather than consumed by what might go wrong. This freedom from worry allows you to access your full physical capacity, because anxiety-driven muscle tension and attentional fragmentation are largely absent.",
          "This psychological clarity is a major competitive advantage. While others are spending mental energy managing their fears, you are directing yours toward task execution and tactical decisions. You likely perform close to your training level in competition -- or even above it -- because you do not lose capacity to performance anxiety. Protect this quality by maintaining the habits and perspectives that sustain it.",
          "One nuance: make sure that your freedom from worry comes from genuine confidence and mental skill, not from avoidance or disengagement. An athlete who \"doesn't worry\" because they have stopped caring about results is not in the same position as one who cares deeply but has learned to manage the mental noise. If you find that your lack of worry coincides with a lack of motivation, that is worth examining honestly.",
        ],
        hu: [
          "Figyelemre méltóan tiszta fejjel versenyzel. A kudarcra, a hibázásra vagy mások véleményére vonatkozó aggodalmak nem foglalják el a mentális sávszélességed nagy részét a verseny előtt vagy alatt. Képes vagy a dobogóra lépni a végrehajtásra fókuszálva, ahelyett, hogy az emésztene, mi romolhat el. Ez a szorongásmentesség lehetővé teszi, hogy hozzáférj a teljes fizikai kapacitásodhoz, mert a szorongás által vezérelt izomfeszültség és figyelmi töredezettség nagyrészt hiányzik.",
          "Ez a pszichológiai tisztaság jelentős versenyelőny. Míg mások mentális energiát fordítanak a félelmeik kezelésére, te a tiédet a feladat végrehajtására és taktikai döntésekre irányítod. Valószínűleg közel teljesítesz az edzésszintedhez a versenyen -- vagy akár afölött --, mert nem veszítesz kapacitást a teljesítményszorongás miatt. Védd ezt a minőséget azáltal, hogy fenntartod azokat a szokásokat és nézőpontokat, amelyek fenntartják.",
          "Egy árnyalat: győződj meg róla, hogy a szorongásmentességed valódi önbizalomból és mentális készségből fakad, nem elkerülésből vagy elköteleződéshiányból. Egy sportoló, aki \"nem aggódik\", mert már nem érdeklik az eredmények, nincs ugyanabban a helyzetben, mint az, aki mélyen törődik, de megtanulta kezelni a mentális zajt. Ha azt tapasztalod, hogy az aggódás hiánya a motiváció hiányával esik egybe, azt érdemes őszintén megvizsgálni.",
        ],
        de: [
          "Du trittst mit einem bemerkenswert klaren Kopf an. Sorgen über Versagen, Fehler oder die Meinungen anderer nehmen nicht viel deiner mentalen Bandbreite vor oder während des Wettkampfs ein. Du kannst auf die Plattform treten und dich auf die Ausführung konzentrieren, anstatt davon aufgezehrt zu werden, was schiefgehen könnte. Diese Freiheit von Sorgen ermöglicht dir, deine volle physische Kapazität abzurufen, weil angstbedingte Muskelspannung und Aufmerksamkeitsfragmentierung weitgehend fehlen.",
          "Diese psychologische Klarheit ist ein grosser Wettbewerbsvorteil. Während andere mentale Energie für das Management ihrer Ängste aufwenden, richtest du deine auf Aufgabenausführung und taktische Entscheidungen. Du performst wahrscheinlich nahe an deinem Trainingsniveau im Wettkampf -- oder sogar darüber --, weil du keine Kapazität durch Leistungsangst verlierst. Schütze diese Qualität, indem du die Gewohnheiten und Perspektiven beibehältst, die sie tragen.",
          "Eine Nuance: Stelle sicher, dass deine Freiheit von Sorgen aus echtem Selbstvertrauen und mentaler Kompetenz kommt, nicht aus Vermeidung oder Desengagement. Ein Athlet, der \"sich keine Sorgen macht\", weil er aufgehört hat, sich um Ergebnisse zu kümmern, ist nicht in der gleichen Position wie einer, der sich tief engagiert, aber gelernt hat, den mentalen Lärm zu managen. Wenn du feststellst, dass dein Mangel an Sorge mit einem Mangel an Motivation zusammenfällt, ist das eine ehrliche Untersuchung wert.",
        ],
      },
    },
  },

  // =========================================================================
  // CONFIDENCE & ACHIEVEMENT MOTIVATION
  // =========================================================================
  confidence: {
    name: {
      en: "Confidence & Achievement Motivation",
      hu: "Önbizalom és teljesítménymotiváció",
      de: "Selbstvertrauen und Leistungsmotivation",
    },
    definition: {
      en: "The belief in your own ability to perform well and the inner drive to work hard, improve, and bounce back from setbacks. Confidence is not arrogance -- it is a quiet, evidence-based certainty that you can meet the demands of your sport.",
      hu: "A hit a saját képességedben, hogy jól teljesíts, és a belső késztetés a kemény munkára, a fejlődésre és a visszaesésekből való felépülésre. Az önbizalom nem arrogancia -- csendes, bizonyítékokon alapuló bizonyosság, hogy meg tudsz felelni a sportágad követelményeinek.",
      de: "Der Glaube an die eigene Fähigkeit, gut zu performen, und der innere Antrieb, hart zu arbeiten, sich zu verbessern und sich von Rückschlägen zu erholen. Selbstvertrauen ist keine Arroganz -- es ist eine ruhige, evidenzbasierte Gewissheit, dass du den Anforderungen deines Sports gerecht werden kannst.",
    },
    bands: {
      low: {
        en: [
          "You struggle with self-belief in your sport. Even when your training suggests you are capable of a certain performance, you find it hard to trust that evidence when it counts. You may compare yourself unfavourably to other athletes, downplay your achievements, or attribute your successes to luck rather than ability. This pattern of thinking limits you more than any physical shortcoming could.",
          "Low confidence often creates a self-fulfilling prophecy. You doubt yourself, so you hold back, play it safe, or approach big moments tentatively -- and then the cautious performance confirms the doubt. Breaking this cycle requires deliberately building a case for your own competence. Start a performance log: record every session where you hit a target, every competition where you executed well, every time you showed up and did hard work. Read it before competitions. Your brain needs evidence to build confidence, and you are probably ignoring the evidence that already exists.",
          "Achievement motivation is the other side of this coin. If setbacks make you want to quit rather than try harder, that is worth examining. Ask yourself what you are competing for -- external validation, intrinsic love of the sport, or something else? Athletes with the most durable motivation tend to be driven by the process of improvement itself. Find what makes you genuinely want to get better and anchor your training around that.",
        ],
        hu: [
          "Küzdesz az önbizalommal a sportodban. Még ha az edzésed arra utal is, hogy képes vagy egy bizonyos teljesítményre, nehéznek találod, hogy megbízz ebben a bizonyítékban, amikor számít. Lehet, hogy kedvezőtlenül hasonlítod magad más sportolókhoz, lekicsinyled az eredményeidet, vagy a sikereidet a szerencsének tulajdonítod a képesség helyett. Ez a gondolkodási minta jobban korlátoz, mint bármely fizikai hiányosság.",
          "Az alacsony önbizalom gyakran önbeteljesítő jóslattá válik. Kételkedsz magadban, ezért visszafogod magad, biztonságra játszol, vagy óvatosan közelíted meg a nagy pillanatokat -- és aztán az óvatos teljesítmény megerősíti a kételyt. Ennek a körnek a megtörése megköveteli, hogy tudatosan építs fel egy érvelést a saját kompetenciád mellett. Vezess teljesítménynaplót: jegyezd fel minden edzést, ahol elérted a célt, minden versenyt, ahol jól hajtottál végre, minden alkalmat, amikor megjelentél és kemény munkát végeztél. Olvasd el versenyek előtt. Az agyad bizonyítékra van szüksége az önbizalom építéséhez, és valószínűleg figyelmen kívül hagyod a már meglévő bizonyítékokat.",
          "A teljesítménymotiváció ennek a dolognak a másik oldala. Ha a visszaesések inkább feladásra késztetnek, mint keményebb próbálkozásra, azt érdemes megvizsgálni. Kérdezd meg magadtól, miért versenyzel -- külső elismerésért, a sport belső szeretetéért, vagy valami másért? A legtartósabb motivációval rendelkező sportolókat általában maga a fejlődés folyamata hajtja. Találd meg, mi késztet őszintén arra, hogy jobbá válj, és horgonyozd az edzésedet e köré.",
        ],
        de: [
          "Du hast Schwierigkeiten mit dem Selbstvertrauen in deinem Sport. Selbst wenn dein Training darauf hindeutet, dass du zu einer bestimmten Leistung fähig bist, fällt es dir schwer, diesem Beweis zu vertrauen, wenn es darauf ankommt. Du vergleichst dich möglicherweise ungünstig mit anderen Athleten, spielst deine Erfolge herunter oder schreibst deine Erfolge dem Glück zu statt deiner Fähigkeit. Dieses Denkmuster begrenzt dich mehr als jede körperliche Schwäche es könnte.",
          "Geringes Selbstvertrauen erzeugt oft eine selbsterfüllende Prophezeiung. Du zweifelst an dir, also hältst du dich zurück, gehst auf Nummer sicher oder gehst grosse Momente zögerlich an -- und dann bestätigt die vorsichtige Leistung den Zweifel. Diesen Kreislauf zu durchbrechen erfordert, bewusst einen Fall für die eigene Kompetenz aufzubauen. Beginne ein Leistungsprotokoll: Notiere jede Einheit, in der du ein Ziel erreicht hast, jeden Wettkampf, bei dem du gut ausgeführt hast, jedes Mal, als du aufgetaucht bist und harte Arbeit geleistet hast. Lies es vor Wettkämpfen. Dein Gehirn braucht Beweise, um Selbstvertrauen aufzubauen, und du ignorierst wahrscheinlich die Beweise, die bereits existieren.",
          "Leistungsmotivation ist die andere Seite dieser Medaille. Wenn Rückschläge dich dazu bringen, aufhören zu wollen, statt es härter zu versuchen, ist das eine Untersuchung wert. Frage dich, wofür du antrittst -- externe Anerkennung, intrinsische Liebe zum Sport oder etwas anderes? Athleten mit der dauerhaftesten Motivation werden tendenziell vom Verbesserungsprozess selbst angetrieben. Finde heraus, was dich wirklich besser werden lassen will, und verankere dein Training darum.",
        ],
      },
      average: {
        en: [
          "Your confidence is situational -- strong in some contexts and fragile in others. You believe in yourself when recent results support that belief, but a string of bad sessions or a poor competition can erode it quickly. Your self-belief fluctuates with your recent performance rather than being anchored in a deeper understanding of your overall competence and trajectory.",
          "The path to more stable confidence runs through how you process both success and failure. When you succeed, do you internalise it (\"I earned this through my preparation\") or externalise it (\"I got lucky\")? When you fail, do you see it as information (\"I need more work on X\") or as identity (\"I'm not good enough\")? Adjusting these attribution patterns is one of the most impactful things you can do for your confidence.",
          "Your achievement motivation is present but may need a clearer target. You are willing to work hard, but you work hardest when you can see the connection between today's effort and a meaningful future outcome. Keep your goals visible and revisit them regularly. When motivation dips, reconnect with the original reason you chose this sport -- the version of it that lights you up, not the version that drains you.",
        ],
        hu: [
          "Az önbizalmad helyzetfüggő -- erős bizonyos kontextusokban és törékeny másokban. Hiszel magadban, amikor a közelmúlt eredményei alátámasztják ezt a hitet, de egy sor rossz edzés vagy egy gyenge verseny gyorsan erodálhatja. Az önbizalmad a közelmúltbeli teljesítményeddel ingadozik, ahelyett, hogy az általános kompetenciád és pályád mélyebb megértésében lenne horgonyozva.",
          "A stabilabb önbizalomhoz vezető út azon keresztül vezet, hogyan dolgozod fel a sikert és a kudarcot egyaránt. Amikor sikert érsz el, internalizálod (\"Ezt a felkészülésemmel érdemeltem ki\") vagy externalizálod (\"Szerencsém volt\")? Amikor kudarcot vallasz, információként látod (\"Több munkára van szükségem X-en\") vagy identitásként (\"Nem vagyok elég jó\")? Ezeknek az attribúciós mintáknak a módosítása az egyik leghatásosabb dolog, amit az önbizalmadért tehetsz.",
          "A teljesítménymotivációd jelen van, de lehet, hogy tisztább célpontra van szüksége. Hajlandó vagy keményen dolgozni, de a legkeményebben akkor dolgozol, amikor látod a kapcsolatot a mai erőfeszítés és egy értelmes jövőbeli eredmény között. Tartsd a céljaidat láthatóan és rendszeresen térj vissza hozzájuk. Amikor a motiváció csökken, kapcsolódj újra az eredeti okhoz, amiért ezt a sportot választottad -- ahhoz a változatához, amelyik lángra lobbant, nem ahhoz, amelyik kiszív.",
        ],
        de: [
          "Dein Selbstvertrauen ist situationsabhängig -- stark in manchen Kontexten und fragil in anderen. Du glaubst an dich, wenn aktuelle Ergebnisse diesen Glauben unterstützen, aber eine Serie schlechter Einheiten oder ein schwacher Wettkampf können es schnell erodieren. Dein Selbstvertrauen schwankt mit deiner jüngsten Leistung, anstatt in einem tieferen Verständnis deiner Gesamtkompetenz und Entwicklung verankert zu sein.",
          "Der Weg zu stabilerem Selbstvertrauen führt darüber, wie du sowohl Erfolg als auch Misserfolg verarbeitest. Wenn du Erfolg hast, verinnerlichst du ihn (\"Ich habe das durch meine Vorbereitung verdient\") oder externalisierst du ihn (\"Ich hatte Glück\")? Wenn du scheiterst, siehst du es als Information (\"Ich muss mehr an X arbeiten\") oder als Identität (\"Ich bin nicht gut genug\")? Diese Attributionsmuster anzupassen ist eines der wirkungsvollsten Dinge, die du für dein Selbstvertrauen tun kannst.",
          "Deine Leistungsmotivation ist vorhanden, braucht aber möglicherweise ein klareres Ziel. Du bist bereit, hart zu arbeiten, aber du arbeitest am härtesten, wenn du die Verbindung zwischen der heutigen Anstrengung und einem bedeutungsvollen zukünftigen Ergebnis siehst. Halte deine Ziele sichtbar und überprüfe sie regelmässig. Wenn die Motivation nachlässt, verbinde dich wieder mit dem ursprünglichen Grund, warum du diesen Sport gewählt hast -- mit der Version davon, die dich entflammt, nicht mit der, die dich auslaugt.",
        ],
      },
      high: {
        en: [
          "You have a strong, well-founded belief in your abilities. You trust your preparation, back yourself in competition, and approach challenges with the expectation that you will meet them. This confidence is not blind optimism -- it is built on accumulated evidence from training and competition. You know what you are capable of because you have consistently done the work to prove it.",
          "Your achievement motivation is also strong. Setbacks do not deflate you -- they ignite a response. When you fail to reach a goal, you treat it as a problem to solve rather than a verdict on your worth. This combination of confidence and drive is the engine of sustained improvement. It keeps you in the gym on hard days and pushes you to compete at levels that stretch you.",
          "Guard against overconfidence only in the tactical sense: make sure you are selecting attempts and setting goals based on current evidence, not on how good you felt last month. Confidence should inform your ambition but not override honest assessment. The strongest version of confidence is the kind that can absorb a humbling result and come back with a better plan, rather than the kind that crumbles when reality does not match expectation.",
        ],
        hu: [
          "Erős, megalapozott hited van a képességeidben. Megbízol a felkészülésedben, kiállsz magadért a versenyen, és azzal a várakozással közelíted a kihívásokat, hogy meg fogsz felelni nekik. Ez az önbizalom nem vak optimizmus -- az edzésen és versenyen felhalmozott bizonyítékokra épül. Tudod, mire vagy képes, mert következetesen elvégezted a munkát, hogy bizonyítsd.",
          "A teljesítménymotivációd is erős. A visszaesések nem laposítanak le -- reakciót gyújtanak benned. Amikor nem sikerül elérned egy célt, megoldandó problémaként kezeled, nem az értékedről szóló ítéletként. Az önbizalom és a hajtóerő kombinációja a tartós fejlődés motorja. Ez tart bent az edzőteremben nehéz napokon, és arra késztet, hogy olyan szinteken versenyezz, amelyek nyújtanak téged.",
          "Az túlzott magabiztosság ellen csak taktikai értelemben védekezz: győződj meg róla, hogy a kísérleteidet és céljaidat a jelenlegi bizonyítékok alapján választod, nem aszerint, hogy milyen jól érezted magad múlt hónapban. Az önbizalomnak informálnia kell az ambíciódat, de nem szabad felülírnia az őszinte értékelést. Az önbizalom legerősebb formája az, amelyik képes felszívni egy alázatos eredményt és jobb tervvel visszatérni, nem az, amelyik összeomlik, amikor a valóság nem felel meg az elvárásnak.",
        ],
        de: [
          "Du hast einen starken, fundierten Glauben an deine Fähigkeiten. Du vertraust deiner Vorbereitung, stehst im Wettkampf hinter dir und gehst Herausforderungen mit der Erwartung an, dass du ihnen gewachsen bist. Dieses Selbstvertrauen ist kein blinder Optimismus -- es ist auf gesammelten Beweisen aus Training und Wettkampf aufgebaut. Du weisst, wozu du fähig bist, weil du konsequent die Arbeit geleistet hast, um es zu beweisen.",
          "Deine Leistungsmotivation ist ebenfalls stark. Rückschläge entmutigen dich nicht -- sie entfachen eine Reaktion. Wenn du ein Ziel nicht erreichst, behandelst du es als Problem, das gelöst werden muss, nicht als Urteil über deinen Wert. Diese Kombination aus Selbstvertrauen und Antrieb ist der Motor nachhaltiger Verbesserung. Sie hält dich an schwierigen Tagen im Gym und treibt dich an, auf Niveaus anzutreten, die dich fordern.",
          "Schütze dich vor Überkonfidenz nur im taktischen Sinne: Stelle sicher, dass du Versuche und Ziele basierend auf aktuellen Beweisen wählst, nicht danach, wie gut du dich letzten Monat gefühlt hast. Selbstvertrauen sollte deine Ambitionen informieren, aber nicht die ehrliche Einschätzung überlagern. Die stärkste Form von Selbstvertrauen ist die, die ein demütigendes Ergebnis absorbieren und mit einem besseren Plan zurückkommen kann, nicht die, die zerbricht, wenn die Realität nicht der Erwartung entspricht.",
        ],
      },
    },
  },

  // =========================================================================
  // COACHABILITY
  // =========================================================================
  coachability: {
    name: {
      en: "Coachability",
      hu: "Irányíthatóság",
      de: "Coachbarkeit",
    },
    definition: {
      en: "The willingness to accept and learn from coaching instruction, including criticism, without taking it personally or becoming defensive. It reflects openness to feedback as a tool for improvement.",
      hu: "A hajlandóság az edzői utasítások elfogadására és az azokból való tanulásra, beleértve a kritikát is, anélkül, hogy személyeskedésnek vennéd vagy védekezővé válnál. A visszajelzésre való nyitottságot tükrözi mint a fejlődés eszközét.",
      de: "Die Bereitschaft, Coaching-Anweisungen anzunehmen und daraus zu lernen, einschliesslich Kritik, ohne es persönlich zu nehmen oder defensiv zu werden. Sie spiegelt die Offenheit für Feedback als Werkzeug zur Verbesserung wider.",
    },
    bands: {
      low: {
        en: [
          "You have a difficult relationship with coaching feedback. When a coach corrects you, criticises a performance, or raises their voice, your first reaction tends to be emotional rather than analytical. You may feel attacked, misunderstood, or unfairly singled out, and that emotional reaction prevents you from hearing and applying the technical content of the feedback. Over time this pattern can damage your relationship with your coach and slow your development significantly.",
          "Low coachability is often rooted in how you interpret feedback. If you hear \"your setup is wrong\" as \"you are incompetent,\" the message lands as a personal attack rather than technical guidance. The shift you need to make is to separate the content of the feedback from the perceived judgment. A coach who corrects you is investing in your improvement -- a coach who has given up on you stops bothering.",
          "Start practising a simple feedback protocol: when you receive a correction, pause before responding. Take one breath. Then ask one clarifying question about what to do differently. This creates a gap between the emotional reaction and your response, and it keeps you in a learning posture. Over weeks, this habit will change how coaching lands on you and will open the door to much faster technical improvement.",
        ],
        hu: [
          "Nehéz kapcsolatod van az edzői visszajelzéssel. Amikor egy edző kijavít, kritizálja a teljesítményed vagy felemeli a hangját, az első reakciód általában érzelmi, nem elemző. Támadásnak, félreértésnek vagy igazságtalan kiemelésnekérezheted, és ez az érzelmi reakció megakadályoz abban, hogy meghalldd és alkalmazd a visszajelzés technikai tartalmát. Idővel ez a minta károsíthatja az edződdel való kapcsolatodat és jelentősen lassíthatja a fejlődésedet.",
          "Az alacsony irányíthatóság gyakran abban gyökerezik, hogyan értelmezed a visszajelzést. Ha a \"rossz a felállásod\" üzenetet úgy hallod, hogy \"alkalmatlan vagy,\" az üzenet személyes támadásként hat technikai útmutatás helyett. Az a váltás, amelyet meg kell tenned, az, hogy elválasztod a visszajelzés tartalmát az észlelt ítélettől. Az az edző, aki kijavít, a fejlődésedbe fektet -- az az edző, aki feladta veled, már nem vesződik.",
          "Kezdj el gyakorolni egy egyszerű visszajelzési protokollt: amikor korrekciót kapsz, szünetelj a válaszolás előtt. Végy egy levegőt. Aztán tegyél fel egy tisztázó kérdést arról, mit csinálj másként. Ez rést hoz létre az érzelmi reakció és a válaszod között, és tanulási testtartásban tart. Hetek alatt ez a szokás megváltoztatja, hogyan hat rád az edzői munka, és megnyitja az ajtót a sokkal gyorsabb technikai fejlődés előtt.",
        ],
        de: [
          "Du hast eine schwierige Beziehung zu Coaching-Feedback. Wenn ein Trainer dich korrigiert, eine Leistung kritisiert oder die Stimme erhebt, ist deine erste Reaktion tendenziell emotional statt analytisch. Du fühlst dich möglicherweise angegriffen, missverstanden oder unfair herausgegriffen, und diese emotionale Reaktion hindert dich daran, den technischen Inhalt des Feedbacks zu hören und anzuwenden. Mit der Zeit kann dieses Muster deine Beziehung zu deinem Trainer beschädigen und deine Entwicklung erheblich verlangsamen.",
          "Geringe Coachbarkeit wurzelt oft darin, wie du Feedback interpretierst. Wenn du \"dein Aufbau ist falsch\" als \"du bist inkompetent\" hörst, landet die Nachricht als persönlicher Angriff statt als technische Anleitung. Die Verschiebung, die du machen musst, ist, den Inhalt des Feedbacks von der wahrgenommenen Bewertung zu trennen. Ein Trainer, der dich korrigiert, investiert in deine Verbesserung -- ein Trainer, der dich aufgegeben hat, bemüht sich nicht mehr.",
          "Beginne, ein einfaches Feedback-Protokoll zu üben: Wenn du eine Korrektur erhältst, pausiere, bevor du antwortest. Nimm einen Atemzug. Stelle dann eine klärende Frage darüber, was du anders machen sollst. Das schafft eine Lücke zwischen der emotionalen Reaktion und deiner Antwort und hält dich in einer Lernhaltung. Über Wochen wird diese Gewohnheit verändern, wie Coaching bei dir ankommt, und wird die Tür zu deutlich schnellerer technischer Verbesserung öffnen.",
        ],
      },
      average: {
        en: [
          "You are generally open to coaching, but your receptiveness depends on how the feedback is delivered and when it arrives. When a coach offers calm, constructive guidance, you can receive it well and apply it. When the delivery is harsh, emotionally charged, or comes at a high-stress moment, you are more likely to react defensively before you can process the content. This is a common pattern -- most athletes live in this range.",
          "The developmental opportunity is to build your ability to extract value from feedback regardless of its packaging. Not every coach delivers criticism kindly, and competition environments are inherently stressful. If you can only learn when conditions are ideal, your growth rate is limited by your coach's communication skills rather than by the quality of the information they offer.",
          "Work on developing what sport psychologists call a \"learning self\" -- a part of your identity that is genuinely curious about how to improve, independent of ego. When you notice a defensive reaction rising, try reframing the moment: \"This is information I can use\" rather than \"This person is attacking me.\" The goal is not to suppress the emotional response but to develop a faster pathway from emotional reaction to rational processing.",
        ],
        hu: [
          "Általában nyitott vagy az edzői munkára, de a fogékonyságod függ attól, hogyan és mikor érkezik a visszajelzés. Amikor az edző nyugodt, konstruktív útmutatást ad, jól tudod fogadni és alkalmazni. Amikor a közlés kemény, érzelmileg teli, vagy nagy stressz pillanatában érkezik, nagyobb valószínűséggel reagálsz védekezően, mielőtt feldolgozhatnád a tartalmat. Ez egy gyakori mintázat -- a legtöbb sportoló ebben a sávban él.",
          "A fejlődési lehetőség az, hogy kiépítsd a képességedet, hogy értéket vonj ki a visszajelzésből, függetlenül annak csomagolásától. Nem minden edző közli kedvesen a kritikát, és a versenyhelyzetek eredendően stresszesek. Ha csak ideális körülmények között tudsz tanulni, a fejlődési tempódat az edződ kommunikációs készségei korlátozzák, nem az általa kínált információ minősége.",
          "Dolgozz azon, amit a sportpszichológusok \"tanuló énnek\" hívnak -- az identitásod egy része, amely őszintén kíváncsi arra, hogyan fejlődjön, az egótól függetlenül. Amikor észreveszel egy védekezési reakciót emelkedni, próbáld átkeretezni a pillanatot: \"Ez információ, amit felhasználhatok\" ahelyett, hogy \"Ez az ember engem támad.\" A cél nem az érzelmi válasz elfojtása, hanem egy gyorsabb útvonal kialakítása az érzelmi reakciótól a racionális feldolgozásig.",
        ],
        de: [
          "Du bist grundsätzlich offen für Coaching, aber deine Empfänglichkeit hängt davon ab, wie das Feedback gegeben wird und wann es kommt. Wenn ein Trainer ruhige, konstruktive Anleitung bietet, kannst du es gut aufnehmen und anwenden. Wenn die Übermittlung hart, emotional aufgeladen oder in einem stressigen Moment kommt, reagierst du eher defensiv, bevor du den Inhalt verarbeiten kannst. Das ist ein häufiges Muster -- die meisten Athleten leben in diesem Bereich.",
          "Die Entwicklungsmöglichkeit besteht darin, deine Fähigkeit auszubauen, aus Feedback unabhängig von seiner Verpackung Wert zu ziehen. Nicht jeder Trainer gibt Kritik freundlich, und Wettkampfumgebungen sind von Natur aus stressig. Wenn du nur unter idealen Bedingungen lernen kannst, wird deine Wachstumsrate durch die Kommunikationsfähigkeiten deines Trainers begrenzt, nicht durch die Qualität der Informationen, die er anbietet.",
          "Arbeite daran, das zu entwickeln, was Sportpsychologen ein \"Lern-Selbst\" nennen -- einen Teil deiner Identität, der wirklich neugierig darauf ist, wie man sich verbessert, unabhängig vom Ego. Wenn du merkst, dass eine defensive Reaktion aufsteigt, versuche den Moment umzurahmen: \"Das sind Informationen, die ich nutzen kann\" statt \"Diese Person greift mich an.\" Das Ziel ist nicht, die emotionale Reaktion zu unterdrücken, sondern einen schnelleren Weg von der emotionalen Reaktion zur rationalen Verarbeitung zu entwickeln.",
        ],
      },
      high: {
        en: [
          "You are highly receptive to coaching. You can take criticism -- even bluntly delivered -- and convert it into technical improvement without getting derailed by ego or emotion. When a coach corrects you, your default response is to listen, process, and adjust, not to defend or explain. This is one of the strongest predictors of long-term athletic development, because it means you can learn at the maximum rate your coaching environment offers.",
          "Your openness to feedback accelerates improvement in a compounding way. Each correction you absorb and apply makes the next correction more effective, because you are building on a foundation of accumulated adjustments. Athletes who resist coaching miss many of these micro-improvements and plateau earlier. You are unlikely to plateau for this reason alone.",
          "The one thing to watch is that high coachability should be paired with critical thinking. Being coachable does not mean accepting every piece of advice uncritically -- it means being open to input, evaluating it honestly, and applying what serves your development. If you find yourself blindly following every instruction without understanding why, develop the habit of asking your coach to explain the reasoning. The best coach-athlete relationships are collaborative, not purely directive.",
        ],
        hu: [
          "Rendkívül fogékony vagy az edzői munkára. Képes vagy fogadni a kritikát -- még a nyers formában közöltet is -- és technikai fejlődéssé alakítani anélkül, hogy az ego vagy az érzelmek kisiklassanak. Amikor az edző kijavít, az alapválaszod a hallgatás, feldolgozás és alkalmazkodás, nem a védekezés vagy magyarázkodás. Ez a hosszú távú sportolói fejlődés egyik legerősebb előrejelzője, mert azt jelenti, hogy a maximális sebességgel tudsz tanulni, amit az edzéskörnyezeted kínál.",
          "A visszajelzésre való nyitottságod kamatoskamat-szerűen gyorsítja a fejlődést. Minden felszívott és alkalmazott korrekció hatékonyabbá teszi a következőt, mert egy felhalmozott módosítások alapjára építesz. Azok a sportolók, akik ellenállnak az edzői munkának, sok ilyen mikrofejlesztést elmulasztanak és korábban platóznak. Neked nem valószínű, hogy emiatt platóznál.",
          "Az egyetlen dolog, amire figyelj, az, hogy a magas irányíthatóságot kritikus gondolkodással kell párosítani. Az irányíthatóság nem jelenti minden tanács kritikátlan elfogadását -- azt jelenti, hogy nyitott vagy az inputra, őszintén értékeled, és alkalmazod, ami a fejlődésedet szolgálja. Ha azon kapod magad, hogy vakon követsz minden utasítást anélkül, hogy megértenéd, miért, alakítsd ki azt a szokást, hogy megkéred az edződet, magyarázza el az érvelést. A legjobb edző-sportoló kapcsolatok együttműködőek, nem pusztán irányítóak.",
        ],
        de: [
          "Du bist sehr empfänglich für Coaching. Du kannst Kritik entgegennehmen -- selbst direkt vorgetragene -- und sie in technische Verbesserung umwandeln, ohne vom Ego oder Emotionen entgleist zu werden. Wenn ein Trainer dich korrigiert, ist deine Standardreaktion zuzuhören, zu verarbeiten und anzupassen, nicht zu verteidigen oder zu erklären. Dies ist einer der stärksten Prädiktoren für langfristige sportliche Entwicklung, denn es bedeutet, dass du mit der maximalen Rate lernen kannst, die deine Trainingsumgebung bietet.",
          "Deine Offenheit für Feedback beschleunigt die Verbesserung auf eine kumulative Weise. Jede Korrektur, die du aufnimmst und anwendest, macht die nächste effektiver, weil du auf einem Fundament angesammelter Anpassungen aufbaust. Athleten, die sich gegen Coaching wehren, verpassen viele dieser Mikroverbesserungen und erreichen früher ein Plateau. Du wirst allein aus diesem Grund wahrscheinlich kein Plateau erreichen.",
          "Das Einzige, worauf du achten solltest, ist, dass hohe Coachbarkeit mit kritischem Denken gepaart sein sollte. Coachbar zu sein bedeutet nicht, jeden Ratschlag unkritisch anzunehmen -- es bedeutet, offen für Input zu sein, ihn ehrlich zu bewerten und das anzuwenden, was deiner Entwicklung dient. Wenn du feststellst, dass du blind jeder Anweisung folgst, ohne zu verstehen warum, entwickle die Gewohnheit, deinen Trainer zu bitten, die Begründung zu erklären. Die besten Trainer-Athleten-Beziehungen sind kooperativ, nicht rein direktiv.",
        ],
      },
    },
  },
};
