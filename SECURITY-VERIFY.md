# OneCard — Card-Data Safety Verification

A repeatable, objective **PASS/FAIL** pre-flight before a real card is ever
entered or Stripe is switched to live mode.

> ⚠️ **This is a pre-flight gate, not PCI certification.** Passing every item
> here does **not** certify PCI-DSS compliance. Real-money / real-user use still
> requires Stripe live onboarding, a completed PCI SAQ (A or A-EP), and a
> professional security / privacy review.

The only card data OneCard may ever store is: **brand, last4, expiry, and a
Stripe token id (`pm_…`)**. A full card number (PAN) or CVV/CVC anywhere in
code, storage, logs, git history, or the client bundle is an automatic FAIL.

---

## Part 1 — Static scanner (automated)

```bash
npm run security-check      # or: pnpm run security-check
```

Runs `scripts/security-check.ts` (Node ≥ 22.6, zero runtime deps). It scans
every tracked + un-ignored file and prints a grouped report with `file:line` +
severity, ending in a bold **PASS**/**FAIL** and a non-zero exit code on FAIL so
it can gate CI. Card numbers are masked and secrets redacted in the output — the
scanner never echoes the sensitive value it finds.

Checks performed:

| # | Check | FAIL condition |
|---|---|---|
| 1 | PAN / CVV patterns & field names | Luhn-valid 13–19 digit card-like number (IIN 2–6, delimited) not on the Stripe test-card allowlist; or an identifier like `cardNumber` / `cvv` / `cvc` / `securityCode` / `track1/2` used as a stored field |
| 2 | Secrets hygiene | Hardcoded `sk_live_` / `sk_test_` / `rk_` / `whsec_` / AWS / Google / private-key in any tracked file (placeholders exempt) |
| 3 | Client bundle leakage | A `"use client"` file references a server-only `*SECRET*` env or imports the server `stripe` singleton; or a secret pattern found inside `.next/static` |
| 4 | Logging on payment routes | `console.*` on a payment route that logs a request body / payload / payment object / card field |
| 5 | Browser storage of card data | `localStorage`/`sessionStorage`/cookie write whose key or value references a card field |
| 6 | `.env` & git hygiene | `.env` not gitignored; a real `.env` tracked; real secret in `.env.example`; **or any `.env` / secret ever committed in git history** |
| 7 | CVV never stored | A `cvv` / `cvc` / `securityCode` column/field in any schema / model / migration |
| 8 | Server-side guard | `assertNoRawCardData` missing; a payment route that reads a body doesn't call it; or the webhook doesn't verify the Stripe signature |

To CI-gate, run `npm run security-check` as a required job — a non-zero exit
fails the build.

---

## Part 2 — Runtime / network proofs (manual)

Some properties can't be proven by a static scan. Do these in a browser with a
**Stripe test key** (`pk_test_…` / `sk_test_…`) and Stripe test cards
(`4242 4242 4242 4242`, any future expiry, any CVC, any postal code).

### 2.1 PAN never hits OneCard's server (the key proof)

1. Open the add-card UI (the page rendering `AddCardForm`).
2. Open **DevTools → Network**, enable **Preserve log**, clear it.
3. Type a test card into the Stripe Payment Element and submit.
4. Inspect every request:
   - Requests carrying the card number must go **only** to Stripe origins —
     `api.stripe.com`, `m.stripe.com`, `js.stripe.com` (and the Stripe Elements
     iframe). Look at their payloads: the PAN/CVC appear **only** in calls to
     `api.stripe.com` (typically `…/payment_methods` or `…/confirm`).
   - Filter to your own origin (the OneCard domain / `localhost:3000`). Inspect
     the body of **every** request to `/api/...`. **None** may contain a card
     number, `number`, `cvc`, `cvv`, or `pan` field. The only card-related value
     your server should receive is a `pm_…` PaymentMethod id.
   - ✅ **PASS:** PAN only in `api.stripe.com` traffic; OneCard's `/api/*` sees
     only `pm_…` + safe metadata.
   - ❌ **FAIL:** any request to OneCard's origin contains the card number, CVC,
     or a `number`/`cvc`/`pan` field. Stop — the architecture is broken.

### 2.2 Backend only ever receives a token

- Server payment routes (`/api/stripe/*`) accept only `{ paymentMethodId }`
  (a `pm_…` token) — never `number`/`cvc`.
- **Defense-in-depth guard:** `apps/web/src/lib/assertNoRawCardData.ts` rejects
  any request body containing a raw-card field name; `setup-intent` and
  `confirm-card` call it and return `400`. Check 8 verifies this guard exists and
  is wired in. To test it manually:

  ```bash
  curl -i -X POST http://localhost:3000/api/stripe/confirm-card \
    -H 'content-type: application/json' \
    -d '{"paymentMethodId":"pm_test","number":"4242424242424242","cvc":"123"}'
  # Expect: HTTP/1.1 400  {"error":"Raw card data is not accepted"}
  ```

### 2.3 HTTPS only

- Card entry happens over HTTPS and inside the Stripe Elements iframe — never
  plain `http://` to a remote origin. In production, `next.config.mjs` sets HSTS
  and the middleware redirects `http → https` (localhost is exempt for dev).
- Confirm the page lock icon is present and the Stripe iframe loads from
  `https://js.stripe.com`.

### 2.4 Webhook signature verification

- `apps/web/src/app/api/stripe/webhook/route.ts` calls
  `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` and rejects
  invalid signatures with `400`. The secret comes from env (`whsec_…`), never
  code. Check 8 verifies the call exists.
- Test locally:

  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  # copy the printed whsec_… into .env.local, then trigger an event:
  stripe trigger payment_intent.succeeded
  ```

### 2.5 Storage inspection

- DevTools → **Application → Storage** (Local Storage, Session Storage, Cookies,
  IndexedDB). After adding a card, confirm **no** entry contains a card number or
  CVV. Only safe metadata (`pm_…`, brand, last4, expiry) may appear.

---

## Part 3 — Go / No-Go gate

**Every box must be green before any real card or Stripe live mode.**

- [ ] `npm run security-check` exits **PASS** (0 failures).
- [ ] **Network proof done:** the card number is submitted only to
      `api.stripe.com` / Stripe Elements; OneCard's own `/api/*` never receives a
      card number — only a `pm_…` token (DevTools → Network, §2.1).
- [ ] **No secrets** in code, the client bundle, or git history; any key that was
      ever exposed has been **rotated** and history purged (`git filter-repo` /
      BFG).
- [ ] **No CVV stored anywhere**; only token + brand + last4 + expiry persist
      (§2.5, check 7).
- [ ] **Webhook signature verification** present (§2.4); payment routes are
      rate-limited, validate input, and call `assertNoRawCardData`; logs are
      scrubbed (checks 4 & 8).
- [ ] **Tested end-to-end** with Stripe **test** cards — no real charges.
- [ ] **Reminder:** passing this gate is a **pre-flight check, not PCI
      certification**. Real-money / real-user use still requires Stripe live
      onboarding, a completed PCI SAQ, and a professional security / privacy
      review.

---

_Related: [SECURITY-AUDIT.md](SECURITY-AUDIT.md) (one-time architecture audit)._
