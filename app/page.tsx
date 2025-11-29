// app/powerflow-application/page.tsx
"use client";

import React from "react";

export default function PowerFlowApplicationPage() {
  return (
    <div className="min-h-screen bg-[#050608] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-black/40 to-black/0">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300/80">
            PowerFlow • Mental preparation for powerlifters
          </p>
          <h1 className="mt-5 font-saira text-4xl font-extrabold uppercase tracking-[0.16em] sm:text-5xl">
            PowerFlow Application
          </h1>
          <p className="mt-6 max-w-2xl font-saira text-sm text-zinc-300 sm:text-base">
            Unlock your optimal performance with a structured, science-based
            mental coaching program designed specifically for powerlifters.
          </p>
          <a
            href="#application-form"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
          >
            Apply now
          </a>
        </div>
      </section>

      {/* Intro strip */}
      <section className="border-b border-white/5 bg-[#0B0C10]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="font-saira text-sm text-zinc-300">
            This application form is for competitive powerlifters and serious
            lifters who want to work 1:1 on their mental preparation, competition
            mindset and long-term development using the PowerFlow method.
          </p>
        </div>
      </section>

      {/* Form */}
      <section
        id="application-form"
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <form
          className="space-y-8"
          // TODO: connect to your backend / 3rd party endpoint
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Section 1 */}
          <FormCard title="1. Basic information">
            <div className="grid gap-6 md:grid-cols-2">
              <TextField
                id="fullName"
                label="Full name"
                description="Vollständiger Name • Teljes név"
                required
              />
              <TextField
                id="email"
                label="Email address"
                type="email"
                description="E-Mail-Adresse • E-mail cím"
                required
              />
              <TextField
                id="instagram"
                label="Instagram handle (optional)"
                description="Instagram-Profil • Instagram felhasználónév"
              />
              <TextField
                id="countryTimezone"
                label="Country and time zone"
                description="Land und Zeitzone • Ország és időzóna"
                required
              />
            </div>

            <div className="mt-6">
              <FieldLabel
                label="Preferred language for coaching"
                description="Bevorzugte Sprache • Előnyben részesített nyelv"
                required
              />
              <div className="mt-3 flex flex-wrap gap-4">
                <RadioPill name="language" value="en" label="English" />
                <RadioPill name="language" value="de" label="Deutsch" />
                <RadioPill name="language" value="hu" label="Magyar" />
              </div>
            </div>
          </FormCard>

          {/* Section 2 */}
          <FormCard title="2. Powerlifting profile">
            <div className="grid gap-6 md:grid-cols-2">
              <TextField
                id="yearsPowerlifting"
                label="How long have you been powerlifting?"
                description="Seit wann betreibst du Powerlifting? • Mióta erőemelsz?"
                required
              />
              <TextField
                id="bestLifts"
                label="Best lifts (S/B/D – competition or gym)"
                description="Bestleistungen • Legjobb eredmények"
                required
              />
              <TextField
                id="weightClass"
                label="Weight class / federation"
                description="Gewichtsklasse / Verband • Súlycsoport / szövetség"
              />
              <TextField
                id="upcomingComps"
                label="Upcoming competitions (date, place)"
                description="Bevorstehende Wettkämpfe • Közelgő versenyek"
              />
            </div>
          </FormCard>

          {/* Section 3 */}
          <FormCard title="3. Performance & mental barriers">
            <TextareaField
              id="mainBarrier"
              label="Right now, what holds your performance back the most?"
              description="Was bremst deine Leistung aktuell am meisten aus? • Mi fog vissza most a legjobban?"
              required
            />
            <TextareaField
              id="confidenceBreak"
              label="In which situations does your confidence usually break?"
              description="In welchen Situationen bricht dein Selbstvertrauen ein? • Milyen helyzetekben törik meg az önbizalmad?"
              required
            />
            <TextareaField
              id="overthinking"
              label="When do you start to overthink or lose focus?"
              description="Wann beginnst du zu überanalysieren oder die Konzentration zu verlieren? • Mikor kezdesz túlgondolni vagy fókuszt veszíteni?"
              required
            />
            <TextareaField
              id="previousWork"
              label="Have you worked with a mental coach or sports psychologist before? What helped, and what didn’t?"
              description="Hast du bereits mit einem Mentalcoach oder Sportpsychologen gearbeitet? • Dolgoztál már mentáltrénerrel vagy sportpszichológussal?"
              required
            />
          </FormCard>

          {/* Section 4 */}
          <FormCard title="4. Self-assessment (1–10)">
            <p className="font-saira text-xs text-zinc-400">
              1 = very low, 10 = very high • 1 = sehr niedrig, 10 = sehr hoch •
              1 = nagyon alacsony, 10 = nagyon magas
            </p>
            <div className="mt-5 space-y-5">
              <ScaleRow
                name="confidenceReg"
                label="Confidence regulation"
                description="Selbstvertrauen steuern • Önbizalom-szabályozás"
              />
              <ScaleRow
                name="focusFatigue"
                label="Focus under fatigue"
                description="Fokus bei Ermüdung • Fókusz fáradtan"
              />
              <ScaleRow
                name="handlingPressure"
                label="Handling pressure"
                description="Umgang mit Druck • Nyomáskezelés"
              />
              <ScaleRow
                name="competitionAnxiety"
                label="Competition anxiety"
                description="Wettkampfangst • Versenyszorongás"
              />
              <ScaleRow
                name="emotionalRecovery"
                label="Emotional recovery after bad sessions or meets"
                description="Emotionale Erholung • Érzelmi regeneráció"
              />
            </div>
          </FormCard>

          {/* Section 5 */}
          <FormCard title="5. Expectations & goals">
            <TextareaField
              id="mentalGoals"
              label="What three mental goals would you like to achieve in the next 3 months?"
              description="Drei mentale Ziele in den nächsten 3 Monaten • Három mentális cél a következő 3 hónapban"
              required
            />
            <TextareaField
              id="expectations"
              label="What do you expect from the coaching process and from us as a team?"
              description="Erwartungen an das Coaching und das Team • Mit vársz a coachingtól és tőlünk?"
              required
            />
            <TextareaField
              id="previousTools"
              label="What mental strategies or tools have you used so far? How did they work for you?"
              description="Bisher genutzte Strategien/Tools • Eddig használt eszközök, tapasztalatok"
              required
            />
            <TextareaField
              id="anythingElse"
              label="Is there anything else you’d like us to know?"
              description="Sonst noch wichtig? • Van még valami fontos?"
            />
          </FormCard>

          {/* Section 6 */}
          <FormCard title="6. Commitment">
            <div className="space-y-6">
              <CheckboxGroup
                name="consentCase"
                label="Do you agree to the anonymous use of your case for educational purposes (e.g., supervision)?"
                description="Anonymisierte Nutzung zu Ausbildungszwecken • Név nélküli felhasználás oktatási célra"
                required
                options={[
                  { value: "yes", label: "Yes / Ja / Igen" },
                  { value: "no", label: "No / Nein / Nem" },
                ]}
              />
              <CheckboxGroup
                name="willingToPay"
                label="Are you willing to pay 75 EUR per session, after each session?"
                description="75 EUR pro Sitzung im Anschluss • Ülésenként 75 EUR"
                required
                options={[
                  { value: "yes", label: "Yes / Ja / Igen" },
                  { value: "no", label: "No / Nein / Nem" },
                ]}
              />
            </div>

            <div className="mt-10 flex justify-center">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-purple-500 px-10 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400"
              >
                Submit application
              </button>
            </div>

            <p className="mt-4 text-center font-saira text-[11px] text-zinc-500">
              By submitting this form you apply for 1:1 mental coaching with
              David Sipos (PowerFlow). Submitting does not guarantee acceptance.
            </p>
          </FormCard>
        </form>
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
};

function TextField({
  id,
  label,
  description,
  required,
  type = "text",
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel label={label} description={description} required={required} />
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="w-full rounded-xl border border-zinc-700/70 bg-[#0D0F14] px-3 py-2.5 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
      />
    </div>
  );
}

type TextareaFieldProps = {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
};

function TextareaField({ id, label, description, required }: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel label={label} description={description} required={required} />
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
};

function FieldLabel({ label, description, required }: FieldLabelProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-saira text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200">
        {label}
        {required && <span className="ml-1 text-purple-300">*</span>}
      </label>
      {description && (
        <p className="font-saira text-[11px] text-zinc-500">{description}</p>
      )}
    </div>
  );
}

type RadioPillProps = {
  name: string;
  value: string;
  label: string;
};

function RadioPill({ name, value, label }: RadioPillProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700/80 bg-[#0D0F14] px-4 py-2 text-xs font-saira text-zinc-100 transition hover:border-purple-400">
      <input
        type="radio"
        name={name}
        value={value}
        className="h-3 w-3 rounded-full border border-zinc-500 text-purple-500 focus:ring-purple-500"
      />
      <span className="tracking-[0.12em] uppercase">{label}</span>
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
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-zinc-700/80 bg-[#0D0F14] text-[11px] font-saira text-zinc-100 transition hover:border-purple-400"
          >
            <input
              type="radio"
              name={name}
              value={value}
              className="peer sr-only"
            />
            <span className="peer-checked:text-purple-300">{value}</span>
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