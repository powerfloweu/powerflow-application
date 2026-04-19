// Narrative interpretations per factor per band.
// Source: SAT_Eng_Script.docx (PowerFlow's interpretation library).
// All text is authored by David Sipos; copy edits here must preserve meaning.
//
// Structure:
//   INTRO               — site-wide intro copy
//   FACTORS[name]:
//     definition        — what the factor measures, shown above the band copy
//     bands.low/avg/high — narrative per band. Each band is an array of paragraphs.
//
// Subfactors (Self-confirmation etc.) are numeric-only in the workbook and do not
// have narrative copy in the source script. They are surfaced as raw scores + band
// labels only until custom narrative is added.

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
};

// Factor interpretations below map each of the 11 factors → 3 bands (low / average / high).
// Text is drawn from SAT_Eng_Script.docx and lightly edited for consistency.
// Some factors in the source document use finer-grained tiers (e.g. Defensiveness has
// 6–8 / 9–11 / 12–15 sub-tiers inside HIGH). The finer tiers are folded into the single
// band they fall into — future iterations can add sub-tier narratives if the product needs it.

export const FACTORS: Record<FactorName, FactorInterpretation> = {
  Performance: {
    definition: {
      en:
        "The need for achievement — the inner drive to create, to compete, to prove our abilities to ourselves and others. Performance is the constant testing of our own capabilities and the motivation to achieve better results.",
    },
    bands: {
      low: {
        en: [
          "You don't go to extremes at work; you perform to the level that is necessary. You don't aspire to great things, it isn't particularly important for you to excel, and you don't like to compete.",
          "Being accepted as a human being matters more to you than becoming a workaholic. Family and relationships are your priority. You work best in a warm environment and prefer to execute tasks rather than invent them.",
          "You like to separate work and personal life. You don't tolerate overtime well, and you know how important personal time is. Reflect on what you've achieved so far and whether your current actions line up with your goals.",
          "You'll show up to a certain level, but without appreciation you can become demotivated. Work isn't the only thing in your life, and you don't like to feel that it is.",
        ],
      },
      average: {
        en: [
          "Being appreciated for what you do is important to you — and intrinsic motivation matters. You like to work, but you need to love what you do. You need feedback and specific goals. Work is a necessity and sometimes a source of meaning, but sometimes you'd rather do something else entirely.",
          "When the workload gets too heavy you don't cope well, but you still try to give your best to the tasks you're given.",
          "It is your responsibility to find a vocation in which you can fulfil yourself.",
          "You start new tasks with enthusiasm and are motivated by opportunities to develop, advance or create. Accept that there will be a bumpy road to success — learn to enjoy the hard parts of the journey.",
        ],
      },
      high: {
        en: [
          "Work and productivity are especially valuable to you. You like challenges, competition and entrepreneurship. Your intrinsic motivation to achieve is stronger than average.",
          "You have good resilience, but a high level of emotional stress can quickly lead to burnout. Find activities that release tension effectively. Finding work-life balance is your challenge — it's up to you to decide which takes priority.",
          "You can stir incredible energy in yourself when motivated, give maximum effort under pressure, and experience success as a person. Recognition matters to you. When you can, hold back a little — don't undervalue personal time, select your tasks well, and practice saying no.",
          "You're not afraid of work and you like a challenge, but too much responsibility can be stressful, especially if you don't fully understand why you're doing what you're doing. Make space for rest so the waves don't crash over your head.",
        ],
      },
    },
  },

  Affiliation: {
    definition: {
      en:
        "The need to belong — to be part of a community, to build human relationships. It measures how much we seek the company of others and how important human connection is to us. It is a concept similar to intimacy, involving physical closeness, eye contact and openness.",
    },
    bands: {
      low: {
        en: [
          "Family and a few friends are important to you, but opening up is difficult. You are more introverted and prefer to surround yourself with fewer people who matter to you. You like to keep work and private life separate, and making friends at work is not a priority.",
          "Trust takes time. People can wear you down, and you don't give out much information about yourself. Given enough space you can be effective at work and thrive in seclusion; even when you're around people, you don't necessarily open up.",
          "You need time alone. You prefer working alone and figuring things out for yourself. Communicate this need to those around you in the right way — you tend toward self-reflection, and that can look like selfishness to others.",
          "In company you start as an observer. You can adapt to others, but adapting doesn't always come naturally.",
        ],
      },
      average: {
        en: [
          "You value relationships and friendship. You're comfortable in both small and large groups, but you also have a strong need for privacy. There are times when you don't feel like socialising — but when you do, you're an integral part of the group. You have a few important people you'd do almost anything for.",
          "You're direct with people; until given a reason otherwise you tend to trust. You need solitude to reflect on what has happened. A good company can define your day, and you aim to build friendships at work.",
          "A little kindness and courtesy on your part goes a long way. You can function alone for long periods, but harmony — often with a partner or close company — matters to you. You manage well on your own, probably with fewer but deeper friendships.",
        ],
      },
      high: {
        en: [
          "You're one of the engines of the group. You speak your mind openly and inspire others. You need a secure, warm atmosphere at work — friendship and work blur together.",
          "Once you've settled into a circle, people know they can turn to you for advice. You experience other people's success as your own and flourish in a good community where people strengthen each other.",
          "You're a team player and more confident with others. You need your friends and family — you don't feel complete without them. Take care of yourself too: awareness of your own needs lets you best support others.",
          "You can work with others much more effectively than alone. Be careful not to become dependent on anyone, and always express your own opinion even when it diverges from the group. Make your own decisions and be honest with yourself.",
        ],
      },
    },
  },

  Aggression: {
    definition: {
      en:
        "The degree of aggression shows how directly we assert ourselves and how we handle our own anger. It is not always a \"negative\" trait — survival and progress are hard to imagine without it. Suppressed aggression can make us ill; excessive expression can damage our image.",
    },
    bands: {
      low: {
        en: [
          "You are far from aggressive self-assertion, and you prefer to avoid conflict. In the long run this can make you ill if you judge a situation as unfair and don't express it. People still respect you when you stand up for yourself — speaking your mind can move situations forward.",
          "You don't like conflict in principle, but you can hold stubbornly to what matters to you. You are fundamentally calm, but injustice can trigger a strong reaction. You're a compromise-seeker and problem-solver.",
          "Sometimes it's OK to defend yourself and take up conflict — it strengthens self-belief, and when you get your point across you gain respect. Standing up for yourself doesn't make you a bad person. Consider where being more assertive would serve you better.",
        ],
      },
      average: {
        en: [
          "When you feel threatened, you defend your rights directly or indirectly. If you disagree, you voice it. Showing your emotions is not difficult for you, and you generally control them well.",
          "Be careful not to put your tension on someone who isn't the cause. Address the behaviour, not the person — say how it made you feel and what the consequences were.",
          "Sometimes you can be blunt in your self-assertion without intending to hurt others. At other times you may repress tension that built up during the day, which can have physical symptoms. Be aware that a sudden, harsh tone can demotivate people.",
        ],
      },
      high: {
        en: [
          "You can sometimes surprise yourself with how vehemently you defend your rights or snap at things. Your assertiveness can tip into aggression — partly an effect of the ambitious side of your personality.",
          "Strive for win-win situations where both positions converge, or leave those who hurt you alone. Don't make your self-worth depend on such people.",
          "You may suppress emotions or tension that built up during the day, which can have physical symptoms. Take time for yourself and talk to someone about problems — otherwise anger can surface at the wrong moment.",
        ],
      },
    },
  },

  Defensiveness: {
    definition: {
      en:
        "This need is about self-protection — physically, but more often metaphorically: the protection of self-esteem, self-respect, self-image and positive self-perception. An extreme defensive tendency can lead to self-esteem disorders.",
    },
    bands: {
      low: {
        en: [
          "You can accept constructive criticism and can be hard on yourself. You see failure as an opportunity for improvement, and you dislike situations where you could be ridiculed in front of others.",
          "You're largely aware of how others see you. You don't usually feel the need to explain yourself — though living with blame isn't always easy. You make room for the opinions and ideas of others.",
          "There are situations where you're much better off standing up for yourself and defending your position — doing so empowers you.",
        ],
      },
      average: {
        en: [
          "Your self-confidence is broadly stable, but from time to time you need affirmation from a few people important to you. You're able to admit when you've made a mistake.",
          "You defend yourself when you need to but generally avoid conflict and blame. You don't talk easily to others about your problems — be careful not to leave anything unfinished or unresolved within yourself.",
        ],
      },
      high: {
        en: [
          "You like to explain situations whenever possible, and you keep things to yourself rather than letting the outside world know about your problems — sometimes until you are on the verge of exhaustion. You need one-to-one affirmation; your confidence isn't always stable.",
          "You can be quite hard on yourself, and you tolerate criticism less easily than most. You are quite self-conscious and take problems upon yourself that you cannot change. Be aware: you are valuable in yourself, and no one can take that away. You must be yourself first — and everyone else will be more accepting of you.",
          "Continual reassurance matters to your self-confidence. You don't like being forced into unfamiliar situations or not fully understanding what's happening. Try to develop a stable image of yourself without letting others influence it too much. Your confidence must come from within — through taking risks and achieving success.",
        ],
      },
    },
  },

  Consciousness: {
    definition: {
      en:
        "Shows how much we care about the moral consequences of our actions, the opinions of others, and the extent to which we accept blame and criticism. It is also a measure of how quickly we can get over a situation and how much energy is tied up in dealing with the past.",
    },
    bands: {
      low: {
        en: [
          "You are a less inhibited person who does rather than thinks. You get over minor or major slip-ups and occasional rule-breaking easily. You don't worry about small things. You act according to your own inner compass.",
          "Some inhibitions exist and you can sometimes overcome them. Your mood can shift suddenly and you may be inclined to extremes. You don't take injustice well — loyalty and morality matter to you, but you don't let them dominate.",
        ],
      },
      average: {
        en: [
          "If you get into a conflict or make a mistake, don't always take it personally. Most mistakes can be corrected and often aren't due to your own lack of ability.",
          "You like your work done to the best of your ability — but that requires inner balance, achieved by not letting minor conflicts throw you off. You can make quick decisions when needed, though sometimes you spend a lot of time weighing alternatives. You typically seek the opinion of important people before big decisions.",
        ],
      },
      high: {
        en: [
          "Very conscientious: you care deeply about justice, honesty, loyalty and morality. You are a careful reflector, prone to judgement. You almost always seek the opinion of trusted people before important decisions.",
          "You may worry more than necessary, or dwell on the past, or blame yourself for things that aren't your fault. Direct your energy toward what you can change — it is not always your personal failure.",
          "If you get into a conflict, don't always take it personally. Most mistakes can be corrected. You do your work conscientiously across the board — protect your inner balance by not letting minor conflicts derail your rhythm.",
        ],
      },
    },
  },

  Dominance: {
    definition: {
      en:
        "The need to control and lead others. A dominant person dominates a given situation and can impose their will on others. Ultimately this is the need that drives a person toward power. It exists in everyone, just to different degrees.",
    },
    bands: {
      low: {
        en: [
          "You are not a dominant type — controlling others is less important to you. You can perform well as a subordinate. Having too much responsibility for others can stress you.",
          "You let others assert themselves and you're not particularly proactive in a group. You speak your mind when asked and are willing to change — you can be persuaded. You're fundamentally adaptable and far from oppressive.",
          "Standing up for your own interests can be difficult. Being above others isn't your goal, and it doesn't bother you when someone is better at something than you.",
        ],
      },
      average: {
        en: [
          "You take control when the situation calls for it, and it bothers you when someone doesn't give their best. You can become an effective leader by finding your voice with people. You like to guide and advise — a strong advantage.",
          "You bring a team together well and you don't resist change; you see it as a challenge and an opportunity. Feeling mentally superior and \"good\" can be important feedback that you're on the right track.",
          "You can \"bang the table\" when necessary. You have leadership ambition — you just might not fully believe it about yourself yet.",
        ],
      },
      high: {
        en: [
          "You bring others together, lead, and speak for the group. You find joy in helping others — and should be aware that you don't have to be the best at everything.",
          "You have a strong sense of self-assertion and take control quickly. It bothers you when things don't go your way. You enjoy both mental and physical challenges and take pleasure in overcoming others. Competition is inner affirmation.",
          "You have real leadership qualities and should seek opportunities to develop them. Knowing people and their reactions — and setting an example — is essential to leading well.",
        ],
      },
    },
  },

  Exhibition: {
    definition: {
      en:
        "The desire to appear — to show oneself and attract attention. This need is present in everyone, even if many hide it or think it shameful. Presenting ourselves and building our personal brand is necessary in all aspects of life — it's how individuals show the value of their work, personality and worldview.",
    },
    bands: {
      low: {
        en: [
          "You avoid being the centre of attention. Appearances are less important to you, and the desire to be seen is far from you. You judge people by personality rather than looks. You're not the speaker in a group.",
          "You can stand up to others, but it doesn't always come easily. You prefer assignments where acting isn't your priority — you're a specialist in the background processes.",
        ],
      },
      average: {
        en: [
          "You care about how you dress and present yourself, and you have no difficulty expressing your opinion or representing others. You don't like being overly visible unless you need to be. You're more of a backroom specialist.",
        ],
      },
      high: {
        en: [
          "You can speak openly about yourself. You're a kind of spokesperson in the group — you can stand up and represent your own interests, and being on stage isn't far from you.",
          "You like to be fastidious and aesthetic; you care about your appearance because you know it reflects on you and influences others. Make sure what you say is understood as you meant it — think before you speak.",
          "Regularity and fastidiousness matter to you in both dress and work. Your work should reflect this attitude — it paints a picture of you. Develop your communication and presentation skills as high as possible; they will contribute greatly to successful self-management.",
        ],
      },
    },
  },

  Autonomy: {
    definition: {
      en:
        "Independence, self-reliance, acting according to one's own will and inner compass. Autonomous individuals choose their own goals rather than being dependent on external forces. This need is universal but specific to each individual in different degrees.",
    },
    bands: {
      low: {
        en: [
          "You need to understand why you're doing what you're doing, and you want a clear purpose and task. You're able to work by rules set by others — it doesn't cause tension — and you prefer a framework over too much freedom.",
          "Rules give you security. You can be creative when needed, but you don't want to reinvent everything — you're fine with others setting goals for you. You don't usually go your own way; you follow others and give in to their opinions.",
        ],
      },
      average: {
        en: [
          "You have innovative ideas and can work independently, but you can also complete tasks or follow directions. You generally get along with people and give in to others' opinions, though you can make independent decisions when necessary.",
          "You accept rules — you don't want to question every decision and process — but there are some things you like to do your own way. You can follow a plan set by another without questioning everything.",
          "You crave independence but can delegate decisions to others. You have ideas but tend to share them when asked, rarely taking the initiative.",
        ],
      },
      high: {
        en: [
          "You have a particular need for independence. You decide for yourself what you follow, what you like, and what you reject — in your lifestyle, appearance and principles. You make your own rules and stick to them even when they cause conflict.",
          "You like to go your own way, see situations realistically and make your own decisions. You yearn for independence and can become stubborn if something is forced on you. Be aware that opinions different from your own can help — be open to honesty.",
        ],
      },
    },
  },

  Caregiving: {
    definition: {
      en:
        "A supportive interaction — the motivation to care for others, make their lives better. It often involves identification and personal attachment. Caring isn't just willpower; it comes from emotional saturation and values.",
    },
    bands: {
      low: {
        en: [
          "You may sometimes appear cold, but that's because you're very selective about who you let close. Family is important, but not always the most important — you can make sacrifices for work in this area.",
          "You don't like to show or talk about your feelings to anyone.",
        ],
      },
      average: {
        en: [
          "You are not typically \"motherly\". Your own interests are important, but you will help when needed. You have a sense of caring but know that not everyone deserves it. You're happy to help those who are important to you; you can take a back seat when the situation requires.",
          "There are few people to whom you'll give your time and energy — you're selective. Developing empathy can mean a lot for your acceptance and well-being. Helping others can be a way to experience happiness.",
          "When you do help, it takes energy — don't let it disorient your attention or hinder your own work. Decide wisely whom to give attention to; your energy is finite. Giving matters, but so does receiving — and so does time for yourself.",
        ],
      },
      high: {
        en: [
          "You love people and animals alike. When you have the opportunity, you're happy to care for others and give. You also have your own needs — not everyone deserves your attention.",
          "You are very helpful even with new people if they're sympathetic. You would do almost anything for those close to you. You may help many people even at the expense of your own time and energy — it gives you pleasure and is a form of inner affirmation. Be careful it doesn't distract you too much.",
          "Assertiveness includes the ability to say no. The care you show must come from somewhere — remember you have needs too.",
        ],
      },
    },
  },

  Order: {
    definition: {
      en:
        "Rationality, precision and regularity. Order and cleanliness of our immediate environment is to some extent a basic necessity. Its meaning extends beyond that — to the need to integrate knowledge and memories into a coherent whole. It is a driving force of cognition.",
    },
    bands: {
      low: {
        en: [
          "Being informal, flexible and having more room to manoeuvre than the average person is important to you. You run the risk of becoming distracted if you overcommit or lose focus. Pay attention to the areas of life where you do need a stricter regime.",
        ],
      },
      average: {
        en: [
          "You like to see things through and have a need for self-development and for avoiding mistakes. You structure your processes and plan continuously to succeed. You may sometimes overlook things — take a few minutes to rest before continuing when you feel tired or unfocused.",
          "You're not a neat freak; you don't need organisation and planning in everything. You like to understand the system around you. You don't like very strict rules and frameworks — you need freedom to work effectively.",
          "Try to approach a problem from as many perspectives as possible to get a fuller picture.",
        ],
      },
      high: {
        en: [
          "A higher value can indicate an increased need for order and cleanliness — in extreme cases what psychologists consider a form of compulsiveness.",
          "You need cleanliness and order around you. You like to know the system, to understand why you do what you do, but you don't need to inspect every detail. You see through processes, and it bothers you when someone isn't as systematic as you.",
          "You like everything tidy and happening as you imagined it. You pay attention to the cleanliness of your surroundings. You want to understand the systems around you.",
          "You are perceptive and have a need to improve and avoid mistakes. You demand well-structured, clear tasks. You like to see things through and prefer things in their proper place.",
        ],
      },
    },
  },

  Helplessness: {
    definition: {
      en:
        "Refers to the extent to which we need the help, care and compassion of others. Asking for help also means being aware of our own and others' capabilities — having assessed our limits, not being afraid to involve others when problems arise.",
    },
    bands: {
      low: {
        en: [
          "Very low scorers prefer to withdraw and \"lick their wounds\" in the face of illness or failure. That pattern is as characteristic of proud people as of shy ones.",
          "You are not a team player in this respect; you prefer to solve problems alone at first, asking for help only when you fail or feel you lack knowledge. Asking for help doesn't make you worse or less capable. Joining forces can speed up your work and doesn't diminish you.",
          "Sometimes you can feel alone in the face of the world. Admitting you can't do something alone is hard; you don't want to depend on others or burden them. Sometimes asking for help genuinely makes the situation easier — and there are many people who like to help.",
        ],
      },
      average: {
        en: [
          "You don't easily share your problems. You sometimes ignore inner tension, and sometimes it comes out. Prevention matters — take time for yourself and the things that are important to you, or you risk burnout.",
          "You don't like to burden others with your problems and prefer to solve situations yourself. Consider where asking for help can speed up your work without making you \"less\". Map out which tasks benefit most from collaboration.",
          "Excessive stress may also show up as physical symptoms.",
        ],
      },
      high: {
        en: [
          "A high need for help can lead to \"nagging\", dramatic symptoms of illness, and exaggeration of difficulties — in pursuit of the care one feels they need.",
          "You can ask for help and rely on others. You feel when you can't solve a problem alone. Being cared for matters to you — there may be quite a few things you prefer not to do alone and would rather do as a team. But some decisions only you can make, and they are never easy.",
          "A few important people in your life feel indispensable, and you may rely on them more than is good for you. Reinforce in yourself that you are valuable in your own right and capable of what you set your mind to. You may be reluctant to talk about yourself — you know who to turn to, and it matters that those you rely on really know you.",
          "Sometimes you feel alone when facing problems and need support in difficult situations. Be careful not to depend on any single person — you are very valuable in your own right.",
        ],
      },
    },
  },
};
