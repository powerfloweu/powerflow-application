// app/powerflow-application/page.tsx
"use client";

import Image from "next/image";
import React from "react";

type Lang = "en" | "de" | "hu";

type CopyEntry = {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  cta: string;
  progressLabel: (current: number, total: number) => string;
  steps: string[];
  labels: {
    languagePrompt: string;
    languageHelper: string;
    fullName: string;
    email: string;
    instagram: string;
    yearsPowerlifting: string;
    bestLifts: string;
    weightClass: string;
    upcomingComps: string;
    mainBarrier: string;
    confidenceBreak: string;
    overthinking: string;
    previousWork: string;
    selfScaleHint: string;
    confidenceReg: string;
    focusFatigue: string;
    handlingPressure: string;
    competitionAnxiety: string;
    emotionalRecovery: string;
    mentalGoals: string;
    expectations: string;
    previousTools: string;
    anythingElse: string;
    consentCase: string;
    willingToPay: string;
    yes: string;
    no: string;
    submit: string;
    next: string;
    back: string;
  };
  disclaimer: string;
};

const copy: Record<Lang, CopyEntry> = {
  en: {
    heroTagline: "PowerFlow • Mental preparation for powerlifters",
    heroTitle: "Application",
    heroSubtitle:
      "Unlock your optimal performance with a structured, science-based mental coaching program designed specifically for powerlifters.",
    intro:
      "For powerlifters who want to take their mental preparation, competition mindset, and long-term development to the next level with the PowerFlow method.",
    cta: "I want to upgrade my mindset",
    progressLabel: (current: number, total: number) =>
      `Step ${current} of ${total}`,
    steps: [
      "1. Language & basics",
      "2. Powerlifting profile",
      "3. Mindset & self-assessment",
      "4. Goals & commitment",
    ],
    labels: {
      languagePrompt: "Preferred language for the form",
      languageHelper: "Choose one language to continue.",
      fullName: "Full name",
      email: "Email address",
      instagram: "Instagram handle",
      yearsPowerlifting: "How long have you been powerlifting?",
      bestLifts: "Best lifts (S/B/D – competition or gym)",
      weightClass: "Weight class",
      upcomingComps: "Upcoming competition (date)",
      mainBarrier: "Right now, what holds your performance back the most?",
      confidenceBreak: "In which situations does your confidence break?",
      overthinking: "When do you start to overthink or lose focus?",
      previousWork:
        "Have you worked with a mental coach or sports psychologist before? What helped, what didn’t?",
      selfScaleHint: "1 = very low, 10 = very high",
      confidenceReg: "Confidence regulation",
      focusFatigue: "Focus under fatigue",
      handlingPressure: "Handling pressure",
      competitionAnxiety: "Competition anxiety",
      emotionalRecovery: "Emotional recovery after bad sessions or meets",
      mentalGoals:
        "What three mental goals would you like to achieve in the next 3 months?",
      expectations:
        "What do you expect from the coaching process and from us as a team?",
      previousTools:
        "What mental strategies or tools have you used so far? How did they work?",
      anythingElse: "Anything else you’d like us to know?",
      consentCase:
        "Do you agree to the anonymous use of your case for educational purposes (e.g., supervision)?",
      willingToPay: "Are you willing to pay 75 EUR per session, after each session?",
      yes: "Yes",
      no: "No",
      submit: "Submit application",
      next: "Next",
      back: "Back",
    },
    disclaimer:
      "By submitting, you apply for 1:1 mental coaching with David Sipos (PowerFlow). Submitting does not guarantee acceptance.",
  },
  de: {
    heroTagline: "PowerFlow • Mentale Vorbereitung für Powerlifter",
    heroTitle: "PowerFlow Bewerbung",
    heroSubtitle:
      "Erreiche dein Leistungsoptimum mit einem strukturierten, wissenschaftsbasierten Mentalcoaching – speziell für Powerlifter.",
    intro:
      "Für Wettkampfs-Powerlifter:innen und ambitionierte Athlet:innen, die 1:1 an mentaler Vorbereitung, Wettkampf-Mindset und langfristiger Entwicklung mit der PowerFlow-Methode arbeiten wollen.",
    cta: "Bewerbung starten",
    progressLabel: (current: number, total: number) =>
      `Schritt ${current} von ${total}`,
    steps: [
      "1. Sprache & Basisdaten",
      "2. Powerlifting-Profil",
      "3. Mindset & Selbsteinschätzung",
      "4. Ziele & Commitment",
    ],
    labels: {
      languagePrompt: "Bevorzugte Sprache für das Formular",
      languageHelper: "Wähle eine Sprache, um fortzufahren.",
      fullName: "Vollständiger Name",
      email: "E-Mail-Adresse",
      instagram: "Instagram-Handle",
      yearsPowerlifting: "Seit wann betreibst du Powerlifting?",
      bestLifts: "Bestleistungen (K/D/B – Wettkampf oder Gym)",
      weightClass: "Gewichtsklasse",
      upcomingComps: "Bevorstehender Wettkampf (Datum)",
      mainBarrier: "Was bremst deine Leistung aktuell am meisten aus?",
      confidenceBreak: "In welchen Situationen bricht dein Selbstvertrauen?",
      overthinking: "Wann beginnst du zu überanalysieren oder Fokus zu verlieren?",
      previousWork:
        "Hast du bereits mit Mentalcoach oder Sportpsycholog:in gearbeitet? Was half, was nicht?",
      selfScaleHint: "1 = sehr niedrig, 10 = sehr hoch",
      confidenceReg: "Selbstvertrauen steuern",
      focusFatigue: "Fokus bei Ermüdung",
      handlingPressure: "Umgang mit Druck",
      competitionAnxiety: "Wettkampfangst",
      emotionalRecovery: "Emotionale Erholung nach schlechten Einheiten/Meets",
      mentalGoals:
        "Welche drei mentalen Ziele möchtest du in den nächsten 3 Monaten erreichen?",
      expectations:
        "Was erwartest du vom Coaching-Prozess und von uns als Team?",
      previousTools:
        "Welche mentalen Strategien oder Tools hast du bisher genutzt? Wie wirkten sie?",
      anythingElse: "Gibt es sonst noch etwas Wichtiges?",
      consentCase:
        "Stimmst du der anonymisierten Nutzung deines Falls zu Ausbildungszwecken zu (z. B. Supervision)?",
      willingToPay:
        "Bist du bereit, 75 EUR pro Sitzung (nach jeder Sitzung) zu zahlen?",
      yes: "Ja",
      no: "Nein",
      submit: "Bewerbung absenden",
      next: "Weiter",
      back: "Zurück",
    },
    disclaimer:
      "Mit dem Absenden bewirbst du dich für 1:1 Mentalcoaching mit David Sipos (PowerFlow). Eine Annahme ist nicht garantiert.",
  },
  hu: {
    heroTagline: "PowerFlow • Mentális felkészítés erőemelőknek",
    heroTitle: "PowerFlow Jelentkezés",
    heroSubtitle:
      "Hozd ki a maximumot egy struktúrált, tudományos alapú mentáltréninggel, kifejezetten erőemelőknek.",
    intro:
      "Versenyző és elkötelezett erőemelőknek, akik 1:1-ben dolgoznának mentális felkészülésen, verseny-mindseten és hosszú távú fejlődésen a PowerFlow módszerrel.",
    cta: "Jelentkezés indítása",
    progressLabel: (current: number, total: number) =>
      `${current}. lépés / ${total}`,
    steps: [
      "1. Nyelv és alapadatok",
      "2. Erőemelő profil",
      "3. Mentális helyzet & önértékelés",
      "4. Célok & elköteleződés",
    ],
    labels: {
      languagePrompt: "Űrlap nyelve",
      languageHelper: "Válassz egy nyelvet a folytatáshoz.",
      fullName: "Teljes név",
      email: "E-mail cím",
      instagram: "Instagram",
      yearsPowerlifting: "Mióta erőemelsz?",
      bestLifts: "Legjobb eredmények (Gugg/Fekv/Húz – verseny vagy edzőterem)",
      weightClass: "Súlycsoport",
      upcomingComps: "Következő verseny (dátum)",
      mainBarrier: "Mi fogja vissza most leginkább a teljesítményedet?",
      confidenceBreak: "Milyen helyzetekben törik meg az önbizalmad?",
      overthinking: "Mikor kezdesz túlgondolni vagy fókuszt veszíteni?",
      previousWork:
        "Dolgoztál már mentáltrénerrel vagy sportpszichológussal? Mi segített, mi nem?",
      selfScaleHint: "1 = nagyon alacsony, 10 = nagyon magas",
      confidenceReg: "Önbizalom-szabályozás",
      focusFatigue: "Fókusz fáradtan",
      handlingPressure: "Nyomáskezelés",
      competitionAnxiety: "Versenyszorongás",
      emotionalRecovery: "Érzelmi regeneráció rossz edzés vagy verseny után",
      mentalGoals:
        "Mely három mentális célt szeretnéd elérni a következő 3 hónapban?",
      expectations:
        "Mit vársz a coaching folyamattól és tőlünk csapatként?",
      previousTools:
        "Milyen mentális eszközöket használtál eddig? Hogyan működtek?",
      anythingElse: "Van még valami fontos?",
      consentCase:
        "Hozzájárulsz az eseted név nélküli felhasználásához oktatási célra (pl. szupervízió)?",
      willingToPay:
        "Vállalod, hogy 75 EUR-t fizetsz ülésenként, minden alkalom után?",
      yes: "Igen",
      no: "Nem",
      submit: "Jelentkezés elküldése",
      next: "Tovább",
      back: "Vissza",
    },
    disclaimer:
      "Az űrlap beküldésével 1:1 mentáltréningre jelentkezel David Siposhoz (PowerFlow). A felvétel nem garantált.",
  },
};

function formatCountdown(dateStr: string): string {
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return "";
  const now = new Date();
  const msDiff = target.getTime() - now.getTime();
  const days = Math.round(msDiff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Competition date has passed.";
  if (days === 0) return "Competition is today.";

  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  if (weeks === 0) return `${days} day${days === 1 ? "" : "s"} out`;
  if (remDays === 0) return `${weeks} week${weeks === 1 ? "" : "s"} out`;
  return `${weeks} week${weeks === 1 ? "" : "s"} + ${remDays} day${remDays === 1 ? "" : "s"} out`;
}

export default function PowerFlowApplicationPage() {
  const [lang, setLang] = React.useState<Lang>("en");
  const [step, setStep] = React.useState(0);
  const [nextCompDate, setNextCompDate] = React.useState<string>("");
  const [submitted, setSubmitted] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const t = copy[lang];

  const totalSteps = t.steps.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinalSubmit = async () => {
    if (step !== totalSteps - 1) return;
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      submittedAt: new Date().toISOString(),
    };

    try {
      await fetch("https://hook.eu1.make.com/afdi7p5rw9trr6242r4d52cllvzsmksm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to submit to webhook", err);
    }

    setSubmitted(true);
  };

  const steps = [
    {
      title: t.steps[0],
      content: (
        <FormCard title={t.steps[0]}>
          <div className="grid gap-6 md:grid-cols-2">
            <TextField id="fullName" label={t.labels.fullName} required />
            <TextField id="email" label={t.labels.email} type="email" required />
            <TextField id="instagram" label={t.labels.instagram} />
          </div>

          <div className="mt-6">
            <FieldLabel
              label={t.labels.languagePrompt}
              description={t.labels.languageHelper}
              required
            />
            <div className="mt-3 flex flex-wrap gap-4">
              <RadioPill
                name="language"
                value="en"
                label="English"
                icon={<span aria-hidden>🇬🇧</span>}
                checked={lang === "en"}
                onChange={() => setLang("en")}
              />
              <RadioPill
                name="language"
                value="de"
                label="Deutsch"
                icon={<span aria-hidden>🇩🇪</span>}
                checked={lang === "de"}
                onChange={() => setLang("de")}
              />
              <RadioPill
                name="language"
                value="hu"
                label="Magyar"
                icon={<span aria-hidden>🇭🇺</span>}
                checked={lang === "hu"}
                onChange={() => setLang("hu")}
              />
            </div>
          </div>
        </FormCard>
      ),
    },
    {
      title: t.steps[1],
      content: (
        <FormCard title={t.steps[1]}>
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              id="yearsPowerlifting"
              label={t.labels.yearsPowerlifting}
              required
              hint="Years"
            />
            <TextField
              id="bestLifts"
              label={t.labels.bestLifts}
              required
              hint="In competition — Squat / Bench / Deadlift"
            />
            <TextField
              id="weightClass"
              label={t.labels.weightClass}
              hint="e.g., -83 kg"
            />
            <TextField
              id="federation"
              label="Federation"
              hint="e.g., IPF, USAPL, GPC"
            />
            <div className="space-y-2">
              <TextField
                id="upcomingComps"
                label={t.labels.upcomingComps}
                type="date"
                onChange={(e) => setNextCompDate(e.target.value)}
                value={nextCompDate}
                hint="Date of next competition"
                showPickerButton
              />
              {nextCompDate && (
                <p className="pl-1 text-sm font-saira text-purple-300">
                  {formatCountdown(nextCompDate)}
                </p>
              )}
            </div>
          </div>
        </FormCard>
      ),
    },
    {
      title: t.steps[2],
      content: (
        <>
          <FormCard title={t.steps[2]}>
            <TextareaField
              id="mainBarrier"
              label={t.labels.mainBarrier}
              required
            />
            <TextareaField
              id="confidenceBreak"
              label={t.labels.confidenceBreak}
              required
            />
            <TextareaField
              id="overthinking"
              label={t.labels.overthinking}
              required
            />
            <TextareaField
              id="previousWork"
              label={t.labels.previousWork}
              required
            />
          </FormCard>

          <FormCard title="Self-assessment">
            <p className="font-saira text-xs text-zinc-400">
              {t.labels.selfScaleHint}
            </p>
            <div className="mt-5 space-y-5">
              <ScaleRow name="confidenceReg" label={t.labels.confidenceReg} />
              <ScaleRow name="focusFatigue" label={t.labels.focusFatigue} />
              <ScaleRow
                name="handlingPressure"
                label={t.labels.handlingPressure}
              />
              <ScaleRow
                name="competitionAnxiety"
                label={t.labels.competitionAnxiety}
              />
              <ScaleRow
                name="emotionalRecovery"
                label={t.labels.emotionalRecovery}
              />
            </div>
          </FormCard>
        </>
      ),
    },
    {
      title: t.steps[3],
      content: (
        <FormCard title={t.steps[3]}>
          <TextareaField
            id="mentalGoals"
            label={t.labels.mentalGoals}
            required
          />
          <TextareaField
            id="expectations"
            label={t.labels.expectations}
            required
          />
          <TextareaField
            id="previousTools"
            label={t.labels.previousTools}
            required
          />
          <TextareaField
            id="anythingElse"
            label={t.labels.anythingElse}
          />

          <div className="space-y-6 pt-4">
            <CheckboxGroup
              name="consentCase"
              label={t.labels.consentCase}
              required
              options={[
                { value: "yes", label: t.labels.yes },
                { value: "no", label: t.labels.no },
              ]}
            />
            <CheckboxGroup
              name="willingToPay"
              label={t.labels.willingToPay}
              required
              options={[
                { value: "yes", label: t.labels.yes },
                { value: "no", label: t.labels.no },
              ]}
            />
          </div>

          <p className="mt-6 text-center font-saira text-[11px] text-zinc-500">
            {t.disclaimer}
          </p>
        </FormCard>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-black/40 to-black/0">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Image
              src="/fm_powerflow_logo_verziok_02_negatív.png"
              alt="PowerFlow logo"
              width={240}
              height={240}
              className="h-24 w-24 drop-shadow-[0_10px_40px_rgba(124,58,237,0.35)] sm:h-40 sm:w-40"
              priority
            />
          </div>
          <div className="mt-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-600/20 via-fuchsia-500/15 to-transparent px-6 py-8 shadow-[0_30px_120px_rgba(126,34,206,0.25)] sm:px-10 sm:py-10">
            <div className="pointer-events-none absolute left-1/2 top-12 h-40 w-40 -translate-x-1/2 rounded-full bg-purple-500/25 blur-3xl" />
            <div className="pointer-events-none absolute right-10 bottom-8 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-3xl" />
            <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/90">
              {t.heroTagline}
            </p>
            <h1 className="mt-4 font-saira text-4xl font-extrabold uppercase tracking-[0.16em] sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl font-saira text-sm text-zinc-100 sm:text-base">
              {t.heroSubtitle}
            </p>
            <a
              href="#application-form"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
            >
              {t.cta}
            </a>
          </div>
        </div>
      </section>

      {/* Intro strip */}
      <section className="border-b border-white/5 bg-[#0B0C10]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="font-saira text-sm text-zinc-300 sm:text-base">{t.intro}</p>
        </div>
      </section>

      {/* Form */}
      <section
        id="application-form"
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"
      >
        {submitted ? (
          <div className="space-y-6 rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-600/20 via-fuchsia-500/10 to-transparent p-8 text-center shadow-[0_30px_120px_rgba(126,34,206,0.25)]">
            <div className="flex justify-center">
              <Image
                src="/fm_powerflow_logo_verziok_01_negatív.png"
                alt="PowerFlow crest logo"
                width={200}
                height={200}
                className="h-20 w-20 sm:h-24 sm:w-24"
              />
            </div>
            <h2 className="font-saira text-2xl font-bold uppercase tracking-[0.16em] text-white">
              Application received
            </h2>
            <p className="font-saira text-sm text-zinc-200 sm:text-base">
              A member of the PowerFlow team will contact you to schedule a free
              15–20 minute intro call to get to know you better and see if we’re a good fit.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setStep(0);
                setNextCompDate("");
              }}
              className="rounded-full border border-purple-500/60 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-purple-100 transition hover:border-purple-400"
            >
              Back to form
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-2">
              <p className="font-saira text-xs uppercase tracking-[0.18em] text-purple-200">
                {t.progressLabel(step + 1, totalSteps)}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-saira text-sm text-zinc-300">{t.steps[step]}</p>
            </div>

            <form
              ref={formRef}
              className="space-y-8"
              onSubmit={(e) => e.preventDefault()}
              noValidate
            >
              <div className="flex justify-center">
                <Image
                  src="/fm_powerflow_logo_verziok_01_negatív.png"
                  alt="PowerFlow crest logo"
                  width={200}
                  height={200}
                  className="h-20 w-20 sm:h-24 sm:w-24"
                />
              </div>

              {steps.map((item, idx) => (
                <div
                  key={item.title}
                  style={{ display: idx === step ? "block" : "none" }}
                >
                  {item.content}
                </div>
              ))}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 0}
                  className="rounded-full border border-purple-500/50 px-6 py-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] text-purple-200 transition hover:border-purple-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
                >
                  {t.labels.back}
                </button>
                {step < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
                  >
                    {t.labels.next}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
                  >
                    {t.labels.submit}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

/* --- Presentational subcomponents --- */

type FormCardProps = {
  title: string;
  children: React.ReactNode;
};

function FormCard({ title, children }: FormCardProps) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#13151A] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55)] sm:p-8">
      <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
        {title}
      </h2>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: string;
  showPickerButton?: boolean;
};

function TextField({
  id,
  label,
  description,
  required,
  type = "text",
  hint,
  onChange,
  value,
  showPickerButton,
}: TextFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleOpenPicker = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="space-y-2">
      <FieldLabel
        label={label}
        description={description}
        required={required}
        hint={hint}
      />
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={type}
          required={required}
          onChange={onChange}
          value={value}
          className="w-full rounded-xl border border-zinc-700/70 bg-[#0D0F14] px-3 py-2.5 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
        />
        {type === "date" && showPickerButton && (
          <button
            type="button"
            onClick={handleOpenPicker}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/50 bg-[#0D0F14] text-purple-200 transition hover:border-purple-400 hover:text-white"
          >
            📅
          </button>
        )}
      </div>
    </div>
  );
}

type TextareaFieldProps = {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  hint?: string;
};

function TextareaField({
  id,
  label,
  description,
  required,
  hint,
}: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel
        label={label}
        description={description}
        required={required}
        hint={hint}
      />
      <textarea
        id={id}
        name={id}
        required={required}
        rows={4}
        className="w-full rounded-xl border border-zinc-700/70 bg-[#0D0F14] px-3 py-2.5 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
      />
    </div>
  );
}

type FieldLabelProps = {
  label: string;
  description?: string;
  required?: boolean;
  hint?: string;
};

function FieldLabel({ label, description, required, hint }: FieldLabelProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
        <span>{label}</span>
        {hint && <Hint text={hint} />}
        {required && <span className="ml-1 text-purple-300">*</span>}
      </label>
      {description && (
        <p className="font-saira text-[11px] text-zinc-500">{description}</p>
      )}
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center" tabIndex={0}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-purple-400/60 bg-white/5 text-[10px] text-purple-200">
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md bg-[#0B0C10] px-3 py-2 text-[11px] text-zinc-100 shadow-lg ring-1 ring-purple-500/50 group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

type RadioPillProps = {
  name: string;
  value: string;
  label: string;
  checked?: boolean;
  onChange?: () => void;
  icon?: React.ReactNode;
};

function RadioPill({
  name,
  value,
  label,
  checked,
  onChange,
  icon,
}: RadioPillProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700/80 bg-[#0D0F14] px-4 py-2 text-xs font-saira text-zinc-100 transition hover:border-purple-400">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-3 w-3 rounded-full border border-zinc-500 text-purple-500 focus:ring-purple-500"
      />
      <span className="flex items-center gap-2 tracking-[0.12em] uppercase">
        {icon}
        {label}
      </span>
    </label>
  );
}

type ScaleRowProps = {
  name: string;
  label: string;
  description?: string;
};

function ScaleRow({ name, label, description }: ScaleRowProps) {
  const scale = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
            {label}
          </p>
          {description && (
            <p className="font-saira text-[11px] text-zinc-500">
              {description}
            </p>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500 sm:mt-0">
          <span>1</span>
          <div className="h-px flex-1 bg-zinc-700/70" />
          <span>10</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {scale.map((value) => (
          <label
            key={value}
            className="inline-flex cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={value}
              className="peer sr-only"
            />
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/80 bg-[#0D0F14] text-[11px] font-saira text-zinc-100 transition hover:border-purple-400 peer-checked:scale-110 peer-checked:border-purple-400 peer-checked:bg-purple-500 peer-checked:text-white peer-checked:shadow-[0_0_25px_rgba(168,85,247,0.35)]">
              {value}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

type CheckboxGroupProps = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  options: { value: string; label: string }[];
};

function CheckboxGroup({
  name,
  label,
  description,
  required,
  options,
}: CheckboxGroupProps) {
  return (
    <div className="space-y-3">
      <FieldLabel label={label} description={description} required={required} />
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-700/80 bg-[#0D0F14] px-4 py-2 font-saira text-xs text-zinc-100 transition hover:border-purple-400"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              required={required}
              className="h-3 w-3 border-zinc-500 text-purple-500 focus:ring-purple-500"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
