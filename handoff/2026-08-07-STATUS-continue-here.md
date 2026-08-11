# Continue here — status as of 2026-08-07

Companion to `handoff/2026-08-06-mobile-ui-and-leak-fix-plan.md` (the original audit
+ plan). That document is still the spec; this one records what is **done** and what
is **left**. Read this first, then `git log --oneline -20`.

---

## Done (committed to `main`, all pushed)

Everything in the plan's **P0 security**, **P1-A/P1-B athlete fixes**, **P3 leaks**,
**P4 API hygiene**, and **P2 passes 1–4** is complete. Highlights, so you don't
re-investigate:

- **`/api/coupon`** was an unauthenticated paywall bypass + mail relay → now
  session-authed, IP rate-limited, generic errors, ownership-checked.
- **Admin auth unified** on `requireAdmin()`; hardcoded `ADMIN_EMAIL` fallback and
  the committed Make.com webhook URL removed.
- **Test submissions no longer silently lost** — all four test pages awaited and
  checked (this was the Regina-DAS failure mode).
- **Post-comp reflection revived** (was gated on a row only its own save created).
- **Assigned-test dismiss** no longer reports a false completion to the coach.
- **Monthly check-in loop** fixed (journal wrote to the wrong table).
- **`effectiveTier()`** in `lib/plan.ts` is now the single gate helper; all call
  sites swept.
- **Coach mobile**: shell padding contract, `viewport-fit=cover` (safe-area insets
  were inert app-wide), BottomSheet rewritten on `dvh` with working drag, duplicate
  modals removed, notification banner moved into normal flow, roster flag switched
  to **inactivity-only** (per product decision), no-data renders `—` not red `0%`,
  and the mobile athlete sheet now has **all 8 desktop tabs** reusing the same
  components.
- **`lib/toolTiers.ts`** added; coach can no longer suggest a tool the athlete's
  plan cannot open (server 409 + filtered dropdown).
- **Admin duplicate-account detection** in the Users tab (read-only chips).
- Test suite grew 58 → 100+.

Verification harness: `scripts/dev/mobile-screenshot.mjs` signs into localhost as
any user (Supabase admin OTP → cookie injection, no email sent) and screenshots
routes at 390×844, auto-dismissing overlays. Use it — it is how every UI claim above
was checked.

```bash
node scripts/dev/mobile-screenshot.mjs trainer.pod@gmail.com /tmp/shots /coach
node scripts/dev/mobile-screenshot.mjs demo.athlete@powerflow.training /tmp/shots /today /journal
```

---

## In flight when the session ended

**P2 pass 5 — ergonomics sweep** was dispatched to a subagent and may not have
finished. **Check `git status` first.** If `app/coach/*.tsx` are dirty, review the
diff, run the gates, and commit; if clean, the work never landed and needs redoing.
Scope (from the plan): 44px tap targets, `text-base` inputs to stop iOS zoom,
`break-words` on previews, move the desktop split `md:` → `lg:` with responsive
`CoachHomePanel` grids, 3-col check-in grids on mobile, 10px type floor, invite link
reachable on mobile, desktop treatment for `/coach/athletes` + `/coach/activity`.

---

## Remaining

1. **Finish/verify P2 pass 5** (above).
2. **P5 polish** — the plan's last section. Mostly i18n: hardcoded English in
   `today/page.tsx` (coach-suggestion card, `TOOL_DISPLAY_NAMES`), `you/page.tsx`,
   `PostCompReflection.tsx` (entirely English), the course editor pages, and
   `lib/weeklyCheckin.ts`'s `weekLabel()` (hardcodes `en-GB` month names and the
   word "Week"). Note: the training-journal prompts are **already** fixed.
3. **Dedupe `app/coach/athletes/page.tsx`** — it carries its own copy of
   `computeAthleteStats()` duplicating `computeClient()` in `app/coach/model.ts`.
   Both now independently implement the recency-flag rules and can drift again.
4. **Full regression** — `npm run typecheck && npm test && npm run build`, plus the
   screenshot harness on both roles and a desktop spot-check at 1440px. A `next
   build` has not been run since pass 4 landed.

---

## Needs the human, not an agent

- **Rotate the Make.com scenario.** The old webhook URL is still in git history.
- **Set `ADMIN_EMAIL` in Vercel.** The fail-open fallback was removed as a security
  fix, so without it the production admin routes fail closed — `/admin` will lock
  out until it is set. It is already in local `.env.local`.
- **Duplicate athlete accounts** (two "Jonah Wiendieck") are now flagged in the
  admin Users tab for manual merge. Nothing is merged automatically by design.

## Product decisions already made (do not re-litigate)

- Roster flag = **inactivity only** (≥7d or never → attention, ≥3d → monitor).
  Sentiment is informational and never colours the roster.
- Billing card **hidden** for the owner/admin account (via `is_admin` from
  `/api/me`, computed server-side so the address stays out of the bundle).
- Duplicates are **flagged only**, never merged.
- `/coach/athletes` and `/coach/activity` should become **responsive**, not redirect.
