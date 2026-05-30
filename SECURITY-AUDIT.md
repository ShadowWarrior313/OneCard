# OneCard Security Audit

**Date:** 2026-05-29  
**Scope:** Full monorepo (`apps/`, `packages/`, `onecard-extension/`)  
**Auditor:** Claude Sonnet 4.6 (automated static analysis)

> **This audit covers architecture and code only. It does not constitute a PCI-DSS assessment, penetration test, or legal compliance review. Real-money production use requires Stripe onboarding, a completed PCI SAQ, and independent legal/privacy review.**

---

## Executive Summary

**No real card data (PAN, CVV, or cardholder credentials) is collected, stored, or transmitted anywhere in the current codebase.** The only card-like data present is explicitly hardcoded Stripe test numbers used exclusively by the browser extension's demo autofill feature.

However, several architectural risks and missing security controls must be addressed before any real payment functionality is added:

| Priority | Finding | Status |
|---|---|---|
| 🔴 CRITICAL | Real API keys in `.env.local` / `.env` (not committed, but present on disk and at risk of future exposure) | Fix immediately |
| 🔴 CRITICAL | `PaymentAutofillProfile` type + demo autofill in extension puts card-like data flow in place — must be replaced with Stripe tokenization before real cards are supported | Fix in Phase 2 |
| 🟠 HIGH | No Stripe integration — no safe tokenized card-add flow exists yet | Fix in Phase 2 |
| 🟠 HIGH | No rate limiting on any API route | Fix in Phase 2 |
| 🟡 MEDIUM | No security headers (CSP, HSTS, X-Frame-Options, etc.) | Fix in Phase 2 |
| 🟡 MEDIUM | `localStorage` used for wallet, spend, bills, profile — fine for demo data, must never hold card credentials | Document / guard |
| 🟢 LOW | No Apple Pay implementation exists yet | Scaffold in Phase 2 |
| 🟢 LOW | `WalletContext` stores product-catalog IDs only, not real card identifiers | Safe as-is |

---

## 1. Card-Data Touchpoints

### 1.1 `packages/optimizer/src/index.ts` — lines 44–471

**Classification: ⚠️ SAFE (demo/mock only) — but architecture must change before real cards**

```
PaymentAutofillProfile {
  cardholderName: string   // "John Smith" (hardcoded)
  cardNumber: string       // Stripe test numbers only
  expiryMonth: string      // "07", "12", "01"
  expiryYear: string       // "2026"–"2028"
  securityCode: string     // "123" or "1234"
  postalCode: string       // "M5V 2T6"
}
```

All values are Stripe's official test card numbers (`4242424242424242`, `4111111111111111`, `378282246310005`, `371449635398431`) with obviously fake CVVs. No real card data is present.

**Risk:** The `PaymentAutofillProfile` type and `AUTOFILL_PROFILES` map establish a data structure that holds card numbers and CVVs in application memory. If this were ever populated with real card data (e.g., from user input), it would constitute a PCI violation. This pattern must be removed and replaced with Stripe tokenization.

**Action required:** Remove `PaymentAutofillProfile`, `AUTOFILL_PROFILES`, and `getAutofillProfile()` from `packages/optimizer/src/index.ts`. Replace the extension's autofill with a Stripe Payment Element flow.

---

### 1.2 `apps/extension/src/content/content.ts` — lines 439–486 (`autofillPaymentFields`)

**Classification: ⚠️ SAFE (uses mock data only) — but pattern is unsafe for production**

The `autofillPaymentFields` function reads a `PaymentAutofillProfile` from `getAutofillProfile()` and uses `document.querySelector` to fill `cc-number`, `cc-exp`, and `cc-csc` fields in third-party checkout pages. It never reads card data from the page — it only writes demo values.

**Risk:** This is a browser extension feature that fills payment fields on external sites (Walmart, etc.) using hardcoded Stripe test values. While currently safe, it simulates exactly the behavior that would be a PCI violation if real card data were substituted. The architecture is problematic:
- Data flows: extension memory → third-party form fields
- No Stripe tokenization is involved
- If a real card number were ever put in `AUTOFILL_PROFILES`, it would be written to arbitrary third-party pages

**Action required:** Replace the demo autofill with a Stripe-based "Use Card" flow — the extension should trigger Stripe's Payment Request API or redirect to a Stripe-hosted page rather than filling raw fields with card data.

---

### 1.3 `apps/web/src/context/WalletContext.tsx` — localStorage

**Classification: ✅ SAFE**

Stores only product-catalog card identifiers: `{ cardIds: ["amex_cobalt", "cibc_dividend_infinite", ...], defaultCardId, businessCardId }`. These are internal lookup keys, not card credentials. No PAN, CVV, expiry, or issuer-assigned card number is stored.

---

### 1.4 `apps/web/src/context/SpendContext.tsx` — localStorage

**Classification: ✅ SAFE**

Stores simulated spend transaction records (merchant name, amount, category, timestamp). No card credentials.

---

### 1.5 `apps/web/src/lib/cardBills.ts` — localStorage

**Classification: ✅ SAFE**

Stores `CardBill` records (balance, due date, autopay flag) and `BillPayment` records (amount, date, method). Schema has no fields for PAN, CVV, or card credentials. `cardId` is an internal catalog reference, not an issuer-assigned number.

---

### 1.6 `apps/web/src/lib/userProfile.ts` — localStorage

**Classification: ✅ SAFE**

`PersonalDetails` stores: occupation, home address, billing address. `UserProfile` stores name and email. `UserSession` stores email and login timestamp. `WaitlistEntry` stores email, name, timestamp. No card data in any schema.

---

### 1.7 `apps/web/src/components/OneCardLogo.tsx`, `OneCardFace.tsx`, et al. — `cardholderName`

**Classification: ✅ SAFE**

`cardholderName` is a display string (user's name shown on the card visual). It is derived from the user's profile name (or defaults to "John Smith") and is used only for UI rendering. It is not a PAN or cardholder data in the PCI sense.

---

## 2. Storage & Transport

### 2.1 localStorage usage

All `localStorage` calls are in client-only contexts and store only the following data:

| Key | Contains | Safe? |
|---|---|---|
| `onecard_wallet_v2` | Card catalog IDs, default card ID | ✅ Yes |
| `onecard_spend_v1` | Simulated spend records | ✅ Yes |
| `onecard_bills_v1` | Bill amounts and due dates | ✅ Yes |
| `onecard_bill_payments_v1` | Payment amounts and dates | ✅ Yes |
| `onecard_profile_v1` | Name and email | ✅ Yes |
| `onecard_session_v1` | Email and login timestamp | ✅ Yes |
| `onecard_personal_details_v1` | Address and occupation | ✅ Yes |
| `onecard_waitlist_v1` | Email list for waitlist | ✅ Yes |

**No localStorage key holds any card number, CVV, expiry, or issuer token. This must remain true as real card support is added — Stripe PaymentMethod tokens (not raw card data) are the only acceptable card-related values to cache client-side.**

### 2.2 API Routes (`apps/web/src/app/api/`)

| Route | Handles | Safe? |
|---|---|---|
| `POST /api/waitlist` | Email + name → forwarded to webhook URL | ✅ Yes |
| `GET /api/brand` | Brand logo lookup via Brandfetch | ✅ Yes |
| `GET /api/card-image` | Card art image proxy | ✅ Yes |
| `GET /api/card-finder` | Public card catalog search | ✅ Yes |

No API route currently accepts or processes card data. No rate limiting exists on any route.

### 2.3 `apps/api/` (NestJS stub)

Contains only a placeholder controller (`app.controller.ts`). No card-handling logic.

---

## 3. Secrets Handling

### 3.1 `apps/web/.env.local` — **🔴 CRITICAL**

```
POSTMARK_SERVER_TOKEN=c92afbc0-3978-4c40-a693-e524a847549a  ← real API key
AUTH_SESSION_SECRET=b07a29add913d06182f3e7...               ← real secret
```

**Status:** File is in `.gitignore` and is **not committed** to the repository (confirmed via `git ls-files`). The secrets are currently safe from public exposure via git.

**Action required:**
1. Rotate `POSTMARK_SERVER_TOKEN` and `AUTH_SESSION_SECRET` immediately — they exist on disk and could be accidentally committed in the future.
2. Set these in Vercel/deployment environment variables only, not in any file.
3. Ensure `.env.local` remains in `.gitignore` and add a pre-commit hook or CI check to block `.env` file commits.

### 3.2 `apps/web/.env` and `apps/api/.env`

Both contain `BRANDFETCH_KEY` / `LOGO_API_KEY` (same value). These files are also excluded by `.gitignore` and not tracked. The Brandfetch key appears to be a client-embeddable key (used in image URLs), but the bearer key must stay server-side.

**Action required:** Add `NEXT_PUBLIC_BRANDFETCH_CLIENT_ID` (publishable) vs `BRANDFETCH_KEY` (server-only) distinction; document in `.env.example`. Do not use `NEXT_PUBLIC_` prefix for the bearer key.

### 3.3 No Stripe keys present

No `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, or `STRIPE_WEBHOOK_SECRET` found anywhere. Stripe has not been integrated yet. This is the correct starting state — keys must be added to server env only, never committed.

### 3.4 No hardcoded secrets in source code

No API keys, tokens, or passwords were found hardcoded in any `.ts` / `.tsx` source file.

---

## 4. Apple Pay / Wallet Code

**No Apple Pay, Apple Wallet, Google Pay, or Payment Request API implementation exists anywhere in the codebase.** The phrase "Apple Wallet" appears only in marketing copy and UI text. No `PKPass`, `passkit`, `ApplePaySession`, or `PaymentRequest` objects are instantiated.

This is the correct baseline — Apple Pay must be added through Stripe's Payment Request Button, which keeps PAN out of OneCard's code entirely.

---

## 5. Custom Encryption

No hand-rolled encryption, decryption, or hashing of card data was found. `crypto.randomUUID()` is used only for generating transaction IDs in `SpendContext`. The `hashSeed()` function in `cardBills.ts` is a deterministic integer hash for seeding UI data — not cryptographic.

---

## 6. Transport & Security Baseline Gaps

| Gap | Severity | Notes |
|---|---|---|
| No rate limiting on any API route | 🟠 HIGH | `POST /api/waitlist` and future payment routes are unprotected |
| No security headers | 🟡 MEDIUM | No CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy configured in `next.config` |
| No input validation beyond email regex | 🟡 MEDIUM | Only `POST /api/waitlist` has any validation; all other routes do none |
| No webhook signature verification | 🟡 MEDIUM | Waitlist webhook sends unauthenticated requests; Stripe webhook needs `stripe.webhooks.constructEvent` |
| HTTPS assumption not enforced in code | 🟡 MEDIUM | Vercel enforces HTTPS at the CDN edge, but no application-level redirect or HSTS header is set |
| No `httpOnly` / `sameSite` session cookies | 🟡 MEDIUM | Sessions are stored in `localStorage`, not secure cookies |
| Error messages not scrubbed | 🟡 MEDIUM | API errors currently return plain string messages; no sanitization to prevent leaking internal details |

---

## 7. Priority Fix List

1. **🔴 Rotate `POSTMARK_SERVER_TOKEN` and `AUTH_SESSION_SECRET`** — do this before anything else.
2. **🔴 Remove `PaymentAutofillProfile` / `AUTOFILL_PROFILES` / `getAutofillProfile()` from optimizer** — replace extension autofill with Stripe-based flow.
3. **🟠 Integrate Stripe** — SetupIntent flow for card-add; server-side only secret key; client sees only publishable key.
4. **🟠 Add rate limiting** to all payment-related and auth-adjacent API routes.
5. **🟡 Add security headers** via `next.config.js` (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, etc.).
6. **🟡 Add Stripe webhook handler** with `stripe.webhooks.constructEvent` signature verification.
7. **🟡 Scrub error responses** — never return raw error messages or stack traces to clients.
8. **🟡 Add `.env.example`** with placeholder names; add CI check to block `.env*` commits.
9. **🟢 Scaffold Apple Pay** via Stripe Payment Request Button with server-side verification.
10. **🟢 Define safe card data model** (paymentMethodId + brand/last4/exp only) for future server-side storage.

---

*Phase 2 refactor implements items 2–10 above.*
