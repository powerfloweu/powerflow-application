// Narrative interpretations per factor per band.
// Sources:
//   English — SAT_Eng_Script.docx (PowerFlow)
//   Hungarian definitions — ÖIT_GOLD_sablon.docx (PowerFlow)
//   Hungarian band narratives — ÖIT_GOLD_faktorok.docx (PowerFlow)
// All text is authored by David Sipos; copy edits here must preserve meaning.

import type { FactorName } from "./items";
import type { Band } from "./norms";

export type Locale = "en" | "hu" | "de";

export type LocalizedText = Partial<Record<Locale, string>> & { en: string };
export type LocalizedParagraphs = Partial<Record<Locale, string[]>> & { en: string[] };

export type FactorInterpretation = {
  definition: LocalizedText;
  bands: Record<Band, LocalizedParagraphs>;
};

export const INTRO: LocalizedParagraphs = {
  en: [
    "In creating the Self-Awareness Test, I examine eleven basic motivations and drives. It is the interplay of these factors that makes up people's personalities.",
    "There may be situations where several conflicting, non-cooperative motivations are active at the same time. This leads to ill-considered decisions and unspoken conflicts. My aim is to explore these conflicts with you — to communicate the areas that need attention. There is always room for personal development; with the right self-awareness, you can thrive in situations that have been difficult for you before.",
    "Take the time to reflect on your results — the work you put in always pays off.",
  ],
  hu: [
    "Az Önismereti teszt megalkotásakor tizenegy alapvető motivációt, késztetést vizsgálok. Ezeknek az összjátéka alkotja az emberek személyiségét.",
    "Előfordulhatnak olyan helyzetek, amikor egyszerre több, egymásnak ellentmondó, nem kooperatív motiváció aktív. Ez nem megfontolt döntésekhez, kimondatlan ellentétekhez vezet. Célom az, hogy ezeket az ellentéteket együtt feltárjuk, a fejlesztendő területeket kommunikáljam feléd. A személyiség fejlesztésére mindig van lehetőség. Kellő önismerettel azokban a helyzetekben is jól tudsz majd érvényesülni, amelyek eddig nehézséget okoztak. A belső összhangod másokra is inspirálóan hathat, így a környezetedre is jó hatással lehetsz.",
    "Szánj időt önmagad megismerésére, hiszen a magadba fektetett munka mindig megtérül!",
  ],
};

export const FACTORS: Record<FactorName, FactorInterpretation> = {
  Performance: {
    definition: {
      en: "The need for achievement — the inner drive to create, to compete, to prove our abilities to ourselves and others. Performance is the constant testing of our own capabilities and the motivation to achieve better results.",
      hu: "A teljesítményigény annak a belső hajtóereje, hogy valamit létrehozzunk, alkossunk, teremtsünk. Ide tartozik a versenyszellem, sikerorientáltság, hogy magunknak és másoknak megmutassuk és bizonyítsuk képességeinket. A teljesítmény a saját képességeink folyamatos próbára tétele és annak a motivációja, hogy minél jobb eredményeket érjünk el.",
    },
    bands: {
      low: {
        en: [
          "You don't go to extremes at work; you perform to the level that is necessary. You don't aspire to great things, it isn't particularly important for you to excel, and you don't like to compete.",
          "Being accepted as a human being matters more to you than becoming a workaholic. Family and relationships are your priority. You work best in a warm environment and prefer to execute tasks rather than invent them.",
          "You like to separate work and personal life. You don't tolerate overtime well, and you know how important personal time is. Reflect on what you've achieved so far and whether your current actions line up with your goals.",
          "You'll show up to a certain level, but without appreciation you can become demotivated. Work isn't the only thing in your life, and you don't like to feel that it is.",
        ],
        hu: [
          "Neked sokkal fontosabb, hogy emberként fogadjanak el, mintsem az, hogy munkamániássá válj. A család, kapcsolatok prioritást élvez nálad, egy \"hideg\" vagy ellenséges munkakörnyezetben képtelen vagy hatékonyan dolgozni. Inkább szereted a feladatokat végrehajtani és nem kitalálni őket.",
          "Szereted különválasztani a munkát és a magánéletet, nem tűröd jól a túlórát. Pontosan tudod, hogy milyen fontos a magadra szánt idő, érdemes átgondolnod azt, hogy mit értél el eddig az életben, és hogy a mostani cselekedeteid összhangban vannak-e a céljaiddal.",
        ],
      },
      average: {
        en: [
          "Being appreciated for what you do is important to you — and intrinsic motivation matters. You like to work, but you need to love what you do. You need feedback and specific goals. Work is a necessity and sometimes a source of meaning, but sometimes you'd rather do something else entirely.",
          "When the workload gets too heavy you don't cope well, but you still try to give your best to the tasks you're given.",
          "It is your responsibility to find a vocation in which you can fulfil yourself.",
          "You start new tasks with enthusiasm and are motivated by opportunities to develop, advance or create. Accept that there will be a bumpy road to success — learn to enjoy the hard parts of the journey.",
        ],
        hu: [
          "Nagyon fontos számodra, hogy elismerjék, amit csinálsz és belsőleg motivált légy. Szeretsz dolgozni, de fontos hogy szeresd is, amit csinálsz. Szükséged van a visszajelzésre és a konkrét célok kijelölésére. A munka számodra egy szükséges dolog, amiben néha meg tudod találni a sikerélményt, de néha egész mással foglalkozol inkább.",
          "Ha úgy érzed, hogy túl nagy a terhelés azt nem viseled jól, ennek ellenére megpróbálod maximális erőbedobással végezni a rád bízott feladatokat. Számodra nem a munka az egyetlen dolog az életedben és nem szereted azt érezni, hogy ez így van.",
          "Van egyfajta belső motivációd a teljesítésre, amely erősebb az átlagosnál. Szereted, ha kihívások elé állítanak, főleg ha ezzel másokat is lelkesíteni tudsz. Feladataidat próbálod maximális erőbedobással végezni. Képes vagy némi plusz áldozatra a munka terén, de nem mész el a végletekig ebben. Tudod, hogy a saját magadra szánt idő is lényeges ahhoz, hogy hatékonyan tudj dolgozni.",
          "Nem félsz a munkától, szereted a kihívásokat, de a túl nagy felelősséget és terhelést nem tűröd jól, feszültséggel jár számodra, főleg ha nem érted meg teljességgel, hogy mit miért kell csinálnod. Jó a teherbíró képességed is, de a túl magas emocionális stressz-szint hamar kiégéshez vezethet, figyelj rá, hogy találj olyan tevékenységeket, amelyekkel hatékonyan le tudod vezetni az esetleges feszültségeket.",
        ],
      },
      high: {
        en: [
          "Work and productivity are especially valuable to you. You like challenges, competition and entrepreneurship. Your intrinsic motivation to achieve is stronger than average.",
          "You have good resilience, but a high level of emotional stress can quickly lead to burnout. Find activities that release tension effectively. Finding work-life balance is your challenge — it's up to you to decide which takes priority.",
          "You can stir incredible energy in yourself when motivated, give maximum effort under pressure, and experience success as a person. Recognition matters to you. When you can, hold back a little — don't undervalue personal time, select your tasks well, and practice saying no.",
          "You're not afraid of work and you like a challenge, but too much responsibility can be stressful, especially if you don't fully understand why you're doing what you're doing. Make space for rest so the waves don't crash over your head.",
        ],
        hu: [
          "Aki ennél több pontot ért el, az minden eszközt megragad képességei felmutatására és igazolására; számára a munka és a produktivitás különösen nagy érték, szereti a kihívásokat és a versenyt, a vállalkozást.",
          "Van egyfajta belső motivációd a teljesítésre, amely erősebb az átlagosnál. Jó a teherbíró képességed is, de a túl magas emocionális stressz-szint hamar kiégéshez vezethet. Figyelj rá, hogy találj olyan tevékenységeket, amelyekkel hatékonyan le tudod vezetni az esetleges feszültségeket. Kihívás lehet a munka és a magánélet egyensúlyának megtalálása, de neked kell döntened mikor melyik az elsődleges.",
          "Vágysz a sikerre és elismerésre, képes vagy tenni is érte. Hajlamos lehetsz emiatt túlpörgésre, nagyon vigyázz saját energiáid optimális particionálására különben a csökkent munkateljesítmény és munkamorál lehet a mellékhatása a felfokozott idegállapotnak.",
          "Nagyon lényeges számodra a munka. Képes vagy hihetetlen energiákat megmozgatni magadban, ha kellően motivált vagy valaminek az elvégzésére. Maximális erőbedobással végzed a rád bízott feladatokat és nagy terhelés alatt is jól tudsz teljesíteni, ehhez azonban érzelmileg stabilnak kell lenned. A sikert személyesként tudod megélni és ez fontos számodra. Figyelj oda rá, hogy amikor lehet, kicsit fogd vissza magad, ne értékeld alul a magadra szánt idő szerepét, és gyakorold a nemet mondást.",
        ],
      },
    },
  },

  Affiliation: {
    definition: {
      en: "The need to belong — to be part of a community, to build human relationships. It measures how much we seek the company of others and how important human connection is to us. It is a concept similar to intimacy, involving physical closeness, eye contact and openness.",
      hu: "A valahová tartozás, a közösségi tagság, az emberi kapcsolatok iránti igény. Megmutatja, mennyire keressük mások társaságát, hogy mennyire fontosak számunkra az emberi kapcsolatok. Az intimitáshoz hasonló és azzal rokon fogalom, ehhez köthető a másokhoz való fizikai közelség, az érintés, a szemkontaktus és a kitárulkozás.",
    },
    bands: {
      low: {
        en: [
          "Family and a few friends are important to you, but opening up is difficult. You are more introverted and prefer to surround yourself with fewer people who matter to you. You like to keep work and private life separate, and making friends at work is not a priority.",
          "Trust takes time. People can wear you down, and you don't give out much information about yourself. Given enough space you can be effective at work and thrive in seclusion; even when you're around people, you don't necessarily open up.",
          "You need time alone. You prefer working alone and figuring things out for yourself. Communicate this need to those around you in the right way — you tend toward self-reflection, and that can look like selfishness to others.",
          "In company you start as an observer. You can adapt to others, but adapting doesn't always come naturally.",
        ],
        hu: [
          "A család és pár barát fontos neked, de nem könnyen nyitsz mások felé, nem vagy kifejezetten társasági ember, inkább introvertált típus. Amennyiben elég teret hagynak hatékony tudsz lenni munka tekintetében is. Jobban szereted a páros vagy egyedüli tevékenységeket.",
          "Kifejezetten szükséged van arra, hogy néha egyedül legyél. Figyelj oda arra, hogy a környezetedet mindig megfelelő stílusban tájékoztasd ezen igényedről.",
        ],
      },
      average: {
        en: [
          "You value relationships and friendship. You're comfortable in both small and large groups, but you also have a strong need for privacy. There are times when you don't feel like socialising — but when you do, you're an integral part of the group. You have a few important people you'd do almost anything for.",
          "You're direct with people; until given a reason otherwise you tend to trust. You need solitude to reflect on what has happened. A good company can define your day, and you aim to build friendships at work.",
          "A little kindness and courtesy on your part goes a long way. You can function alone for long periods, but harmony — often with a partner or close company — matters to you. You manage well on your own, probably with fewer but deeper friendships.",
        ],
        hu: [
          "Fontosak számodra az emberi kapcsolatok, a barátaid, jól tudod magad érezni társaságban, de fokozottan szükséged van az elvonulásra is és hogy néha csak magaddal lehess. Bár vannak időszakok, amikor annyira nem vágysz a társasági életre, amikor mégis, akkor hatékony és szerves része lehetsz annak. Nincs nagyon sok barátod, de van pár fontos ember, akikért szívesen megteszel szinte bármit.",
          "Átlagosan vagy társaság-orientált, lényegesek számodra a baráti kapcsolatok, de nem haverkodsz mindenkivel, inkább kevesebb fontos emberrel veszed körbe magad. A család fontos számodra.",
          "Alapvetően közvetlen vagy az emberekkel, de nem könnyen nyílsz meg, tudod, hogy a bizalmat ki kell érdemelni. Szükséged van rá, hogy néha egyedül legyél és elgondolkozz a történteken. Figyelj oda arra, hogy egy kis kedvesség és előzékenység a részedről sokat tehet mások pozitív hangulatának érdekében.",
          "Képes vagy huzamosabb ideig egyedül is funkcionálni, de fontos számodra a harmónia és ennek egy része lehet a társaság illetve egy társ. Remekül elboldogulsz egyedül is, valószínűleg kevesebb, de mély barátsággal rendelkezel.",
        ],
      },
      high: {
        en: [
          "You're one of the engines of the group. You speak your mind openly and inspire others. You need a secure, warm atmosphere at work — friendship and work blur together.",
          "Once you've settled into a circle, people know they can turn to you for advice. You experience other people's success as your own and flourish in a good community where people strengthen each other.",
          "You're a team player and more confident with others. You need your friends and family — you don't feel complete without them. Take care of yourself too: awareness of your own needs lets you best support others.",
          "You can work with others much more effectively than alone. Be careful not to become dependent on anyone, and always express your own opinion even when it diverges from the group. Make your own decisions and be honest with yourself.",
        ],
        hu: [
          "Empatikus személyiség vagy, aki a társaság egyik motorja és hangadója lehet. Képes vagy a véleményedet nyíltan is felfedni és ezzel sokakat inspirálsz. Akik fontosak neked, azokkal szívesen törődsz. Amint beilleszkedtél egy társaságba, szinte mindenkinek tudsz hasznos tanácsokat adni.",
          "Jó közösségben tudsz igazán kibontakozni, ahol erősítik egymást a felek és te is beleadhatod a tudásodat. Csapatjátékos vagy és sokkal magabiztosabb másokkal együtt. Szükséged van a barátaidra, családra, nélkülük nem vagy el jól túl sokáig.",
          "Az emberekhez való érzelmi kapcsolat fontos neked, nem szeretsz túlzottan egyedül lenni, társasági lény vagy. Abszolút csapatjátékos vagy, és nagy szükséged van a jó társaságra. Törekszel arra, hogy mindenki elfogadjon. Figyelj arra, hogy ne válj függővé senkitől, saját magad hozd meg a döntéseidet és légy őszinte magaddal és másokkal.",
        ],
      },
    },
  },

  Aggression: {
    definition: {
      en: "The degree of aggression shows how directly we assert ourselves and how we handle our own anger. It is not always a \"negative\" trait — survival and progress are hard to imagine without it. Suppressed aggression can make us ill; excessive expression can damage our image.",
      hu: "Az agresszió mértéke az önérvényesítés direktségét és saját dühünk kezelésnek mintázatát mutatja meg. Nem minden esetben \"negatív\" vonás, hiszen a fennmaradás, a túlélés alig képzelhető el nélküle. Az elfojtott agresszió problémákhoz vezethet, túlzott kifejezése pedig saját imidzsünket rombolhatja.",
    },
    bands: {
      low: {
        en: [
          "You are far from aggressive self-assertion, and you prefer to avoid conflict. In the long run this can make you ill if you judge a situation as unfair and don't express it. People still respect you when you stand up for yourself — speaking your mind can move situations forward.",
          "You don't like conflict in principle, but you can hold stubbornly to what matters to you. You are fundamentally calm, but injustice can trigger a strong reaction. You're a compromise-seeker and problem-solver.",
          "Sometimes it's OK to defend yourself and take up conflict — it strengthens self-belief, and when you get your point across you gain respect. Standing up for yourself doesn't make you a bad person. Consider where being more assertive would serve you better.",
        ],
        hu: [
          "Nagyon távol áll tőled az agresszív önérvényesítés, inkább elkerülöd a konfliktusokat, ez viszont hosszútávon megbetegíthet, ha igazságtalannak ítélsz meg egy helyzetet és ennek nem adsz hangot. Az emberek akkor is szeretni fognak, ha kiállsz magadért és az igazadért, vállald fel a véleményed.",
          "Meglepően határozott és öntudatos lehetsz, ha megbántanak vagy valami fontos dologgal kapcsolatban kell védekezned. Alapvetően nem szereted az erőszakot és tényleg csak akkor vagy direkt valamivel kapcsolatban, ha szükségesnek érzed. Önérvényesítésedre nem jellemző az agresszivitás, inkább a kompromisszumkeresés és problémamegoldás híve vagy.",
          "Nem jellemző rád, hogy erőszakos lennél, de néha nem árt megvédeni magad és felvállalni a konfliktusokat, mert ezzel saját magadba vetett hitedet erősítheted, és ha meg tudod értetni az álláspontod nagyobb tisztelet is övezhet majd.",
        ],
      },
      average: {
        en: [
          "When you feel threatened, you defend your rights directly or indirectly. If you disagree, you voice it. Showing your emotions is not difficult for you, and you generally control them well.",
          "Be careful not to put your tension on someone who isn't the cause. Address the behaviour, not the person — say how it made you feel and what the consequences were.",
          "Sometimes you can be blunt in your self-assertion without intending to hurt others. At other times you may repress tension that built up during the day, which can have physical symptoms. Be aware that a sudden, harsh tone can demotivate people.",
        ],
        hu: [
          "Átlagosan jellemző rád az agresszió, ha fenyegetve érzed magad direkt vagy indirekt módon megvéded az igazad. Általában türelmes vagy más emberekkel, de határozott tudsz lenni, ha úgy ítéled meg, hogy szükség van rá. Nem szeretsz másokat megbántani és szándékosan nem is teszel ilyet.",
          "Nem szereted, ha ellentmondanak neked és ki tudod nyilvánítani a véleményedet, ha igazságtalannak vagy rossznak ítéled a helyzetet. Hiszel abban, hogy az egyenes kommunikációval lehet célt érni.",
          "Figyelj arra, hogy ne hárítsd a feszültséged olyanra, aki annak nem okozója. Ha gondod van valakivel, ne az adott embert, hanem a viselkedést tedd szóvá, és hogy az neked milyen érzés vagy milyen következményekkel jár.",
        ],
      },
      high: {
        en: [
          "You can sometimes surprise yourself with how vehemently you defend your rights or snap at things. Your assertiveness can tip into aggression — partly an effect of the ambitious side of your personality.",
          "Strive for win-win situations where both positions converge, or leave those who hurt you alone. Don't make your self-worth depend on such people.",
          "You may suppress emotions or tension that built up during the day, which can have physical symptoms. Take time for yourself and talk to someone about problems — otherwise anger can surface at the wrong moment.",
        ],
        hu: [
          "Erős önfegyelemmel rendelkezel, és sok sérülést hordozol a múltból. Figyelj arra, hogy magadra is szánj időt, illetve beszéld meg valakivel a problémáidat, mert különben egyszerre, a nem megfelelő pillanatban törhet ki belőled a felgyülemlett düh. Mérlegeld, hogy milyen helyzetekben lehet jobb az eredmény, ha erőteljesebb vagy.",
          "Néha akár saját magad is meglepődhetsz azon, hogy mit hoz ki belőled egy helyzet. Képes vagy határozottan fellépni a neked ellenállókkal szemben és önérvényesítésed néha agresszív lehet. Figyelj arra, hogy törekedj a győztes-győztes szituációkra, ahol a két fél álláspontja közeledik egymáshoz.",
          "Ha valamivel vagy valakivel bajod van az tudni fog róla, indulatos lehetsz, ha elégedetlen vagy. Határozott és öntudatos lehetsz, ha megbántanak. Képes vagy az önérvényesítésre, ismerd meg az embereket és alakítsd úgy, hogy mindenkinek jó legyen, amikor csak lehet.",
        ],
      },
    },
  },

  Defensiveness: {
    definition: {
      en: "This need is about self-protection — physically, but more often metaphorically: the protection of self-esteem, self-respect, self-image and positive self-perception. An extreme defensive tendency can lead to self-esteem disorders.",
      hu: "Ezen szükséglet az önvédelmet foglalja magába: fizikailag is, de inkább átvitt értelemben az önérzet, önbecsülés, a magunkról kialakított kép és a magunk pozitív megítélésének védelmét. A túl szélsőséges védekezi hajlam önértékelési zavarokat okozhat.",
    },
    bands: {
      low: {
        en: [
          "You can accept constructive criticism and can be hard on yourself. You see failure as an opportunity for improvement, and you dislike situations where you could be ridiculed in front of others.",
          "You're largely aware of how others see you. You don't usually feel the need to explain yourself — though living with blame isn't always easy. You make room for the opinions and ideas of others.",
          "There are situations where you're much better off standing up for yourself and defending your position — doing so empowers you.",
        ],
        hu: [
          "Képes vagy a hibáidat beismerni és nem magyarázkodsz, hanem teszel a kijavításuk érdekében. Képes vagy elfogadni a konstruktív kritikát, magaddal szemben szigorú tudsz lenni. Pontszámod oldott, lazább, a hibákat könnyen beismerő, változásra kész emberre utal.",
          "Néha szükségét érzed annak, hogy egy adott helyzetből kimagyarázd magad, de képes vagy beismerni a hibáidat. Általában nem érezed szükségét a magyarázkodásnak, el tudod fogadni az építő jellegű kritikát.",
          "Vannak olyan helyzetek, ahol sokkal jobban jársz, ha kiállsz magadért és megvéded az igazad, ezzel is erősítve önmagad.",
        ],
      },
      average: {
        en: [
          "Your self-confidence is broadly stable, but from time to time you need affirmation from a few people important to you. You're able to admit when you've made a mistake.",
          "You defend yourself when you need to but generally avoid conflict and blame. You don't talk easily to others about your problems — be careful not to leave anything unfinished or unresolved within yourself.",
        ],
        hu: [
          "Átlagos pontszámod arról tanúskodik, hogy vannak olyan helyzetek, amikor szükségét érzed megmagyarázni a történteket, de nem ez a jellemző. Önbizalmad nagyjából stabil, szükséged van a számodra fontos emberek megerősítésére időnként.",
          "Képes vagy beismerni, ha hibáztál, rendelkezel egy relatíve stabil önbizalommal, amit nem könnyű megingatni. Megvéded magad, ha szükségét látod, de általában kerülöd a konfliktust. Figyelj rá, hogy lehetőleg semmit ne hagyj lezáratlanul vagy megoldatlanul magadban.",
        ],
      },
      high: {
        en: [
          "You like to explain situations whenever possible, and you keep things to yourself rather than letting the outside world know about your problems — sometimes until you are on the verge of exhaustion. You need one-to-one affirmation; your confidence isn't always stable.",
          "You can be quite hard on yourself, and you tolerate criticism less easily than most. You are quite self-conscious and take problems upon yourself that you cannot change. Be aware: you are valuable in yourself, and no one can take that away. You must be yourself first — and everyone else will be more accepting of you.",
          "Continual reassurance matters to your self-confidence. You don't like being forced into unfamiliar situations or not fully understanding what's happening. Try to develop a stable image of yourself without letting others influence it too much. Your confidence must come from within — through taking risks and achieving success.",
        ],
        hu: [
          "Van szükséged külső megerősítésre, illetve ha hibázol, hajlamos lehetsz kételkedni magadban. Képes vagy beismerni a hibáidat és tenni is a javítás érdekében. Magaddal elég szigorú tudsz lenni, illetve kevés embertől tűröd jól a kritikát. Fontos hogy folyamatosan megerősítsenek abban, hogy jó, amit csinálsz. Az önbizalmadhoz fontos a folyamatos megerősítés, támogatás.",
          "Önértékelésed néha hullámzóvá válhat, erősen kerülöd a kudarcot és nem könnyen szokod meg az új dolgokat. Próbálj meg egy stabil képet kialakítani magadról és ne hagyd, hogy mások ezt nagymértékben befolyásolják. Lényeges, hogy az önbizalmadnak belülről kell jönnie, kockázatok vállalásával és sikerek elérése által.",
          "Magas pontszámod arról tanúskodik, hogy amikor lehet, szereted megmagyarázni a helyzeteket és nagyon jól magadban tartod a dolgokat anélkül, hogy a külvilágnak tudomása lenne a gondjaidról. Nagy szükséged van egy-egy ember megerősítésére, az önbizalmad nem mindig stabil. Fontos tisztában lenned azzal, hogy önmagadban is értékes vagy, és ami, illetve aki vagy azt senki nem veheti el tőled.",
        ],
      },
    },
  },

  Consciousness: {
    definition: {
      en: "Shows how much we care about the moral consequences of our actions, the opinions of others, and the extent to which we accept blame and criticism. It is also a measure of how quickly we can get over a situation and how much energy is tied up in dealing with the past.",
      hu: "Megmutatja, mennyit foglalkozunk tetteink morális következményivel, mások véleményével és milyen mértékben vesszük magunkra a hibázást és a kritikát. A faktor jelentését tovább árnyalhatja, hogy el tudjuk-e fogadni a büntetést és mennyi energiánkat köti le a múlttal való törődés. Annak a mérőszáma is, hogy milyen gyorsan tudunk túllépni egy-egy helyzeten.",
    },
    bands: {
      low: {
        en: [
          "You are a less inhibited person who does rather than thinks. You get over minor or major slip-ups and occasional rule-breaking easily. You don't worry about small things. You act according to your own inner compass.",
          "Some inhibitions exist and you can sometimes overcome them. Your mood can shift suddenly and you may be inclined to extremes. You don't take injustice well — loyalty and morality matter to you, but you don't let them dominate.",
        ],
        hu: [
          "Az alacsony pontszám felületesebb, aggálytalanabb, kevésbé gátlásos személyiség jellemzője, aki inkább cselekszik, mint töpreng, és könnyen túlteszi magát kisebb-nagyobb botlásokon, a \"játékszabályok\" időnkénti megszegésén.",
          "Vannak gátlásaid de néha fel tudod ezeket oldani, túlteszed magad az apró \"botlásokon\" és félre tudod tenni az aggódós énedet. Hirtelen lehet a hangulatodban változás, hajlamos lehetsz szélsőséges lenni ezzel kapcsolatban. Az igazságtalanságot nem viseled jól, szoktál gondolkodni a hűségen és erkölcsösségen is.",
        ],
      },
      average: {
        en: [
          "If you get into a conflict or make a mistake, don't always take it personally. Most mistakes can be corrected and often aren't due to your own lack of ability.",
          "You like your work done to the best of your ability — but that requires inner balance, achieved by not letting minor conflicts throw you off. You can make quick decisions when needed, though sometimes you spend a lot of time weighing alternatives. You typically seek the opinion of important people before big decisions.",
        ],
        hu: [
          "Ha konfliktusba kerülsz vagy hibázol, azt nem szabad mindig magadra venned. A legtöbb hibát ki lehet javítani és sokszor nem saját képességeid hiányából adódnak. A munkádat szereted maximálisan elvégezni, de ehhez szükség van belső egyensúlyra is, amit akkor érhetsz el, ha nem hagyod, hogy a kisebb konfliktusok kilendítsenek a ritmusodból.",
          "Képes vagy gyorsan is döntéseket hozni, ha arra van szükség, viszont vannak olyan helyzetek, ahol sokat mérlegelsz, hogy mi lenne a helyes út. Fontos döntések előtt általában kikéred a számodra fontos személy(ek) véleményét.",
        ],
      },
      high: {
        en: [
          "Very conscientious: you care deeply about justice, honesty, loyalty and morality. You are a careful reflector, prone to judgement. You almost always seek the opinion of trusted people before important decisions.",
          "You may worry more than necessary, or dwell on the past, or blame yourself for things that aren't your fault. Direct your energy toward what you can change — it is not always your personal failure.",
          "If you get into a conflict, don't always take it personally. Most mistakes can be corrected. You do your work conscientiously across the board — protect your inner balance by not letting minor conflicts derail your rhythm.",
        ],
        hu: [
          "A magas pontszám nagyon lelkiismeretes, az igazsággal, becsülettel, hűséggel és erkölccsel sokat törődő, talán aggályosan is mérlegelő, ítélkezésre hajlamos emberre jellemző. Fontos döntések előtt mindenképp kikéred számodra fontos személy(ek) véleményét.",
          "Elképzelhető, hogy néha túl hamar ítélsz, illetve a kelleténél többet aggódsz egy adott problémán. Nézd meg mely dolgokra érdemes rászánni az energiádat és mire nem, mert lehet, hogy azt szeretnéd megváltoztatni, amit nem lehet. Ez nem feltétlenül a te személyes kudarcod ilyenkor.",
          "Elég sok dolog van, amiből lelkiismereti kérdést csinálsz. Elképzelhető, hogy sok helyzetben a szükségesnél többet aggódsz vagy túlságosan a múltban gondolkodsz. Hajlamos lehetsz magadban keresni a hibát, pedig vannak problémák, amelyeket nem érdemes magadra venned. Szereted igényesen és jól csinálni a dolgokat. A munkádat lelkiismeretesen végzed minden téren.",
        ],
      },
    },
  },

  Dominance: {
    definition: {
      en: "The need to control and lead others. A dominant person dominates a given situation and can impose their will on others. Ultimately this is the need that drives a person toward power. It exists in everyone, just to different degrees.",
      hu: "Mások irányításának, vezetésének igénye jelenik meg ebben a faktorban. Domináns ember az, aki uralja az adott helyzetet, aki az akaratát rá tudja kényszeríteni másokra. Végső soron ez az a szükséglet, ami arra ösztönzi az embert, hogy hatalmat szerezzen. Mindenkiben megvan, csupán a mértéke különböző.",
    },
    bands: {
      low: {
        en: [
          "You are not a dominant type — controlling others is less important to you. You can perform well as a subordinate. Having too much responsibility for others can stress you.",
          "You let others assert themselves and you're not particularly proactive in a group. You speak your mind when asked and are willing to change — you can be persuaded. You're fundamentally adaptable and far from oppressive.",
          "Standing up for your own interests can be difficult. Being above others isn't your goal, and it doesn't bother you when someone is better at something than you.",
        ],
        hu: [
          "Nem szeretsz másokat irányítani, jobban tudsz működni egyedül vagy valaki által vezetve. Feszélyezhet, ha mások tőled függenek vagy túl nagy felelősséggel tartozol irántuk és ezzel nincs is semmi gond.",
        ],
      },
      average: {
        en: [
          "You take control when the situation calls for it, and it bothers you when someone doesn't give their best. You can become an effective leader by finding your voice with people. You like to guide and advise — a strong advantage.",
          "You bring a team together well and you don't resist change; you see it as a challenge and an opportunity. Feeling mentally superior and \"good\" can be important feedback that you're on the right track.",
          "You can \"bang the table\" when necessary. You have leadership ambition — you just might not fully believe it about yourself yet.",
        ],
        hu: [
          "Tudsz irányítani, ha úgy látod, a helyzet megkívánja vagy szükséges, de ezen igényed alapvetően nem magas. Képes lehetsz hatékony vezetővé válni, ha megtalálod az emberekkel a hangot és felfedezed, hogy milyen helyzetben mennyire kell domináns módon viselkedni.",
        ],
      },
      high: {
        en: [
          "You bring others together, lead, and speak for the group. You find joy in helping others — and should be aware that you don't have to be the best at everything.",
          "You have a strong sense of self-assertion and take control quickly. It bothers you when things don't go your way. You enjoy both mental and physical challenges and take pleasure in overcoming others. Competition is inner affirmation.",
          "You have real leadership qualities and should seek opportunities to develop them. Knowing people and their reactions — and setting an example — is essential to leading well.",
        ],
        hu: [
          "Az átlagnál magasabb pontszám \"vezérszerepre\" vágyó vagy törekvő embert jelent, akinek erős az igénye, hogy másokat irányítson, mások felett álljon. Tudsz irányítani, ha úgy látod, hogy a helyzet megkívánja, zavar, ha valaki nem hozza ki magából a maximumot. Alapvetően szeretsz másokat terelgetni, tanácsokat adni nekik.",
          "Képes vagy egy csapatot jól összefogni és nem állsz ellen a változásoknak, inkább kihívásnak és lehetőségnek tekinted. Szereted megmutatni, ha valamihez értesz. Képes vagy néha az \"asztalra csapni\" ha szükséges, van benned egyfajta vezetői ambíció.",
          "Rendelkezel vezetői adottságokkal és keresed a lehetőségeket, ahol ezen képességeid kiteljesítheted. Ehhez fontos ismerned az embereket, reakcióikat és példát mutatni azoknak, akiket vezetni szeretnél. Figyelj arra, hogy nem kell, hogy mindenben te légy a legjobb.",
        ],
      },
    },
  },

  Exhibition: {
    definition: {
      en: "The desire to appear — to show oneself and attract attention. This need is present in everyone, even if many hide it or think it shameful. Presenting ourselves and building our personal brand is necessary in all aspects of life — it's how individuals show the value of their work, personality and worldview.",
      hu: "A szereplési vágy közismert tényezőjét jelenti ez a faktor, ami magunk megmutatásában és a figyelem magunkra vonzásában jelentkezik. Mindenkiben él ez a szükséglet, még ha sokan tagadják, rejtegetni - vagy szégyellnivalónak gondolják is. Önmagunk prezentálása, személyes márka építése szükséges az élet minden területén. Ezen a folyamaton keresztül tudja megmutatni az egyén a munkája, személyisége, a világnézete értékeit.",
    },
    bands: {
      low: {
        en: [
          "You avoid being the centre of attention. Appearances are less important to you, and the desire to be seen is far from you. You judge people by personality rather than looks. You're not the speaker in a group.",
          "You can stand up to others, but it doesn't always come easily. You prefer assignments where acting isn't your priority — you're a specialist in the background processes.",
        ],
        hu: [
          "Számodra a külsőségek nem annyira hangsúlyosak, mint ahogyan a szereplési vágy is elég messze áll tőled. Nem szeretsz túl sok dolgot elárulni magadról a legtöbb embernek és ki kell érdemelni a bizalmadat egy hosszú időn keresztül. Jobban szeretsz elvonulni és jól végezni a dolgodat.",
          "Képes vagy kiállni mások elé, illetve egy csoport véleményét képviselni, de ez nem megy mindig könnyedén. Nem szeretsz túlságosan középpontban lenni, inkább meghallgatsz másokat is.",
        ],
      },
      average: {
        en: [
          "You care about how you dress and present yourself, and you have no difficulty expressing your opinion or representing others. You don't like being overly visible unless you need to be. You're more of a backroom specialist.",
        ],
        hu: [
          "Odafigyelsz az öltözködésre és a rólad kialakított képre, nem esik nehezedre kinyilvánítani a véleményed és képviselni másokat, de nem szeretsz túlságosan szerepelni, csak ha szükség van rá. Inkább a háttérfolyamatok specialistája vagy.",
        ],
      },
      high: {
        en: [
          "You can speak openly about yourself. You're a kind of spokesperson in the group — you can stand up and represent your own interests, and being on stage isn't far from you.",
          "You like to be fastidious and aesthetic; you care about your appearance because you know it reflects on you and influences others. Make sure what you say is understood as you meant it — think before you speak.",
          "Regularity and fastidiousness matter to you in both dress and work. Your work should reflect this attitude — it paints a picture of you. Develop your communication and presentation skills as high as possible; they will contribute greatly to successful self-management.",
        ],
        hu: [
          "Egyfajta hangadó vagy a csoportban, ki tudsz állni és képviselni saját érdekeidet, nem áll tőled távol a szereplés. Szereted az igényességet, esztétikusságot, számodra fontos a külsőd és a rendezettség, hiszen tudod, hogy ez is téged tükröz. Fontos, hogy megbizonyosodj arról, hogy amit mondasz azt a másik fél is úgy értse, ahogyan te.",
          "Számodra nagyon fontos az igényesség, jó megjelenés és erre törekedsz saját magaddal és a munkáddal kapcsolatban is. Nem okoz gondot számodra kiállni mások elé, akár saját, akár egy csoport véleményének képviseletében. Igyekezz minél magasabb szintre fejleszteni a kommunikációs és előadói készségedet, mert ez nagymértékben hozzájárul a sikeres önmenedzseléshez.",
        ],
      },
    },
  },

  Autonomy: {
    definition: {
      en: "Independence, self-reliance, acting according to one's own will and inner compass. Autonomous individuals choose their own goals rather than being dependent on external forces. This need is universal but specific to each individual in different degrees.",
      hu: "Jelentése: függetlenség, öntörvényűség, a saját akarat és belső iránytű szerinti cselekvés. Autonóm egyének azok, akik önállóan választják meg céljaikat, szemben azokkal, akik külső erőktől függenek. Ez az igény, illetve az erre való képesség általános emberi sajátosság, de mindenkire más-más mértékben jellemző.",
    },
    bands: {
      low: {
        en: [
          "You need to understand why you're doing what you're doing, and you want a clear purpose and task. You're able to work by rules set by others — it doesn't cause tension — and you prefer a framework over too much freedom.",
          "Rules give you security. You can be creative when needed, but you don't want to reinvent everything — you're fine with others setting goals for you. You don't usually go your own way; you follow others and give in to their opinions.",
        ],
        hu: [
          "Fontos számodra, hogy megértsd, mit miért kell csinálnod és legyen világosan, normálisan kijelölve a cél és a feladat. Abszolút képes vagy szabályok és mások által kijelölt irányok alapján működni, nem okoz ez számodra feszültséget, sőt preferálod a túl nagy szabadsággal szemben a kereteket.",
          "Számodra biztonságot adnak a szabályok, keretek. Ha szükség van rá képes vagy kreatív lenni, de nem akarsz mindenáron mindent újra kitalálni, nem gond, ha mások jelölik ki a célokat neked. Nem mész általában a saját fejed után, inkább másokat követsz, adva a véleményükre.",
        ],
      },
      average: {
        en: [
          "You have innovative ideas and can work independently, but you can also complete tasks or follow directions. You generally get along with people and give in to others' opinions, though you can make independent decisions when necessary.",
          "You accept rules — you don't want to question every decision and process — but there are some things you like to do your own way. You can follow a plan set by another without questioning everything.",
          "You crave independence but can delegate decisions to others. You have ideas but tend to share them when asked, rarely taking the initiative.",
        ],
        hu: [
          "Átlagos pontszámod arra enged következtetni, hogy vannak újító jellegű gondolataid, képes vagy önálló munkavégzésre is, de beosztottként is tudsz viselkedni, feladatokat teljesítve vagy egy kijelölt irány alapján dolgozni.",
          "Általában jól kijössz az emberekkel, adsz mások véleményére, de ha arra van szükség, tudsz önálló döntéseket hozni. El tudod fogadni a szabályokat, nem akarsz megkérdőjelezni minden döntést és folyamatot, de vannak dolgok, amiket szeretsz a saját módodon megoldani.",
          "Vágysz a függetlenségre, de képes vagy a döntést átengedni másnak. Vannak ötleteid, de ezeket inkább akkor osztod meg, ha kérdeznek, ritkán kezdeményezel.",
        ],
      },
      high: {
        en: [
          "You have a particular need for independence. You decide for yourself what you follow, what you like, and what you reject — in your lifestyle, appearance and principles. You make your own rules and stick to them even when they cause conflict.",
          "You like to go your own way, see situations realistically and make your own decisions. You yearn for independence and can become stubborn if something is forced on you. Be aware that opinions different from your own can help — be open to honesty.",
        ],
        hu: [
          "Aki ennél több pontot szerzett, az különösen igényli a másoktól való függetlenséget, hogy az tegye, amit jónak lát, maga döntse el mit követ, mit kedvel és mit utasít vissza. Akkor is ragaszkodik ezekhez, ha miattuk konfliktusokba keveredik, hátrányba kerül.",
          "Szereted a saját utad járni, reálisan látni a helyzeteket és saját magad dönteni. Vágysz a függetlenségre és makaccsá válhatsz, ha valamit Rád szeretnének erőltetni. Figyelj arra, hogy a sajátodtól eltérő vélemények is hasznosak lehetnek. Fogadd nyitottan az őszinteséget.",
        ],
      },
    },
  },

  Caregiving: {
    definition: {
      en: "A supportive interaction — the motivation to care for others, make their lives better. It often involves identification and personal attachment. Caring isn't just willpower; it comes from emotional saturation and values.",
      hu: "A szó általában támogató jellegű interakcióra utal. Ez az érzés gyakran magába foglalja a törődést vagy azonosulást, személyes kötődést. Az a belső motiváció, hogy mások életét jobbá tegyük. A gondoskodás képessége nem csak akaraterő, hanem érzelmi telítettség és értékrend kérdése.",
    },
    bands: {
      low: {
        en: [
          "You may sometimes appear cold, but that's because you're very selective about who you let close. Family is important, but not always the most important — you can make sacrifices for work in this area.",
          "You don't like to show or talk about your feelings to anyone.",
        ],
        hu: [
          "Elképzelhető, hogy mások számára néha hidegnek tűnhetsz, de ez valószínűleg azért van, mert nagyon megválogatod, hogy kit mennyire engedsz közel magadhoz. A család fontos számodra, de nem mindig a legfontosabb, képes vagy áldozatokat hozni a munka érdekében e téren.",
          "Nem szereted az érzelmeid kimutatni illetve beszélni róluk bárkinek.",
        ],
      },
      average: {
        en: [
          "You are not typically \"motherly\". Your own interests are important, but you will help when needed. You have a sense of caring but know that not everyone deserves it. You're happy to help those who are important to you; you can take a back seat when the situation requires.",
          "There are few people to whom you'll give your time and energy — you're selective. Developing empathy can mean a lot for your acceptance and well-being. Helping others can be a way to experience happiness.",
          "When you do help, it takes energy — don't let it disorient your attention or hinder your own work. Decide wisely whom to give attention to; your energy is finite. Giving matters, but so does receiving — and so does time for yourself.",
        ],
        hu: [
          "Nem vagy tipikusan \"anyáskodó\". Bár fontos számodra a saját érdeked, ha kell, segítesz. Van benned egyfajta törődés, de tudod, hogy nem mindenki érdemli ezt meg. Aki fontos számodra annak szívesen segítesz.",
          "Kevés ember van, akire hajlandó vagy rászánni az idődet és az energiádat, ezt jól megválogatod. Az empátia fejlesztése sokat jelenthet az elfogadottságod és jó közérzeted szempontjából.",
          "Az embereket és állatokat egyaránt szereted, ha lehetőséged van rá, akkor szívesen gondoskodsz másokról, örömmel adsz. Szívesen segítesz másoknak, de emellett megvannak a saját igényeid is. Az asszertivitáshoz a nemet mondás képessége is hozzátartozik. Ne felejtsd el, hogy neked is vannak szükségleteid.",
        ],
      },
      high: {
        en: [
          "You love people and animals alike. When you have the opportunity, you're happy to care for others and give. You also have your own needs — not everyone deserves your attention.",
          "You are very helpful even with new people if they're sympathetic. You would do almost anything for those close to you. You may help many people even at the expense of your own time and energy — it gives you pleasure and is a form of inner affirmation. Be careful it doesn't distract you too much.",
          "Assertiveness includes the ability to say no. The care you show must come from somewhere — remember you have needs too.",
        ],
        hu: [
          "A magasabb értékek a törődő, segítő szeretetet mutató emberek sajátjai. Erős anyaösztönnel rendelkezel, nagyon segítőkész vagy akár új emberekkel is, ha szimpatikusak neked. Akik közel állnak hozzád, azokért szinte bármire képes lennél.",
          "Tudod, hogy nem mindenki érdemli meg a törődést, inkább kevesebb, de számodra fontos emberrel veszed körbe magad. Akit egyszer a szívedbe fogadsz azzal nagyon megértő és támogató tudsz lenni. Előfordulhat, hogy a saját időd és energiád kárára is segítesz, ezt mindig mérlegeld, hogy mennyire egyenlő a viszony.",
        ],
      },
    },
  },

  Order: {
    definition: {
      en: "Rationality, precision and regularity. Order and cleanliness of our immediate environment is to some extent a basic necessity. Its meaning extends beyond that — to the need to integrate knowledge and memories into a coherent whole. It is a driving force of cognition.",
      hu: "Ez az igény magába foglalja az ésszerűséget, a precizitást és a szabályozottságot. Közvetlen környezetünk rendje és tisztasága bizonyos mértékben alapszükséglet. Jelentése ezen túl kiterjed az ismeretek, emlékek egységes egészbe foglalásának igényére. Ez a megismerés egyik fő hajtóereje, törekvésünk a minket körülvevő rendszer megértésére.",
    },
    bands: {
      low: {
        en: [
          "Being informal, flexible and having more room to manoeuvre than the average person is important to you. You run the risk of becoming distracted if you overcommit or lose focus. Pay attention to the areas of life where you do need a stricter regime.",
        ],
        hu: [
          "Számodra nagyon fontos a kötetlenség, rugalmasság és az, hogy kicsit nagyobb mozgástered legyen, mint az átlagnak. Viszont fennáll a veszély, hogy szétszórttá válsz, ha túlvállalod magad vagy elvész a fókusz. Figyelj oda arra, hogy az élet mely területein kell, hogy szigorú rendszer legyen.",
        ],
      },
      average: {
        en: [
          "You like to see things through and have a need for self-development and for avoiding mistakes. You structure your processes and plan continuously to succeed. You may sometimes overlook things — take a few minutes to rest before continuing when you feel tired or unfocused.",
          "You're not a neat freak; you don't need organisation and planning in everything. You like to understand the system around you. You don't like very strict rules and frameworks — you need freedom to work effectively.",
          "Try to approach a problem from as many perspectives as possible to get a fuller picture.",
        ],
        hu: [
          "Szereted átlátni a dolgokat, igényed van saját magad fejlesztésére és a hibázás elkerülésére. Strukturálnod kell a folyamatokat és folyamatosan tervezni a siker érdekében. Néha elképzelhető hogy elsiklik a figyelmed egy-egy dolog felett.",
          "Nem vagy rendmániásnak mondható, nem mindenben igényled a szervezettséget, tervezettséget. Szereted megérteni a téged körülvevő rendszert amennyire lehet. Nem szereted a nagyon szigorú szabályokat és kereteket, szükséged van a szabadságra ahhoz, hogy hatékonyan tudj működni.",
          "Figyelsz arra, hogy rend legyen körülötted, de nem tervezel meg mindent aprólékos részletességgel. Alapvetően racionális személyiség vagy. Próbálj meg egy adott problémát minél több perspektívából megközelíteni, hogy teljesebb képet kaphass.",
        ],
      },
      high: {
        en: [
          "A higher value can indicate an increased need for order and cleanliness — in extreme cases what psychologists consider a form of compulsiveness.",
          "You need cleanliness and order around you. You like to know the system, to understand why you do what you do, but you don't need to inspect every detail. You see through processes, and it bothers you when someone isn't as systematic as you.",
          "You like everything tidy and happening as you imagined it. You pay attention to the cleanliness of your surroundings. You want to understand the systems around you.",
          "You are perceptive and have a need to improve and avoid mistakes. You demand well-structured, clear tasks. You like to see things through and prefer things in their proper place.",
        ],
        hu: [
          "Az ennél magasabb érték fokozott rend- és tisztaságigényt, szélsőséges esetben \"mániát\" jelezhet, ami a pszichológusok, pszichiáterek szerint a \"kényszeresség\" egyik megnyilvánulási formája.",
          "Van igényed a tisztaságra, rendre magad körül és a munkában, szereted megismerni a körülötted lévő rendszert. Jól átlátod a folyamatokat is és zavar, ha valaki nem annyira rendszerető, mint te.",
          "Nagy az igényed arra, hogy megértsd a körülötted zajló folyamatokat. Szereted, ha minden rendezett, úgy történik, ahogyan elképzelted. Jól átlátod a dolgokat, igényed van saját magad fejlesztésére és a hibázás elkerülésére. Szereted, ha a dolgoknak megvan a maguk helye.",
          "Alapvetően befelé forduló típus vagy, aki örömét leli a rendben. Megnyugtató számodra, ha rend van körülötted és a munkádban is. Alapvetően racionális személyiség vagy, jól tudod kontrollálni az érzelmeidet.",
        ],
      },
    },
  },

  Helplessness: {
    definition: {
      en: "Refers to the extent to which we need the help, care and compassion of others. Asking for help also means being aware of our own and others' capabilities — having assessed our limits, not being afraid to involve others when problems arise.",
      hu: "Ez a motiváció azt jelenti, hogy mennyire igényeljük mások segítségét, törődését, együttérzését. A segítségkérés azt is jelenti, hogy tisztában vagyunk saját magunk és mások képességeivel, és miután felmértük határainkat, nem félünk másokat is belevonni azokba a helyzetekbe, amelyek problémát okoznak.",
    },
    bands: {
      low: {
        en: [
          "Very low scorers prefer to withdraw and \"lick their wounds\" in the face of illness or failure. That pattern is as characteristic of proud people as of shy ones.",
          "You are not a team player in this respect; you prefer to solve problems alone at first, asking for help only when you fail or feel you lack knowledge. Asking for help doesn't make you worse or less capable. Joining forces can speed up your work and doesn't diminish you.",
          "Sometimes you can feel alone in the face of the world. Admitting you can't do something alone is hard; you don't want to depend on others or burden them. Sometimes asking for help genuinely makes the situation easier — and there are many people who like to help.",
        ],
        hu: [
          "Ebből a szempontból nem vagy kifejezetten csapatjátékos, inkább először egyedül szereted megoldani a problémáidat, csak akkor kérsz segítséget, ha nem sikerül valami vagy úgy érzed nincs elég tudásod. A segítségkérés nem tesz téged semmivel rosszabbá vagy kevésbé képessé.",
          "Néha egyedül érezheted magad a világgal és a problémákkal szemben. Nehezen ismered be, ha valamit egyedül nem tudsz elvégezni és nagyon kevés embertől fogadsz el segítséget, nem akarsz másoktól függni vagy terhelni őket a problémáiddal. Sokan vannak, akik szeretnek segíteni.",
        ],
      },
      average: {
        en: [
          "You don't easily share your problems. You sometimes ignore inner tension, and sometimes it comes out. Prevention matters — take time for yourself and the things that are important to you, or you risk burnout.",
          "You don't like to burden others with your problems and prefer to solve situations yourself. Consider where asking for help can speed up your work without making you \"less\". Map out which tasks benefit most from collaboration.",
          "Excessive stress may also show up as physical symptoms.",
        ],
        hu: [
          "Nem könnyen osztod meg a problémáid másokkal, elképzelhető, hogy néha ignorálod a belső feszültséget, olykor pedig ez kiütközik. A prevenció itt egy nagyon fontos rész, szánj magadra és a számodra fontos dolgokra kellő időt, mert fokozott kiégés veszélyének lehetsz kitéve.",
          "Nem szívesen terhelsz másokat a problémáiddal, szereted saját magad megoldani a helyzeteket. Mérlegeld azt, hogy néha a segítségkérés meggyorsíthatja a munkádat és semmivel nem leszel kevesebb vagy rosszabb ettől.",
          "Képes vagy segítséget kérni és másokra támaszkodni, érzed, ha egy problémát nem tudsz egyedül megoldani. Fontos számodra, hogy foglalkozzanak veled. Erősítsd azt magadban, hogy önmagadban is értékes vagy és bármire képes, amit elhatározol.",
        ],
      },
      high: {
        en: [
          "A high need for help can lead to \"nagging\", dramatic symptoms of illness, and exaggeration of difficulties — in pursuit of the care one feels they need.",
          "You can ask for help and rely on others. You feel when you can't solve a problem alone. Being cared for matters to you — there may be quite a few things you prefer not to do alone and would rather do as a team. But some decisions only you can make, and they are never easy.",
          "A few important people in your life feel indispensable, and you may rely on them more than is good for you. Reinforce in yourself that you are valuable in your own right and capable of what you set your mind to. You may be reluctant to talk about yourself — you know who to turn to, and it matters that those you rely on really know you.",
          "Sometimes you feel alone when facing problems and need support in difficult situations. Be careful not to depend on any single person — you are very valuable in your own right.",
        ],
        hu: [
          "A problémákkal szemben néha egyedül érzed magad, szükséged van támogatásra nehezebb helyzetekben. Képes vagy segítséget kérni és másokra támaszkodni, érzed, ha egy problémát nem tudsz egyedül megoldani, nehezen engedsz el embereket és kapcsolatokat.",
          "Fokozottan igényed van a neked fontos emberek megerősítésére és elfogadásra, szeretnél szakmailag és emberileg is hasznos lenni. Figyelj oda rá, hogy ne függj egyetlen embertől sem, önmagadban is nagyon értékes vagy.",
        ],
      },
    },
  },
};
