import React from "react";
import { coachContent, GuideLocale } from "./content";

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

// Real product screenshot, desktop-shaped (no phone bezel).
function DesktopShot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div className="desktop-wrap">
      <img src={src} alt={alt} className="desktop-shot-img" />
      {caption && <p className="phone-caption">{caption}</p>}
    </div>
  );
}

// ── Screen mockups ────────────────────────────────────────────────────────────


// ── Main export ───────────────────────────────────────────────────────────────

export default async function CoachGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale: GuideLocale =
    lang === "de" ? "de" : lang === "hu" ? "hu" : "en";
  const c = coachContent[locale] as typeof coachContent.en;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PowerFlow · {c.cover.title.join(" ")}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;600;700;800&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Saira', sans-serif; background: #fff; color: #111; font-size: 11px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          .doc { max-width: 780px; margin: 0 auto; padding: 0 32px; }

          @media print {
            body { font-size: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .doc { padding: 0 20px; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            /* Cover: fill exactly one page, dark bg prints, no overflow to page 2 */
            .cover { height: 100vh; min-height: unset; justify-content: flex-start; padding-top: 14vh; }
            /* Keep section heading attached to the content that follows it */
            .section-heading { break-after: avoid; page-break-after: avoid; }
            /* Smaller phones so two stacked fit on one page */
            .phone-frame { width: 152px; }
            .phone-screen { min-height: 290px; }
          }

          .cover {
            min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
            background: #050608; color: #fff; padding: 60px 0;
          }
          @media print { .cover { page-break-after: always; } }
          .cover-logo-img { width: 96px; height: auto; margin-bottom: 40px; display: block; }
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
          .phone-frame { width: 180px; background: #050608; border-radius: 28px; border: 6px solid #27272a; overflow: hidden; position: relative; display: flex; flex-direction: column; }
          .phone-notch { width: 60px; height: 14px; background: #27272a; border-radius: 0 0 10px 10px; margin: 0 auto; position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 10; }
          .phone-screen { flex: 1; overflow: hidden; padding-top: 18px; font-family: 'Saira', sans-serif; min-height: 360px; }
          .phone-home { width: 48px; height: 4px; background: #3f3f46; border-radius: 2px; margin: 6px auto 8px; }
          .phone-caption { font-size: 9px; color: #71717a; text-align: center; margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase; }

          /* Real screenshots */
          .shot-wrap { width: 180px; flex-shrink: 0; }
          .shot-img { display: block; width: 100%; height: auto; border-radius: 16px; border: 1px solid #d4d4d8; }
          .desktop-wrap { margin-bottom: 20px; }
          .desktop-shot-img { display: block; width: 100%; height: auto; border-radius: 10px; border: 1px solid #27272a; }

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

          /*
           * Back-to-app button — only visible on screen, hidden in print.
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
                background: "#0891b2",
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
              right={<Screenshot src="/guide-assets/athlete-welcome.png" alt="Sign-in screen" caption={c.screens.coachSignIn} />}
            />
          </Page>

          {/* ── 02 Invite athletes ──────────────────────────────── */}
          <Page>
            <SectionHeading num="02" title={c.s02.title} subtitle={c.s02.subtitle} />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    {c.s02.intro}
                  </p>
                  <Steps items={c.s02.steps} />
                  <Note>{c.s02.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/coach-dashboard.png" alt="Coach dashboard" caption={c.screens.dashboard} />}
            />
          </Page>

          {/* ── 03 Dashboard overview ───────────────────────────── */}
          <Page>
            <SectionHeading num="03" title={c.s03.title} subtitle={c.s03.subtitle} />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    {c.s03.intro}
                  </p>
                  <Steps items={c.s03.steps} />
                  <Note>
                    <strong>{c.s03.note.bold}</strong>{c.s03.note.text}
                  </Note>
                </>
              }
              right={<Screenshot src="/guide-assets/coach-dashboard.png" alt="Coach dashboard" caption={c.screens.dashboard} />}
            />
          </Page>

          {/* ── 04 Analysis tab ─────────────────────────────────── */}
          <Page>
            <SectionHeading num="04" title={c.s12.title} subtitle={c.s12.subtitle} />
            <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
              {c.s12.intro}
            </p>
            <Steps items={c.s12.steps} />
            <Note>{c.s12.note.text}</Note>
          </Page>

          {/* ── 05 Entries tab ──────────────────────────────────── */}
          <Page>
            <SectionHeading num="05" title={c.s04.title} subtitle={c.s04.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s04.steps} />
                  <Note>{c.s04.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/coach-entries.png" alt="Recent entries tab" caption={c.screens.entriesTab} />}
            />
          </Page>

          {/* ── 06 Training log tab ─────────────────────────────── */}
          <Page>
            <SectionHeading num="06" title={c.s05.title} subtitle={c.s05.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s05.steps} />
                  <Note>{c.s05.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/athlete-training-log.png" alt="Post-set reflection" caption="What the athlete submits" />}
            />
          </Page>

          {/* ── 07 Test results tab ─────────────────────────────── */}
          <Page>
            <SectionHeading num="07" title={c.s06.title} subtitle={c.s06.subtitle} />
            <TwoCol
              left={
                <>
                  <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
                    {c.s06.intro}
                  </p>
                  <Steps items={c.s06.steps} />
                  <Note>{c.s06.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/coach-tests.png" alt="Test results tab" caption={c.screens.testsTab} />}
            />
          </Page>

          {/* ── 08 Check-ins tab ────────────────────────────────── */}
          <Page>
            <SectionHeading num="08" title={c.s07.title} subtitle={c.s07.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s07.steps} />
                  <Note>{c.s07.note.text}</Note>
                </>
              }
              right={<Screenshot src="/guide-assets/coach-checkins.png" alt="Check-ins tab" caption="Coach view — weekly check-in" />}
            />
          </Page>

          {/* ── 09 Competition reflections ──────────────────────── */}
          <Page>
            <SectionHeading num="09" title={c.s13.title} subtitle={c.s13.subtitle} />
            <p style={{ fontSize: 10, color: "#52525b", marginBottom: 12, lineHeight: 1.6 }}>
              {c.s13.intro}
            </p>
            <Steps items={c.s13.steps} />
            <Note>{c.s13.note.text}</Note>
          </Page>

          {/* ── 10 Notes & Prompts tabs ──────────────────────────── */}
          <Page>
            <SectionHeading num="10" title={c.s14.title} subtitle={c.s14.subtitle} />
            <Steps items={c.s14.steps} />
          </Page>

          {/* ── 11 Assigning tests ──────────────────────────────── */}
          <Page>
            <SectionHeading num="11" title={c.s08.title} subtitle={c.s08.subtitle} />
            <Steps items={c.s08.steps} />
          </Page>

          {/* ── 12 Suggest a tool ───────────────────────────────── */}
          <Page>
            <SectionHeading num="12" title={c.s10.title} subtitle={c.s10.subtitle} />
            <TwoCol
              left={
                <>
                  <Steps items={c.s10.steps} />
                  <Note>
                    <strong>{c.s10.note.bold}</strong>{c.s10.note.text}
                  </Note>
                </>
              }
              right={<Screenshot src="/guide-assets/coach-suggest-tool.png" alt="Suggest a tool" caption="Profile tab — Suggest a tool" />}
            />
          </Page>

          {/* ── 13 Quick reference ──────────────────────────────── */}
          <Page>
            <SectionHeading num="13" title={c.s11.title} subtitle={c.s11.subtitle} />

            <DesktopShot src="/guide-assets/coach-dashboard-desktop.png" alt="Coach dashboard, desktop view" caption="The dashboard also works full-size on desktop — same data, sidebar navigation." />

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 32 }}>
              <thead>
                <tr style={{ background: "#0891b2", color: "#fff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>{c.s11.tableHeaders[0]}</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>{c.s11.tableHeaders[1]}</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>{c.s11.tableHeaders[2]}</th>
                </tr>
              </thead>
              <tbody>
                {c.s11.tableRows.map(([signal, meaning, action], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ecfeff" : "#fff" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0e7490" }}>{signal}</td>
                    <td style={{ padding: "8px 12px", color: "#52525b" }}>{meaning}</td>
                    <td style={{ padding: "8px 12px", color: "#111" }}>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Note>
              <strong>{c.s11.note.bold}</strong>{c.s11.note.text}
            </Note>
          </Page>

        </div>
      </body>
    </html>
  );
}
