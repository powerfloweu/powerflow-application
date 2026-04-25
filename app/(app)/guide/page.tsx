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

      <GuideSection num="02" title="Setup wizard (6 steps)">
        <Tip><Highlight>Step 1 — About you</Highlight> Your name, Instagram, and gender. Name and gender are required.</Tip>
        <Tip><Highlight>Step 2 — Powerlifting profile</Highlight> Years in the sport, federation, bodyweight, weight class, next competition date, and how many days per week you train.</Tip>
        <Tip><Highlight>Step 3 — Your lifts</Highlight> Current bests and competition goals for squat, bench, and deadlift. All optional — you can fill these in later from the <Highlight>You</Highlight> tab.</Tip>
        <Tip><Highlight>Step 4 — Mindset</Highlight> Four open questions about your mental barriers, confidence, overthinking, and previous mental coaching work. Then rate yourself 1–10 on five areas: confidence regulation, focus under fatigue, handling pressure, competition anxiety, and emotional recovery.</Tip>
        <Tip><Highlight>Step 5 — Goals</Highlight> Three mental goals for the next 3 months. The first is required. Also share your expectations from coaching, what mental tools you&apos;ve tried, and anything else important.</Tip>
        <Tip><Highlight>Step 6 — Your coach</Highlight> Pick your PowerFlow coach from the list. You can skip and connect later in the <Highlight>You</Highlight> tab.</Tip>
        <Tip>At any point you can tap <Highlight>Skip setup</Highlight> in the top-right corner to go straight to the app — all your data is saved when you reach the last step.</Tip>
      </GuideSection>

      <GuideSection num="03" title="Today — daily check-in">
        <Tip>Every day starts on the <Highlight>Today</Highlight> screen. The first card asks: training day or rest day?</Tip>
        <Tip>Tap <Highlight>🏋️ Training Day</Highlight> or <Highlight>😴 Rest Day</Highlight> to open the check-in sheet.</Tip>
        <Tip>On a <Highlight>training day</Highlight> you&apos;ll rate your mood 1–10 and answer four questions: thoughts before the session, how it went, what worked well, any frustrations, and what to focus on next session.</Tip>
        <Tip>On a <Highlight>rest day</Highlight> just rate your mood and add any notes.</Tip>
        <Tip>Already logged something? Tap <Highlight>Edit</Highlight> on the check-in card to update it.</Tip>
        <Tip>The <Highlight>🔔 Reminders</Highlight> button on the check-in card enables browser notifications. You&apos;ll get a nudge at 7 pm if you haven&apos;t logged yet. The red dot on the Today tab also shows when your check-in is pending.</Tip>
      </GuideSection>

      <GuideSection num="04" title="Journal — capture your mindset">
        <Tip>Tap the <Highlight>Journal</Highlight> tab at the bottom to write a free entry at any time.</Tip>
        <Tip>Choose a <Highlight>context tag</Highlight>: General, Pre-competition, Post-competition, During session, or Rest day.</Tip>
        <Tip>Write your thoughts. The AI automatically labels the sentiment (positive, neutral, negative) and detects themes (confidence, focus, anxiety, etc.). This feeds into your coach&apos;s dashboard.</Tip>
        <Tip>All your past entries are listed below the input, newest first.</Tip>
      </GuideSection>

      <GuideSection num="05" title="Tools — psychological assessments">
        <Tip>The <Highlight>Tools</Highlight> tab contains four validated sport psychology tests you can complete at any time.</Tip>
        <Tip><Highlight>SAT</Highlight> — Sport Anxiety Test. Measures your anxiety profile.</Tip>
        <Tip><Highlight>ACSI</Highlight> — Athletic Coping Skills Inventory. Covers coping, concentration, confidence, and goal-setting.</Tip>
        <Tip><Highlight>CSAI-2</Highlight> — Competitive State Anxiety Inventory. Cognitive vs. somatic anxiety.</Tip>
        <Tip><Highlight>DAS</Highlight> — Depression, Anxiety, Stress scale adapted for athletes.</Tip>
        <Tip>Some tests require a one-time payment to unlock results. Completed tests appear in your coach&apos;s dashboard automatically.</Tip>
      </GuideSection>

      <GuideSection num="06" title="Course — 16-week programme">
        <Tip>The <Highlight>Course</Highlight> tab unlocks week-by-week mental preparation content tied to your competition date. Each week has a video, an exercise, and a short Q&amp;A.</Tip>
        <Tip>If the course isn&apos;t unlocked yet, contact your coach — they can enable it for you.</Tip>
        <Tip>The current week is also surfaced as a card on your <Highlight>Today</Highlight> screen so you never lose track.</Tip>
      </GuideSection>

      <GuideSection num="07" title="You — profile &amp; settings">
        <Tip>The <Highlight>You</Highlight> tab lets you update everything from the setup wizard at any time: name, competition date, body stats, lifts, mental goals, training schedule, and coach connection.</Tip>
        <Tip>Your GL Points (IPF Goodlift formula) calculate automatically from your total and bodyweight once you&apos;ve added your lifts and gender.</Tip>
        <Tip>To change your coach, tap <Highlight>Change coach</Highlight> in the Coach section.</Tip>
        <Tip>Sign out is at the bottom of this page.</Tip>
      </GuideSection>
    </>
  );
}

// ── Coach guide ───────────────────────────────────────────────────────────────

function CoachGuide() {
  return (
    <>
      <GuideSection num="01" title="Sign in as a coach">
        <Tip>Open the app and tap <Highlight>Sign in as coach</Highlight> (or select the coach role before the Google sign-in). Role is set once — coaches cannot also be athletes in the same account.</Tip>
        <Tip>After sign-in you land on the <Highlight>Coach Dashboard</Highlight> automatically.</Tip>
      </GuideSection>

      <GuideSection num="02" title="Invite your athletes">
        <Tip>Your unique <Highlight>Coach Code</Highlight> is shown at the top of the dashboard. Share it with athletes — they enter it during onboarding or from their <Highlight>You</Highlight> tab to link their account to you.</Tip>
        <Tip>You also have a direct <Highlight>Join Link</Highlight> athletes can click before signing in — it handles the link automatically.</Tip>
        <Tip>New athletes appear on your dashboard within seconds of linking.</Tip>
      </GuideSection>

      <GuideSection num="03" title="Dashboard overview">
        <Tip>Each athlete appears as a card. The header shows three key stats for the last 7 days: number of journal entries, percentage of positive sentiment, and a traffic-light flag.</Tip>
        <Tip><Highlight>🟢 On-track</Highlight> = 55%+ positive entries. <Highlight>🟡 Monitor</Highlight> = 30–55%. <Highlight>🔴 Attention</Highlight> = below 30% — check in with this athlete.</Tip>
        <Tip>Tap any athlete card to expand their full profile with three tabs: Recent Entries, Training Log, and Test Results.</Tip>
      </GuideSection>

      <GuideSection num="04" title="Recent entries tab">
        <Tip>Shows the athlete&apos;s latest journal entries with sentiment colour (🟢 positive · ⚪ neutral · 🔴 negative) and the context tag.</Tip>
        <Tip>Scroll down to read the full text of any entry. Themes detected by AI are shown as chips — useful for spotting recurring patterns like confidence issues or competition anxiety.</Tip>
      </GuideSection>

      <GuideSection num="05" title="Training log tab">
        <Tip>Shows the current Mon–Sun training week. The mood sparkline displays a bar for each day the athlete logged a check-in.</Tip>
        <Tip>🏋️ = training day · 💤 = rest day · no bar = no check-in logged yet.</Tip>
        <Tip>Below the sparkline you can read the full daily log entries: pre-session thoughts, how it went, what worked, frustrations, and next-session focus.</Tip>
        <Tip>Average mood for the week is shown at the top of the tab. Watch for sudden drops — they often precede confidence issues in competition.</Tip>
      </GuideSection>

      <GuideSection num="06" title="Test results tab">
        <Tip>Displays the athlete&apos;s most recent scores on all four assessments: SAT, ACSI, CSAI-2, and DAS. Results only appear once the athlete has completed and unlocked a test.</Tip>
        <Tip>Use these alongside journal sentiment to get a full picture — low ACSI concentration score combined with negative journal entries around competition is a strong signal.</Tip>
      </GuideSection>

      <GuideSection num="07" title="Your profile &amp; code">
        <Tip>As a coach your <Highlight>You</Highlight> tab is minimal — it shows your name, role badge, and sign-out. The key asset is your coach code shown on the dashboard.</Tip>
        <Tip>Coach codes never expire. If you need to disconnect an athlete, contact support — athlete unlinking isn&apos;t yet self-serve.</Tip>
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
