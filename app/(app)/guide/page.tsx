"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AthleteProfile } from "@/lib/athlete";

// ── Section component ─────────────────────────────────────────────────────────

function GuideSection({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="font-saira text-[10px] font-bold text-purple-400 pt-0.5 flex-shrink-0 tabular-nums">
          {num}
        </span>
        <h2 className="font-saira text-sm font-bold uppercase tracking-[0.16em] text-white">
          {title}
        </h2>
      </div>
      <div className="pl-6 space-y-2">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-saira text-xs text-zinc-400 leading-relaxed">{children}</p>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 font-saira text-[10px] font-semibold text-purple-300">
      {children}
    </span>
  );
}

// ── Athlete guide ─────────────────────────────────────────────────────────────

function AthleteGuide() {
  return (
    <>
      <GuideSection num="01" title="Sign in">
        <Tip>Open the app and tap <Highlight>Sign in with Google</Highlight>. Make sure you select <Highlight>Athlete</Highlight> before signing in — this sets your role permanently.</Tip>
        <Tip>If your coach shared an invite link, open it first. It automatically links your account to your coach when you sign in.</Tip>
      </GuideSection>

      <GuideSection num="02" title="Setup wizard">
        <Tip><Highlight>Step 1 — About you</Highlight> Your name, Instagram, and gender. Name and gender are required.</Tip>
        <Tip><Highlight>Step 2 — Powerlifting profile</Highlight> Years in the sport, federation, bodyweight, weight class, next competition date, and training days per week.</Tip>
        <Tip><Highlight>Step 3 — Your lifts</Highlight> Current bests and competition goals for squat, bench, and deadlift. All optional — you can update from the <Highlight>You</Highlight> tab at any time.</Tip>
        <Tip><Highlight>Step 4 — Mindset</Highlight> Four questions about your mental barriers, confidence, overthinking, and previous mental coaching work. Then rate yourself 1–10 on five areas: confidence regulation, focus under fatigue, handling pressure, competition anxiety, and emotional recovery.</Tip>
        <Tip><Highlight>Step 5 — Goals</Highlight> Up to three mental goals for the next 3 months. Also share your expectations from coaching, mental tools you&apos;ve tried, and anything else relevant.</Tip>
        <Tip><Highlight>Step 6 — Your coach</Highlight> Pick your PowerFlow coach from the list, or skip and connect later from the <Highlight>You</Highlight> tab.</Tip>
        <Tip>Use the <Highlight>← Back</Highlight> button to revisit any step. Tap <Highlight>Skip setup</Highlight> in the top-right to go straight to the app — your progress is saved.</Tip>
      </GuideSection>

      <GuideSection num="03" title="Home — set your day type">
        <Tip>Every day starts on the <Highlight>Home</Highlight> screen. The first time you open it each day, a full-screen prompt asks: training day or rest day?</Tip>
        <Tip>Tap <Highlight>🏋️ Training Day</Highlight> or <Highlight>😴 Rest Day</Highlight> to log your choice. This takes one second — the detail goes in your journal.</Tip>
        <Tip>Already logged? Home shows your current day type. Tap <Highlight>Change</Highlight> to switch it.</Tip>
        <Tip>The red dot on the <Highlight>Home</Highlight> tab means you haven&apos;t set your day type yet.</Tip>
      </GuideSection>

      <GuideSection num="04" title="Journal — write your session">
        <Tip>Tap the <Highlight>Journal</Highlight> tab to write. On a <Highlight>training day</Highlight> you&apos;ll see five focused questions: pre-session thoughts, post-session reflection, what went well, frustrations, and next-session focus.</Tip>
        <Tip>On a <Highlight>rest day</Highlight> the journal opens as a free-text prompt — write anything on your mind.</Tip>
        <Tip>You can also log a general entry at any time using a <Highlight>context tag</Highlight>: General, Pre-competition, Post-competition, During session, or Rest day.</Tip>
        <Tip>The AI automatically labels sentiment (positive, neutral, negative) and detects themes — this feeds your coach&apos;s dashboard.</Tip>
        <Tip>If your coach leaves a note on one of your entries, it appears directly below that entry as a quoted comment — look for the purple line on the left side.</Tip>
      </GuideSection>

      <GuideSection num="05" title="Tools — mental performance toolkit">
        <Tip>The <Highlight>Tools</Highlight> tab has four sections: Visualizations, Relaxation, Progressive Muscle Relaxation (PR), and Affirmations.</Tip>
        <Tip><Highlight>Visualizations</Highlight> — guided audio for squat, bench, and deadlift. After your first listen, enter 1–3 personal cue words that resonate with you. These are saved and visible to your coach.</Tip>
        <Tip><Highlight>Relaxation</Highlight> — two breathing tracks. Star your favourite with the ☆ icon so it&apos;s always at the top.</Tip>
        <Tip><Highlight>PR (Progressive Muscle Relaxation)</Highlight> — a guided full-body tension-release session.</Tip>
        <Tip><Highlight>Affirmations</Highlight> — write 1–3 personal self-talk sentences that prime your best mindset. Saved to your profile and visible to your coach.</Tip>
        <Tip>The <Highlight>Tools</Highlight> tab also gives access to four validated psychological assessments: SAT, ACSI, CSAI-2, and DAS. These feed into your coach&apos;s Test Results tab.</Tip>
      </GuideSection>

      <GuideSection num="06" title="You — profile &amp; settings">
        <Tip>The <Highlight>You</Highlight> tab lets you update everything from the setup wizard: name, competition date, body stats, lifts, mental goals, training schedule, and coach connection. Each section collapses — tap to expand.</Tip>
        <Tip>To change or disconnect your coach, expand the <Highlight>Coach</Highlight> section and tap <Highlight>Change coach</Highlight>.</Tip>
        <Tip>The guide link (this page) and sign-out are at the bottom.</Tip>
      </GuideSection>
    </>
  );
}

// ── Coach guide ───────────────────────────────────────────────────────────────

function CoachGuide() {
  return (
    <>
      <GuideSection num="01" title="Sign in as a coach">
        <Tip>Open the app and tap <Highlight>Sign in as coach</Highlight> (select the coach role before Google sign-in). Role is set once — coaches and athletes need separate accounts.</Tip>
        <Tip>After sign-in you land on the <Highlight>Coach Dashboard</Highlight> automatically.</Tip>
      </GuideSection>

      <GuideSection num="02" title="Invite your athletes">
        <Tip>Your unique <Highlight>Join Link</Highlight> is shown at the top of the dashboard. Share it — athletes who click it before signing in are automatically linked to you.</Tip>
        <Tip>Athletes can also connect by selecting your name from the coach list during onboarding, or later from their <Highlight>You</Highlight> tab.</Tip>
        <Tip>New athletes appear on your dashboard within seconds of linking.</Tip>
      </GuideSection>

      <GuideSection num="03" title="Dashboard overview">
        <Tip>Each athlete card shows: entries this week, 7-day positive sentiment %, a sparkline, and a traffic-light flag.</Tip>
        <Tip><Highlight>🟢 On-track</Highlight> = 55%+ positive. <Highlight>🟡 Monitor</Highlight> = 30–55%. <Highlight>🔴 Attention</Highlight> = below 30% — reach out.</Tip>
        <Tip>A <Highlight>rose banner</Highlight> appears at the top of the dashboard listing all athletes currently flagged as Attention, with a quick email link for each.</Tip>
        <Tip>Use the search bar and sort options (Priority, Positive %, Activity, Name) to navigate a larger roster.</Tip>
        <Tip>Tap any athlete card to expand it — six tabs are available: Analysis, Recent Entries, Test Scores, Training Log, Profile, and Notes.</Tip>
      </GuideSection>

      <GuideSection num="04" title="Analysis tab">
        <Tip>Shows the athlete&apos;s dominant psychological theme this period (e.g. Perfectionism, Self-doubt, Confidence) with a short descriptor.</Tip>
        <Tip>A 3-week sentiment trajectory (improving / declining / stable / volatile) helps you spot trends before they become problems.</Tip>
        <Tip>Training-mood correlation: whether the athlete&apos;s mood is consistently higher or lower on training days.</Tip>
        <Tip>Two or three <Highlight>conversation starters</Highlight> are suggested based on the current pattern — useful prompts for your next check-in call.</Tip>
        <Tip>Switch between <Highlight>7d / 30d / 60d</Highlight> windows at the top of the tab to zoom in or out on the data.</Tip>
      </GuideSection>

      <GuideSection num="05" title="Recent entries tab">
        <Tip>Shows the athlete&apos;s latest journal entries with sentiment colour and context tag. Tap an entry to read the full text.</Tip>
        <Tip>To leave feedback on an entry, tap <Highlight>Add coach note</Highlight> below it. Type your comment and save — the athlete sees it immediately in their Journal, quoted in purple below the entry.</Tip>
        <Tip>Existing notes show inline; tap the pencil icon to edit.</Tip>
      </GuideSection>

      <GuideSection num="06" title="Training log tab">
        <Tip>Shows the full training week (Mon–Sun) with a mood sparkline. Use the <Highlight>← →</Highlight> arrows to navigate up to 4 weeks back.</Tip>
        <Tip>🏋️ = training day · 💤 = rest day · no bar = no entry that day.</Tip>
        <Tip>Expand any day to read pre-session thoughts, post-session reflection, what went well, frustrations, and next-session focus.</Tip>
        <Tip>The weekly brief at the bottom surfaces recurring pre/post-session themes and overall mood trend.</Tip>
      </GuideSection>

      <GuideSection num="07" title="Test scores tab">
        <Tip>Displays the athlete&apos;s most recent scores on all four assessments: SAT, ACSI, CSAI-2, and DAS. Scores appear once the athlete completes and unlocks a test.</Tip>
        <Tip>Cross-reference with journal sentiment — low ACSI concentration combined with negative entries around competition is a strong early warning signal.</Tip>
      </GuideSection>

      <GuideSection num="08" title="Profile tab">
        <Tip>Full onboarding profile: physical stats, lifts (current and goal), self-rating scales, mindset assessment answers, mental goals, and coaching expectations.</Tip>
        <Tip>The <Highlight>Mental tools</Highlight> section at the top shows the athlete&apos;s saved affirmations and their personal cue words for each lift (squat, bench, deadlift).</Tip>
      </GuideSection>

      <GuideSection num="09" title="Notes tab">
        <Tip>Your private notepad for this athlete. Write session observations, follow-up items, patterns you&apos;ve noticed — anything you&apos;d want to remember before the next call.</Tip>
        <Tip>Notes auto-save as you type. Only you can see them — athletes cannot read your coach notes.</Tip>
      </GuideSection>

      <GuideSection num="10" title="Your profile &amp; code">
        <Tip>The <Highlight>You</Highlight> tab shows your name, role badge, and sign-out. Your join link and coach code are always visible at the top of the main dashboard.</Tip>
        <Tip>Athletes can disconnect from you themselves via their <Highlight>You</Highlight> tab. You can also manage athlete-coach links from the admin dashboard if needed.</Tip>
      </GuideSection>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const router = useRouter();
  const [role, setRole] = React.useState<"athlete" | "coach" | null>(null);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { router.replace("/auth/sign-in"); return null; }
        return r.json();
      })
      .then((p: AthleteProfile | null) => {
        if (!p) return;
        setRole(p.role);
        setName(p.display_name?.split(" ")[0] ?? "");
      })
      .catch(() => {});
  }, [router]);

  const pdfHref = role === "coach" ? "/guide/coach" : "/guide/athlete";
  const isCoach = role === "coach";

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-10 sm:px-6 max-w-lg mx-auto">

      {/* Back */}
      <Link
        href="/you"
        className="inline-block mb-5 font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
      >
        ← You
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · GUIDE
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          {isCoach ? "Coach guide" : "Athlete guide"}
        </h1>
        {name && (
          <p className="font-saira text-sm text-zinc-500">
            Welcome{name ? `, ${name}` : ""}. Here&apos;s everything you need to know.
          </p>
        )}
      </div>

      {/* PDF link */}
      <a
        href={pdfHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-2xl border border-purple-500/25 bg-purple-500/5 px-5 py-4 mb-6 hover:border-purple-400/50 transition group"
      >
        <div>
          <p className="font-saira text-sm font-semibold text-purple-300 group-hover:text-white transition mb-0.5">
            Printable PDF version
          </p>
          <p className="font-saira text-[10px] text-zinc-500">
            Open in browser → Cmd/Ctrl+P → Save as PDF
          </p>
        </div>
        <span className="text-purple-400 text-lg">↗</span>
      </a>

      {/* Role-specific guide */}
      {role === null ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
        </div>
      ) : isCoach ? (
        <CoachGuide />
      ) : (
        <AthleteGuide />
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="font-saira text-[10px] text-zinc-600">
          Questions? Contact your PowerFlow coach or email support.
        </p>
      </div>
    </div>
  );
}
