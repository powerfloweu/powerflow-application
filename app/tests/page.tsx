import Link from "next/link";

export const metadata = {
  title: "PowerFlow — Mental Tests",
  description:
    "Psychology tests by PowerFlow. Take a test and get structured insights into your mental profile.",
};

export default function TestsIndexPage() {
  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
            PowerFlow · Mental Tests
          </p>
          <h1 className="mt-3 font-saira text-3xl font-extrabold uppercase tracking-[0.14em] sm:text-4xl">
            Know yourself before you train yourself
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-saira text-sm text-zinc-300 sm:text-base">
            Structured, evidence-based psychology tests built on our 1:1 coaching work.
            Complete the test online, see your profile immediately, and receive a full
            written report to keep.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <TestCard
            slug="self-awareness"
            tier="Free + Paid"
            duration="~30–45 minutes · 165 items"
            title="Self-Awareness Test"
            description="Map 11 core motivations (Performance, Affiliation, Aggression, Defensiveness, Consciousness, Dominance, Exhibition, Autonomy, Caregiving, Order, Helplessness) and their composite dynamics. Reveals which drives are pulling you forward and which ones conflict."
            href="/tests/self-awareness"
            cta="Start the test"
            available
          />

          <TestCard
            slug="coming-soon-2"
            tier="Coming soon"
            duration=""
            title="Test #2"
            description="To be announced."
            href="#"
            cta="Coming soon"
            available={false}
          />
        </div>

        <p className="mt-12 text-center font-saira text-[11px] text-zinc-500">
          Our tests are screening and self-reflection tools, not clinical diagnoses.
          If you are looking for 1:1 coaching, see the{" "}
          <Link href="/" className="underline decoration-zinc-600 hover:text-white">
            PowerFlow Application
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function TestCard({
  tier,
  duration,
  title,
  description,
  href,
  cta,
  available,
}: {
  slug: string;
  tier: string;
  duration: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  available: boolean;
}) {
  const CardBody = (
    <div
      className={`flex h-full flex-col rounded-3xl border p-7 transition sm:p-9 ${
        available
          ? "border-purple-500/25 bg-gradient-to-br from-purple-600/15 via-fuchsia-500/10 to-transparent shadow-[0_22px_60px_rgba(126,34,206,0.18)] hover:border-purple-400/50"
          : "border-white/5 bg-white/[0.02] opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-saira text-[10px] font-semibold uppercase tracking-[0.28em] ${
            available ? "text-purple-200" : "text-zinc-400"
          }`}
        >
          {tier}
        </span>
        {duration ? (
          <span className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            {duration}
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 font-saira text-xl font-extrabold uppercase tracking-[0.1em] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-4 flex-1 font-saira text-sm text-zinc-300">{description}</p>
      <div className="mt-7">
        <span
          className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 font-saira text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
            available
              ? "bg-purple-500 text-white group-hover:bg-purple-400"
              : "border border-zinc-700/70 text-zinc-500"
          }`}
        >
          {cta}
        </span>
      </div>
    </div>
  );

  if (!available) return <div className="h-full">{CardBody}</div>;
  return (
    <Link href={href} className="group h-full">
      {CardBody}
    </Link>
  );
}
