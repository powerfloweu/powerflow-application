export default function TiersPage() {
  type Row = { label: string; opener: boolean; second: boolean; pr: boolean };

  const rows: Row[] = [
    { label: "Daily journal & training log",        opener: true,  second: true,  pr: true  },
    { label: "Athlete profile",                      opener: true,  second: true,  pr: true  },
    { label: "Coach connection",                     opener: true,  second: true,  pr: true  },
    { label: "Weekly & monthly check-ins",           opener: true,  second: true,  pr: true  },
    { label: "Audio library",                        opener: false, second: true,  pr: true  },
    { label: "Mental performance scripts",           opener: false, second: true,  pr: true  },
    { label: "Voice work sessions",                  opener: false, second: true,  pr: true  },
    { label: "Psychological test reports",           opener: false, second: true,  pr: true  },
    { label: "Visualization tools",                  opener: false, second: false, pr: true  },
    { label: "16-week mental performance course",    opener: false, second: false, pr: true  },
    { label: "AI coaching chat",                     opener: false, second: false, pr: true  },
    { label: "Personalised course plan",             opener: false, second: false, pr: true  },
  ];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PowerFlow · Plans &amp; Pricing</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800;900&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          html, body {
            background: #050608;
            font-family: 'Saira', sans-serif;
            color: #f4f4f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .page {
            max-width: 900px;
            margin: 0 auto;
            padding: 52px 40px 64px;
          }

          /* ── Header ─────────────────────────────── */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 56px;
          }
          .logo-row {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .logo-circle {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            object-fit: contain;
          }
          .logo-name {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #fff;
            line-height: 1;
          }
          .logo-tagline {
            font-size: 9px;
            font-weight: 500;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #52525b;
            margin-top: 3px;
          }
          .header-url {
            font-size: 10px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #3f3f46;
          }

          /* ── Hero ───────────────────────────────── */
          .hero {
            margin-bottom: 52px;
          }
          .hero-eyebrow {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.36em;
            text-transform: uppercase;
            color: #7c3aed;
            margin-bottom: 14px;
          }
          .hero-title {
            font-size: 46px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.02em;
            line-height: 1.0;
            color: #fff;
            margin-bottom: 16px;
          }
          .hero-title em {
            font-style: normal;
            color: #a78bfa;
          }
          .hero-body {
            font-size: 13px;
            font-weight: 400;
            color: #71717a;
            line-height: 1.65;
            max-width: 440px;
          }

          /* ── Tier cards ─────────────────────────── */
          .cards {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 14px;
            margin-bottom: 48px;
            align-items: start;
          }

          .card {
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.06);
            background: #0d0d14;
            padding: 28px 22px 24px;
            position: relative;
          }
          .card-second {
            border-color: rgba(124,58,237,0.25);
          }
          .card-pr {
            border-color: rgba(124,58,237,0.55);
            background: #0f0b1a;
            box-shadow: 0 0 48px rgba(124,58,237,0.12), inset 0 1px 0 rgba(167,139,250,0.06);
          }

          .best-badge {
            position: absolute;
            top: -11px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(90deg, #5b21b6, #7c3aed);
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: #fff;
            padding: 4px 14px;
            border-radius: 100px;
            white-space: nowrap;
          }

          .card-tier-num {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #3f3f46;
            margin-bottom: 6px;
          }
          .card-name {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 18px;
            line-height: 1;
          }
          .card-name-opener { color: #a1a1aa; }
          .card-name-second { color: #c4b5fd; }
          .card-name-pr     { color: #ede9fe; }

          .price-row {
            display: flex;
            align-items: baseline;
            gap: 4px;
            margin-bottom: 6px;
          }
          .price-amount {
            font-size: 44px;
            font-weight: 900;
            letter-spacing: -0.04em;
            line-height: 1;
          }
          .price-amount-opener { color: #52525b; }
          .price-amount-second { color: #fff; }
          .price-amount-pr     { color: #fff; }

          .price-period {
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #3f3f46;
          }

          .card-desc {
            font-size: 11px;
            color: #52525b;
            line-height: 1.55;
            padding-bottom: 18px;
            margin-bottom: 18px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .card-pr .card-desc { color: #71717a; }

          .feat-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .feat-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 11px;
            line-height: 1.4;
          }
          .feat-item-opener { color: #71717a; }
          .feat-item-second { color: #e4e4e7; }
          .feat-item-pr     { color: #e4e4e7; }

          .feat-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            font-weight: 800;
            flex-shrink: 0;
            margin-top: 1px;
          }
          .feat-dot-opener { background: rgba(82,82,91,0.25);  color: #52525b; }
          .feat-dot-second { background: rgba(124,58,237,0.18); color: #a78bfa; }
          .feat-dot-pr     { background: rgba(124,58,237,0.25); color: #c4b5fd; }
          .feat-dot-carry  { background: rgba(82,82,91,0.15);  color: #3f3f46; }

          /* ── Comparison table ───────────────────── */
          .section-rule {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
          }
          .section-rule-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #3f3f46;
            white-space: nowrap;
          }
          .section-rule-line {
            flex: 1;
            height: 1px;
            background: rgba(255,255,255,0.05);
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            padding: 8px 14px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          th.th-label { text-align: left; color: #3f3f46; width: 46%; }
          th.th-opener { color: #52525b; }
          th.th-second { color: #8b5cf6; }
          th.th-pr     { color: #a78bfa; }

          tbody tr {
            border-bottom: 1px solid rgba(255,255,255,0.03);
          }
          tbody tr:last-child { border-bottom: none; }

          td {
            padding: 9px 14px;
            font-size: 11px;
            text-align: center;
          }
          td.td-label {
            text-align: left;
            color: #a1a1aa;
            font-weight: 500;
          }
          .tick-yes-opener { color: #52525b;  font-size: 13px; font-weight: 700; }
          .tick-yes-second { color: #8b5cf6;  font-size: 13px; font-weight: 700; }
          .tick-yes-pr     { color: #a78bfa;  font-size: 13px; font-weight: 700; }
          .tick-no  { color: rgba(255,255,255,0.1); font-size: 11px; }

          /* ── Footer ─────────────────────────────── */
          .footer {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-top: 52px;
            padding-top: 24px;
            border-top: 1px solid rgba(255,255,255,0.05);
          }
          .footer-note {
            font-size: 10px;
            color: #3f3f46;
            line-height: 1.7;
          }
          .footer-note strong { color: #52525b; font-weight: 600; }
          .footer-contact {
            text-align: right;
          }
          .contact-label {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.26em;
            text-transform: uppercase;
            color: #3f3f46;
            margin-bottom: 4px;
          }
          .contact-email {
            font-size: 14px;
            font-weight: 700;
            color: #a78bfa;
            letter-spacing: 0.02em;
          }
          .contact-hint {
            font-size: 9px;
            color: #3f3f46;
            margin-top: 2px;
          }

          @page { size: A4; margin: 0; }
          @media print {
            .page { padding: 36px 32px 48px; }
          }
        `}</style>
      </head>
      <body>
        <div className="page">

          {/* Header */}
          <div className="header">
            <div className="logo-row">
              <img src="/fm_powerflow_logo_verziok_01_negative.png" alt="PowerFlow" className="logo-circle" />
              <div>
                <div className="logo-name">PowerFlow</div>
                <div className="logo-tagline">Mental Training for Powerlifters</div>
              </div>
            </div>
            <div className="header-url">app.power-flow.eu</div>
          </div>

          {/* Hero */}
          <div className="hero">
            <p className="hero-eyebrow">PowerFlow · Plans &amp; Pricing</p>
            <h1 className="hero-title">
              Train your mind<br />
              <em>like you train your body.</em>
            </h1>
            <p className="hero-body">
              Three tiers built around the sport. Start free, unlock more tools as your mental game develops.
            </p>
          </div>

          {/* Cards */}
          <div className="cards">

            {/* Opener */}
            <div className="card">
              <p className="card-tier-num">Tier 01</p>
              <p className={`card-name card-name-opener`}>Opener</p>
              <div className="price-row">
                <span className={`price-amount price-amount-opener`}>Free</span>
              </div>
              <p style={{ marginBottom: 18 }} />
              <p className="card-desc">Journal your sessions and track your training.</p>
              <ul className="feat-list">
                {["Daily journal & training log", "Athlete profile", "Weekly & monthly check-ins", "Coach connection"].map((f) => (
                  <li key={f} className="feat-item feat-item-opener">
                    <span className="feat-dot feat-dot-opener">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Second */}
            <div className="card card-second">
              <p className="card-tier-num">Tier 02</p>
              <p className={`card-name card-name-second`}>Second</p>
              <div className="price-row">
                <span className={`price-amount price-amount-second`}>€9</span>
                <span className="price-period">/ month</span>
              </div>
              <p style={{ marginBottom: 18 }} />
              <p className="card-desc">The full mental performance toolkit.</p>
              <ul className="feat-list">
                {[
                  { label: "Everything in Opener", carry: true },
                  { label: "Audio library", carry: false },
                  { label: "Mental performance scripts", carry: false },
                  { label: "Voice work sessions", carry: false },
                  { label: "Psychological test reports", carry: false },
                ].map(({ label, carry }) => (
                  <li key={label} className={`feat-item feat-item-second`}>
                    <span className={`feat-dot ${carry ? "feat-dot-carry" : "feat-dot-second"}`}>✓</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* PR */}
            <div className="card card-pr">
              <div className="best-badge">Best Value</div>
              <p className="card-tier-num">Tier 03</p>
              <p className={`card-name card-name-pr`}>PR</p>
              <div className="price-row">
                <span className={`price-amount price-amount-pr`}>€19</span>
                <span className="price-period">/ month</span>
              </div>
              <p style={{ marginBottom: 18 }} />
              <p className="card-desc">Every tool, the full course, and your AI coach.</p>
              <ul className="feat-list">
                {[
                  { label: "Everything in Second", carry: true },
                  { label: "Visualization tools", carry: false },
                  { label: "16-week mental performance course", carry: false },
                  { label: "AI coaching chat", carry: false },
                  { label: "Personalised course plan", carry: false },
                ].map(({ label, carry }) => (
                  <li key={label} className={`feat-item feat-item-pr`}>
                    <span className={`feat-dot ${carry ? "feat-dot-carry" : "feat-dot-pr"}`}>✓</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Comparison table */}
          <div className="section-rule">
            <span className="section-rule-label">Full comparison</span>
            <div className="section-rule-line" />
          </div>

          <table>
            <thead>
              <tr>
                <th className="th-label">Feature</th>
                <th className="th-opener">Opener</th>
                <th className="th-second">Second</th>
                <th className="th-pr">PR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, opener, second, pr }) => (
                <tr key={label}>
                  <td className="td-label">{label}</td>
                  <td>{opener ? <span className="tick-yes-opener">✓</span> : <span className="tick-no">—</span>}</td>
                  <td>{second ? <span className="tick-yes-second">✓</span> : <span className="tick-no">—</span>}</td>
                  <td>{pr     ? <span className="tick-yes-pr">✓</span>     : <span className="tick-no">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="footer">
            <div className="footer-note">
              <strong>Coaches</strong> — billed per active athlete per month.<br />
              All plans billed monthly. Cancel anytime.
            </div>
            <div className="footer-contact">
              <p className="contact-label">Upgrade or enquire</p>
              <p className="contact-email">david@power-flow.eu</p>
              <p className="contact-hint">We'll set you up manually.</p>
            </div>
          </div>

        </div>
      </body>
    </html>
  );
}
