import React from "react";
import { athleteContent, GuideLocale } from "./content";

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

function Steps({ items }: { items: ReadonlyArray<{ label: string; desc: string }> }) {
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

// Real product screenshot, framed like a phone.
function Screenshot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div className="shot-wrap">
      <img src={src} alt={alt} className="shot-img" />
      {caption && <p className="phone-caption">{caption}</p>}
    </div>
  );
}

// ── Individual screen mockups ─────────────────────────────────────────────────


function ScreenOnboardingStep1({ caption }: { caption: string }) {
  return (
    <Phone caption={caption}>
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

function ScreenOnboardingMindset({ caption }: { caption: string }) {
  return (
    <Phone caption={caption}>
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

// ── Main export ───────────────────────────────────────────────────────────────

export default async function AthleteGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale: GuideLocale =
    lang === "de" ? "de" : lang === "hu" ? "hu" : "en";
  const c = athleteContent[locale] as typeof athleteContent.en;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PowerFlow · {c.cover.title.join(" ")}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;600;700;800&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Saira', sans-serif;
            background: #fff;
            color: #111;
            font-size: 11px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* ── Print layout ── */
          .doc { max-width: 780px; margin: 0 auto; padding: 0 32px; }

          @media print {
            body { font-size: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .doc { padding: 0 20px; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            /* Cover: fill exactly one page, dark bg prints, no overflow to page 2 */
            .cover {
              height: 100vh;
              min-height: unset;
              justify-content: flex-start;
              padding-top: 14vh;
            }
            /* Keep section heading attached to the content that follows it */
            .section-heading { break-after: avoid; page-break-after: avoid; }
            /* Smaller phones so two stacked fit on one page */
            .phone-frame { width: 152px; }
            .phone-screen { min-height: 290px; }
          }

          /* ── Cover page ── */
          .cover {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #050608;
            color: #fff;
            padding: 60px 0;
          }
          @media print {
            .cover { page-break-after: always; }
          }
          .cover-logo-img { width: 96px; height: auto; margin-bottom: 40px; display: block; }
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
          .shot-wrap { width: 180px; flex-shrink: 0; }
          .shot-img { display: block; width: 100%; height: auto; border-radius: 16px; border: 1px solid #d4d4d8; }
          .tools-table-note {
            background: #f5f3ff; border-left: 3px solid #7c3aed; padding: 10px 14px;
            border-radius: 0 6px 6px 0; font-size: 10px; color: #4c1d95; line-height: 1.5;
            margin: 4px 0 16px; font-style: italic;
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
        <div className="back-bar">
          <a href="/guide">{c.back}</a>
        </div>
        {/* ── Cover — outside .doc so it spans full page width ── */}
        <div className="cover">
          <div style={{ maxWidth: 716, padding: "0 48px" }}>
            <img src="/guide-assets/powerflow-logo.png" alt="PowerFlow" className="cover-logo-img" />
            <div className="cover-eyebrow">{c.cover.eyebrow}</div>
            <h1 className="cover-title">{c.cover.title[0]}<br />{c.cover.title[1]}</h1>
            <div className="cover-divider" />
            <p className="cover-sub">{c.cover.sub}</p>
            <a
              href="https://app.power-flow.eu/auth/sign-in"
              style={{
                display: "inline-block",
                margin: "24px 0 16px",
                padding: "12px 28px",
                background: "#7c3aed",
                color: "#fff",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              {c.cover.signIn}
            </a>
            <p className="cover-meta">{c.cover.meta}</p>
          </div>
        </div>

        <div className="doc">

          {/* ── 00 Install ──────────────────────────────────────── */}
          <Page>
            <SectionHeading num="00" title={c.s00.title} subtitle={c.s00.subtitle} />
            <p style={{ fontSize: 10, color: "#52525b", marginBottom: 16, lineHeight: 1.7, maxWidth: 480 }}>
              {c.s00.intro}
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", background: "#f4f4f5", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 8 }}>
                  {c.s00.ios.title}
                </p>
                <ol style={{ fontSize: 10, color: "#3f3f46", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                  {c.s00.ios.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <div style={{ flex: "1 1 200px", background: "#f4f4f5", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 8 }}>
                  {c.s00.android.title}
                </p>
                <ol style={{ fontSize: 10, color: "#3f3f46", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                  {c.s00.android.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
            <Note>
              <strong>{c.s00.note.bold}</strong>{c.s00.note.text}
            </Note>
          </Page>

          {/* ── 01 Sign in ──────────────────────────────────────── */}
          <Page>
            <SectionHeading num="01" title={c.s01.title} subtitle={c.s01.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s01.steps} />
                  <Note>
                    <strong>{c.s01.note.bold}</strong>{c.s01.note.text}
                  </Note>
                </>
              }
              right={<Screenshot src="/guide-assets/athlete-welcome.png" alt="Sign-in screen" caption={c.screens.signIn} />}
            />
          </Page>

          {/* ── 02 Setup wizard ─────────────────────────────────── */}
          <Page>
            <SectionHeading num="02" title={c.s02.title} subtitle={c.s02.subtitle} />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    {c.s02.intro}
                  </p>
                  <Steps items={c.s02.steps} />
                </>
              }
              right={
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <ScreenOnboardingStep1 caption={c.screens.onboardingStep1} />
                  <ScreenOnboardingMindset caption={c.screens.onboardingMindset} />
                </div>
              }
            />
          </Page>

          {/* ── 03 Today ────────────────────────────────────────── */}
          <Page>
            <SectionHeading num="03" title={c.s03.title} subtitle={c.s03.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s03.steps} />
                  <Note>
                    <strong>{c.s03.note.bold}</strong>{c.s03.note.text}
                  </Note>
                </>
              }
              right={
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Screenshot src="/guide-assets/athlete-today.png" alt="Today screen" caption={c.screens.today} />
                  <Screenshot src="/guide-assets/athlete-training-log.png" alt="Training day reflection" caption="Post-set reflection" />
                </div>
              }
            />
          </Page>

          {/* ── 04 Journal ──────────────────────────────────────── */}
          <Page>
            <SectionHeading num="04" title={c.s04.title} subtitle={c.s04.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s04.steps} />
                  <Note>{c.s04.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/athlete-journal.png" alt="Journal history" caption="Your journal, colour-coded" />}
            />
          </Page>

          {/* ── 05 Tools ────────────────────────────────────────── */}
          <Page>
            <SectionHeading num="05" title={c.s05.title} subtitle={c.s05.subtitle} />
            <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6, maxWidth: 560 }}>
              {c.s05.intro}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 4 }}>
              <tbody>
                {c.s05.toolsTable.map(([tool, desc], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f5f3ff" : "#fff" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 700, color: "#7c3aed", whiteSpace: "nowrap", verticalAlign: "top" }}>{tool}</td>
                    <td style={{ padding: "7px 10px", color: "#52525b" }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tools-table-note">
              <strong style={{ fontStyle: "normal" }}>{c.s05.example.bold}</strong>{c.s05.example.text}
            </p>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <Screenshot src="/guide-assets/athlete-tools.png" alt="Tools library" caption={c.screens.tools} />
              <Screenshot src="/guide-assets/athlete-now-playing.png" alt="Now playing a script" caption="Now playing" />
              <Screenshot src="/guide-assets/athlete-tools-tests.png" alt="Full assessment results" caption="A fully scored result" />
            </div>
            <Steps items={c.s05.steps} />
            <Note>{c.s05.note.text}</Note>
          </Page>

          {/* ── 06 Course ───────────────────────────────────────── */}
          <Page>
            <SectionHeading num="06" title={c.s06.title} subtitle={c.s06.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s06.steps} />
                  <Note>{c.s06.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/athlete-course.png" alt="Course" caption="16-week course" />}
            />
          </Page>

          {/* ── 07 You ──────────────────────────────────────────── */}
          <Page>
            <SectionHeading num="07" title={c.s07.title} subtitle={c.s07.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s07.steps} />
                  <Note>
                    <strong>{c.s07.note.bold}</strong>{c.s07.note.text}
                  </Note>
                </>
              }
              right={<Screenshot src="/guide-assets/athlete-profile.png" alt="Your profile" caption={c.screens.you} />}
            />
          </Page>

          {/* ── 08 Coach AI ─────────────────────────────────────── */}
          <Page>
            <SectionHeading num="08" title={c.s08.title} subtitle={c.s08.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s08.steps} />
                  <Note>{c.s08.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/athlete-coach-ai.png" alt="Coach AI reply" caption="AI response" />}
            />
          </Page>

          {/* ── 09 Check-ins ─────────────────────────────────────── */}
          <Page>
            <SectionHeading num="09" title={c.s10.title} subtitle={c.s10.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s10.steps} />
                  <Note>{c.s10.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/athlete-checkin.png" alt="Weekly check-in" caption="Weekly check-in" />}
            />
          </Page>

          {/* ── 10 Coach tool suggestions ─────────────────────────── */}
          <Page>
            <SectionHeading num="10" title={c.s11.title} subtitle={c.s11.subtitle} />
            <Steps items={c.s11.steps} />
            <Note>{c.s11.note.text}</Note>
          </Page>

          {/* ── Quick reference ──────────────────────────────────── */}
          <Page>
            <SectionHeading num="11" title={c.s12.title} subtitle={c.s12.subtitle} />
            <Steps items={c.s12.steps} />
            <Note>{c.s12.note.text}</Note>
          </Page>

          <Page>
            <SectionHeading num="—" title={c.ref.title} subtitle={c.ref.subtitle} />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ background: "#7c3aed", color: "#fff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderRadius: "6px 0 0 0" }}>{c.ref.headers[0]}</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>{c.ref.headers[1]}</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderRadius: "0 6px 0 0" }}>{c.ref.headers[2]}</th>
                </tr>
              </thead>
              <tbody>
                {c.ref.rows.map(([tab, what, use], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
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
