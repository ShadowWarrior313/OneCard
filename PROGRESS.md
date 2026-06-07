# OneCard — Project Progress

---

## Steps Done

- **Added Chrome Extension** — advisory overlay that detects checkout pages, scores the best card from the user's wallet, and recommends which card to use. It never autofills or stores PAN, expiry, or CVC.
- Landing page with hero section, card showcase, and how-it-works components
- Card finder tool — lets users search and compare reward cards by category and issuer
- Wallet page — view linked cards and estimated rewards
- Spend simulator — runs hypothetical transactions through the routing engine
- Waitlist / signup flow with email capture and API route
- Merchant category engine — expanded from 10 categories to 20 (dining, fine dining, electronics, adventure, fitness, education, beauty, home improvement, clothing, pets, and more) with 298 domain rules so "other" is rarely shown
- Favicon updated to OneCard brand mark across the web app
- Homepage polish — phone bill pay demo, card showcase section, hero section refinements
- Rewards optimizer hub — logged-in Sandbox-first dashboard with Plaid Link, encrypted server-side access tokens, incremental transaction sync, MCC confidence estimates, earned-vs-optimal rewards, cap / credit alerts, next-card advice, SUB tracking, and manual fallback entry
- **Rewards-intelligence-on-Plaid foundation (backend-first, flag-gated)** — re-shaped the hub around the real strategy: a provider-abstracted data layer (`FinancialDataProvider` interface + Plaid and local **mock** implementations, provider chosen via `DATA_PROVIDER`, default mock) so the app never imports Plaid directly; the reliability layer most teams skip (connection-health states, freshness/staleness, `ITEM_LOGIN_REQUIRED` update-mode re-auth, verified idempotent webhooks, rate-limit backoff); the rewards-intelligence core under `src/server/rewards-intel/` exposed via internal authed `/api/hub/*` routes; transactions categorized through the MCC engine (never the provider's category); read-only by construction with scrubbed logs and encrypted tokens. All hub UI is behind `NEXT_PUBLIC_HUB_UI` (OFF by default) — the public website is unchanged. See [STRATEGY-PIVOT.md](STRATEGY-PIVOT.md).

---

## Steps Still Pending

- **Demo video and how it works page** — full animated walkthrough and production-ready how-it-works flow
- Production Plaid readiness — replace the Sandbox file store and demo session bridge with reviewed production auth and durable storage; complete Plaid approval, privacy policy, encryption review, data-retention controls, and a security/legal pass before importing real financial data
- Continue expanding the curated reward rules and MCC priors, with issuer-term freshness checks
