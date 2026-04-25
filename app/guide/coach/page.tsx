import React from "react";

export const metadata = {
  title: "PowerFlow · Coach Guide",
  description: "How to use the PowerFlow coach dashboard",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Page({ children }: { children: React.ReactNode }) {
  return <div className="page-break">{children}</div>;
}

function SectionHeading({ num, title, subtitle }: { num: string; title: string; subtitle?: string }) {
  return (
    <div className="section-heading">
      <div className="section-num">{num}</div>
      <div>
        <div className="section-title">{title}</div>
        {subtitle && <div className="section-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="two-col">
      <div className="col-text">{left}</div>
      <div className="col-phone">{right}</div>
    </div>
  );
}

function Steps({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <ol className="step-list">
      {items.map((item, i) => (
        <li key={i}>
          <span className="step-num">{i + 1}</span>
          <div>
            <strong>{item.label}</strong>
            <p>{item.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="note">{children}</div>;
}

function Phone({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <div className="phone-wrap">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">{children}</div>
        <div className="phone-home" />
      </div>
      {caption && <p className="phone-caption">{caption}</p>}
    </div>
  );
}

// ── Screen mockups ────────────────────────────────────────────────────────────

function ScreenCoachSignIn() {
  return (
    <Phone caption="Sign-in — coach role">
      <div className="s-center" style={{ padding: "24px 16px" }}>
        <div className="s-logo">PF</div>
        <div className="s-tagline">POWERFLOW</div>
        <div className="s-h1" style={{ marginBottom: 6 }}>Mental Training</div>
        <div className="s-sub" style={{ marginBottom: 20 }}>for Powerlifters</div>
        <div className="s-btn-primary">Sign in with Google</div>
        <div style={{ marginTop: 16 }}>
          <div className="s-pill" style={{ marginBottom: 8 }}>Athlete</div>
          <div className="s-pill active">Coach</div>
        </div>
      </div>
    </Phone>
  );
}

function ScreenDashboard() {
  return (
    <Phone caption="Coach dashboard">
      <div style={{ padding: "0 10px" }}>
        <div className="s-eyebrow" style={{ paddingTop: 2 }}>POWERFLOW · COACH</div>
        <div className="s-h1" style={{ marginBottom: 2 }}>Dashboard</div>
        <div className="s-coach-code-card">
          <div className="s-eyebrow">YOUR COACH CODE</div>
          <div className="s-code">3S1X4W23</div>
          <div style={{ fontSize: 7, color: "#71717a" }}>Share with athletes to link accounts</div>
        </div>
        <div className="s-athlete-card">
          <div className="s-athlete-header">
            <div className="s-ath-avatar">NJ</div>
            <div style={{ flex: 1 }}>
              <div className="s-ath-name">Niina Jarvenkari</div>
              <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                <span className="s-stat">7 entries</span>
                <span className="s-stat">29% pos.</span>
                <span className="s-flag red">🔴 Attention</span>
              </div>
            </div>
          </div>
        </div>
        <div className="s-athlete-card">
          <div className="s-athlete-header">
            <div className="s-ath-avatar">PD</div>
            <div style={{ flex: 1 }}>
              <div className="s-ath-name">Prince of Dragons</div>
              <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                <span className="s-stat">0 entries</span>
                <span className="s-stat">—</span>
                <span className="s-flag red">🔴 Attention</span>
              </div>
            </div>
          </div>
        </div>
        <div className="s-athlete-card">
          <div className="s-athlete-header">
            <div className="s-ath-avatar">SD</div>
            <div style={{ flex: 1 }}>
              <div className="s-ath-name">Sipos Dávid Tamás</div>
              <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                <span className="s-stat">4 entries</span>
                <span className="s-stat">25% pos.</span>
                <span className="s-flag yellow">🟡 Monitor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function ScreenEntriesTab() {
  return (
    <Phone caption="Athlete — Recent entries tab">
      <div style={{ padding: "0 10px" }}>
        <div className="s-ath-name" style={{ paddingTop: 4, marginBottom: 6 }}>Niina Jarvenkari</div>
        <div className="s-tabs">
          <span className="s-tab active">Entries</span>
          <span className="s-tab">Training</span>
          <span className="s-tab">Tests</span>
        </div>
        {[
          { dot: "green", date: "Sat 25", ctx: "Post-comp", text: "Hit a 3-month bench PR today. Big confidence boost…" },
          { dot: "red",   date: "Fri 24", ctx: "General",   text: "Meet is 6 weeks away and I keep imagining bombing out…" },
          { dot: "gray",  date: "Thu 23", ctx: "Post-comp", text: "Squat volume day. Stayed present even though I was tired…" },
          { dot: "red",   date: "Wed 22", ctx: "Session",   text: "Deadlift lockout broke down on top singles. Frustrated…" },
          { dot: "gray",  date: "Tue 21", ctx: "Rest",      text: "Took a walk. Realising I compare myself too much…" },
        ].map((e, i) => (
          <div key={i} className="s-entry-row">
            <span className={`s-dot ${e.dot}`} style={{ marginTop: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="s-entry-meta">{e.date} · {e.ctx}</div>
              <div className="s-entry-preview">{e.text}</div>
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenTrainingTab() {
  return (
    <Phone caption="Athlete — Training log tab">
      <div style={{ padding: "0 10px" }}>
        <div className="s-ath-name" style={{ paddingTop: 4, marginBottom: 6 }}>Niina Jarvenkari</div>
        <div className="s-tabs">
          <span className="s-tab">Entries</span>
          <span className="s-tab active">Training</span>
          <span className="s-tab">Tests</span>
        </div>
        <div className="s-training-summary">
          <span>4/7 training days</span>
          <span>avg mood <strong style={{ color: "#fff" }}>6.8/10</strong></span>
        </div>
        <div className="s-eyebrow" style={{ marginBottom: 4 }}>MOOD SPARKLINE</div>
        {[
          { day: "Mon", date: "20", icon: "🏋️", mood: 7, fill: 70 },
          { day: "Tue", date: "21", icon: "💤", mood: 8, fill: 80 },
          { day: "Wed", date: "22", icon: "🏋️", mood: 5, fill: 50 },
          { day: "Thu", date: "23", icon: "🏋️", mood: 6, fill: 60 },
          { day: "Fri", date: "24", icon: "💤", mood: 7, fill: 70 },
          { day: "Sat", date: "25", icon: "🏋️", mood: 8, fill: 80 },
          { day: "Sun", date: "26", icon: null, mood: null, fill: 0 },
        ].map((d) => (
          <div key={d.day} className="s-spark-row">
            <span className="s-spark-day">{d.day}</span>
            <span className="s-spark-icon">{d.icon ?? "–"}</span>
            <div className="s-spark-bar-bg">
              <div className="s-spark-bar" style={{ width: `${d.fill}%` }} />
            </div>
            <span className="s-spark-num">{d.mood !== null ? `${d.mood}/10` : "—"}</span>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenTestsTab() {
  return (
    <Phone caption="Athlete — Test results tab">
      <div style={{ padding: "0 10px" }}>
        <div className="s-ath-name" style={{ paddingTop: 4, marginBottom: 6 }}>Niina Jarvenkari</div>
        <div className="s-tabs">
          <span className="s-tab">Entries</span>
          <span className="s-tab">Training</span>
          <span className="s-tab active">Tests</span>
        </div>
        {[
          { name: "SAT", label: "Sport Anxiety Test", score: "42 / 100", sub: "Low — stable profile", done: true },
          { name: "ACSI", label: "Coping Skills", score: "Confidence: 78%", sub: "Goal-setting: 64%", done: true },
          { name: "CSAI-2", label: "Competitive Anxiety", score: null, sub: "Not completed yet", done: false },
          { name: "DAS", label: "Depression · Anxiety", score: null, sub: "Not completed yet", done: false },
        ].map(t => (
          <div key={t.name} className="s-tool-card" style={{ marginBottom: 6 }}>
            <div>
              <div className="s-tool-name">{t.name}</div>
              <div className="s-tool-desc">{t.label}</div>
              {t.score && <div style={{ fontSize: 8, color: "#a78bfa", marginTop: 2, fontWeight: 700 }}>{t.score}</div>}
              <div style={{ fontSize: 7, color: "#71717a" }}>{t.sub}</div>
            </div>
            <div className={`s-tool-status ${t.done ? "done" : ""}`}>{t.done ? "✓" : "–"}</div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenDailyLog() {
  return (
    <Phone caption="Daily log entry detail">
      <div style={{ padding: "0 10px" }}>
        <div className="s-ath-name" style={{ paddingTop: 4, marginBottom: 6 }}>Niina Jarvenkari</div>
        <div className="s-tabs">
          <span className="s-tab">Entries</span>
          <span className="s-tab active">Training</span>
          <span className="s-tab">Tests</span>
        </div>
        <div className="s-log-entry">
          <div className="s-log-date">Mon 20 · Training · Mood 7/10</div>
          <div className="s-log-label">BEFORE SESSION</div>
          <div className="s-log-text">Bench day. Felt more locked in than yesterday.</div>
          <div className="s-log-label">HOW IT WENT</div>
          <div className="s-log-text">Hit 110 kg for a double, cleanest reps in weeks.</div>
          <div className="s-log-label">WHAT WENT WELL</div>
          <div className="s-log-text">Stayed patient off the chest, no rushing.</div>
          <div className="s-log-label">NEXT SESSION</div>
          <div className="s-log-text">Rest tomorrow, then deadlifts. Don&apos;t skip warmup.</div>
        </div>
      </div>
    </Phone>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CoachGuidePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PowerFlow · Coach Guide</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;600;700;800&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Saira', sans-serif; background: #fff; color: #111; font-size: 11px; line-height: 1.5; }

          .doc { max-width: 780px; margin: 0 auto; padding: 0 32px; }

          @media print {
            body { font-size: 10px; }
            .doc { padding: 0 20px; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
          }

          .cover {
            min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
            background: #050608; color: #fff; padding: 60px 48px;
          }
          @media print { .cover { min-height: 100vh; page-break-after: always; } }
          .cover-logo {
            width: 72px; height: 72px; border-radius: 50%;
            background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 40px;
          }
          .cover-eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: #67e8f9; margin-bottom: 12px; }
          .cover-title { font-size: 48px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1.05; color: #fff; margin-bottom: 16px; }
          .cover-sub { font-size: 13px; color: #a1a1aa; max-width: 400px; line-height: 1.6; margin-bottom: 48px; }
          .cover-meta { font-size: 9px; color: #52525b; letter-spacing: 0.18em; text-transform: uppercase; }
          .cover-divider { width: 48px; height: 2px; background: #0891b2; margin-bottom: 32px; }

          .page-break { padding-top: 48px; }
          .section-heading { display: flex; align-items: flex-start; gap: 16px; padding-bottom: 16px; margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; }
          .section-num { font-size: 28px; font-weight: 800; color: #0891b2; line-height: 1; min-width: 36px; }
          .section-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #111; line-height: 1.1; }
          .section-subtitle { font-size: 10px; color: #71717a; margin-top: 3px; letter-spacing: 0.06em; }

          .two-col { display: flex; gap: 32px; align-items: flex-start; }
          .col-text { flex: 1; }
          .col-phone { flex-shrink: 0; }

          .step-list { list-style: none; padding: 0; margin: 0 0 16px; }
          .step-list li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f4f4f5; }
          .step-list li:last-child { border-bottom: none; }
          .step-num { width: 20px; height: 20px; border-radius: 50%; background: #0891b2; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
          .step-list li strong { display: block; font-weight: 700; color: #111; margin-bottom: 2px; }
          .step-list li p { color: #52525b; font-size: 10px; line-height: 1.5; }

          .note { background: #ecfeff; border-left: 3px solid #0891b2; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 10px; color: #164e63; line-height: 1.5; margin-top: 12px; }

          /* Phone frame */
          .phone-wrap { display: flex; flex-direction: column; align-items: center; }
          .phone-frame { width: 180px; background: #050608; border-radius: 28px; border: 6px solid #27272a; box-shadow: 0 20px 60px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.05); overflow: hidden; position: relative; display: flex; flex-direction: column; }
          .phone-notch { width: 60px; height: 14px; background: #27272a; border-radius: 0 0 10px 10px; margin: 0 auto; position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 10; }
          .phone-screen { flex: 1; overflow: hidden; padding-top: 18px; font-family: 'Saira', sans-serif; min-height: 360px; }
          .phone-home { width: 48px; height: 4px; background: #3f3f46; border-radius: 2px; margin: 6px auto 8px; }
          .phone-caption { font-size: 9px; color: #71717a; text-align: center; margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase; }

          /* Screen primitives */
          .s-eyebrow { font-size: 7px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: #67e8f9; }
          .s-h1 { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #fff; }
          .s-h2 { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #fff; margin-bottom: 8px; }
          .s-sub { font-size: 9px; color: #71717a; }
          .s-center { display: flex; flex-direction: column; align-items: center; }
          .s-logo { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#0e7490,#0891b2); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 6px; }
          .s-tagline { font-size: 7px; font-weight: 700; letter-spacing: 0.28em; color: #67e8f9; margin-bottom: 4px; }
          .s-btn-primary { background: #0891b2; color: #fff; border-radius: 20px; padding: 6px 16px; font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; display: inline-block; }
          .s-pill { border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #a1a1aa; border-radius: 20px; padding: 4px 12px; font-size: 8px; font-weight: 700; display: inline-block; }
          .s-pill.active { border-color: #0891b2; background: #0891b2; color: #fff; }

          .s-coach-code-card { background: rgba(8,145,178,0.1); border: 1px solid rgba(8,145,178,0.3); border-radius: 10px; padding: 8px; margin: 8px 0; }
          .s-code { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: 0.2em; margin: 4px 0; }

          .s-athlete-card { background: #17131f; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px; margin-bottom: 6px; }
          .s-athlete-header { display: flex; align-items: center; gap: 8px; }
          .s-ath-avatar { width: 28px; height: 28px; border-radius: 50%; background: rgba(8,145,178,0.2); border: 1px solid rgba(8,145,178,0.3); display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #67e8f9; flex-shrink: 0; }
          .s-ath-name { font-size: 9px; font-weight: 700; color: #fff; }
          .s-stat { font-size: 7px; color: #71717a; }
          .s-flag { font-size: 7px; font-weight: 700; border-radius: 4px; padding: 1px 4px; }
          .s-flag.red { color: #fca5a5; background: rgba(239,68,68,0.1); }
          .s-flag.yellow { color: #fde68a; background: rgba(245,158,11,0.1); }
          .s-flag.green { color: #6ee7b7; background: rgba(16,185,129,0.1); }

          .s-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; }
          .s-tab { flex: 1; text-align: center; font-size: 7px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 0; color: #71717a; }
          .s-tab.active { color: #67e8f9; border-bottom: 1.5px solid #0891b2; }

          .s-entry-row { display: flex; gap: 6px; align-items: flex-start; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .s-entry-meta { font-size: 7px; color: #71717a; }
          .s-entry-preview { font-size: 8px; color: #d4d4d8; line-height: 1.3; }
          .s-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
          .s-dot.green { background: #34d399; }
          .s-dot.red { background: #f87171; }
          .s-dot.gray { background: #71717a; }

          .s-training-summary { font-size: 8px; color: #a1a1aa; display: flex; justify-content: space-between; margin-bottom: 6px; }
          .s-spark-row { display: flex; align-items: center; gap: 4px; padding: 2px 0; }
          .s-spark-day { font-size: 7px; color: #71717a; width: 22px; flex-shrink: 0; }
          .s-spark-icon { font-size: 8px; width: 14px; flex-shrink: 0; text-align: center; }
          .s-spark-bar-bg { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
          .s-spark-bar { height: 100%; background: #0891b2; border-radius: 3px; }
          .s-spark-num { font-size: 7px; color: #a1a1aa; width: 28px; text-align: right; flex-shrink: 0; }

          .s-tool-card { display: flex; justify-content: space-between; align-items: center; background: #17131f; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px 10px; }
          .s-tool-name { font-size: 9px; font-weight: 700; color: #fff; }
          .s-tool-desc { font-size: 7px; color: #71717a; }
          .s-tool-status { font-size: 8px; font-weight: 700; color: #71717a; }
          .s-tool-status.done { color: #34d399; }

          .s-log-entry { background: #17131f; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px; }
          .s-log-date { font-size: 8px; font-weight: 700; color: #fff; margin-bottom: 6px; }
          .s-log-label { font-size: 6.5px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-top: 5px; margin-bottom: 2px; }
          .s-log-text { font-size: 7.5px; color: #d4d4d8; line-height: 1.4; }
        `}</style>
      </head>
      <body>
        <div className="doc">

          {/* ── Cover ─────────────────────────────────────────── */}
          <div className="cover">
            <div className="cover-logo">PF</div>
            <div className="cover-eyebrow">PowerFlow · User Guide</div>
            <h1 className="cover-title">Coach<br />Guide</h1>
            <div className="cover-divider" />
            <p className="cover-sub">
              How to sign in as a coach, invite your athletes, and use the PowerFlow dashboard to track journal sentiment, training load, and assessment results.
            </p>
            <p className="cover-meta">Version 1.0 · April 2026 · powerflow.eu</p>
          </div>

          {/* ── 01 Sign in ──────────────────────────────────────── */}
          <Page>
            <SectionHeading num="01" title="Signing in as a coach" subtitle="Google OAuth · Coach role" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open the app", desc: "Navigate to the PowerFlow URL. You will see the sign-in screen." },
                    { label: "Select Coach role", desc: "Below the Google button, tap Coach. This sets your role permanently — coaches and athletes use separate accounts." },
                    { label: "Sign in with Google", desc: "Complete the standard Google OAuth flow. You land directly on the Coach Dashboard — there is no setup wizard for coaches." },
                    { label: "Your coach code is generated", desc: "A unique 8-character code is created automatically on first sign-in. You will see it at the top of the dashboard immediately." },
                  ]} />
                  <Note>
                    <strong>Important:</strong> The Coach role is set permanently at first sign-in. If you need a separate athlete account, sign up with a different Google account.
                  </Note>
                </>
              }
              right={<ScreenCoachSignIn />}
            />
          </Page>

          {/* ── 02 Invite athletes ──────────────────────────────── */}
          <Page>
            <SectionHeading num="02" title="Inviting your athletes" subtitle="Coach code · Join link" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    Athletes connect to you using your unique coach code. There are two ways to share it:
                  </p>
                  <Steps items={[
                    { label: "Share your Coach Code directly", desc: "Your 8-character code is shown at the top of the dashboard (e.g. 3S1X4W23). Athletes enter it during onboarding (Step 6) or from the Coach section in their You tab." },
                    { label: "Share your Join Link", desc: "The dashboard also shows a direct join link. Athletes who click it before signing in are automatically linked to you after they complete the Google sign-in — no code entry needed." },
                    { label: "Athlete appears on your dashboard", desc: "Once linked, the athlete appears in your coach dashboard within seconds. No refresh needed." },
                    { label: "Verify the link", desc: "The athlete card shows the athlete's name and their data starts populating as soon as they log entries. If they do not appear, ask them to check the Coach section in their You tab." },
                  ]} />
                  <Note>
                    Coach codes never expire. You can share the same code with all your athletes. If an athlete accidentally linked to the wrong coach, they can change their coach from the <strong>You</strong> tab.
                  </Note>
                </>
              }
              right={<ScreenDashboard />}
            />
          </Page>

          {/* ── 03 Dashboard overview ───────────────────────────── */}
          <Page>
            <SectionHeading num="03" title="Dashboard overview" subtitle="Traffic-light system · Athlete cards" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    Each athlete appears as a card showing their 7-day snapshot. The header gives you the three numbers you need to triage at a glance.
                  </p>
                  <Steps items={[
                    { label: "Journal entry count", desc: "How many journal entries the athlete has written in the last 7 days. Zero entries is itself a signal — the athlete may be disengaged." },
                    { label: "Positive sentiment rate", desc: "Percentage of entries in the last 7 days tagged as positive by AI. This is the core engagement metric." },
                    { label: "Traffic-light flag", desc: "🟢 On-track: 55%+ positive. 🟡 Monitor: 30–55% positive — worth a check-in. 🔴 Attention: below 30% — this athlete needs direct contact." },
                    { label: "Tap to expand", desc: "Tap any athlete card to open their full profile with three tabs: Recent Entries, Training Log, and Test Results." },
                  ]} />
                  <Note>
                    <strong>The 🔴 Attention flag is the most important signal.</strong> Check these athletes first in every session review. A drop from 🟢 to 🔴 in one week often correlates with an upcoming competition or a bad training block.
                  </Note>
                </>
              }
              right={<ScreenDashboard />}
            />
          </Page>

          {/* ── 04 Entries tab ──────────────────────────────────── */}
          <Page>
            <SectionHeading num="04" title="Recent entries tab" subtitle="Journal sentiment · AI theme detection" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open an athlete card", desc: "Tap the athlete card on the dashboard. The default tab is Recent Entries." },
                    { label: "Read sentiment at a glance", desc: "Each entry has a colour dot: 🟢 positive, ⚪ neutral, 🔴 negative. The context tag (Pre-comp, Post-comp, General, etc.) is shown next to the date." },
                    { label: "Read the full entry", desc: "Tap any entry card to read the full text. The AI-detected themes appear as chips below the text (confidence, anxiety, focus, pressure, recovery, etc.)." },
                    { label: "Spot patterns", desc: "Look for clusters of negative entries around specific contexts. Repeated 'competition anxiety' or 'confidence' themes across multiple entries signal a clear coaching focus area." },
                    { label: "Scroll back in time", desc: "The tab shows the last 50 entries, newest first. Scroll to see older entries and track trends over multiple weeks." },
                  ]} />
                  <Note>
                    Sentiment is tagged automatically by AI, but it is not infallible. A negative entry does not always mean the athlete is struggling — read the actual text. Use sentiment as a filter to prioritise which entries to read, not as the final verdict.
                  </Note>
                </>
              }
              right={<ScreenEntriesTab />}
            />
          </Page>

          {/* ── 05 Training log tab ─────────────────────────────── */}
          <Page>
            <SectionHeading num="05" title="Training log tab" subtitle="Mood sparkline · Daily log entries" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open Training Log tab", desc: "Inside an athlete card, tap the Training tab. You see the current Mon–Sun training week." },
                    { label: "Read the sparkline", desc: "Each day shows a bar filled to the athlete's mood rating (1–10). 🏋️ = training day, 💤 = rest day, — = no check-in logged." },
                    { label: "Week summary", desc: "The header shows total training days logged and the weekly average mood. A low average across training days is more concerning than a single bad day." },
                    { label: "Read daily log entries", desc: "Below the sparkline, the two most recent days are expanded with their full answers: thoughts before the session, how it went, what went well, frustrations, and next-session focus." },
                    { label: "Missing check-ins", desc: "Days with no entry (—) mean the athlete did not log. If multiple consecutive days are missing, it may indicate avoidance or disengagement — worth a message." },
                  ]} />
                  <Note>
                    Cross-reference the training log with journal entries. A mood of 8/10 on a training day paired with a negative journal entry from the same day often means the athlete is performing well physically but struggling mentally — a nuanced coaching moment.
                  </Note>
                </>
              }
              right={
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <ScreenTrainingTab />
                  <ScreenDailyLog />
                </div>
              }
            />
          </Page>

          {/* ── 06 Test results tab ─────────────────────────────── */}
          <Page>
            <SectionHeading num="06" title="Test results tab" subtitle="SAT · ACSI · CSAI-2 · DAS" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    Once an athlete completes and unlocks a test, the scored results appear here automatically. No action needed from you.
                  </p>
                  <Steps items={[
                    { label: "SAT — Sport Anxiety Test", desc: "Total score out of 100. Lower is better. Cross-reference spikes with upcoming competition dates." },
                    { label: "ACSI — Coping Skills Inventory", desc: "Four sub-scores: coping with adversity, concentration, confidence, and goal-setting. Each expressed as a percentage. Look for the lowest score — that is often the first coaching focus." },
                    { label: "CSAI-2 — Competitive State Anxiety", desc: "Three scores: cognitive anxiety (worry), somatic anxiety (body symptoms), and self-confidence. High cognitive + low confidence = classic pre-competition anxiety pattern." },
                    { label: "DAS — Depression, Anxiety, Stress", desc: "Screens for depression-prone thinking, anxiety, and stress. A high DAS alongside many negative journal entries warrants a direct conversation and possible referral." },
                  ]} />
                  <Note>
                    Tests require a one-time athlete payment to unlock results. If results are not showing, the athlete may not have completed the unlock payment. You cannot see partial or unpaid results.
                  </Note>
                </>
              }
              right={<ScreenTestsTab />}
            />
          </Page>

          {/* ── 07 Quick reference ──────────────────────────────── */}
          <Page>
            <SectionHeading num="07" title="Quick reference" subtitle="Dashboard signals at a glance" />

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 32 }}>
              <thead>
                <tr style={{ background: "#0891b2", color: "#fff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Signal</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>What it means</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Suggested action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["🟢 On-track (55%+ positive)", "Athlete is expressing positive mindset consistently", "Review entries, reinforce what's working"],
                  ["🟡 Monitor (30–55% positive)", "Mixed sentiment — could be a rough week or a trend", "Read entries, check training log mood, send a message"],
                  ["🔴 Attention (<30% positive)", "Predominantly negative entries — athlete is struggling", "Contact the athlete directly before next session"],
                  ["0 entries this week", "No journal activity", "Remind athlete to log — engagement is the first step"],
                  ["Mood drop (e.g. 8 → 4/10)", "Sudden mood decline in training log", "Check journal entries from the same days for context"],
                  ["Low ACSI Confidence <50%", "Self-confidence deficit in competition context", "Focus next session on confidence-building exercises"],
                  ["High CSAI-2 Cognitive Anxiety", "Athlete is worrying about performance outcomes", "Introduce thought-stopping or re-framing techniques"],
                ].map(([signal, meaning, action], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ecfeff" : "#fff" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0e7490" }}>{signal}</td>
                    <td style={{ padding: "8px 12px", color: "#52525b" }}>{meaning}</td>
                    <td style={{ padding: "8px 12px", color: "#111" }}>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Note>
              <strong>Weekly review rhythm (suggested):</strong> Check all athlete flags once a week before your group or individual sessions. Read full entries for any 🔴 athletes first. Scan training log mood trends for all athletes. Note any test results that appeared since last review.
            </Note>
          </Page>

        </div>
      </body>
    </html>
  );
}
