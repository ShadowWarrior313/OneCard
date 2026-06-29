# OneCard

OneCard is a **recommend-only** wallet assistant: for each purchase it predicts the merchant's likely category (MCC), scores the cards you already hold, and tells you **which card to pay with** to maximize rewards.

> ⚖️ **It never charges, proxies, or funds a transaction.** OneCard is a pure advice layer — it never acts as an issuer or acceptor and never does cross-issuer back-to-back funding (which is **prohibited by Visa/Mastercard US rules**). It stores no card numbers/CVV, only card identity + reward rules. The decision engine lives in [`packages/onecard-engine`](packages/onecard-engine).

## Monorepo layout

```
apps/
  web/                 # Next.js 14 — marketing site + dashboard + OneCard's own checkout
  api/                 # NestJS — recommendation API
packages/
  shared-types/        # Domain types shared across apps
  onecard-engine/      # ★ Recommend-only brain: MCC-as-distribution + EV scoring (current direction)
  rewards-engine/      # Earlier single-MCC routing brain (legacy/exploratory; see note below)
  optimizer/           # Wallet-level optimization helpers
```

**Tooling:** pnpm workspaces + Turborepo. Node 20+.

## Stack choices

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 14, Tailwind, Framer Motion, Recharts | SSR for demo links, strong React ecosystem for motion/charts |
| Backend | **NestJS** (Node) | Same language as the engine + web types; easy workspace imports of the engine packages |
| DB (later) | Postgres + Redis | Wallet/profile store + recommendation cache (no card numbers) |
| Card data | Curated JSON (source of truth) | Issuer scraping is fragile/ToS-sensitive; Playwright enrichment is swappable |
| Checkout (OneCard's own product) | Stripe Payment Element (test mode) | Collect payment for OneCard itself; card data never touches our servers. **Not** used to charge or proxy user purchases. |

## Recommend-only by design (the legal boundary)

OneCard is a **pure advice layer**. For each purchase the engine:

1. **Predicts** the merchant's MCC as a *probability distribution* — we can't see the real network-assigned MCC (that would require proxying the charge), so we never pretend to; we quantify confidence instead.
2. **Scores** the user's cards by **expected value** across that distribution (so a robust catch-all wins when the merchant is ambiguous, and a category card wins when the category is reliably likely).
3. **Recommends** the best card, surfacing uncertainty + a one-tap alternative when the merchant is ambiguous.

It **never** charges a card, proxies a payment, or does back-to-back / cross-issuer funding. That last point is legal-critical: cross-issuer "card fronting" is **prohibited by Visa and Mastercard rules in the US**. Staying advice-only is precisely what keeps OneCard out of issuer/acceptor regulation. See [`packages/onecard-engine`](packages/onecard-engine) for the MCC-as-distribution model, ambiguity rules (hotel sundry / gas+QSR / food truck / big-box), confidence gating, and the test fixtures.

> **Legacy note.** `packages/rewards-engine` contains an earlier exploration that modeled three *proxy* settlement architectures (`network_dependent`, `closed_loop`, `virtual_provisioning`) as mode metadata under `src/modes/`. Those describe charge-proxying designs and are **not** the product direction — they're retained only as exploratory context. The current brain is `onecard-engine`, which is recommend-only.

## Development

```bash
pnpm install
pnpm build
pnpm test          # engine unit tests (onecard-engine + rewards-engine)
pnpm dev           # web :3000, api :3001 (when wired in turbo)
```

## Rewards-intelligence hub (backend-first, feature-flagged OFF)

The logged-in `/hub` dashboard is the **consumer rewards-intelligence layer on top of open-banking data** — the decision layer Plaid enables but does not build. It imports account + transaction records through an **abstracted data provider**, predicts each transaction's reward category through `packages/onecard-engine` (it never trusts the provider's generic category), surfaces confidence, estimates rewards earned vs. left on the table, tracks caps / credits / rotations, projects SUB progress, and recommends a next card. It never processes, proxies, or fronts a card transaction, and never moves money. See [STRATEGY-PIVOT.md](STRATEGY-PIVOT.md) for the full positioning + go-live plan.

**The hub UI ships OFF.** With `NEXT_PUBLIC_HUB_UI` unset, the public site is unchanged — no `/hub` page, no nav entry. Set `NEXT_PUBLIC_HUB_UI=1` to turn it on.

### Architecture (why it reflects the strategy)

- **Provider-abstracted data layer** — `apps/web/src/server/data-providers/` defines a neutral `FinancialDataProvider` interface (`linkAccount`, `syncTransactions`, `getAccounts`, `reauth`, `status`, `verifyAndParseWebhook`). The rest of the app **never imports Plaid directly**; the Plaid SDK lives only in `data-providers/plaid/`. A `mock` provider (local fixtures) is the **default**, so the hub runs with zero third-party keys. Choose with `DATA_PROVIDER`.
- **Reliability layer most teams skip** — `apps/web/src/server/data-providers/` models connection health (`healthy | login_required | error | stale`), a freshness threshold (stale data is shown as last-known, never as live), `ITEM_LOGIN_REQUIRED` → update-mode re-auth, verified **idempotent** webhooks, and rate-limit/PRODUCT_NOT_READY backoff.
- **Rewards-intelligence core** — `apps/web/src/server/rewards-intel/` (categorize, earned-vs-optimal, insights, rules-data), exposed via internal **authenticated** routes under `/api/hub/*` and consumed by the flagged UI.

### Run it locally (mock provider — no keys)

```bash
cp apps/web/.env.example apps/web/.env.local
# Mock is the default. To see the UI, set NEXT_PUBLIC_HUB_UI=1 and AUTH_SESSION_SECRET + HUB_ENCRYPTION_KEY.
pnpm --filter @onecard/web dev
```

Open `/hub`, log in with a local demo profile, and **Link a sample account**. The demo profile-to-cookie bridge is disabled in production builds; deployed hub sessions require reviewed auth. To use real Plaid Sandbox locally instead, set `DATA_PROVIDER=plaid` plus `PLAID_CLIENT_ID` / `PLAID_SECRET`, then link with Plaid's documented Sandbox credentials `user_good` / `pass_good`. Link exchanges the `public_token` server-side, encrypts the resulting access token with AES-256-GCM at rest, and stores only safe account metadata + imported transactions. The browser never receives provider access tokens or provider item/account/transaction IDs. Sync is incremental + idempotent; the provider webhook route (`/api/hub/webhook/<provider>`) verifies the provider's signature and de-duplicates replays before refreshing.

The JSON file store and the local profile→cookie session bridge are for the Sandbox/mock build. Before switching to real (non-Sandbox) data, replace them with reviewed production auth + durable storage and complete the go-live trust/compliance checklist in [STRATEGY-PIVOT.md](STRATEGY-PIVOT.md) (provider approval, privacy policy, encryption review, webhook deployment, data-retention controls, security/legal pass). This build does not by itself authorize production use of real financial data.

## Deploying (Vercel monorepo)

This repo uses **two Vercel projects** on the same GitHub repo:

| Vercel project | Root directory | Domain |
|----------------|----------------|--------|
| `one-card-web` | `apps/web` | `use-onecard.com`, `www.use-onecard.com` |
| `one-card-api` | `apps/api` | `one-card-api.vercel.app` only |

**Critical:** In each Vercel project → **Settings → General → Root Directory**, set the path above. Without this, pushes may build the wrong app or fail silently.

Each app has its own `vercel.json` with monorepo install/build commands. The web project also sets `NEXT_PUBLIC_SITE_URL` for sitemap/metadata.

**Env vars (Vercel → one-card-web → Environment Variables):**

- `BRANDFETCH_KEY` — merchant/issuer logos
- `REWARDS_CC_RAPIDAPI_KEY` — wallet card art (optional)
- `WAITLIST_WEBHOOK_URL` — HTTPS endpoint that accepts `POST` JSON (`email`, `source`, `timestamp`, optional `name`). Used by `apps/web/src/app/api/waitlist/route.ts` (Zapier/Make/n8n/Airtable automation, etc.). If unset, waitlist forms show “Waitlist opening soon” and the site still builds.

After changing Root Directory or env vars, redeploy **one-card-web** (Deployments → … → Redeploy, optionally clear cache).

## Regulatory reality (read before pitching)

As a **recommend-only** advice layer, OneCard avoids the heaviest licensing burdens *by design* — it doesn't issue cards, hold funds, or move money:

1. **No issuer/acceptor role** — we recommend cards the user already holds; we never issue or proxy, so the advice product needs no sponsor bank and no Visa/Mastercard network sponsorship.
2. **No money transmission** — we never hold or move funds, so no MSB / money-transmitter licensing applies to the advice layer.
3. **PCI** — we collect no PANs/CVV for advice; OneCard's own checkout (below) tokenizes via Stripe so full card data never touches our servers.
4. **Privacy (PIPEDA / GDPR / US state laws)** — wallet contents and checkout/browsing signals are personal data; handle with consent + data minimization.
5. **Rewards accuracy** — MCC at auth time is merchant-dependent and the post-settlement category can differ. Because we never see the real MCC, the engine treats it as a **probability** and **discloses uncertainty** instead of guaranteeing a category.

> ⚠️ The moment a design *proxies or fronts* a charge (the legacy `rewards-engine` proxy modes), the full stack returns — sponsor bank, network sponsorship, MSB / money-transmitter, Reg Z — and **cross-issuer back-to-back funding is prohibited by Visa/Mastercard US rules.** That path is **out of scope** for this product.

Scraping issuer reward pages: treat as **enrichment only**; curated JSON in-repo is the legal/commercial source of truth for demos.

## What ships next

1. Wire `@onecard/onecard-engine` `recommend()` into the API (`POST /recommend`) and the dashboard
2. Seed 15–20 CA/US cards + expand the curated merchant → MCC priors
3. Dashboard: per-purchase recommendation showing confidence + uncertainty disclosure
4. Postgres schema for wallets + recommendation logging (card identity only, never PANs)

## Stripe integration & payment security

> **Scope:** this is OneCard's *own* product checkout (paying OneCard for OneCard), completed inside Stripe's hosted Payment Element. It is **not** used to charge or proxy the user's purchases at other merchants — OneCard never does that (see [Recommend-only by design](#recommend-only-by-design-the-legal-boundary)).

> ⚠️ **This is not PCI certification.** This codebase implements a safe tokenized architecture using Stripe, but real-money production use additionally requires: completing Stripe's business onboarding, a PCI SAQ A (or SAQ A-EP) assessment, and independent legal/privacy review for your jurisdiction.

### How card data is handled

Card details (PAN, CVV, expiry) are **never** collected, stored, or transmitted by OneCard's servers. The only path is:

```
User's browser → Stripe-hosted Payment Element iframe → Stripe servers
```

OneCard stores only: `paymentMethodId` (Stripe token), `brand`, `last4`, `expMonth`, `expYear`.

### Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in real values. **Never commit `.env.local`.**

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client + Server | Stripe publishable key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | **Server only** | Stripe secret key (`sk_test_...`) — never `NEXT_PUBLIC_` |
| `STRIPE_WEBHOOK_SECRET` | **Server only** | Webhook signing secret (`whsec_...`) |
| `POSTMARK_SERVER_TOKEN` | **Server only** | Email delivery |
| `AUTH_SESSION_SECRET` | **Server only** | Session signing — min 32 random bytes |
| `WAITLIST_WEBHOOK_URL` | Server only | Webhook endpoint for waitlist signups |

### Stripe test cards

Use these in the Payment Element — no real card data, no charges:

| Card number | Brand | Notes |
|---|---|---|
| `4242 4242 4242 4242` | Visa | Any future expiry, any 3-digit CVV, any postal code |
| `4000 0566 5566 5556` | Visa (debit) | |
| `5555 5555 5555 4444` | Mastercard | |
| `3782 822463 10005` | Amex | 4-digit CVV |
| `4000 0025 0000 3155` | Visa | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Visa | Always declined |

Full list: https://stripe.com/docs/testing#cards

### Running webhooks locally

```bash
# Install the Stripe CLI, then:
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the whsec_... secret printed to your terminal into .env.local
```

### Apple Pay domain association (production only)

Apple Pay requires your domain to be verified with Apple via Stripe before the payment sheet appears:

1. Go to Stripe Dashboard → Settings → Payment Methods → Apple Pay.
2. Add your domain (e.g. `use-onecard.com`).
3. Download the domain-association file Stripe provides.
4. Host it at: `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`
   - In Next.js: place the file in `apps/web/public/.well-known/` (create the folder).
5. Verify in the Stripe dashboard. Apple Pay will then appear in the Payment Element on Safari/iOS.

Full guide: https://stripe.com/docs/stripe-js/elements/payment-request-button#verifying-your-domain-with-apple-pay

### Security baseline

- **CSP** — enforced via `next.config.mjs` `headers()`. Allows Stripe's iframe origins; blocks everything else.
- **HSTS** — `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **Rate limiting** — `/api/stripe/*` and `/api/waitlist` are limited to 5–10 req/IP/min via Edge middleware. Replace the in-memory store with Upstash Redis / Vercel KV for multi-region durability.
- **Webhook verification** — `stripe.webhooks.constructEvent` validates the `Stripe-Signature` header before any payload is processed.
- **Log scrubbing** — API routes log only event type + id; raw Stripe errors and payloads are never logged.

## License

Private — demo / investor use.
