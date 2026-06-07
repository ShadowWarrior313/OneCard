# OneCard — Strategy & Pivot Plan

> **Status: plan, not yet executed.** Nothing in this document changes the live
> public website. The rewards-intelligence backend described here is already
> built (provider-abstracted, behind a feature flag that is **OFF** by default).
> This file is the playbook for when we choose to go public.

---

## 1. Positioning

**OneCard is the consumer rewards-intelligence layer that sits on top of
open-banking data.** It is the product Plaid *enables* but will never build
itself.

- **Plaid is plumbing.** It delivers raw account + transaction data to
  developers, plus a generic budgeting category. That is data, not decisions.
- **OneCard owns the decisions.** MCC-accurate categorization, rewards
  earned-vs-missed, cap/credit/rotation tracking, and "what card should I use /
  get next." It also owns the **cardholder trust relationship**.

We are **not** a payment card, **not** a Plaid competitor, and **not** the dead
"proxy / card-fronting" model. We are a *decision and intelligence* product
**built on** Plaid (and, later, other open-banking sources).

### Framed against the two things we are not

| We are NOT… | Why we're different |
|---|---|
| **A card that fronts/proxies charges** | Cross-issuer back-to-back funding is **prohibited by Visa/Mastercard US rules** and pulls in issuer/acceptor + money-transmitter regulation. We never move money, never proxy, never front a card. Advice only. |
| **A Plaid competitor** | We don't sell bank-data infrastructure. We *consume* it and add the decision layer Plaid deliberately leaves to its customers. Plaid is a supplier, not a rival. |

### Why this wins where Plaid teams usually lose

Plaid's well-known gaps are precisely our value, and they shaped the architecture:

1. **Data, not decisions** → our MCC engine + rewards-intelligence core.
2. **Generic categorization** → we ignore Plaid's budgeting category and re-derive
   the *reward* category (MCC-accurate) with a confidence score.
3. **Reliability / staleness** → the re-auth + freshness layer most teams skip
   (`ITEM_LOGIN_REQUIRED`, verified idempotent webhooks, staleness, backoff).
4. **Provider risk** → the data provider is abstracted, so Plaid is swappable.
5. **Trust** → read-only by construction; no money movement; no card numbers.

---

## 2. Naming / brand options

We are **not changing any live branding now.** These are candidates to evaluate
when (and if) we rename for the rewards-intelligence positioning.

| Candidate | Rationale | Risk |
|---|---|---|
| **OneCard** (keep) | Established asset, domain, favicon, existing recognition. "One card to rule them" reads as *advice* ("use this one card"), not *issuance*, once messaging is updated. | Historically implied a physical/phantom card; must actively re-message away from "a card." |
| **OneCard Intelligence / OneCard IQ** | Keeps equity, signals the decision layer, cleanly separates from "a card." | Sub-brand sprawl. |
| **Tally-style verb name** (e.g. *Earnwise*, *Maximize*, *Topcard*) | Describes the benefit (earn more), no "issuer" connotation. | New brand from zero; trademark/domain search required. |
| **Layer / Ledger-style infra name** | Signals "the layer on top of open banking." | Sounds B2B/infra; we're consumer-facing. |

**Recommendation:** keep **OneCard** and re-message it as the rewards-intelligence
layer. The cheapest credible move; brand equity > naming purity. Decide before
go-live, not now.

---

## 3. Migration plan (how the current site evolves later)

Everything is staged so **the public site only changes when we deliberately flip
the flag.** Today: `NEXT_PUBLIC_HUB_UI` is unset → the site is byte-identical to
before this work.

**Stage 0 — today (done).** Backend built; UI flag OFF. No public change.
- Provider abstraction, reliability layer, rewards-intelligence core, internal
  authed routes, encrypted tokens — all shipped behind the flag.

**Stage 1 — internal / dogfood.** Set `NEXT_PUBLIC_HUB_UI=1` in a *preview/staging*
deploy only. `/hub` appears; "Rewards Hub" enters the nav; the logged-in CTA
points at `/hub`. Public production stays flag-off.
- Exercise the mock provider end-to-end (no keys), then `DATA_PROVIDER=plaid`
  with Plaid **Sandbox** (`user_good` / `pass_good`).

**Stage 2 — limited beta.** Enable the flag for a beta cohort. Still Plaid Sandbox
or a tightly scoped real-data pilot **only after** the §5 checklist is green.
- Replace the Sandbox session bridge + JSON file store with reviewed production
  auth and durable storage (Postgres) before any real data.

**Stage 3 — public flip.** Turn `NEXT_PUBLIC_HUB_UI=1` on in production and execute
the agreed re-messaging:
- Homepage / `/how-it-works` copy shifts from "a card that routes" to
  "the rewards-intelligence layer on your existing cards."
- Promote `/hub` from a flagged route to a primary destination.
- Any rename (see §2) lands here, not before.

**Rollback at every stage:** flip the flag off. The public site reverts with no
code change.

### What changes when the flag flips (and nothing else)

- `Header.tsx` — adds the "Rewards Hub" nav item; logged-in CTA → `/hub`.
- `/hub` — becomes a reachable page instead of a 404.
- `UserProfileContext` — begins bridging the local profile into a hub session.

All three are already wired to the single flag.

---

## 4. Provider strategy

- **Plaid first**, Sandbox-first. The Plaid implementation lives entirely in
  `apps/web/src/server/data-providers/plaid/` and is the *only* place that imports
  the `plaid` SDK.
- **Abstraction already in place.** Everything else depends on the neutral
  `FinancialDataProvider` interface (`server/data-providers/provider.ts`) and
  neutral domain types. The active provider is chosen by `DATA_PROVIDER`
  (**default `mock`**) via a one-function factory (`server/data-providers/index.ts`).
- **Mock provider** (`.../mock/`) gives full local fixtures so dev/CI/tests run
  with zero third-party keys — and can simulate `login_required` and rate-limit
  to exercise the reliability layer.
- **Path to alternates.** Adding MX / Finicity / direct open banking =
  implement `FinancialDataProvider`, add one branch to the factory. No changes
  to routes, storage, categorization, or UI. This is the anti-vendor-lock moat
  and the answer to "Plaid is one vendor with cost + the ability to deactivate
  accounts."

---

## 5. Trust / compliance checklist (before going live with REAL data)

This Sandbox/mock build does **not** by itself authorize production use of real
financial data. Before flipping to real (non-Sandbox) data:

- [ ] **Plaid production approval** (or the chosen provider's equivalent).
- [ ] **Privacy policy** covering bank-data import, retention, deletion, and
      consent; PIPEDA / GDPR / US state-law review.
- [ ] **Security review** of token encryption at rest, key management/rotation,
      access controls, and log scrubbing.
- [ ] **Durable storage + auth**: replace the JSON file store and the
      Sandbox profile→cookie session bridge with reviewed production auth and a
      database with per-user isolation.
- [ ] **Webhook hardening**: deployed HTTPS endpoint, signature verification,
      idempotency, rate-limit/backoff verified under load.
- [ ] **Data-retention controls**: user-initiated disconnect + data deletion;
      token revocation on unlink.
- [ ] **Read-only / no money movement / no card numbers** guarantees re-verified
      end-to-end (no transfer/payment capability anywhere in the data layer; no
      PAN/CVV stored; tokens never logged or bundled).
- [ ] **Legal sign-off** on the rewards-intelligence positioning (estimates carry
      disclaimers; we never guarantee a category or a reward).

---

## 6. What stays true regardless

These are invariant across every stage, brand, and provider:

- **Never proxy or front a card.** No cross-issuer back-to-back funding, ever.
- **Never move money.** No transfer/payment capability exists in this layer.
- **Advice + intelligence only.** We recommend; the user acts on their own cards.
- **No card numbers.** No PAN/CVV/expiry stored — only encrypted provider tokens,
  safe account metadata, and transaction records.
- **Honest uncertainty.** Reward categories are *predicted*; estimates disclose
  confidence and defer dynamic issuer terms to the issuer.
