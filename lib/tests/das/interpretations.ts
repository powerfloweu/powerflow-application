import type { DasSubscaleKey } from "./scoring";

type Lang = "en" | "hu" | "de";

type SubscaleInterpretation = {
  name: Record<Lang, string>;
  normalText: Record<Lang, string>;
  highText: Record<Lang, string>;
  lowText: Record<Lang, string>;
};

export const DAS_INTRO: Record<Lang, string> = {
  en: "The Dysfunctional Attitude Scale identifies seven core belief patterns that research links to performance anxiety, perfectionism, and burnout in athletes. Scores within the normal range (−5 to +5) indicate balanced, adaptive thinking. Scores outside this range signal a belief pattern that may increase psychological vulnerability under pressure.",
  hu: "A Diszfunkcionális Attitűd Skála hét alapvető hiedelemrendszert azonosít, amelyeket a kutatások sportolóknál a teljesítményszorongással, perfekcionizmussal és kiégéssel hoznak összefüggésbe. A normál tartományba eső pontszámok (−5-től +5-ig) kiegyensúlyozott, adaptív gondolkodást jeleznek. A tartományon kívül eső pontszámok olyan hiedelmeket jeleznek, amelyek nyomás alatt növelhetik a pszichológiai sebezhetőséget.",
  de: "Die Skala dysfunktionaler Einstellungen identifiziert sieben grundlegende Überzeugungsmuster, die die Forschung mit Leistungsangst, Perfektionismus und Burnout bei Athleten in Verbindung bringt. Werte im Normalbereich (−5 bis +5) weisen auf ausgewogenes, adaptives Denken hin. Werte außerhalb dieses Bereichs signalisieren ein Überzeugungsmuster, das unter Druck die psychologische Verletzlichkeit erhöhen kann.",
};

export const SUBSCALE_INTERPRETATIONS: Record<DasSubscaleKey, SubscaleInterpretation> = {
  externalApproval: {
    name: { en: "External Approval", hu: "Külső megerősítés", de: "Externe Anerkennung" },
    normalText: {
      en: "You can distinguish between valuing feedback and depending on it. Others' opinions inform but do not define your sense of worth.",
      hu: "Képes vagy különbséget tenni a visszajelzés értékelése és attól való függőség között. Mások véleménye tájékoztat, de nem határozza meg az önértékelésedet.",
      de: "Du kannst zwischen dem Wertschätzen von Feedback und dem Abhängigseindavon unterscheiden. Die Meinung anderer informiert, bestimmt aber nicht dein Selbstwertgefühl.",
    },
    highText: {
      en: "Your self-worth is significantly tied to external validation. When approval is absent — after a loss, a missed target, or a critical comment — you may struggle to maintain confidence. This pattern can make you sensitive to criticism and prone to people-pleasing at the expense of honest self-assessment.",
      hu: "Az önértékelésed jelentős mértékben külső megerősítéshez kötődik. Ha az elismerés elmarad — vereség, elmaradt cél vagy kritikus megjegyzés esetén — nehézséget okozhat a magabiztosság fenntartása. Ez a minta érzékennyé tehet a kritikára, és hajlamossá tehetsz a megfelelni akarásra az őszinte önértékelés rovására.",
      de: "Dein Selbstwertgefühl ist stark an externe Bestätigung gebunden. Wenn Anerkennung ausbleibt — nach einer Niederlage, einem verfehlten Ziel oder einem kritischen Kommentar — fällt es dir möglicherweise schwer, dein Selbstvertrauen aufrechtzuerhalten. Dieses Muster kann dich anfällig für Kritik machen und dazu verleiten, es anderen recht machen zu wollen, auf Kosten einer ehrlichen Selbsteinschätzung.",
    },
    lowText: {
      en: "You show little concern for others' evaluations — to a degree that may limit useful feedback. Staying open to constructive input while protecting your inner confidence is the optimal balance.",
      hu: "Kevés figyelmet fordítasz mások véleményére — olyan mértékben, ami esetleg korlátozhatja a hasznos visszajelzések befogadását. Az egyensúly megtalálása az építő visszajelzésekre való nyitottság és a belső magabiztosság megőrzése között a legelőnyösebb.",
      de: "Du zeigst wenig Interesse an den Einschätzungen anderer — in einem Ausmaß, das nützliches Feedback einschränken kann. Das optimale Gleichgewicht liegt darin, offen für konstruktive Rückmeldungen zu bleiben und gleichzeitig dein inneres Selbstvertrauen zu schützen.",
    },
  },
  lovability: {
    name: { en: "Lovability", hu: "Szerethetőség", de: "Liebenswürdigkeit" },
    normalText: {
      en: "You can tolerate disapproval or disconnection from others without it destabilising your sense of self. Relationships matter to you without defining your worth.",
      hu: "Képes vagy elviselni mások rosszallását vagy távolságát anélkül, hogy az megingassa az önértékelésed. A kapcsolatok fontosak számodra, de nem határozzák meg az értékedet.",
      de: "Du kannst Missbilligung oder Distanz von anderen tolerieren, ohne dass dein Selbstbild dadurch destabilisiert wird. Beziehungen sind dir wichtig, ohne deinen Wert zu definieren.",
    },
    highText: {
      en: "You have a strong need to be loved and accepted by the people who matter to you. When a key relationship feels strained, you may experience disproportionate distress. In sport, this can manifest as conflict-avoidance with coaches, over-reliance on teammates' approval, or difficulty recovering after social friction.",
      hu: "Erős igényed van arra, hogy a számodra fontos emberek szeressenek és elfogadjanak. Ha egy kulcsfontosságú kapcsolat feszültté válik, aránytalanul nagy szorongást élhetsz meg. A sportban ez megnyilvánulhat az edzőkkel való konfliktusoktól való menekülésben, a csapattársak elismerésétől való túlzott függőségben, vagy nehézségként a szociális súrlódások utáni felépülésben.",
      de: "Du hast ein starkes Bedürfnis, von den Menschen, die dir wichtig sind, geliebt und akzeptiert zu werden. Wenn eine wichtige Beziehung angespannt ist, erlebst du möglicherweise unverhältnismäßig große Belastung. Im Sport kann sich dies als Konfliktvermeidung mit Trainern, übermäßige Abhängigkeit von der Zustimmung der Teammitglieder oder Schwierigkeiten bei der Erholung nach sozialen Spannungen äußern.",
    },
    lowText: {
      en: "You are highly self-sufficient in your need for belonging. This resilience is an asset, though staying attuned to team dynamics and coaching relationships remains important.",
      hu: "Rendkívül önellátó vagy az összetartozás igényét illetően. Ez a rugalmasság értékes tulajdonság, bár a csapatdinamikákra és az edzői kapcsolatokra való odafigyelés továbbra is fontos marad.",
      de: "Du bist in deinem Zugehörigkeitsbedürfnis sehr selbstständig. Diese Resilienz ist ein Vorteil, obwohl es weiterhin wichtig ist, auf die Teamdynamik und Trainerbeziehungen zu achten.",
    },
  },
  achievement: {
    name: { en: "Achievement", hu: "Teljesítményigény", de: "Leistungsstreben" },
    normalText: {
      en: "You can separate performance outcomes from personal worth. Setbacks are processed as events to learn from rather than reflections of who you are.",
      hu: "Képes vagy szétválasztani a teljesítményeredményeket a személyes értéktől. A kudarcokat olyan eseményként dolgozod fel, amelyekből tanulni lehet, nem pedig a személyiséged tükröként.",
      de: "Du kannst Leistungsergebnisse von persönlichem Wert trennen. Rückschläge werden als Lernmöglichkeiten verarbeitet, nicht als Spiegelbild dessen, wer du bist.",
    },
    highText: {
      en: "Your sense of personal value is closely linked to how you perform. While this drives high motivation, it also creates fragility: a poor result, an injury, or a performance plateau can feel like an identity threat. Over time, this belief pattern is associated with fear of failure, avoidance of challenging goals, and burnout.",
      hu: "A személyes értékérzeted szorosan összefügg a teljesítményeddel. Bár ez magas motivációt generál, egyben törékenységet is okoz: egy gyenge eredmény, sérülés vagy teljesítménystagnálás identitást fenyegető érzésként jelenhet meg. Idővel ez a hiedelemrendszer a kudarctól való félelemmel, a kihívást jelentő célok elkerülésével és kiégéssel jár együtt.",
      de: "Dein Gefühl für persönlichen Wert ist eng mit deiner Leistung verknüpft. Während dies hohe Motivation antreibt, erzeugt es auch Verletzlichkeit: Ein schwaches Ergebnis, eine Verletzung oder ein Leistungsplateau kann sich wie eine Bedrohung der eigenen Identität anfühlen. Langfristig ist dieses Überzeugungsmuster mit Versagensangst, Vermeidung anspruchsvoller Ziele und Burnout verbunden.",
    },
    lowText: {
      en: "Your self-worth is well insulated from performance outcomes. The challenge may be maintaining drive when results feel disconnected from meaning — channelling this detachment into long-term consistency.",
      hu: "Az önértékelésed jól el van szigetelve a teljesítményeredményektől. A kihívás az lehet, hogy fenntartsd a motivációt, ha az eredmények elveszítik értelmüket — ez az elszakadás hosszú távú következetességgé alakítható.",
      de: "Dein Selbstwertgefühl ist gut gegenüber Leistungsergebnissen abgeschirmt. Die Herausforderung könnte darin bestehen, den Antrieb aufrechtzuerhalten, wenn sich Ergebnisse von Bedeutung losgelöst anfühlen — diese Ablösung in langfristige Konsequenz umzuwandeln.",
    },
  },
  perfectionism: {
    name: { en: "Perfectionism", hu: "Perfekcionizmus", de: "Perfektionismus" },
    normalText: {
      en: "You maintain high standards without treating imperfection as catastrophic. Mistakes are part of your improvement process.",
      hu: "Magas mércét tartasz fenn anélkül, hogy a tökéletlenséget katasztrofálisnak tekintenéd. A hibák a fejlődési folyanatod részét képezik.",
      de: "Du hältst hohe Standards aufrecht, ohne Unvollkommenheit als katastrophal zu betrachten. Fehler sind Teil deines Verbesserungsprozesses.",
    },
    highText: {
      en: "You hold yourself to exacting standards that leave little room for error. While this can produce excellent work, it comes at a cost: mistakes feel disproportionately damaging, good-enough is rarely acceptable, and the gap between current and ideal performance generates chronic stress. Athletes with high perfectionism are at elevated risk of over-training, pre-competition anxiety, and difficulty recovering from errors mid-performance.",
      hu: "Olyan szigorú elvárásokat támasztasz magaddal szemben, amelyek alig hagynak teret a hibára. Bár ez kiváló teljesítményt eredményezhet, súlyos ára van: a hibák aránytalanul rombolónak tűnnek, az \u201Eel\u00E9g j\u00F3\u201D ritkán elfogadható, a jelenlegi és az ideális teljesítmény közötti rés krónikus stresszt okoz. A magas perfekcionizmussal rendelkező sportolóknál fokozottan fennáll a túledzés, a verseny előtti szorongás és a hibákból való felépülés nehézségének kockázata.",
      de: "Du hältst dich an genaue Standards, die wenig Raum für Fehler lassen. Während dies hervorragende Arbeit produzieren kann, hat es seinen Preis: Fehler fühlen sich unverhältnismäßig schädlich an, gut genug ist selten akzeptabel, und die Lücke zwischen aktueller und idealer Leistung erzeugt chronischen Stress. Athleten mit hohem Perfektionismus haben ein erhöhtes Risiko für Übertraining, Wettkampfangst und Schwierigkeiten bei der Erholung von Fehlern während der Leistung.",
    },
    lowText: {
      en: "You are largely free from perfectionist pressure. The balance to strike is holding enough standard to drive quality while remaining genuinely unconcerned about imperfection.",
      hu: "Nagyrészt mentes vagy a perfekcionista nyomástól. Az egyensúly megteremtése az, hogy elegendő mércét tarts fenn a minőség hajtásához, miközben valóban nem foglalkozol a tökéletlenséggel.",
      de: "Du bist weitgehend frei von perfektionistischem Druck. Das richtige Gleichgewicht besteht darin, genug Standard zu halten, um Qualität anzutreiben, während du genuinen Gleichmut gegenüber Unvollkommenheit bewahrst.",
    },
  },
  entitlement: {
    name: { en: "Entitlement", hu: "Jogosultságtudat", de: "Anspruchsdenken" },
    normalText: {
      en: "You have a realistic sense of what you can expect from others and from competitive outcomes. Fairness matters without dominating your emotional responses.",
      hu: "Reális képed van arról, mire számíthatsz másoktól és a versenyeredményektől. Az igazságosság fontos számodra, de nem uralja az érzelmi reakcióidat.",
      de: "Du hast ein realistisches Gefühl dafür, was du von anderen und von Wettkampfergebnissen erwarten kannst. Fairness ist wichtig, ohne deine emotionalen Reaktionen zu dominieren.",
    },
    highText: {
      en: "You hold a strong belief that your efforts entitle you to specific outcomes, recognition, or treatment. When reality falls short of these expectations — as it regularly does in competitive sport — the result is frustration, resentment, or disengagement. This pattern can strain coaching relationships and make it difficult to maintain motivation after setbacks that feel 'unfair'.",
      hu: "Erősen hiszed, hogy az erőfeszítéseid meghatározott eredményekre, elismerésre vagy bánásmódra jogosítanak fel. Amikor a valóság elmarad ettől — ami a versenysportban rendszeresen előfordul —, az eredmény frusztráció, neheztelés vagy elhatárolódás. Ez a minta megterhelheti az edzői kapcsolatokat, és megnehezítheti a motiváció fenntartását az \u201Eigazs\u00E1gtalannak\u201D érzett visszaesések után.",
      de: "Du hegst die starke Überzeugung, dass deine Bemühungen dich zu bestimmten Ergebnissen, Anerkennung oder Behandlung berechtigen. Wenn die Realität hinter diesen Erwartungen zurückbleibt — was im Wettkampfsport regelmäßig passiert — ist das Ergebnis Frustration, Groll oder Rückzug. Dieses Muster kann Trainerbeziehungen belasten und es erschweren, die Motivation nach Rückschlägen aufrechtzuerhalten, die sich 'unfair' anfühlen.",
    },
    lowText: {
      en: "You carry little sense of personal entitlement. The opportunity here is to advocate effectively for yourself and recognise when you genuinely deserve more.",
      hu: "Kevés személyes jogosultságérzeted van. A lehetőség itt az, hogy hatékonyan képviseld magad, és felismerd, mikor érdemelsz valóban többet.",
      de: "Du trägst wenig Gefühl persönlicher Berechtigung. Die Chance hier liegt darin, effektiv für dich selbst einzutreten und zu erkennen, wann du wirklich mehr verdienst.",
    },
  },
  omnipotence: {
    name: { en: "Omnipotence", hu: "Mindenhatóság", de: "Allmacht" },
    normalText: {
      en: "You believe in your capacity to influence outcomes through effort while accepting that not everything is controllable. This balanced orientation supports resilience.",
      hu: "Hiszel abban, hogy az erőfeszítéssel befolyásolni tudod az eredményeket, miközben elfogadod, hogy nem minden kontrollálható. Ez a kiegyensúlyozott orientáció támogatja a rugalmasságot.",
      de: "Du glaubst an deine Fähigkeit, Ergebnisse durch Anstrengung zu beeinflussen, während du akzeptierst, dass nicht alles kontrollierbar ist. Diese ausgewogene Orientierung unterstützt Resilienz.",
    },
    highText: {
      en: "You believe that sufficient effort should produce any desired outcome, and that failure is therefore a personal deficiency. This creates two problems: when outcomes go wrong despite effort, the response is self-blame; and when outcomes require factors beyond your control, the belief generates frustration and over-control attempts. In sport, this pattern is linked to over-training, difficulty with team dependency, and post-injury perfectionism.",
      hu: "Úgy véled, hogy elegendő erőfeszítéssel bármilyen kívánt eredmény elérhető, és ezért a kudarc személyes hiányosság. Ez két problémát okoz: ha az eredmények az erőfeszítések ellenére rosszra fordulnak, az önvád következik; ha az eredmények befolyáson kívüli tényezőket igényelnek, a hiedelem frusztrációt és túlzott kontrollárakadésekat generál. A sportban ezt a mintát összefüggésbe hozzák a túledzéssel, a csapatfüggőséggel kapcsolatos nehézségekkel és a sérülés utáni perfekcionizmussal.",
      de: "Du glaubst, dass ausreichende Anstrengung jeden gewünschten Ausgang produzieren sollte, und dass Misserfolg daher ein persönliches Defizit ist. Dies schafft zwei Probleme: Wenn trotz Anstrengung etwas schiefgeht, folgt Selbstvorwürfe; wenn Ergebnisse Faktoren außerhalb deiner Kontrolle erfordern, erzeugt die Überzeugung Frustration und übermäßige Kontrollversuche. Im Sport ist dieses Muster mit Übertraining, Schwierigkeiten bei der Teamabhängigkeit und post-Verletzungs-Perfektionismus verbunden.",
    },
    lowText: {
      en: "You have limited belief in your capacity to influence outcomes through sustained effort. Building a strong internal locus of control — recognising the real link between consistent effort and results — is a meaningful growth area.",
      hu: "Korlátozott hited van abban, hogy erőfeszítéssel befolyásolni tudod az eredményeket. Erős belső kontrollhely kiépítése — a következetes erőfeszítés és az eredmények közötti valós kapcsolat felismerése — értelmes fejlődési terület.",
      de: "Du hast eingeschränkten Glauben an deine Fähigkeit, Ergebnisse durch anhaltende Anstrengung zu beeinflussen. Den Aufbau eines starken inneren Kontrollorts — die Erkenntnis des realen Zusammenhangs zwischen konsequenter Anstrengung und Ergebnissen — ist ein bedeutsamer Wachstumsbereich.",
    },
  },
  externalControl: {
    name: { en: "External Control / Autonomy", hu: "Külső kontroll / Autonómia", de: "Ext. Kontrolle / Autonomie" },
    normalText: {
      en: "You recognise both your agency and the genuine role of external circumstances. This balanced attribution supports adaptive coping.",
      hu: "Felismered mind a saját cselekvőképességedet, mind a külső körülmények valódi szerepét. Ez a kiegyensúlyozott attribúció adaptív megküzdést támogat.",
      de: "Du erkennst sowohl deine Handlungsfähigkeit als auch die echte Rolle externer Umstände. Diese ausgewogene Attribution unterstützt adaptives Coping.",
    },
    highText: {
      en: "Your score indicates a strong External Control orientation — a tendency to attribute outcomes primarily to luck, circumstances, or other people's decisions rather than to your own actions. While this can protect your ego from blame after poor performances, it also erodes initiative, consistency, and the motivation to develop skills, since effort feels disconnected from outcomes.",
      hu: "A pontszámod erős külső kontroll orientációt jelez — hajlamot arra, hogy az eredményeket elsősorban a szerencsének, a körülményeknek vagy mások döntéseinek tulajdonítsd, nem a saját cselekedeteinek. Bár ez megvédheti az egódat a felelősségre vonástól gyenge teljesítmény esetén, egyben aláássa a kezdeményezőkészséget, a következetességet és a készségfejlesztés motivációját, mivel az erőfeszítés elveszti kapcsolatát az eredményekkel.",
      de: "Dein Score zeigt eine starke externe Kontrollorientierung — eine Tendenz, Ergebnisse primär Glück, Umständen oder den Entscheidungen anderer Menschen zuzuschreiben, nicht deinen eigenen Handlungen. Während dies dein Ego nach schlechten Leistungen vor Schuldzuweisungen schützen kann, untergräbt es auch Initiative, Konsequenz und die Motivation zur Kompetenzentwicklung, da Anstrengung sich von Ergebnissen losgelöst anfühlt.",
    },
    lowText: {
      en: "Your score indicates an Autonomy orientation — a strong belief in your own agency and capacity to determine outcomes. This internal locus of control is a foundation for consistent effort and resilience. The balance to maintain is acknowledging genuine external factors without falling into excessive self-blame when results are outside your control.",
      hu: "A pontszámod autonómia orientációt jelez — erős hitet a saját cselekvőképességedben és az eredmények meghatározásának képességében. Ez a belső kontrollhely az állandó erőfeszítés és rugalmasság alapja. A megőrzendő egyensúly az, hogy elismerd a valódi külső tényezőket anélkül, hogy túlzott önvádba esnél, ha az eredmények kívül esnek az irányításodon.",
      de: "Dein Score zeigt eine Autonomieorientierung — einen starken Glauben an deine eigene Handlungsfähigkeit und die Fähigkeit, Ergebnisse zu bestimmen. Dieser interne Kontrollort ist eine Grundlage für konsequente Anstrengung und Resilienz. Das aufrechtzuerhaltende Gleichgewicht besteht darin, echte externe Faktoren anzuerkennen, ohne in übermäßige Selbstvorwürfe zu verfallen, wenn Ergebnisse außerhalb deiner Kontrolle liegen.",
    },
  },
};

export const DEPRESSION_PRONE_TEXT: Record<Lang, string> = {
  en: "Your combined score across all seven subscales is elevated. Research indicates that a high overall dysfunctional attitude load is associated with increased vulnerability to anxiety and depression-like symptoms in performance settings. This does not mean you have or will develop depression — it means that working with a sport psychologist or mental coach to examine these belief patterns could have a meaningful positive impact on your wellbeing and performance.",
  hu: "A hét alskála összesített pontszáma emelkedett. A kutatások szerint a magas összesített diszfunkcionális attitűd terhelés összefügg a teljesítményi helyzetekben megjelenő szorongás és depressziószerű tünetek fokozott kockázatával. Ez nem jelenti azt, hogy depressziója van vagy fejlődik ki — azt jelenti, hogy sport pszichológussal vagy mentális edzővel dolgozva e hiedelmek vizsgálata érzékelhető pozitív hatással lehet a jóllétére és teljesítményére.",
  de: "Dein kombinierter Score über alle sieben Subskalen ist erhöht. Forschungsergebnisse zeigen, dass eine hohe Gesamtbelastung durch dysfunktionale Einstellungen mit erhöhter Anfälligkeit für Angst und depressions-ähnliche Symptome in Leistungsumgebungen verbunden ist. Das bedeutet nicht, dass du eine Depression hast oder entwickeln wirst — es bedeutet, dass die Arbeit mit einem Sportpsychologen oder Mental-Coach zur Untersuchung dieser Überzeugungsmuster einen bedeutsamen positiven Einfluss auf dein Wohlbefinden und deine Leistung haben könnte.",
};
