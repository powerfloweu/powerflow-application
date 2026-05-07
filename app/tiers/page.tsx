export default function TiersPage() {
  const features = [
    // [label, opener, second, pr]
    ["Daily journal & training log",    true,  true,  true ],
    ["Athlete profile",                 true,  true,  true ],
    ["Coach connection",                true,  true,  true ],
    ["Weekly & monthly check-ins",      true,  true,  true ],
    ["Audio library",                   false, true,  true ],
    ["Mental performance scripts",      false, true,  true ],
    ["Voice work sessions",             false, true,  true ],
    ["Psychological tests",             false, true,  true ],
    ["Visualization tools",             false, false, true ],
    ["16-week mental performance course", false, false, true],
    ["AI coaching chat",                false, false, true ],
    ["Personalised course plan",        false, false, true ],
  ] as const;

  const check = (v: boolean, tier: "opener" | "second" | "pr") => {
    if (v) return <span className={`check check-${tier}`}>✓</span>;
    return <span className="check check-no">—</span>;
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PowerFlow · Plans &amp; Pricing</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --bg:        #0b0b10;
            --surface:   #14141c;
            --surface2:  #1a1a25;
            --border:    rgba(255,255,255,0.06);
            --purple:    #7c3aed;
            --purple-l:  #a78bfa;
            --purple-ll: #ede9fe;
            --teal:      #14b8a6;
            --teal-l:    #5eead4;
            --zinc:      #52525b;
            --zinc-l:    #a1a1aa;
            --white:     #f4f4f5;
          }

          html, body { background: var(--bg); min-height: 100vh; }

          body {
            font-family: 'Saira', sans-serif;
            color: var(--white);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* ── Page shell ──────────────────────────────── */
          .page {
            max-width: 960px;
            margin: 0 auto;
            padding: 48px 32px 64px;
          }

          /* ── Top bar ────────────────────────────────── */
          .top-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 52px;
          }
          .logo-group {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-mark {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, #5b21b6, #7c3aed);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: 900;
            letter-spacing: -0.03em;
            color: #fff;
            flex-shrink: 0;
          }
          .logo-text {
            font-size: 17px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--white);
          }
          .logo-sub {
            font-size: 9px;
            font-weight: 500;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--zinc-l);
            margin-top: 1px;
          }
          .top-url {
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--zinc);
          }

          /* ── Hero ───────────────────────────────────── */
          .hero {
            text-align: center;
            margin-bottom: 52px;
          }
          .eyebrow {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.32em;
            text-transform: uppercase;
            color: var(--purple-l);
            margin-bottom: 12px;
          }
          .hero-title {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: -0.02em;
            line-height: 1.05;
            color: var(--white);
            text-transform: uppercase;
            margin-bottom: 14px;
          }
          .hero-title span {
            background: linear-gradient(90deg, #a78bfa, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .hero-sub {
            font-size: 14px;
            font-weight: 400;
            color: var(--zinc-l);
            max-width: 420px;
            margin: 0 auto;
            line-height: 1.6;
          }

          /* ── Tier cards ─────────────────────────────── */
          .tiers-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
            margin-bottom: 48px;
          }

          .tier-card {
            border-radius: 20px;
            border: 1px solid var(--border);
            background: var(--surface);
            padding: 28px 24px;
            position: relative;
          }
          .tier-card.highlight {
            border-color: rgba(124,58,237,0.5);
            background: linear-gradient(160deg, #1a1428 0%, #14141c 60%);
            box-shadow: 0 0 40px rgba(124,58,237,0.15);
          }
          .badge {
            position: absolute;
            top: -11px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(90deg, #5b21b6, #7c3aed);
            color: #fff;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 100px;
            white-space: nowrap;
          }

          .tier-eyebrow {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .tier-eyebrow.opener  { color: var(--zinc-l); }
          .tier-eyebrow.second  { color: var(--teal-l); }
          .tier-eyebrow.pr      { color: var(--purple-l); }

          .tier-name {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .tier-name.opener  { color: var(--white); }
          .tier-name.second  { color: var(--teal-l); }
          .tier-name.pr      { color: var(--purple-ll); }

          .tier-price {
            font-size: 38px;
            font-weight: 900;
            letter-spacing: -0.03em;
            line-height: 1;
            margin-bottom: 2px;
          }
          .tier-price.opener  { color: var(--zinc-l); }
          .tier-price.second  { color: var(--white); }
          .tier-price.pr      { color: var(--white); }

          .tier-price-period {
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.12em;
            color: var(--zinc);
            margin-bottom: 16px;
            text-transform: uppercase;
          }

          .tier-desc {
            font-size: 12px;
            font-weight: 400;
            color: var(--zinc-l);
            line-height: 1.5;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 16px;
          }

          .feature-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 9px;
          }
          .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 12px;
            font-weight: 400;
            color: var(--white);
            line-height: 1.4;
          }
          .feat-icon {
            flex-shrink: 0;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: 800;
            margin-top: 1px;
          }
          .feat-icon.opener  { background: rgba(82,82,91,0.3);  color: var(--zinc-l); }
          .feat-icon.second  { background: rgba(20,184,166,0.15); color: var(--teal-l); }
          .feat-icon.pr      { background: rgba(124,58,237,0.2);  color: var(--purple-l); }

          .feat-new {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            padding: 1px 5px;
            border-radius: 4px;
            margin-left: 4px;
            flex-shrink: 0;
          }
          .feat-new.second { background: rgba(20,184,166,0.15); color: var(--teal-l); }
          .feat-new.pr     { background: rgba(124,58,237,0.2);  color: var(--purple-l); }

          /* ── Comparison table ───────────────────────── */
          .section-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: var(--zinc);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead tr {
            border-bottom: 1px solid var(--border);
          }
          th {
            padding: 10px 12px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            text-align: center;
          }
          th.th-opener { color: var(--zinc-l); }
          th.th-second { color: var(--teal-l); }
          th.th-pr     { color: var(--purple-l); }
          th.th-feature { text-align: left; color: var(--zinc); width: 44%; }

          tbody tr {
            border-bottom: 1px solid rgba(255,255,255,0.03);
          }
          tbody tr:last-child { border-bottom: none; }
          tbody tr:hover { background: rgba(255,255,255,0.02); }

          td {
            padding: 9px 12px;
            font-size: 12px;
            font-weight: 400;
            color: var(--zinc-l);
            text-align: center;
          }
          td.td-feature {
            text-align: left;
            color: var(--white);
            font-weight: 500;
          }

          .check {
            font-size: 13px;
            font-weight: 700;
          }
          .check-opener { color: var(--zinc-l); }
          .check-second { color: var(--teal-l); }
          .check-pr     { color: var(--purple-l); }
          .check-no     { color: rgba(255,255,255,0.12); font-size: 11px; }

          /* ── Footer ─────────────────────────────────── */
          .footer {
            margin-top: 52px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 24px;
            border-top: 1px solid var(--border);
          }
          .footer-left {
            font-size: 11px;
            color: var(--zinc);
            line-height: 1.6;
          }
          .footer-left strong {
            color: var(--zinc-l);
            font-weight: 600;
          }
          .footer-cta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }
          .cta-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: var(--zinc);
          }
          .cta-email {
            font-size: 13px;
            font-weight: 700;
            color: var(--purple-l);
            letter-spacing: 0.04em;
          }
          .cta-hint {
            font-size: 10px;
            color: var(--zinc);
          }

          /* ── Print ──────────────────────────────────── */
          @page { size: A4; margin: 0; }
          @media print {
            html, body { background: #0b0b10 !important; }
            .page { padding: 32px 28px 48px; }
          }
        `}</style>
      </head>
      <body>
        <div className="page">

          {/* ── Top bar ──────────────────────────────── */}
          <div className="top-bar">
            <div className="logo-group">
              <div className="logo-mark">PF</div>
              <div>
                <div className="logo-text">PowerFlow</div>
                <div className="logo-sub">Mental Training for Powerlifters</div>
              </div>
            </div>
            <div className="top-url">app.power-flow.eu</div>
          </div>

          {/* ── Hero ─────────────────────────────────── */}
          <div className="hero">
            <p className="eyebrow">Plans &amp; Pricing</p>
            <h1 className="hero-title">
              Train your mind<br />
              <span>like you train your body.</span>
            </h1>
            <p className="hero-sub">
              Three tiers built around the sport. Start free, unlock more tools as your mental game grows.
            </p>
          </div>

          {/* ── Tier cards ───────────────────────────── */}
          <div className="tiers-grid">

            {/* Opener */}
            <div className="tier-card">
              <p className="tier-eyebrow opener">Tier 1</p>
              <p className="tier-name opener">Opener</p>
              <p className="tier-price opener">Free</p>
              <p className="tier-price-period">&nbsp;</p>
              <p className="tier-desc">Journal your sessions and track your training.</p>
              <ul className="feature-list">
                {[
                  "Daily journal",
                  "Training log & mood tracking",
                  "Athlete profile",
                  "Weekly & monthly check-ins",
                  "Coach connection",
                ].map((f) => (
                  <li key={f} className="feature-item">
                    <span className="feat-icon opener">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Second */}
            <div className="tier-card">
              <p className="tier-eyebrow second">Tier 2</p>
              <p className="tier-name second">Second</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <p className="tier-price second">€9</p>
                <p className="tier-price-period">/ month</p>
              </div>
              <p className="tier-desc">The full mental performance toolkit.</p>
              <ul className="feature-list">
                {[
                  "Everything in Opener",
                  "Audio library",
                  "Mental performance scripts",
                  "Voice work sessions",
                  "Psychological test reports",
                ].map((f, i) => (
                  <li key={f} className="feature-item">
                    <span className={`feat-icon ${i === 0 ? "opener" : "second"}`}>✓</span>
                    {f}
                    {i > 0 && <span className="feat-new second">New</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* PR */}
            <div className="tier-card highlight">
              <div className="badge">Best Value</div>
              <p className="tier-eyebrow pr">Tier 3</p>
              <p className="tier-name pr">PR</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <p className="tier-price pr">€19</p>
                <p className="tier-price-period">/ month</p>
              </div>
              <p className="tier-desc">Every tool, the full course, and your AI coach.</p>
              <ul className="feature-list">
                {[
                  "Everything in Second",
                  "16-week mental performance course",
                  "AI coaching chat",
                  "Personalised course plan",
                  "Visualization tools",
                ].map((f, i) => (
                  <li key={f} className="feature-item">
                    <span className={`feat-icon ${i === 0 ? "second" : "pr"}`}>✓</span>
                    {f}
                    {i > 0 && <span className="feat-new pr">PR</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Feature comparison ───────────────────── */}
          <p className="section-label">Full comparison</p>
          <table>
            <thead>
              <tr>
                <th className="th-feature">Feature</th>
                <th className="th-opener">Opener</th>
                <th className="th-second">Second</th>
                <th className="th-pr">PR</th>
              </tr>
            </thead>
            <tbody>
              {features.map(([label, o, s, p]) => (
                <tr key={label}>
                  <td className="td-feature">{label}</td>
                  <td>{check(o, "opener")}</td>
                  <td>{check(s, "second")}</td>
                  <td>{check(p, "pr")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Footer ───────────────────────────────── */}
          <div className="footer">
            <div className="footer-left">
              <strong>Coaches</strong> — pricing is per active athlete per month.<br />
              Prices shown are monthly. All plans billed monthly, cancel anytime.
            </div>
            <div className="footer-cta">
              <span className="cta-label">Upgrade or enquire</span>
              <span className="cta-email">info@power-flow.eu</span>
              <span className="cta-hint">We'll set you up manually.</span>
            </div>
          </div>

        </div>
      </body>
    </html>
  );
}
