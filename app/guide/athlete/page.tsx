import React from "react";

export const metadata = {
  title: "PowerFlow · Athlete Guide",
  description: "How to use the PowerFlow app — athlete edition",
};

// ── Shared print layout helpers ───────────────────────────────────────────────

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-break">
      {children}
    </div>
  );
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

// ── Phone mockup frames ───────────────────────────────────────────────────────

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

// ── Individual screen mockups ─────────────────────────────────────────────────

function ScreenSignIn() {
  return (
    <Phone caption="Sign-in screen">
      <div className="s-center" style={{ padding: "24px 16px" }}>
        <div className="s-logo">PF</div>
        <div className="s-tagline">POWERFLOW</div>
        <div className="s-h1" style={{ marginBottom: 6 }}>Mental Training</div>
        <div className="s-sub" style={{ marginBottom: 24 }}>for Powerlifters</div>
        <div className="s-btn-primary">Sign in with Google</div>
        <div style={{ marginTop: 16 }}>
          <div className="s-pill active" style={{ marginBottom: 8 }}>Athlete</div>
          <div className="s-pill">Coach</div>
        </div>
      </div>
    </Phone>
  );
}

function ScreenOnboardingStep1() {
  return (
    <Phone caption="Step 1 — About you">
      <div className="s-header">
        <span className="s-eyebrow">POWERFLOW · SETUP</span>
        <span className="s-skip">Skip setup</span>
      </div>
      <div className="s-progress-bar"><div className="s-progress-fill" style={{ width: "17%" }} /></div>
      <div style={{ padding: "0 12px" }}>
        <div className="s-h2">About you</div>
        <div className="s-label">YOUR NAME *</div>
        <div className="s-input">Anna Kovács</div>
        <div className="s-label" style={{ marginTop: 10 }}>INSTAGRAM</div>
        <div className="s-input">@annakovacs</div>
        <div className="s-label" style={{ marginTop: 10 }}>GENDER *</div>
        <div style={{ display: "flex", gap: 6 }}>
          <div className="s-pill active">Female</div>
          <div className="s-pill">Male</div>
        </div>
      </div>
      <div className="s-footer-btn">Next →</div>
    </Phone>
  );
}

function ScreenOnboardingMindset() {
  return (
    <Phone caption="Step 4 — Mindset & self-rating">
      <div className="s-header">
        <span className="s-eyebrow">POWERFLOW · SETUP</span>
        <span className="s-skip">Skip setup</span>
      </div>
      <div className="s-progress-bar"><div className="s-progress-fill" style={{ width: "67%" }} /></div>
      <div style={{ padding: "0 12px" }}>
        <div className="s-h2">Mindset</div>
        <div className="s-label">BIGGEST BARRIER *</div>
        <div className="s-textarea">I freeze under heavy attempts in competition…</div>
        <div className="s-label" style={{ marginTop: 8 }}>SELF-ASSESSMENT (1–10)</div>
        <div className="s-scale-row">
          <span>Confidence reg.</span>
          <div className="s-scale-dots">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <div key={n} className={`s-scale-dot${n === 6 ? " active" : ""}`}>{n}</div>
            ))}
          </div>
        </div>
        <div className="s-scale-row">
          <span>Handling pressure</span>
          <div className="s-scale-dots">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <div key={n} className={`s-scale-dot${n === 4 ? " active" : ""}`}>{n}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="s-footer-btn">Next →</div>
    </Phone>
  );
}

function ScreenToday() {
  return (
    <Phone caption="Today screen">
      <div style={{ padding: "12px 12px 0" }}>
        <div className="s-eyebrow">POWERFLOW · TODAY</div>
        <div className="s-h1" style={{ marginBottom: 2 }}>Good morning, Anna</div>
        <div className="s-sub">Saturday, 25 April</div>
        <div className="s-card-purple" style={{ marginTop: 12 }}>
          <div className="s-eyebrow">LOG TODAY</div>
          <div className="s-body" style={{ margin: "4px 0 8px" }}>Saturday — training day or rest day?</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div className="s-btn-sm-purple">🏋️ Training Day</div>
            <div className="s-btn-sm-dark">😴 Rest Day</div>
          </div>
        </div>
        <div className="s-card-dark" style={{ marginTop: 8 }}>
          <div className="s-eyebrow">TRAINING PHASE</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <div className="s-badge">Peak</div>
            <div>
              <div className="s-num-big">18</div>
              <div className="s-eyebrow">days to go</div>
            </div>
          </div>
        </div>
        <div className="s-card-dark" style={{ marginTop: 8 }}>
          <div className="s-eyebrow">STRENGTH GOALS</div>
          <div className="s-lift-row"><span>Squat</span><span>200 kg → 215 kg</span></div>
          <div className="s-lift-row"><span>Bench</span><span>110 kg → 120 kg</span></div>
          <div className="s-lift-row"><span>Deadlift</span><span>235 kg → 250 kg</span></div>
        </div>
      </div>
    </Phone>
  );
}

function ScreenCheckIn() {
  return (
    <Phone caption="Training day check-in">
      <div style={{ padding: "12px" }}>
        <div className="s-h2" style={{ marginBottom: 8 }}>Training Day</div>
        <div className="s-label">RATE YOUR MOOD</div>
        <div className="s-scale-dots" style={{ flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <div key={n} className={`s-scale-dot${n === 8 ? " active" : ""}`}>{n}</div>
          ))}
        </div>
        <div className="s-label">THOUGHTS BEFORE SESSION</div>
        <div className="s-textarea" style={{ marginBottom: 8 }}>Feeling sharp today, good warm-up…</div>
        <div className="s-label">HOW DID IT GO?</div>
        <div className="s-textarea">Hit every planned set. Deadlifts felt strong…</div>
        <div className="s-label" style={{ marginTop: 8 }}>WHAT WENT WELL?</div>
        <div className="s-textarea">Stayed composed on the heavy singles.</div>
      </div>
      <div className="s-footer-btn" style={{ margin: "0 12px 12px" }}>Save</div>
    </Phone>
  );
}

function ScreenJournal() {
  return (
    <Phone caption="Journal — write an entry">
      <div style={{ padding: "12px" }}>
        <div className="s-eyebrow">POWERFLOW · JOURNAL</div>
        <div className="s-h1" style={{ marginBottom: 8 }}>Journal</div>
        <div className="s-label">CONTEXT</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {["General","Pre-comp","Post-comp","Session","Rest day"].map((t, i) => (
            <div key={t} className={`s-tag${i === 2 ? " active" : ""}`}>{t}</div>
          ))}
        </div>
        <div className="s-label">YOUR ENTRY</div>
        <div className="s-textarea" style={{ height: 56 }}>
          Hit a bench PR today. Hard to believe after last week&apos;s session — I was convinced I was going backwards…
        </div>
        <div className="s-btn-primary" style={{ marginTop: 10, textAlign: "center" }}>Save entry</div>
        <div className="s-divider" />
        <div className="s-label">RECENT</div>
        <div className="s-entry-row">
          <span className="s-dot green" />
          <div>
            <div className="s-entry-meta">Thu 23 · Post-comp</div>
            <div className="s-entry-preview">Met is in 6 weeks and I keep imagining…</div>
          </div>
        </div>
        <div className="s-entry-row">
          <span className="s-dot red" />
          <div>
            <div className="s-entry-meta">Wed 22 · Session</div>
            <div className="s-entry-preview">Deadlift session was rough. Lockout broke…</div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function ScreenTools() {
  return (
    <Phone caption="Tools — assessments">
      <div style={{ padding: "12px" }}>
        <div className="s-eyebrow">POWERFLOW · TOOLS</div>
        <div className="s-h1" style={{ marginBottom: 10 }}>Tools</div>
        {[
          { name: "SAT", desc: "Sport Anxiety Test", done: true },
          { name: "ACSI", desc: "Coping Skills Inventory", done: true },
          { name: "CSAI-2", desc: "Competitive Anxiety", done: false },
          { name: "DAS", desc: "Depression · Anxiety · Stress", done: false },
        ].map(t => (
          <div key={t.name} className="s-tool-card">
            <div>
              <div className="s-tool-name">{t.name}</div>
              <div className="s-tool-desc">{t.desc}</div>
            </div>
            <div className={`s-tool-status ${t.done ? "done" : ""}`}>
              {t.done ? "Done ✓" : "Start →"}
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenYou() {
  return (
    <Phone caption="You — profile & settings">
      <div style={{ padding: "12px" }}>
        <div className="s-eyebrow">POWERFLOW · YOU</div>
        <div className="s-h1" style={{ marginBottom: 10 }}>Profile</div>
        <div className="s-identity-card">
          <div className="s-avatar">AK</div>
          <div>
            <div className="s-name">Anna Kovács</div>
            <div className="s-role-badge">athlete</div>
          </div>
        </div>
        <div className="s-section-card">
          <div className="s-eyebrow">NEXT COMPETITION</div>
          <div className="s-input-row">2026-09-14<span className="s-save-btn">Save</span></div>
        </div>
        <div className="s-section-card">
          <div className="s-eyebrow">STRENGTH GOALS</div>
          <div className="s-lift-row"><span>Squat</span><span>200 → 215 kg</span></div>
          <div className="s-lift-row"><span>Bench</span><span>110 → 120 kg</span></div>
        </div>
        <div className="s-section-card">
          <div className="s-eyebrow">COACH</div>
          <div className="s-coach-row">
            <span className="s-dot green" />
            <span style={{ fontSize: 9, color: "#6ee7b7" }}>Connected to Clarice Tighe</span>
          </div>
        </div>
      </div>
    </Phone>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function AthleteGuidePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PowerFlow · Athlete Guide</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;600;700;800&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Saira', sans-serif;
            background: #fff;
            color: #111;
            font-size: 11px;
            line-height: 1.5;
          }

          /* ── Print layout ── */
          .doc { max-width: 780px; margin: 0 auto; padding: 0 32px; }

          @media print {
            body { font-size: 10px; }
            .doc { padding: 0 20px; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
          }

          /* ── Cover page ── */
          .cover {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #050608;
            color: #fff;
            padding: 60px 48px;
          }
          @media print {
            .cover { min-height: 100vh; page-break-after: always; }
          }
          .cover-logo {
            width: 72px; height: 72px;
            border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 800; color: #fff;
            margin-bottom: 40px;
          }
          .cover-eyebrow {
            font-size: 9px; font-weight: 700;
            letter-spacing: 0.32em; text-transform: uppercase;
            color: #a78bfa; margin-bottom: 12px;
          }
          .cover-title {
            font-size: 48px; font-weight: 800;
            text-transform: uppercase; letter-spacing: -0.01em;
            line-height: 1.05; color: #fff; margin-bottom: 16px;
          }
          .cover-sub {
            font-size: 13px; color: #a1a1aa; max-width: 400px;
            line-height: 1.6; margin-bottom: 48px;
          }
          .cover-meta { font-size: 9px; color: #52525b; letter-spacing: 0.18em; text-transform: uppercase; }
          .cover-divider { width: 48px; height: 2px; background: #7c3aed; margin-bottom: 32px; }

          /* ── Section layout ── */
          .page-break { padding-top: 48px; }

          .section-heading {
            display: flex; align-items: flex-start; gap: 16px;
            padding-bottom: 16px; margin-bottom: 24px;
            border-bottom: 1px solid #e4e4e7;
          }
          .section-num {
            font-size: 28px; font-weight: 800; color: #7c3aed;
            line-height: 1; min-width: 36px;
          }
          .section-title {
            font-size: 18px; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.06em;
            color: #111; line-height: 1.1;
          }
          .section-subtitle {
            font-size: 10px; color: #71717a; margin-top: 3px;
            letter-spacing: 0.06em;
          }

          .two-col {
            display: flex; gap: 32px; align-items: flex-start;
          }
          .col-text { flex: 1; }
          .col-phone { flex-shrink: 0; }

          /* ── Text content ── */
          .step-list { list-style: none; padding: 0; margin: 0 0 16px; }
          .step-list li {
            display: flex; gap: 12px; align-items: flex-start;
            padding: 10px 0; border-bottom: 1px solid #f4f4f5;
          }
          .step-list li:last-child { border-bottom: none; }
          .step-num {
            width: 20px; height: 20px; border-radius: 50%;
            background: #7c3aed; color: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 9px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
          }
          .step-list li strong { display: block; font-weight: 700; color: #111; margin-bottom: 2px; }
          .step-list li p { color: #52525b; font-size: 10px; line-height: 1.5; }

          .note {
            background: #faf5ff; border-left: 3px solid #7c3aed;
            padding: 10px 14px; border-radius: 0 6px 6px 0;
            font-size: 10px; color: #4c1d95; line-height: 1.5;
            margin-top: 12px;
          }

          /* ── Phone mockup ── */
          .phone-wrap { display: flex; flex-direction: column; align-items: center; }
          .phone-frame {
            width: 180px;
            background: #050608;
            border-radius: 28px;
            border: 6px solid #27272a;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.05);
            overflow: hidden;
            position: relative;
            display: flex; flex-direction: column;
          }
          .phone-notch {
            width: 60px; height: 14px;
            background: #27272a; border-radius: 0 0 10px 10px;
            margin: 0 auto; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
            z-index: 10;
          }
          .phone-screen {
            flex: 1; overflow: hidden; padding-top: 18px;
            font-family: 'Saira', sans-serif;
            min-height: 360px;
          }
          .phone-home {
            width: 48px; height: 4px; background: #3f3f46; border-radius: 2px;
            margin: 6px auto 8px;
          }
          .phone-caption {
            font-size: 9px; color: #71717a; text-align: center;
            margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase;
          }

          /* ── Screen UI primitives ── */
          .s-eyebrow {
            font-size: 7px; font-weight: 700; letter-spacing: 0.28em;
            text-transform: uppercase; color: #a78bfa;
          }
          .s-h1 { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #fff; }
          .s-h2 { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #fff; margin-bottom: 8px; }
          .s-sub { font-size: 9px; color: #71717a; }
          .s-label {
            font-size: 7px; font-weight: 700; letter-spacing: 0.2em;
            text-transform: uppercase; color: #71717a; margin-bottom: 4px;
          }
          .s-input {
            background: #0D0B14; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px; padding: 5px 8px;
            font-size: 9px; color: #fff; margin-bottom: 6px;
          }
          .s-textarea {
            background: #0D0B14; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px; padding: 5px 8px;
            font-size: 8px; color: #a1a1aa; margin-bottom: 6px;
            min-height: 36px; line-height: 1.4;
          }
          .s-btn-primary {
            background: #7c3aed; color: #fff; border-radius: 20px;
            padding: 6px 16px; font-size: 8px; font-weight: 700;
            letter-spacing: 0.14em; text-transform: uppercase;
            display: inline-block; cursor: default;
          }
          .s-btn-sm-purple {
            background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4);
            color: #c4b5fd; border-radius: 8px;
            padding: 4px 6px; font-size: 7px; font-weight: 700; flex: 1; text-align: center;
          }
          .s-btn-sm-dark {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: #d4d4d8; border-radius: 8px;
            padding: 4px 6px; font-size: 7px; font-weight: 700; flex: 1; text-align: center;
          }
          .s-footer-btn {
            background: #7c3aed; color: #fff; margin: 8px 12px;
            border-radius: 10px; padding: 8px; font-size: 9px;
            font-weight: 700; text-align: center; letter-spacing: 0.1em;
          }
          .s-pill {
            border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
            color: #a1a1aa; border-radius: 20px; padding: 4px 12px;
            font-size: 8px; font-weight: 700; display: inline-block;
          }
          .s-pill.active {
            border-color: #7c3aed; background: #7c3aed; color: #fff;
          }
          .s-card-purple {
            background: rgba(124,58,237,0.07); border: 1px solid rgba(124,58,237,0.3);
            border-radius: 12px; padding: 10px;
          }
          .s-card-dark {
            background: #17131f; border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px; padding: 10px;
          }
          .s-badge {
            display: inline-block; background: rgba(124,58,237,0.2);
            border: 1px solid rgba(124,58,237,0.3); color: #c4b5fd;
            border-radius: 6px; padding: 2px 6px; font-size: 8px; font-weight: 700;
          }
          .s-num-big { font-size: 20px; font-weight: 800; color: #fff; line-height: 1; }
          .s-lift-row {
            display: flex; justify-content: space-between;
            font-size: 8px; color: #a1a1aa; padding: 2px 0;
          }
          .s-lift-row span:last-child { color: #fff; }
          .s-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 0 12px 6px;
          }
          .s-skip { font-size: 7px; color: #52525b; }
          .s-progress-bar {
            height: 2px; background: rgba(255,255,255,0.05);
            margin: 0 12px 10px; border-radius: 1px; overflow: hidden;
          }
          .s-progress-fill { height: 100%; background: #7c3aed; border-radius: 1px; }
          .s-center { display: flex; flex-direction: column; align-items: center; }
          .s-logo {
            width: 40px; height: 40px; border-radius: 50%;
            background: linear-gradient(135deg,#7c3aed,#a855f7);
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 6px;
          }
          .s-tagline { font-size: 7px; font-weight: 700; letter-spacing: 0.28em; color: #a78bfa; margin-bottom: 4px; }
          .s-body { font-size: 9px; color: #d4d4d8; }
          .s-scale-row {
            display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px;
          }
          .s-scale-row > span { font-size: 8px; color: #a1a1aa; }
          .s-scale-dots { display: flex; gap: 2px; flex-wrap: nowrap; }
          .s-scale-dot {
            width: 14px; height: 14px; border-radius: 4px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            font-size: 7px; color: #71717a;
            display: flex; align-items: center; justify-content: center;
            font-weight: 600; flex-shrink: 0;
          }
          .s-scale-dot.active {
            background: #7c3aed; border-color: #7c3aed; color: #fff;
          }
          .s-tag {
            border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
            color: #a1a1aa; border-radius: 6px; padding: 2px 6px;
            font-size: 7px; font-weight: 600;
          }
          .s-tag.active {
            border-color: #7c3aed; background: rgba(124,58,237,0.2); color: #c4b5fd;
          }
          .s-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 8px 0; }
          .s-entry-row {
            display: flex; gap: 6px; align-items: flex-start; padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .s-entry-meta { font-size: 7px; color: #71717a; }
          .s-entry-preview { font-size: 8px; color: #d4d4d8; line-height: 1.3; }
          .s-dot {
            width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
          }
          .s-dot.green { background: #34d399; }
          .s-dot.red { background: #f87171; }
          .s-dot.gray { background: #71717a; }
          .s-tool-card {
            display: flex; justify-content: space-between; align-items: center;
            background: #17131f; border: 1px solid rgba(255,255,255,0.05);
            border-radius: 10px; padding: 8px 10px; margin-bottom: 6px;
          }
          .s-tool-name { font-size: 9px; font-weight: 700; color: #fff; }
          .s-tool-desc { font-size: 7px; color: #71717a; }
          .s-tool-status {
            font-size: 8px; font-weight: 700;
            color: #71717a; letter-spacing: 0.08em;
          }
          .s-tool-status.done { color: #34d399; }
          .s-identity-card {
            display: flex; align-items: center; gap: 10px;
            background: #17131f; border: 1px solid rgba(255,255,255,0.05);
            border-radius: 10px; padding: 8px; margin-bottom: 6px;
          }
          .s-avatar {
            width: 28px; height: 28px; border-radius: 50%;
            background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 9px; font-weight: 700; color: #a78bfa;
          }
          .s-name { font-size: 9px; font-weight: 700; color: #fff; }
          .s-role-badge {
            display: inline-block; border: 1px solid rgba(124,58,237,0.3);
            background: rgba(124,58,237,0.1); color: #a78bfa;
            border-radius: 20px; padding: 1px 6px; font-size: 7px; font-weight: 700;
            letter-spacing: 0.12em; text-transform: uppercase;
          }
          .s-section-card {
            background: #17131f; border: 1px solid rgba(255,255,255,0.05);
            border-radius: 10px; padding: 8px; margin-bottom: 6px;
          }
          .s-input-row {
            display: flex; justify-content: space-between; align-items: center;
            background: #0D0B14; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px; padding: 4px 8px; font-size: 8px; color: #fff; margin-top: 4px;
          }
          .s-save-btn {
            font-size: 7px; background: #7c3aed; color: #fff;
            border-radius: 6px; padding: 2px 6px; font-weight: 700;
          }
          .s-coach-row { display: flex; align-items: center; gap: 5px; margin-top: 4px; }

          /*
           * Back-to-app button — only visible on screen. Hidden in print so
           * the PDF stays clean. Sits at the very top of the document so users
           * can never get stuck on this page (especially in a PWA where
           * target="_blank" sometimes opens in the same window).
           */
          .back-bar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #fff;
            border-bottom: 1px solid #eee;
            padding: 12px 16px;
          }
          .back-bar a {
            display: inline-flex; align-items: center; gap: 8px;
            text-decoration: none;
            color: #7c3aed;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.04em;
            background: rgba(124, 58, 237, 0.08);
            border: 1px solid rgba(124, 58, 237, 0.3);
            border-radius: 999px;
            padding: 8px 14px;
            transition: background 0.15s, border-color 0.15s;
          }
          .back-bar a:hover {
            background: rgba(124, 58, 237, 0.16);
            border-color: rgba(124, 58, 237, 0.5);
          }
          @media print {
            .back-bar { display: none !important; }
          }
        `}</style>
      </head>
      <body>
        {/* Sticky back-to-app bar — hidden in print, visible on screen */}
        <div className="back-bar">
          <a href="/guide">← Back to app</a>
        </div>
        <div className="doc">

          {/* ── Cover ─────────────────────────────────────────── */}
          <div className="cover">
            <div className="cover-logo">PF</div>
            <div className="cover-eyebrow">PowerFlow · User Guide</div>
            <h1 className="cover-title">Athlete<br />Guide</h1>
            <div className="cover-divider" />
            <p className="cover-sub">
              Everything you need to get the most out of the PowerFlow app — from signing in to logging your first training session and connecting with your coach.
            </p>
            <p className="cover-meta">Version 1.0 · April 2026 · powerflow.eu</p>
          </div>

          {/* ── 01 Sign in ──────────────────────────────────────── */}
          <Page>
            <SectionHeading num="01" title="Signing in" subtitle="Google OAuth · Role selection" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open the app", desc: "Navigate to the PowerFlow URL. You will see the sign-in screen with a Google button." },
                    { label: "Make sure Athlete is selected", desc: "Below the Google button you will see two role options: Athlete and Coach. The role is set permanently — choose Athlete." },
                    { label: "Tap Sign in with Google", desc: "Complete the standard Google OAuth flow. You will be redirected to the setup wizard on first sign-in." },
                    { label: "Used an invite link?", desc: "If your coach gave you a join link, open it before signing in. It automatically links your account to your coach." },
                  ]} />
                  <Note>
                    <strong>Important:</strong> Your role (Athlete / Coach) is assigned at first sign-in and cannot be changed. If you accidentally signed in as a coach, contact support.
                  </Note>
                </>
              }
              right={<ScreenSignIn />}
            />
          </Page>

          {/* ── 02 Setup wizard ─────────────────────────────────── */}
          <Page>
            <SectionHeading num="02" title="Setup wizard" subtitle="6 steps · Replaces the paper application form" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    The wizard collects the same information as the PowerFlow application form and stores it securely in the app. All steps except Step 1 and Step 4&apos;s first question are optional — you can complete them later from the <strong>You</strong> tab.
                  </p>
                  <Steps items={[
                    { label: "Step 1 — About you", desc: "Full name (required), Instagram handle, and gender (required for GL Points calculation)." },
                    { label: "Step 2 — Powerlifting profile", desc: "Years competing, federation, bodyweight, weight class, next competition date, and training days per week." },
                    { label: "Step 3 — Your lifts", desc: "Current bests and competition goals for squat, bench, and deadlift in kg. Powers the GL Points calculator on the Today screen." },
                    { label: "Step 4 — Mindset & self-assessment", desc: "Four open questions about your mental barriers, confidence, overthinking patterns, and previous coaching history. Then rate yourself 1–10 on five mental skills. This goes straight to your coach." },
                    { label: "Step 5 — Goals", desc: "Three mental goals for the next 3 months, your expectations from coaching, mental tools you have tried before, and anything else important." },
                    { label: "Step 6 — Your coach", desc: "Pick your PowerFlow coach from the list. Tap No coach yet if you want to connect later." },
                  ]} />
                </>
              }
              right={
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <ScreenOnboardingStep1 />
                  <ScreenOnboardingMindset />
                </div>
              }
            />
          </Page>

          {/* ── 03 Today ────────────────────────────────────────── */}
          <Page>
            <SectionHeading num="03" title="Today — daily check-in" subtitle="Log every session · Track your training week" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open Today tab", desc: "The Today tab is your home screen. At the top you will always see the check-in card if you have not logged yet today." },
                    { label: "Choose Training Day or Rest Day", desc: "Tap the button that matches your day. A sheet slides up from the bottom." },
                    { label: "Rate your mood (1–10)", desc: "Required. This powers the mood sparkline your coach sees in the training log." },
                    { label: "Answer the training questions", desc: "On training days: thoughts before the session, how it went, what went well, any frustrations, and focus for next session. On rest days: just an optional note." },
                    { label: "Tap Save", desc: "The check-in card turns green with a confirmation. Your coach can see this within seconds." },
                    { label: "Edit any time", desc: "Tap Edit on the confirmation card to update your log for the same day." },
                  ]} />
                  <Note>
                    <strong>Reminder badge:</strong> If you have not logged by end of day, a red dot appears on the Today tab in the bottom bar. Enable browser notifications (tap 🔔 Reminders on the check-in card) to get a nudge at 7 pm.
                  </Note>
                </>
              }
              right={
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <ScreenToday />
                  <ScreenCheckIn />
                </div>
              }
            />
          </Page>

          {/* ── 04 Journal ──────────────────────────────────────── */}
          <Page>
            <SectionHeading num="04" title="Journal" subtitle="Capture your mindset · AI sentiment & theme detection" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open Journal tab", desc: "Tap Journal in the bottom navigation. The entry composer is at the top." },
                    { label: "Select a context tag", desc: "Choose from: General, Pre-competition, Post-competition, During session, or Rest day. This helps your coach filter entries." },
                    { label: "Write freely", desc: "There is no minimum length. Describe what you are feeling, thinking, or observing about your mental state." },
                    { label: "Tap Save entry", desc: "The entry is processed automatically. Sentiment (positive / neutral / negative) and themes (confidence, anxiety, focus, pressure, recovery…) are tagged by AI." },
                    { label: "Review past entries", desc: "Scroll down to see all your entries, newest first. Sentiment is shown as a colour dot: green = positive, red = negative, grey = neutral." },
                  ]} />
                  <Note>
                    Journal entries feed directly into your coach&apos;s dashboard. Your weekly positive-sentiment rate and detected themes are the first things they see on your athlete card.
                  </Note>
                </>
              }
              right={<ScreenJournal />}
            />
          </Page>

          {/* ── 05 Tools ────────────────────────────────────────── */}
          <Page>
            <SectionHeading num="05" title="Tools — assessments" subtitle="Four validated sport psychology tests" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    Complete these assessments periodically to track your psychological profile over time. Results appear on your coach&apos;s dashboard automatically.
                  </p>
                  <Steps items={[
                    { label: "SAT — Sport Anxiety Test", desc: "Measures your overall sport anxiety profile. ~10 minutes." },
                    { label: "ACSI — Athletic Coping Skills Inventory", desc: "Assesses four coping skill areas: coping with adversity, concentration, confidence, and goal-setting." },
                    { label: "CSAI-2 — Competitive State Anxiety Inventory", desc: "Differentiates cognitive anxiety (worry) from somatic anxiety (body tension) and self-confidence." },
                    { label: "DAS — Depression, Anxiety & Stress Scale", desc: "Screens for depression-prone thinking, general anxiety, and stress levels adapted for athletes." },
                  ]} />
                  <Note>
                    Some tests require a one-time unlock payment to see your scored results. The test itself is always free to complete — payment is only needed to view the detailed breakdown and share it with your coach.
                  </Note>
                </>
              }
              right={<ScreenTools />}
            />
          </Page>

          {/* ── 06 Course ───────────────────────────────────────── */}
          <Page>
            <SectionHeading num="06" title="Course" subtitle="16-week mental preparation programme" />
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <Steps items={[
                  { label: "Unlock the course", desc: "Course access is granted by your coach. Once unlocked, the Course tab activates and the current week appears as a card on your Today screen." },
                  { label: "Follow your competition timeline", desc: "The programme is calculated backwards from your competition date. Week 1 starts 16 weeks out, tapering to Week 16 in the final week before the meet." },
                  { label: "Complete each week's content", desc: "Each week has three parts: a video lesson, a practical exercise, and a short Q&A. Progress dots show what is done." },
                  { label: "Current week card", desc: "The Today screen shows your current course week as a reminder card. Tap Continue to jump straight into it." },
                ]} />
                <Note>If you have not set a competition date, the course cannot calculate your current week. Add your meet date from the <strong>You</strong> tab first.</Note>
              </div>
            </div>
          </Page>

          {/* ── 07 You ──────────────────────────────────────────── */}
          <Page>
            <SectionHeading num="07" title="You — profile & settings" subtitle="Update your data · Manage your coach connection" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open You tab", desc: "Tap You in the bottom navigation. All your profile data is editable here at any time." },
                    { label: "Update your name", desc: "Tap the name field in the identity card at the top and save. This is the name your coach sees." },
                    { label: "Update lifts and goals", desc: "Keep your current bests up to date so GL Points and the strength card on Today stay accurate." },
                    { label: "Change competition date", desc: "Update your next competition date whenever plans change. This recalculates your training phase and course week." },
                    { label: "Connect or change coach", desc: "In the Coach section, tap Choose a coach or Change coach to open the coach picker." },
                    { label: "Sign out", desc: "The Sign out button is at the bottom of the You page." },
                  ]} />
                  <Note>
                    <strong>GL Points</strong> (IPF Goodlift formula) calculate automatically from your total (squat + bench + deadlift current bests) and bodyweight. Set your gender, bodyweight, and lifts to see them.
                  </Note>
                </>
              }
              right={<ScreenYou />}
            />
          </Page>

          {/* ── 08 Coach AI ─────────────────────────────────────── */}
          <Page>
            <SectionHeading num="08" title="Coach AI" subtitle="Sports psychology AI · Built on your coach's methodology" />
            <Steps items={[
              { label: "Open Coach AI", desc: "Tap the chat bubble icon in the bottom navigation. The first time you open it with no conversation history, personalised prompt chips appear based on your recent journal entries, upcoming meet date, and what you've already mapped." },
              { label: "What you can ask it", desc: "Analyse recent journal entries · Prepare mentally for competition · Debrief a tough session · Map your ego states · Generate a visualization or relaxation script · Guide you through switching psychological states · Work through self-doubt or anxiety" },
              { label: "Scripts in your coach's voice", desc: "Any script the AI generates — visualization, grounding, pre-competition routine — can be played back in your coach's voice. Tap ▶ Play on the script card. Save scripts to your library with the save button to listen again any time." },
              { label: "Smart prompts", desc: "If you open Coach AI without typing anything, personalised prompt chips appear. These update based on your recent entries, upcoming meet, and ego states. Tap one to start the session immediately." },
            ]} />
            <Note>Coach AI works best when your journal is active. The more you write, the more context the AI has — and the more relevant its observations and suggestions become.</Note>
          </Page>

          {/* ── 09 Ego States ────────────────────────────────────── */}
          <Page>
            <SectionHeading num="09" title="Ego States" subtitle="Psychological personas · Deliberate state design" />
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: "#52525b", lineHeight: 1.6, marginBottom: 12 }}>
                  An ego state is a psychological persona you deliberately step into for a specific context. Each state has eight components:
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 16 }}>
                  <tbody>
                    {[
                      ["Name", "What you call this part of you — e.g. The Machine, The Builder"],
                      ["Colour", "A visual anchor for rapid recognition"],
                      ["Posture", "How your body holds itself when fully in this state"],
                      ["Body feeling", "Where you feel this state in your body, and what it feels like"],
                      ["Inner voice", "The tone, speed, and style of how this state speaks internally"],
                      ["Origin", "When was this state born? What situation created it?"],
                      ["Domain", "What contexts call for this state?"],
                      ["Shadow side", "What does it look like when this state shows up at the wrong moment?"],
                      ["Activation ritual", "Three concrete steps to switch into this state intentionally"],
                    ].map(([field, desc], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#f5f3ff" : "#fff" }}>
                        <td style={{ padding: "6px 10px", fontWeight: 700, color: "#7c3aed", whiteSpace: "nowrap" }}>{field}</td>
                        <td style={{ padding: "6px 10px", color: "#52525b" }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Steps items={[
                  { label: "Map via Coach AI", desc: "Ask Coach AI: 'Map my ego states with me.' It asks eight questions one at a time, then outputs a state card you save with one tap." },
                  { label: "Review in You tab", desc: "Once saved, an Ego States section appears in your You tab. Tap it to view, edit, or add states." },
                  { label: "Practise switching", desc: "The skill is recognising which state a moment calls for and entering it via your activation ritual — before the moment demands it. Thinking-mode during execution causes paralysis. Warrior-mode during recovery causes burnout." },
                ]} />
              </div>
            </div>
          </Page>

          {/* ── 10 Check-ins ─────────────────────────────────────── */}
          <Page>
            <SectionHeading num="10" title="Weekly & monthly check-ins" subtitle="Structured reflection · Coach visibility" />
            <Steps items={[
              { label: "Weekly check-in", desc: "A prompt appears at the end of each week. Rate five areas: overall mood, training quality, energy levels, sleep quality, and readiness for next week (each 1–10). Then add your biggest win, main challenge, and one focus for the week ahead. Takes about 60 seconds." },
              { label: "Monthly check-in", desc: "Appears at the end of each month with the same five ratings plus three deeper questions: biggest breakthrough this month, the most important thing you learned about yourself, and your main intention going into next month." },
              { label: "Coach visibility", desc: "Your coach sees all check-in responses on their dashboard. These give them a structured picture of how each week and month felt — beyond the individual training log entries." },
            ]} />
            <Note>Check-ins are separate from your daily journal and training log. They are a weekly and monthly pulse — the bigger picture sitting above the day-to-day entries.</Note>
          </Page>

          {/* ── Quick reference ──────────────────────────────────── */}
          <Page>
            <SectionHeading num="—" title="Quick reference" subtitle="What each tab does at a glance" />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ background: "#7c3aed", color: "#fff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderRadius: "6px 0 0 0" }}>Tab</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>What it does</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderRadius: "0 6px 0 0" }}>Use it for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Today", "Daily check-in, phase countdown, lift goals, course card", "Every single day — start here"],
                  ["Journal", "Free-text entries, AI sentiment & theme tagging", "After sessions, competitions, or whenever something is on your mind"],
                  ["Tools", "Sport psychology assessments (SAT, ACSI, CSAI-2, DAS)", "At start of programme and periodically to track progress"],
                  ["Coach AI", "Sports psychology AI, script generation, ego state mapping", "Before competition, after tough sessions, whenever you need to work something through"],
                  ["Course", "16-week structured mental programme", "Weekly — follow the current week's content"],
                  ["You", "Profile editor, lifts, goals, coach, ego states, sign out", "Whenever your data changes or after mapping a new ego state"],
                ].map(([tab, what, use], i) => (
                  <tr key={tab} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#7c3aed" }}>{tab}</td>
                    <td style={{ padding: "8px 12px", color: "#52525b" }}>{what}</td>
                    <td style={{ padding: "8px 12px", color: "#111" }}>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Page>

        </div>
      </body>
    </html>
  );
}
