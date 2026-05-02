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
        <div className="s-athlete-card">
          <div className="s-athlete-header">
            <div className="s-ath-avatar">AK</div>
            <div style={{ flex: 1 }}>
              <div className="s-ath-name">Anna Kovács</div>
              <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                <span className="s-stat">12 entries</span>
                <span className="s-stat">67% pos.</span>
                <span className="s-flag green">🟢 On-track</span>
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
          <span className="s-tab">Check-ins</span>
          <span className="s-tab">Tests</span>
        </div>
        {[
          { dot: "green", date: "Sat 2", ctx: "Post-comp", text: "Hit a 3-month bench PR today. Big confidence boost…" },
          { dot: "red",   date: "Fri 1", ctx: "General",   text: "Meet is 6 weeks away and I keep imagining bombing out…" },
          { dot: "gray",  date: "Thu 30", ctx: "Session",  text: "Squat volume day. Stayed present even though tired…" },
          { dot: "red",   date: "Wed 29", ctx: "Session",  text: "Deadlift lockout broke down on top singles. Frustrated…" },
          { dot: "gray",  date: "Tue 28", ctx: "Rest",     text: "Realising I compare myself too much to others…" },
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
          <span className="s-tab">Check-ins</span>
          <span className="s-tab">Tests</span>
        </div>
        <div className="s-training-summary">
          <span>4/7 training days</span>
          <span>avg mood <strong style={{ color: "#fff" }}>6.8/10</strong></span>
        </div>
        {[
          { day: "Mon", date: "27", icon: "🏋️", mood: 7, fill: 70 },
          { day: "Tue", date: "28", icon: "💤", mood: 8, fill: 80 },
          { day: "Wed", date: "29", icon: "🏋️", mood: 5, fill: 50 },
          { day: "Thu", date: "30", icon: "🏋️", mood: 6, fill: 60 },
          { day: "Fri", date: "1",  icon: "💤", mood: 7, fill: 70 },
          { day: "Sat", date: "2",  icon: "🏋️", mood: 8, fill: 80 },
          { day: "Sun", date: "3",  icon: null,  mood: null, fill: 0 },
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

function ScreenCheckInsTab() {
  return (
    <Phone caption="Athlete — Weekly check-ins tab">
      <div style={{ padding: "0 10px" }}>
        <div className="s-ath-name" style={{ paddingTop: 4, marginBottom: 6 }}>Niina Jarvenkari</div>
        <div className="s-tabs">
          <span className="s-tab">Entries</span>
          <span className="s-tab">Training</span>
          <span className="s-tab active">Check-ins</span>
          <span className="s-tab">Tests</span>
        </div>
        {[
          { week: "Week of 27 Apr", type: "Weekly", conf: 7, press: 5, mot: 8 },
          { week: "Week of 20 Apr", type: "Weekly", conf: 6, press: 6, mot: 7 },
          { week: "Week of 13 Apr", type: "Monthly", conf: 5, press: 7, mot: 6 },
        ].map((c, i) => (
          <div key={i} className="s-tool-card" style={{ marginBottom: 6, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div className="s-tool-name">{c.week}</div>
              <span style={{ fontSize: 7, background: c.type === "Monthly" ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.05)", color: c.type === "Monthly" ? "#a78bfa" : "#71717a", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{c.type}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 7, color: "#71717a" }}>Confidence <strong style={{ color: "#fff" }}>{c.conf}/10</strong></span>
              <span style={{ fontSize: 7, color: "#71717a" }}>Pressure <strong style={{ color: "#fff" }}>{c.press}/10</strong></span>
              <span style={{ fontSize: 7, color: "#71717a" }}>Motivation <strong style={{ color: "#fff" }}>{c.mot}/10</strong></span>
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenTestsTab() {
  return (
    <Phone caption="Athlete — Tests tab + assign">
      <div style={{ padding: "0 10px" }}>
        <div className="s-ath-name" style={{ paddingTop: 4, marginBottom: 6 }}>Niina Jarvenkari</div>
        <div className="s-tabs">
          <span className="s-tab">Entries</span>
          <span className="s-tab">Training</span>
          <span className="s-tab">Check-ins</span>
          <span className="s-tab active">Tests</span>
        </div>
        {[
          { name: "SAT", label: "Sport Anxiety Test", score: "42 / 100", sub: "Low — stable profile", done: true },
          { name: "ACSI", label: "Coping Skills", score: "Confidence: 78%", sub: "Goal-setting: 64%", done: true },
          { name: "CSAI-2", label: "Competitive Anxiety", score: null, sub: "Not completed yet", done: false },
          { name: "DAS", label: "Depression · Anxiety", score: null, sub: "Not completed yet", done: false },
        ].map(t => (
          <div key={t.name} className="s-tool-card" style={{ marginBottom: 5 }}>
            <div>
              <div className="s-tool-name">{t.name}</div>
              <div className="s-tool-desc">{t.label}</div>
              {t.score && <div style={{ fontSize: 8, color: "#a78bfa", marginTop: 2, fontWeight: 700 }}>{t.score}</div>}
              <div style={{ fontSize: 7, color: "#71717a" }}>{t.sub}</div>
            </div>
            <div className={`s-tool-status ${t.done ? "done" : ""}`}>{t.done ? "✓" : "–"}</div>
          </div>
        ))}
        {/* Assign panel */}
        <div style={{ marginTop: 8, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 7, color: "#71717a", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5 }}>Assign a test</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["SAT", "ACSI", "CSAI-2", "DAS"].map(t => (
              <div key={t} style={{ background: "rgba(8,145,178,0.1)", border: "1px solid rgba(8,145,178,0.3)", borderRadius: 6, padding: "2px 6px", fontSize: 7, color: "#67e8f9", fontWeight: 700 }}>{t}</div>
            ))}
          </div>
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

          /* ── Cover ── */
          .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; background: #050608; color: #fff; padding: 60px 48px; }
          @media print { .cover { min-height: 100vh; page-break-after: always; } }
          .cover-logo { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 40px; }
          .cover-eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: #67e8f9; margin-bottom: 12px; }
          .cover-title { font-size: 48px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1.05; color: #fff; margin-bottom: 16px; }
          .cover-sub { font-size: 13px; color: #a1a1aa; max-width: 400px; line-height: 1.6; margin-bottom: 48px; }
          .cover-meta { font-size: 9px; color: #52525b; letter-spacing: 0.18em; text-transform: uppercase; }
          .cover-divider { width: 48px; height: 2px; background: #0891b2; margin-bottom: 32px; }

          /* ── What's New ── */
          .whats-new-page { padding: 48px 0 32px; }
          .whats-new-banner { background: linear-gradient(135deg, #06131a 0%, #062533 100%); border: 1px solid rgba(103,232,249,0.2); border-radius: 16px; padding: 28px 32px; }
          .whats-new-eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: #67e8f9; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
          .whats-new-badge { display: inline-block; background: #0891b2; color: #fff; border-radius: 20px; padding: 2px 8px; font-size: 8px; font-weight: 700; letter-spacing: 0.14em; }
          .whats-new-title { font-size: 22px; font-weight: 800; text-transform: uppercase; color: #fff; letter-spacing: 0.04em; margin-bottom: 20px; }
          .whats-new-items { display: flex; flex-direction: column; gap: 12px; }
          .whats-new-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; }
          .whats-new-item-icon { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; background: rgba(8,145,178,0.15); border: 1px solid rgba(8,145,178,0.3); }
          .whats-new-item-title { font-size: 11px; font-weight: 700; color: #fff; margin-bottom: 3px; }
          .whats-new-item-desc { font-size: 9px; color: #a1a1aa; line-height: 1.5; }

          /* ── Section layout ── */
          .page-break { padding-top: 48px; }
          .section-heading { display: flex; align-items: flex-start; gap: 16px; padding-bottom: 16px; margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; }
          .section-num { font-size: 28px; font-weight: 800; color: #0891b2; line-height: 1; min-width: 36px; }
          .section-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #111; line-height: 1.1; }
          .section-subtitle { font-size: 10px; color: #71717a; margin-top: 3px; letter-spacing: 0.06em; }
          .two-col { display: flex; gap: 32px; align-items: flex-start; }
          .col-text { flex: 1; }
          .col-phone { flex-shrink: 0; }

          /* ── Text ── */
          .step-list { list-style: none; padding: 0; margin: 0 0 16px; }
          .step-list li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f4f4f5; }
          .step-list li:last-child { border-bottom: none; }
          .step-num { width: 20px; height: 20px; border-radius: 50%; background: #0891b2; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
          .step-list li strong { display: block; font-weight: 700; color: #111; margin-bottom: 2px; }
          .step-list li p { color: #52525b; font-size: 10px; line-height: 1.5; }
          .note { background: #ecfeff; border-left: 3px solid #0891b2; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 10px; color: #164e63; line-height: 1.5; margin-top: 12px; }

          /* ── Phone mockup ── */
          .phone-wrap { display: flex; flex-direction: column; align-items: center; }
          .phone-frame { width: 180px; background: #050608; border-radius: 28px; border: 6px solid #27272a; box-shadow: 0 20px 60px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.05); overflow: hidden; position: relative; display: flex; flex-direction: column; }
          .phone-notch { width: 60px; height: 14px; background: #27272a; border-radius: 0 0 10px 10px; margin: 0 auto; position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 10; }
          .phone-screen { flex: 1; overflow: hidden; padding-top: 18px; font-family: 'Saira', sans-serif; min-height: 360px; }
          .phone-home { width: 48px; height: 4px; background: #3f3f46; border-radius: 2px; margin: 6px auto 8px; }
          .phone-caption { font-size: 9px; color: #71717a; text-align: center; margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase; }

          /* ── Screen primitives ── */
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
          .s-tab { flex: 1; text-align: center; font-size: 6.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 0; color: #71717a; }
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

          .back-bar { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #eee; padding: 12px 16px; }
          .back-bar a { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #7c3aed; font-weight: 700; font-size: 13px; letter-spacing: 0.04em; background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 999px; padding: 8px 14px; transition: background 0.15s, border-color 0.15s; }
          .back-bar a:hover { background: rgba(124, 58, 237, 0.16); border-color: rgba(124, 58, 237, 0.5); }
          @media print { .back-bar { display: none !important; } }
        `}</style>
      </head>
      <body>
        <div className="back-bar">
          <a href="/guide">← Back to app</a>
        </div>
        <div className="doc">

          {/* ── Cover ─────────────────────────────────────────── */}
          <div className="cover">
            <div className="cover-logo">PF</div>
            <div className="cover-eyebrow">PowerFlow · User Guide</div>
            <h1 className="cover-title">Coach<br />Guide</h1>
            <div className="cover-divider" />
            <p className="cover-sub">
              How to sign in as a coach, invite your athletes, and use the dashboard to monitor journal sentiment, training mood, weekly check-ins, and assessment results.
            </p>
            <p className="cover-meta">Version 2.0 · May 2026 · powerflow.eu</p>
          </div>

          {/* ── What's New ────────────────────────────────────── */}
          <div className="whats-new-page">
            <div className="whats-new-banner">
              <div className="whats-new-eyebrow">
                <span className="whats-new-badge">NEW</span>
                May 2026
              </div>
              <div className="whats-new-title">What&apos;s new</div>
              <div className="whats-new-items">
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">📅</div>
                  <div>
                    <div className="whats-new-item-title">Athlete course restructured — 8-week core</div>
                    <div className="whats-new-item-desc">The mental preparation course has been rebuilt as a focused 8-module programme calculated backwards from each athlete&apos;s competition date. Module progress and completion now appear in the athlete view. Modules link directly to the corresponding library tools, making it easier to see what your athlete is working on.</div>
                  </div>
                </div>
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">📋</div>
                  <div>
                    <div className="whats-new-item-title">Weekly & monthly check-ins now visible on the dashboard</div>
                    <div className="whats-new-item-desc">Athletes complete a 5-metric check-in each week (confidence, pressure handling, motivation, recovery, focus) plus a written reflection. Every fourth week becomes a deeper monthly review. A dedicated Check-ins tab on each athlete card shows all historical responses — a fast way to spot trends before they become problems.</div>
                  </div>
                </div>
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">🔬</div>
                  <div>
                    <div className="whats-new-item-title">Assign tests directly from the dashboard</div>
                    <div className="whats-new-item-desc">Open any athlete&apos;s Tests tab and use the Assign panel to prompt an athlete to complete a specific test (SAT, ACSI, CSAI-2, or DAS). The assignment appears as an amber prompt on the athlete&apos;s Today screen. Results are linked automatically when the athlete completes it.</div>
                  </div>
                </div>
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">📢</div>
                  <div>
                    <div className="whats-new-item-title">In-app broadcasts · devlog</div>
                    <div className="whats-new-item-desc">Broadcasts are delivered inside the app — athletes and coaches see them as a modal on next login, no email required. Supports clickable links in the body. Coaches see the devlog (full release changelog) automatically after any new broadcast. Athletes access it from You → What&apos;s New.</div>
                  </div>
                </div>
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">🎤</div>
                  <div>
                    <div className="whats-new-item-title">Coach AI for athletes · voice input · light mode</div>
                    <div className="whats-new-item-desc">Athletes now have a private AI coaching chat informed by their journal, training log, and profile. Voice input lets them speak messages aloud. Light mode is now available to all users under You → Appearance.</div>
                  </div>
                </div>
              </div>
            </div>
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
                    { label: "Share your Coach Code directly", desc: "Your 8-character code is shown at the top of the dashboard. Athletes enter it during onboarding (Step 6) or from the Coach section in their You tab." },
                    { label: "Share your Join Link", desc: "The dashboard also shows a direct join link. Athletes who click it before signing in are automatically linked to you after completing the Google sign-in — no code entry needed." },
                    { label: "Athlete appears on your dashboard", desc: "Once linked, the athlete appears in your coach dashboard within seconds. Their data starts populating as soon as they log their first entry." },
                    { label: "Verify the link", desc: "If an athlete does not appear, ask them to check the Coach section in their You tab. Coach codes never expire and can be shared with any number of athletes." },
                  ]} />
                  <Note>
                    If an athlete accidentally linked to the wrong coach, they can change their coach from the <strong>You</strong> tab — no action needed from you.
                  </Note>
                </>
              }
              right={<ScreenDashboard />}
            />
          </Page>

          {/* ── 03 Dashboard overview ───────────────────────────── */}
          <Page>
            <SectionHeading num="03" title="Dashboard overview" subtitle="Traffic-light system · Athlete cards · 3-week trend" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    Each athlete appears as a card showing their 7-day snapshot. The header gives you the three numbers you need to triage at a glance.
                  </p>
                  <Steps items={[
                    { label: "Journal entry count", desc: "How many entries the athlete has written in the last 7 days. Zero is itself a signal — the athlete may be disengaged." },
                    { label: "Positive sentiment rate", desc: "Percentage of entries in the last 7 days tagged as positive by AI. This is the core engagement metric." },
                    { label: "Traffic-light flag", desc: "🟢 On-track: 55%+ positive. 🟡 Monitor: 30–55% — worth a check-in. 🔴 Attention: below 30% — this athlete needs direct contact." },
                    { label: "3-week sentiment trend", desc: "Below the header, each athlete card shows whether their trajectory is improving, declining, stable, or volatile. A declining trend over three weeks is a stronger signal than a single bad week." },
                    { label: "Tap to expand", desc: "Tap any athlete card to open their full profile: Entries, Training, Check-ins, and Tests tabs." },
                  ]} />
                  <Note>
                    <strong>The 🔴 Attention flag is the most important signal.</strong> Check these athletes first in every review session. A drop from 🟢 to 🔴 within a single week often correlates with an upcoming competition or a difficult training block.
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
                    { label: "Read the full entry", desc: "Tap any entry to read the full text. AI-detected themes appear as chips below (confidence, anxiety, focus, pressure, recovery, etc.)." },
                    { label: "Spot patterns", desc: "Look for clusters of negative entries around specific contexts. Repeated 'competition anxiety' or 'confidence' themes across multiple entries signal a clear coaching focus area." },
                    { label: "Leave a coach note", desc: "On any entry you can leave a short coach note. It appears directly below that entry in the athlete's view as a quoted comment — a subtle but visible signal that you read it." },
                  ]} />
                  <Note>
                    Sentiment is tagged automatically by AI but it is not infallible. A negative entry does not always mean the athlete is struggling — read the actual text. Use sentiment as a filter to prioritise which entries to read, not as the final verdict.
                  </Note>
                </>
              }
              right={<ScreenEntriesTab />}
            />
          </Page>

          {/* ── 05 Training log tab ─────────────────────────────── */}
          <Page>
            <SectionHeading num="05" title="Training log tab" subtitle="Mood sparkline · Daily session notes" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open Training Log tab", desc: "Inside an athlete card, tap the Training tab. You see the current Mon–Sun training week." },
                    { label: "Read the sparkline", desc: "Each day shows a bar filled to the athlete's mood rating (1–10). 🏋️ = training day, 💤 = rest day, — = no check-in logged." },
                    { label: "Week summary", desc: "The header shows total training days logged and the weekly average mood. A low average across training days is more concerning than a single bad day." },
                    { label: "Read daily log entries", desc: "The two most recent days are expanded with their full answers: thoughts before the session, how it went, what went well, frustrations, and next-session focus." },
                    { label: "Missing check-ins", desc: "Days with no entry (—) mean the athlete did not log. Multiple consecutive missing days may indicate avoidance — worth a message." },
                  ]} />
                  <Note>
                    Cross-reference the training log with journal entries. A mood of 8/10 on a training day paired with a negative journal entry from the same day often means the athlete is performing well physically but struggling mentally — a nuanced coaching moment.
                  </Note>
                </>
              }
              right={<ScreenTrainingTab />}
            />
          </Page>

          {/* ── 06 Check-ins tab ────────────────────────────────── */}
          <Page>
            <SectionHeading num="06" title="Weekly check-ins tab" subtitle="5 mental metrics weekly · deeper monthly review" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    Athletes complete a structured check-in every week. Five self-rated metrics (1–10) plus a written reflection. Every fourth week becomes a deeper monthly review with additional questions. All responses are visible to you here.
                  </p>
                  <Steps items={[
                    { label: "Open Check-ins tab", desc: "Inside an athlete card, tap the Check-ins tab. All historical check-ins appear, newest first." },
                    { label: "Read the five metrics", desc: "Confidence, pressure handling, motivation, recovery quality, and focus are rated 1–10. A sudden drop in a single metric is a specific conversation starter." },
                    { label: "Read the written reflection", desc: "Each check-in includes a short written response. These are often the most honest content an athlete produces — less formal than a journal entry." },
                    { label: "Monthly review depth", desc: "Monthly check-ins (every 4 weeks) include the five ratings plus three deeper prompts: biggest breakthrough, key lesson, and intention for next month. These are particularly valuable for goal-setting conversations." },
                    { label: "Track trends over time", desc: "Scroll down to compare multiple check-ins. Consistent low scores on a specific metric (e.g. pressure handling stays at 4/10 for 3 weeks) should drive your next session focus." },
                  ]} />
                  <Note>
                    Weekly check-ins are separate from daily training logs. They represent the athlete&apos;s reflective, week-level view of their mental state — not just how any single session felt.
                  </Note>
                </>
              }
              right={<ScreenCheckInsTab />}
            />
          </Page>

          {/* ── 07 Test results tab ─────────────────────────────── */}
          <Page>
            <SectionHeading num="07" title="Test results & assignment" subtitle="SAT · ACSI · CSAI-2 · DAS · Assign from dashboard" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    Once an athlete completes and unlocks a test, scored results appear automatically. You can also prompt any athlete to complete a specific test directly from the dashboard.
                  </p>
                  <Steps items={[
                    { label: "SAT — Sport Anxiety Test", desc: "Total score out of 100. Lower is better. Cross-reference spikes with upcoming competition dates in their profile." },
                    { label: "ACSI — Coping Skills Inventory", desc: "Four sub-scores: coping with adversity, concentration, confidence, goal-setting (all as %). The lowest sub-score is typically the first coaching focus." },
                    { label: "CSAI-2 — Competitive State Anxiety", desc: "Three scores: cognitive anxiety (worry), somatic anxiety (body), and self-confidence. High cognitive + low confidence = classic pre-competition pattern." },
                    { label: "DAS — Depression, Anxiety, Stress", desc: "Screens for depression-prone thinking, anxiety, and stress. A high DAS alongside many negative journal entries warrants a direct conversation and possible referral." },
                    { label: "Assign a test", desc: "At the bottom of the Tests tab, tap any of the four test names in the Assign panel. The athlete receives an amber prompt on their Today screen. You see the results as soon as they complete and unlock them." },
                  ]} />
                  <Note>
                    Tests require a one-time athlete payment to view detailed scored results. If results are not showing after an athlete reports completing a test, ask whether they have unlocked the results view.
                  </Note>
                </>
              }
              right={<ScreenTestsTab />}
            />
          </Page>

          {/* ── 08 Quick reference ──────────────────────────────── */}
          <Page>
            <SectionHeading num="—" title="Quick reference" subtitle="Dashboard signals at a glance" />

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 24 }}>
              <thead>
                <tr style={{ background: "#0891b2", color: "#fff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Signal</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>What it means</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Suggested action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["🟢 On-track (55%+ positive)", "Positive mindset pattern this week", "Review entries, reinforce what&apos;s working"],
                  ["🟡 Monitor (30–55% positive)", "Mixed sentiment — could be a rough week or a trend", "Read entries, check training mood, send a message"],
                  ["🔴 Attention (<30% positive)", "Predominantly negative entries", "Contact the athlete before their next session"],
                  ["Declining 3-week trend", "Trajectory is getting worse across three weeks", "Do not wait for next flag — check in now"],
                  ["0 entries this week", "No journal activity", "Remind athlete to log — engagement is the first step"],
                  ["Mood drop in training log", "Sudden decline in daily mood ratings", "Cross-reference with journal entries from same days"],
                  ["Check-in metric ≤3 for 2+ weeks", "A specific mental skill is consistently low", "Use it as the focus of your next session"],
                  ["Low ACSI Confidence <50%", "Self-confidence deficit in competition context", "Focus on confidence-building and evidence review"],
                  ["High CSAI-2 Cognitive Anxiety", "Athlete is worrying about performance outcomes", "Introduce pre-competition thought-management strategies"],
                  ["Assigned test — no result yet", "Athlete has not completed or unlocked test", "Follow up; they may not have seen the prompt"],
                ].map(([signal, meaning, action], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ecfeff" : "#fff" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0e7490" }} dangerouslySetInnerHTML={{ __html: signal }} />
                    <td style={{ padding: "8px 12px", color: "#52525b" }} dangerouslySetInnerHTML={{ __html: meaning }} />
                    <td style={{ padding: "8px 12px", color: "#111" }} dangerouslySetInnerHTML={{ __html: action }} />
                  </tr>
                ))}
              </tbody>
            </table>

            <Note>
              <strong>Suggested weekly review rhythm:</strong> Check all athlete flags once a week before your group or individual sessions. Read full entries for any 🔴 athletes first. Scan check-in metrics for any consistent lows. Review any test results that appeared since last week. The whole review takes under 10 minutes once you know the pattern.
            </Note>
          </Page>

        </div>
      </body>
    </html>
  );
}
