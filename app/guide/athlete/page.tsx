import React from "react";

export const metadata = {
  title: "PowerFlow · Athlete Guide",
  description: "How to use the PowerFlow app — athlete edition",
};

// ── Shared print layout helpers ───────────────────────────────────────────────

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

function BetaNote({ children }: { children: React.ReactNode }) {
  return <div className="note beta-note">{children}</div>;
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
        <div className="s-sub">Saturday, 2 May</div>
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
          <div className="s-eyebrow">THIS WEEK · MODULE 6</div>
          <div className="s-lift-row"><span>The Bench</span><span style={{ color: "#a78bfa" }}>Continue →</span></div>
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
          Hit a bench PR today. Hard to believe after last week — I was convinced I was going backwards…
        </div>
        <div className="s-btn-primary" style={{ marginTop: 10, textAlign: "center" }}>Save entry</div>
        <div className="s-divider" />
        <div className="s-label">RECENT</div>
        <div className="s-entry-row">
          <span className="s-dot green" />
          <div>
            <div className="s-entry-meta">Thu 30 · Post-comp</div>
            <div className="s-entry-preview">Hit a 3-month bench PR — big confidence boost…</div>
          </div>
        </div>
        <div className="s-entry-row">
          <span className="s-dot red" />
          <div>
            <div className="s-entry-meta">Wed 29 · Session</div>
            <div className="s-entry-preview">Deadlift session was rough. That voice again…</div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function ScreenLibrary() {
  return (
    <Phone caption="Library — mental tools">
      <div style={{ padding: "12px" }}>
        <div className="s-eyebrow">POWERFLOW · LIBRARY</div>
        <div className="s-h1" style={{ marginBottom: 4 }}>Library</div>
        <div className="s-sub" style={{ marginBottom: 10 }}>Mental performance tools</div>
        {[
          { group: "RELAXATION", items: ["Progressive Muscle Relaxation", "Autogenic Training"] },
          { group: "VISUALIZATIONS", items: ["Squat · 3 modes", "Bench · 3 modes", "Deadlift · 3 modes"] },
          { group: "ACTIVATION", items: ["Resource Activation", "Affirmations"] },
          { group: "FOCUS", items: ["Barrier Audio", "Error Correction"] },
          { group: "COMPETITION", items: ["Competition Day Viz"] },
        ].map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 10 }}>
            <div className="s-label" style={{ marginBottom: 4 }}>{group}</div>
            {items.map(item => (
              <div key={item} className="s-tool-card" style={{ marginBottom: 4 }}>
                <div className="s-tool-name" style={{ fontSize: 8 }}>{item}</div>
                <div className="s-tool-status">→</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenTests() {
  return (
    <Phone caption="Tests — sport psychology assessments">
      <div style={{ padding: "12px" }}>
        <div className="s-eyebrow" style={{ marginBottom: 6 }}>MENTAL TESTS</div>
        {[
          { name: "SAT", desc: "Sport Anxiety Test", done: true },
          { name: "ACSI", desc: "Coping Skills Inventory", done: true },
          { name: "CSAI-2", desc: "Competitive Anxiety", done: false },
          { name: "DAS", desc: "Depression · Anxiety · Stress", done: false },
        ].map(t => (
          <div key={t.name} className="s-tool-card" style={{ marginBottom: 6 }}>
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

function ScreenVoiceWizard() {
  return (
    <Phone caption="Voice Work Beta — wizard step 1">
      <div style={{ padding: "12px" }}>
        <div className="s-eyebrow" style={{ color: "#a78bfa" }}>VOICE WORK · BETA</div>
        <div style={{ fontSize: 7, color: "#71717a", marginBottom: 10 }}>Step 1 of 5</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{
              width: 20, height: 20, borderRadius: "50%",
              background: n === 1 ? "#7c3aed" : n < 1 ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.05)",
              border: n > 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 700, color: n === 1 ? "#fff" : "#52525b",
            }}>{n < 1 ? "✓" : n}</div>
          ))}
        </div>
        <div className="s-h2">Name the voice</div>
        <div style={{ fontSize: 8, color: "#71717a", marginBottom: 10, lineHeight: 1.4 }}>
          Give this inner voice a name. It can be anything — The Cheater, The Warrior, The Quiet One.
        </div>
        <div className="s-label">NEW VOICE NAME</div>
        <div className="s-input">The Cheater</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          <div style={{ fontSize: 7, color: "#71717a", letterSpacing: "0.2em", textTransform: "uppercase" }}>OR UPDATE EXISTING</div>
          <div style={{ background: "#17131f", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 8px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 8, color: "#fff" }}>The Warrior</span>
            <span style={{ fontSize: 7, color: "#a78bfa" }}>Update →</span>
          </div>
        </div>
      </div>
      <div className="s-footer-btn" style={{ margin: "8px 12px" }}>Continue →</div>
    </Phone>
  );
}

function ScreenVoiceCanvas() {
  return (
    <Phone caption="Voice Work Beta — step 4: place in space">
      <div style={{ padding: "10px 12px" }}>
        <div className="s-eyebrow" style={{ color: "#a78bfa" }}>VOICE WORK · BETA</div>
        <div style={{ fontSize: 7, color: "#71717a", marginBottom: 8 }}>Step 4 of 5</div>
        <div className="s-h2" style={{ marginBottom: 4 }}>Place it in space</div>
        <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
          <div style={{ flex: 1, border: "1px solid rgba(167,139,250,0.4)", background: "rgba(124,58,237,0.12)", borderRadius: 8, padding: "4px 8px", fontSize: 8, color: "#c4b5fd", fontWeight: 700 }}>● Now</div>
          <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "4px 8px", fontSize: 8, color: "#71717a", fontWeight: 700 }}>○ Want</div>
        </div>
        {/* Mini canvas */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 6, marginBottom: 8, textAlign: "center" }}>
          <svg viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <circle cx={60} cy={60} r={55} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <circle cx={60} cy={60} r={40} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3 2" />
            <circle cx={60} cy={60} r={25} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3 2" />
            <circle cx={60} cy={60} r={10} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3 2" />
            <line x1={60} y1={5} x2={60} y2={115} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <line x1={5} y1={60} x2={115} y2={60} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={60} y={12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={6}>Front</text>
            <text x={60} y={116} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={6}>Back</text>
            {/* Now puck — close, front */}
            <circle cx={60} cy={38} r={7} fill="rgba(167,139,250,0.25)" stroke="#a78bfa" strokeWidth={1.5} />
            <text x={60} y={41} textAnchor="middle" fill="white" fontSize={4} fontWeight="bold">NOW</text>
            {/* Want puck — arm, front */}
            <circle cx={60} cy={25} r={7} fill="rgba(96,165,250,0.15)" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="2 1" />
            <text x={60} y={28} textAnchor="middle" fill="#93c5fd" fontSize={4} fontWeight="bold">WANT</text>
          </svg>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ flex: 1, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 7, padding: "5px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 6, color: "rgba(167,139,250,0.6)", marginBottom: 2 }}>NOW</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>Close</div>
            <div style={{ fontSize: 6, color: "#71717a" }}>Front</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", color: "#52525b", fontSize: 10 }}>→</div>
          <div style={{ flex: 1, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 7, padding: "5px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 6, color: "rgba(96,165,250,0.6)", marginBottom: 2 }}>WANT</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>Arm&apos;s length</div>
            <div style={{ fontSize: 6, color: "#71717a" }}>Front</div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function ScreenCourse() {
  return (
    <Phone caption="Course — 8-week programme">
      <div style={{ padding: "12px" }}>
        <div className="s-eyebrow">POWERFLOW · COURSE</div>
        <div className="s-h1" style={{ marginBottom: 2 }}>Course</div>
        <div className="s-sub" style={{ marginBottom: 10 }}>8-week mental preparation</div>
        <div className="s-card-dark" style={{ marginBottom: 8 }}>
          <div className="s-eyebrow" style={{ marginBottom: 3 }}>YOUR CURRENT MODULE</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Week 6 · The Bench</div>
          <div style={{ fontSize: 7, color: "#71717a" }}>Visualization + technique connection</div>
          <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: "#34d399" }} />
            <div style={{ width: 7, height: 7, borderRadius: 2, background: "#34d399" }} />
            <div style={{ width: 7, height: 7, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
          </div>
        </div>
        {[
          { w: 1, title: "Know Thyself", type: "Insight", done: true },
          { w: 2, title: "Goal Setting", type: "Insight", done: true },
          { w: 3, title: "Coach Relationship", type: "Insight", done: true },
          { w: 4, title: "Relaxation", type: "Practice ×14", done: true },
          { w: 5, title: "The Squat", type: "Practice ×14", done: true },
          { w: 6, title: "The Bench", type: "Practice ×14", done: false },
          { w: 7, title: "The Deadlift", type: "Practice ×14", done: false },
          { w: 8, title: "All You", type: "Practice ×10", done: false },
        ].map(m => (
          <div key={m.w} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: m.done ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${m.done ? "#34d399" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: m.done ? "#34d399" : "#52525b", flexShrink: 0 }}>
              {m.done ? "✓" : m.w}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: m.done ? "#71717a" : "#fff" }}>{m.title}</div>
              <div style={{ fontSize: 6, color: "#52525b" }}>{m.type}</div>
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenChat() {
  return (
    <Phone caption="AI Coach chat">
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", height: "100%" }}>
        <div className="s-eyebrow">POWERFLOW · COACH AI</div>
        <div className="s-h1" style={{ marginBottom: 10 }}>Coach AI</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#17131f", borderRadius: "10px 10px 10px 3px", padding: "8px 10px", fontSize: 8, color: "#d4d4d8", lineHeight: 1.4, maxWidth: "85%" }}>
            Your last three journal entries show a pattern around confidence before heavy singles. Let's talk about that.
          </div>
          <div style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "10px 10px 3px 10px", padding: "8px 10px", fontSize: 8, color: "#c4b5fd", lineHeight: 1.4, maxWidth: "85%", alignSelf: "flex-end" }}>
            Yeah, I noticed that too. It&apos;s mostly on deadlift attempts over 90%…
          </div>
          <div style={{ background: "#17131f", borderRadius: "10px 10px 10px 3px", padding: "8px 10px", fontSize: 8, color: "#d4d4d8", lineHeight: 1.4, maxWidth: "85%" }}>
            That&apos;s a common threshold. Let&apos;s work on a pre-attempt ritual. What cue word has worked for you before?
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
          <div style={{ flex: 1, background: "#0D0B14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 10px", fontSize: 8, color: "#71717a" }}>
            Message your coach AI…
          </div>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>🎤</div>
        </div>
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
        <div className="s-section-card">
          <div className="s-eyebrow">APPEARANCE</div>
          <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
            <div className="s-pill active">Dark</div>
            <div className="s-pill">Light</div>
          </div>
        </div>
        <div className="s-section-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="s-eyebrow">WHAT&apos;S NEW</div>
            <span style={{ fontSize: 7, color: "#a78bfa" }}>View →</span>
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

          .doc { max-width: 780px; margin: 0 auto; padding: 0 32px; }

          @media print {
            body { font-size: 10px; }
            .doc { padding: 0 20px; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
          }

          /* ── Cover ── */
          .cover {
            min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
            background: #050608; color: #fff; padding: 60px 48px;
          }
          @media print { .cover { min-height: 100vh; page-break-after: always; } }
          .cover-logo {
            width: 72px; height: 72px; border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 40px;
          }
          .cover-eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: #a78bfa; margin-bottom: 12px; }
          .cover-title { font-size: 48px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1.05; color: #fff; margin-bottom: 16px; }
          .cover-sub { font-size: 13px; color: #a1a1aa; max-width: 400px; line-height: 1.6; margin-bottom: 48px; }
          .cover-meta { font-size: 9px; color: #52525b; letter-spacing: 0.18em; text-transform: uppercase; }
          .cover-divider { width: 48px; height: 2px; background: #7c3aed; margin-bottom: 32px; }

          /* ── What's New banner ── */
          .whats-new-page {
            padding: 48px 0 32px;
          }
          .whats-new-banner {
            background: linear-gradient(135deg, #0f0a1e 0%, #1a0f38 100%);
            border: 1px solid rgba(167,139,250,0.25);
            border-radius: 16px;
            padding: 28px 32px;
            margin-bottom: 0;
          }
          .whats-new-eyebrow {
            font-size: 9px; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase;
            color: #a78bfa; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
          }
          .whats-new-badge {
            display: inline-block; background: #7c3aed; color: #fff;
            border-radius: 20px; padding: 2px 8px; font-size: 8px; font-weight: 700;
            letter-spacing: 0.14em;
          }
          .whats-new-title { font-size: 22px; font-weight: 800; text-transform: uppercase; color: #fff; letter-spacing: 0.04em; margin-bottom: 20px; }
          .whats-new-items { display: flex; flex-direction: column; gap: 12px; }
          .whats-new-item {
            display: flex; gap: 12px; align-items: flex-start;
            padding: 12px 16px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px;
          }
          .whats-new-item-icon {
            width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3);
          }
          .whats-new-item-title { font-size: 11px; font-weight: 700; color: #fff; margin-bottom: 3px; }
          .whats-new-item-desc { font-size: 9px; color: #a1a1aa; line-height: 1.5; }

          /* ── Section layout ── */
          .page-break { padding-top: 48px; }
          .section-heading { display: flex; align-items: flex-start; gap: 16px; padding-bottom: 16px; margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; }
          .section-num { font-size: 28px; font-weight: 800; color: #7c3aed; line-height: 1; min-width: 36px; }
          .section-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #111; line-height: 1.1; }
          .section-subtitle { font-size: 10px; color: #71717a; margin-top: 3px; letter-spacing: 0.06em; }
          .two-col { display: flex; gap: 32px; align-items: flex-start; }
          .col-text { flex: 1; }
          .col-phone { flex-shrink: 0; }

          /* ── Text primitives ── */
          .step-list { list-style: none; padding: 0; margin: 0 0 16px; }
          .step-list li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f4f4f5; }
          .step-list li:last-child { border-bottom: none; }
          .step-num { width: 20px; height: 20px; border-radius: 50%; background: #7c3aed; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
          .step-list li strong { display: block; font-weight: 700; color: #111; margin-bottom: 2px; }
          .step-list li p { color: #52525b; font-size: 10px; line-height: 1.5; }
          .note { background: #faf5ff; border-left: 3px solid #7c3aed; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 10px; color: #4c1d95; line-height: 1.5; margin-top: 12px; }
          .beta-note { background: #f5f3ff; border-left-color: #a78bfa; }

          /* ── Phone mockup ── */
          .phone-wrap { display: flex; flex-direction: column; align-items: center; }
          .phone-frame { width: 180px; background: #050608; border-radius: 28px; border: 6px solid #27272a; box-shadow: 0 20px 60px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.05); overflow: hidden; position: relative; display: flex; flex-direction: column; }
          .phone-notch { width: 60px; height: 14px; background: #27272a; border-radius: 0 0 10px 10px; margin: 0 auto; position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 10; }
          .phone-screen { flex: 1; overflow: hidden; padding-top: 18px; font-family: 'Saira', sans-serif; min-height: 360px; }
          .phone-home { width: 48px; height: 4px; background: #3f3f46; border-radius: 2px; margin: 6px auto 8px; }
          .phone-caption { font-size: 9px; color: #71717a; text-align: center; margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase; }

          /* ── Screen UI primitives ── */
          .s-eyebrow { font-size: 7px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: #a78bfa; }
          .s-h1 { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #fff; }
          .s-h2 { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #fff; margin-bottom: 8px; }
          .s-sub { font-size: 9px; color: #71717a; }
          .s-label { font-size: 7px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a; margin-bottom: 4px; }
          .s-input { background: #0D0B14; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 5px 8px; font-size: 9px; color: #fff; margin-bottom: 6px; }
          .s-textarea { background: #0D0B14; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 5px 8px; font-size: 8px; color: #a1a1aa; margin-bottom: 6px; min-height: 36px; line-height: 1.4; }
          .s-btn-primary { background: #7c3aed; color: #fff; border-radius: 20px; padding: 6px 16px; font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; display: inline-block; cursor: default; }
          .s-btn-sm-purple { background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4); color: #c4b5fd; border-radius: 8px; padding: 4px 6px; font-size: 7px; font-weight: 700; flex: 1; text-align: center; }
          .s-btn-sm-dark { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #d4d4d8; border-radius: 8px; padding: 4px 6px; font-size: 7px; font-weight: 700; flex: 1; text-align: center; }
          .s-footer-btn { background: #7c3aed; color: #fff; margin: 8px 12px; border-radius: 10px; padding: 8px; font-size: 9px; font-weight: 700; text-align: center; letter-spacing: 0.1em; }
          .s-pill { border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #a1a1aa; border-radius: 20px; padding: 4px 12px; font-size: 8px; font-weight: 700; display: inline-block; }
          .s-pill.active { border-color: #7c3aed; background: #7c3aed; color: #fff; }
          .s-card-purple { background: rgba(124,58,237,0.07); border: 1px solid rgba(124,58,237,0.3); border-radius: 12px; padding: 10px; }
          .s-card-dark { background: #17131f; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 10px; }
          .s-badge { display: inline-block; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3); color: #c4b5fd; border-radius: 6px; padding: 2px 6px; font-size: 8px; font-weight: 700; }
          .s-num-big { font-size: 20px; font-weight: 800; color: #fff; line-height: 1; }
          .s-lift-row { display: flex; justify-content: space-between; font-size: 8px; color: #a1a1aa; padding: 2px 0; }
          .s-lift-row span:last-child { color: #fff; }
          .s-header { display: flex; justify-content: space-between; align-items: center; padding: 0 12px 6px; }
          .s-skip { font-size: 7px; color: #52525b; }
          .s-progress-bar { height: 2px; background: rgba(255,255,255,0.05); margin: 0 12px 10px; border-radius: 1px; overflow: hidden; }
          .s-progress-fill { height: 100%; background: #7c3aed; border-radius: 1px; }
          .s-center { display: flex; flex-direction: column; align-items: center; }
          .s-logo { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#7c3aed,#a855f7); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 6px; }
          .s-tagline { font-size: 7px; font-weight: 700; letter-spacing: 0.28em; color: #a78bfa; margin-bottom: 4px; }
          .s-body { font-size: 9px; color: #d4d4d8; }
          .s-scale-row { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
          .s-scale-row > span { font-size: 8px; color: #a1a1aa; }
          .s-scale-dots { display: flex; gap: 2px; flex-wrap: nowrap; }
          .s-scale-dot { width: 14px; height: 14px; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-size: 7px; color: #71717a; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
          .s-scale-dot.active { background: #7c3aed; border-color: #7c3aed; color: #fff; }
          .s-tag { border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #a1a1aa; border-radius: 6px; padding: 2px 6px; font-size: 7px; font-weight: 600; }
          .s-tag.active { border-color: #7c3aed; background: rgba(124,58,237,0.2); color: #c4b5fd; }
          .s-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 8px 0; }
          .s-entry-row { display: flex; gap: 6px; align-items: flex-start; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .s-entry-meta { font-size: 7px; color: #71717a; }
          .s-entry-preview { font-size: 8px; color: #d4d4d8; line-height: 1.3; }
          .s-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
          .s-dot.green { background: #34d399; }
          .s-dot.red { background: #f87171; }
          .s-dot.gray { background: #71717a; }
          .s-tool-card { display: flex; justify-content: space-between; align-items: center; background: #17131f; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px 10px; margin-bottom: 6px; }
          .s-tool-name { font-size: 9px; font-weight: 700; color: #fff; }
          .s-tool-desc { font-size: 7px; color: #71717a; }
          .s-tool-status { font-size: 8px; font-weight: 700; color: #71717a; letter-spacing: 0.08em; }
          .s-tool-status.done { color: #34d399; }
          .s-identity-card { display: flex; align-items: center; gap: 10px; background: #17131f; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px; margin-bottom: 6px; }
          .s-avatar { width: 28px; height: 28px; border-radius: 50%; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #a78bfa; }
          .s-name { font-size: 9px; font-weight: 700; color: #fff; }
          .s-role-badge { display: inline-block; border: 1px solid rgba(124,58,237,0.3); background: rgba(124,58,237,0.1); color: #a78bfa; border-radius: 20px; padding: 1px 6px; font-size: 7px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
          .s-section-card { background: #17131f; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px; margin-bottom: 6px; }
          .s-input-row { display: flex; justify-content: space-between; align-items: center; background: #0D0B14; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 4px 8px; font-size: 8px; color: #fff; margin-top: 4px; }
          .s-save-btn { font-size: 7px; background: #7c3aed; color: #fff; border-radius: 6px; padding: 2px 6px; font-weight: 700; }
          .s-coach-row { display: flex; align-items: center; gap: 5px; margin-top: 4px; }

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
            <h1 className="cover-title">Athlete<br />Guide</h1>
            <div className="cover-divider" />
            <p className="cover-sub">
              Everything you need to get the most out of the PowerFlow app — from signing in to your daily check-in, journal, library tools, course, and AI coaching chat.
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
              <div className="whats-new-title">What's new</div>
              <div className="whats-new-items">
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">📅</div>
                  <div>
                    <div className="whats-new-item-title">Course restructured — 8-week core programme</div>
                    <div className="whats-new-item-desc">The course has been rebuilt around a focused 8-module core, calculated backwards from your competition date. Each module now includes meaningful self-reflection questions and links directly to the corresponding library tool. No fluff — just the work that matters.</div>
                  </div>
                </div>
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">🎬</div>
                  <div>
                    <div className="whats-new-item-title">Visualisation modes — three ways to train your mind</div>
                    <div className="whats-new-item-desc">Each visualization tool (Squat, Bench, Deadlift) now offers three modes: guided audio, a live session with real-time on-screen cues, or record your own voice note to play back at the bar. Find them in the Library tab.</div>
                  </div>
                </div>
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">📆</div>
                  <div>
                    <div className="whats-new-item-title">Back-date your training log · monthly check-in</div>
                    <div className="whats-new-item-desc">Forgot to log yesterday? Use the date switcher on Today or Journal to log for any missed day. Every fourth week, your regular check-in becomes a deeper monthly review with bigger-picture questions.</div>
                  </div>
                </div>
                <div className="whats-new-item">
                  <div className="whats-new-item-icon">🎤</div>
                  <div>
                    <div className="whats-new-item-title">Voice input in AI Coach · light mode</div>
                    <div className="whats-new-item-desc">Tap the mic button in Coach AI to speak your message — it transcribes in real time. Light mode is now available under You → Appearance. The PowerFlow logo has also been added across the app.</div>
                  </div>
                </div>
              </div>
            </div>
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
                    { label: "Tap Sign in with Google", desc: "Complete the standard Google OAuth flow. You will be redirected to the setup wizard on your first sign-in." },
                    { label: "Used an invite link?", desc: "If your coach gave you a join link, open it before signing in. It automatically links your account to your coach — no code entry needed." },
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
                    The wizard collects the same information as the PowerFlow application form and stores it securely in the app. All steps except your name and gender are optional — you can complete them later from the <strong>You</strong> tab.
                  </p>
                  <Steps items={[
                    { label: "Step 1 — About you", desc: "Full name (required), Instagram handle, and gender (required for GL Points calculation)." },
                    { label: "Step 2 — Powerlifting profile", desc: "Years competing, federation, bodyweight, weight class, next competition date, and training days per week." },
                    { label: "Step 3 — Your lifts", desc: "Current bests and goals for squat, bench, and deadlift in kg. Powers the GL Points calculator on the Today screen." },
                    { label: "Step 4 — Mindset & self-assessment", desc: "Open questions about your mental barriers, confidence, and coaching history. Rate yourself 1–10 on five mental skills. Your coach sees this immediately." },
                    { label: "Step 5 — Goals", desc: "Three mental goals for the next 3 months, coaching expectations, tools you have tried, and anything else important." },
                    { label: "Step 6 — Your coach", desc: "Pick your PowerFlow coach from the list, or tap No coach yet to connect later." },
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
            <SectionHeading num="03" title="Today — daily check-in" subtitle="Log every session · back-date · monthly review" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open Today tab", desc: "The Today tab is your home screen. The check-in card appears at the top whenever you have not logged yet." },
                    { label: "Choose Training Day or Rest Day", desc: "A sheet slides up. On training days you rate mood, describe the session before and after, note what went well, and set a focus for next session. Rest days have a single optional note." },
                    { label: "Rate your mood (1–10)", desc: "Required for both day types. This powers the mood sparkline your coach sees in the training log." },
                    { label: "Back-date a missed day", desc: "Forgot yesterday? Use the date switcher (Yesterday / 2 days ago) at the top of Today or Journal to log for any day you missed." },
                    { label: "Weekly & monthly check-in", desc: "Each week a check-in modal appears on login: rate five mental metrics and write a short reflection. Every fourth week it becomes a deeper monthly review." },
                    { label: "Course and test cards", desc: "The Today screen also shows your current course module as a reminder card. If your coach has assigned a test, a prompt appears here too." },
                  ]} />
                  <Note>
                    <strong>GL Points</strong> (IPF Goodlift formula) appear beneath your lift goals on Today once you have set your current totals, bodyweight, and gender in the You tab.
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
                    { label: "Write freely", desc: "There is no minimum length. Write about what you are feeling, thinking, or noticing about your mental state. The more honest, the more useful." },
                    { label: "Save — AI tags it automatically", desc: "Sentiment (positive / neutral / negative) and themes (confidence, anxiety, focus, pressure, recovery…) are tagged the moment you save." },
                    { label: "Back-date an entry", desc: "Use the date switcher at the top to write an entry for a day you missed. If that day was a training day, you can also fill in the training log questions at the same time." },
                    { label: "Review past entries", desc: "Scroll down for all your entries, newest first. A green dot means positive, red means negative, grey means neutral." },
                  ]} />
                  <Note>
                    Journal entries feed directly into your coach&apos;s dashboard. Your weekly positive-sentiment rate and detected themes are the first things they see on your athlete card.
                  </Note>
                </>
              }
              right={<ScreenJournal />}
            />
          </Page>

          {/* ── 05 Library ──────────────────────────────────────── */}
          <Page>
            <SectionHeading num="05" title="Library — mental tools & tests" subtitle="Audio tools · Visualization modes · Assessments" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    The Library contains all PowerFlow mental performance tools, organised by purpose. Tools are unlocked based on your plan tier.
                  </p>
                  <Steps items={[
                    { label: "Relaxation — PMR & Autogenic Training", desc: "Two guided audio sessions for nervous system down-regulation. Use before bed, on rest days, or to reduce pre-competition anxiety." },
                    { label: "Visualizations — Squat, Bench, Deadlift", desc: "Each lift has three modes: Guided (narrated audio), Live (on-screen cues synced to your set timing), and Voice Note (record your own cue-words to play back at the bar)." },
                    { label: "Activation — Resource Activation & Affirmations", desc: "Resource Activation guides you to anchor a peak-performance state. Affirmations generates a personalized statement from your onboarding profile." },
                    { label: "Focus — Barrier & Error Correction", desc: "Barrier builds a psychological boundary against competition-day distractions. Error Correction (Hibajavítás) is a structured framework for reviewing and resetting after a mistake." },
                    { label: "Competition — Competition Day Viz", desc: "A full-length guided visualization for competition day, walking through warm-up, attempts, and mindset from first lift to third deadlift." },
                    { label: "Mental Tests (SAT, ACSI, CSAI-2, DAS)", desc: "Four validated sport psychology assessments. Complete periodically to track your profile. Results are shared with your coach automatically once unlocked." },
                  ]} />
                  <Note>
                    Visualization tools and most library tools are tied to specific course modules — the course section will tell you when to use each one.
                  </Note>
                </>
              }
              right={
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <ScreenLibrary />
                  <ScreenTests />
                </div>
              }
            />
          </Page>

          {/* ── 06 Course ───────────────────────────────────────── */}
          <Page>
            <SectionHeading num="06" title="Course — 8-week mental programme" subtitle="8 core modules · calculated from your competition date" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    The course is an 8-week structured mental preparation programme calculated backwards from your competition date. Each module has a video, exercises, and self-reflection questions that connect directly to the relevant library tool.
                  </p>
                  <Steps items={[
                    { label: "Set your competition date", desc: "The course cannot start until you have a competition date in the You tab. This is the anchor point for the whole programme." },
                    { label: "Follow your current module", desc: "The Today screen shows a card for your current module. Tap Continue to jump into it. Each module has three elements: a video, a practice task, and reflection questions." },
                    { label: "8 core modules", desc: "Know Thyself → Goal Setting → Coach Relationship → Relaxation → The Squat → The Bench → The Deadlift → All You. One bonus module (Post-Meet) unlocks after the competition." },
                    { label: "Practice modules build habits", desc: "Relaxation, Squat, Bench, Deadlift, and All You are practice modules — they come with a daily repetition target (e.g. 14 days). The module stays active until you complete the reps." },
                    { label: "Sequential unlock", desc: "Each module unlocks once the previous one is marked complete. Completed modules remain accessible — go back to any session at any time." },
                    { label: "Library tool link", desc: "Every module that involves a tool (relaxation, visualization, affirmations) links directly to that tool in the Library. You do not need to navigate there separately." },
                  ]} />
                  <Note>
                    If your competition date changes, update it in the You tab. The programme recalculates your current module automatically.
                  </Note>
                </>
              }
              right={<ScreenCourse />}
            />
          </Page>

          {/* ── 07 Coach AI ─────────────────────────────────────── */}
          <Page>
            <SectionHeading num="07" title="Coach AI" subtitle="AI-powered coaching chat · voice input" />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    The Coach AI is a private chat with an AI trained on your PowerFlow data — your journal entries, training logs, test results, and onboarding profile. It uses this context to give relevant, personalised responses rather than generic advice.
                  </p>
                  <Steps items={[
                    { label: "Open Coach AI", desc: "Tap the Chat icon in the navigation. The conversation starts fresh each session but the AI always has access to your profile and recent entries as context." },
                    { label: "Ask anything", desc: "Use it before a heavy session, after a competition, when you feel stuck, or just to think out loud. It can help with pre-lift rituals, handling specific anxieties, technique mindset, or goal review." },
                    { label: "Voice input", desc: "Tap the microphone button next to the text field, speak, and your message appears in real time. Tap the button again to send. Works on Chrome, Edge, and Safari." },
                    { label: "Feedback after your third message", desc: "After your third message in a session, a quick check-in appears asking you to rate response length, style, and helpfulness. Takes five seconds and helps improve the AI." },
                  ]} />
                  <Note>
                    Coach AI is a supplement to your coach relationship, not a replacement. Use it between sessions, for day-to-day questions, and to prepare for conversations with your real coach.
                  </Note>
                </>
              }
              right={<ScreenChat />}
            />
          </Page>

          {/* ── 08 You ──────────────────────────────────────────── */}
          <Page>
            <SectionHeading num="08" title="You — profile & settings" subtitle="Update your data · language · appearance · What's new" />
            <TwoCol
              left={
                <>
                  <Steps items={[
                    { label: "Open You tab", desc: "Tap You in the bottom navigation. All your profile data is editable here at any time." },
                    { label: "Update lifts and competition date", desc: "Keep your current bests and next competition date up to date. The competition date recalculates your training phase and course module." },
                    { label: "Connect or change coach", desc: "In the Coach section, tap Choose a coach or Change coach to open the coach picker. You can also enter a coach code manually." },
                    { label: "Language", desc: "Switch between English, German, and Hungarian. All app content and Library tools follow the selected language." },
                    { label: "Appearance", desc: "Toggle between Dark mode (default) and Light mode using the sun/moon control. Your choice is saved across sessions." },
                    { label: "What's New", desc: "Tap What's New to read the full in-app changelog — a log of every feature and fix added to PowerFlow, newest first." },
                    { label: "Sign out", desc: "The Sign out button is at the bottom of the You page." },
                  ]} />
                  <Note>
                    <strong>GL Points</strong> (IPF Goodlift formula) calculate automatically from your total and bodyweight. Set your gender, bodyweight, and lift goals to see them on the Today screen.
                  </Note>
                </>
              }
              right={<ScreenYou />}
            />
          </Page>

          {/* ── Quick reference ──────────────────────────────────── */}
          <Page>
            <SectionHeading num="—" title="Quick reference" subtitle="What each section does at a glance" />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 24 }}>
              <thead>
                <tr style={{ background: "#7c3aed", color: "#fff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Section</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>What it does</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Use it for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Today", "Daily check-in, phase countdown, GL points, course card, test prompts", "Every day — start here"],
                  ["Journal", "Free-text entries with AI sentiment and theme tagging", "After sessions, competitions, or whenever something is on your mind"],
                  ["Library", "Audio tools, visualization modes (×3), tests, affirmations, barrier audio", "Following your course module or when you need a specific tool"],
                  ["Course", "8-week modular mental programme tied to your competition date", "Weekly — work through your current module"],
                  ["Chat", "AI coaching chat informed by your journal, logs, and profile", "Between sessions, for day-to-day questions, pre-competition prep"],
                  ["You", "Profile editor, lifts, goals, language, appearance, coach, sign out", "Whenever your data or settings change"],
                ].map(([section, what, use], i) => (
                  <tr key={section} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#7c3aed" }}>{section}</td>
                    <td style={{ padding: "8px 12px", color: "#52525b" }}>{what}</td>
                    <td style={{ padding: "8px 12px", color: "#111" }}>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Note>
              <strong>Getting the most out of PowerFlow:</strong> Consistency matters more than intensity. A two-sentence journal entry every day beats a long entry once a week. Complete your current course module before moving on. Use the Library tools your module points to — they are selected specifically for where you are in your preparation.
            </Note>
          </Page>

        </div>
      </body>
    </html>
  );
}
