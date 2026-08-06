/**
 * Mobile visual-verification harness (390×844 iPhone viewport, real auth).
 *
 * Signs into localhost:3000 as any user by generating a Supabase magic-link OTP
 * (no email is sent), exchanging it for a session, and injecting the
 * @supabase/ssr cookie. Then screenshots the given routes and reports
 * horizontal overflow + failed network requests.
 *
 * Usage:
 *   node scripts/dev/mobile-screenshot.mjs <email> <out-dir> <route> [route...]
 * Example:
 *   node scripts/dev/mobile-screenshot.mjs trainer.pod@gmail.com /tmp/shots /coach /coach/athletes
 *
 * Requires: `npm i -D playwright-core` (or a global install), Google Chrome,
 * a running dev server on :3000, and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. Session tokens are held in
 * memory only — nothing is written to disk except screenshots.
 */
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "fs";

const [email, outDir, ...routes] = process.argv.slice(2);
if (!email || !outDir || routes.length === 0) {
  console.error("usage: node scripts/dev/mobile-screenshot.mjs <email> <out-dir> <route> [route...]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

// Parse .env.local (KEY=VALUE lines only)
const env = {};
for (const line of readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const SB_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const REF = new URL(SB_URL).hostname.split(".")[0];

async function getSession() {
  const gen = await fetch(`${SB_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email }),
  }).then(r => r.json());
  const otp = gen.email_otp ?? gen.properties?.email_otp;
  if (!otp) throw new Error("no email_otp: " + JSON.stringify(gen).slice(0, 200));
  const session = await fetch(`${SB_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email, token: otp }),
  }).then(r => r.json());
  if (!session.access_token) throw new Error("verify failed: " + JSON.stringify(session).slice(0, 200));
  return session;
}

function sessionCookies(s) {
  const session = { access_token: s.access_token, token_type: "bearer", expires_in: s.expires_in, expires_at: s.expires_at, refresh_token: s.refresh_token, user: s.user };
  const encoded = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const CHUNK = 3180;
  const cookies = [];
  if (encoded.length <= CHUNK) cookies.push({ name: `sb-${REF}-auth-token`, value: encoded });
  else for (let i = 0; i * CHUNK < encoded.length; i++) cookies.push({ name: `sb-${REF}-auth-token.${i}`, value: encoded.slice(i * CHUNK, (i + 1) * CHUNK) });
  return cookies.map(c => ({ ...c, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  hasTouch: true,
  isMobile: true,
});
await ctx.addCookies(sessionCookies(await getSession()));
const page = await ctx.newPage();
const failures = [];
page.on("response", r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.request().method()} ${r.url().replace("http://localhost:3000", "")}`); });
page.on("pageerror", e => failures.push("PAGEERROR: " + String(e).slice(0, 250)));

for (const route of routes) {
  const name = route.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "root";
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  await page.screenshot({ path: `${outDir}/${name}-full.png`, fullPage: true });
  const ov = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
  console.log(`${route} → ${page.url()} ${ov.scrollW > ov.clientW + 2 ? `HORIZONTAL OVERFLOW ${ov.scrollW}/${ov.clientW}` : "ok"}`);
}
console.log("failed requests:", [...new Set(failures)].join(" | ") || "none");
await browser.close();
