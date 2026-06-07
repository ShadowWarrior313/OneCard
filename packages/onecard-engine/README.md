# @onecard/onecard-engine

The recommend-only **brain** of OneCard.

It predicts the merchant's likely **MCC** (Merchant Category Code) as a
*probability distribution*, scores the user's cards by **expected value**, and
recommends the best card to pay with — and it does this **without ever
processing, charging, proxying, or funding a transaction.**

> ### ⚖️ Legal-critical boundary
> OneCard is a **pure advice layer**. It never charges a card, never does
> back-to-back / cross-issuer funding, and never acts as an issuer or indirect
> acceptor. Cross-issuer "card fronting" (back-to-back funding) is **prohibited
> by Visa and Mastercard rules in the US**. This module must never cross into
> proxying a charge. It stores **no card numbers / CVV** — only card identity +
> reward rules needed to score. See [Guardrails](#guardrails).

Because we never proxy the charge, we **cannot read the network-assigned MCC**
the way the (illegal) back-to-back products could. So we don't pretend to know
it: we **predict it, quantify our confidence, and never confidently mislead.**

---

## The core idea: MCC is a distribution, not a value

The famous failure cases all come from one physical/online merchant mapping to
**multiple plausible MCCs**:

| Case | What goes wrong without this engine |
|------|-------------------------------------|
| Hotel gift-shop candy bar | Codes as the **hotel** (7011), not convenience |
| Gas station + attached Burger King | Pump = **gas** (5542) vs inside = **fast food** (5814) |
| Food truck | Often **convenience** (5499) / misc, not dining |
| Razor at Walmart | Codes as the **store** (discount/grocery), never "beauty" |

`predictMcc(context)` returns a ranked distribution, never a single guess:

```ts
predictMcc(context) -> {
  candidates: [{ mcc, label, category, p }],  // sums ~1.0, sorted desc
  topConfidence,   // priorStrength(merchant) × p(top candidate)
  ambiguous,       // top two close, or an inherently uncertain merchant
  flags,           // composite / hostVenue / bigBox / mobileVendor
  signalsUsed,     // explainability trace
}
```

`topConfidence = priorStrength × p(top)` so an unknown merchant reads as **low
confidence even when we only list one candidate** — the honest signal.

---

## Architecture

```
src/
  mcc/
    mcc-catalog.ts       # canonical MCC list + the reward category each maps to
    merchant-mcc-map.ts  # merchant/domain/brand -> candidate MCCs with priors
    predict.ts           # ranked MCC candidates + confidence for a context
    confidence.ts        # confidence bands + thresholds + gating policy
    ambiguity-rules.ts   # composite / host / mobile / big-box handling
  rewards/
    rewards-rules.ts     # card × category × rate × caps (per-program mapping)
    score.ts             # MCC distribution × rewards -> best card + EV math
  context/
    online-signals.ts    # extract merchant/cart signals from a checkout page
    inperson-signals.ts  # (V2) location/merchant-name signals; stubbed
  explain/
    why.ts               # human rationale + uncertainty disclosure
  data/
    cards.sample.ts      # sample wallet for testing
    fixtures/            # the ambiguous-merchant test cases
  config.ts              # thresholds, GATING_MODE
  recommend.ts           # predict → score → gate → explain (one call)
  index.ts               # public API
```

> Placed under `packages/` to fit the pnpm/Turborepo monorepo; the internal
> layout matches the engine spec exactly.

---

## How a recommendation is produced

`recommend()` chains four pure steps:

1. **predict** — resolve the merchant, build candidate MCCs from curated priors,
   apply structural [ambiguity rules](#ambiguity-rules), let cart/online signals
   reweight the prior, then normalize → distribution + confidence.
2. **score** — for each card, `EV = amount × Σ p(mcc) × rate(card, mcc)`,
   respecting caps. Recommend the **highest-EV card**.
3. **gate** — decide how much uncertainty to surface (see below). The pick is
   *always* the EV winner; gating never changes it.
4. **explain** — produce a rationale that states the **basis (merchant MCC, not
   the item)** and surfaces uncertainty when present.

### Why expected value is the right call under uncertainty

EV naturally prefers a strong **catch-all** when the MCC is uncertain: a flat 2%
everywhere card beats a 5% groceries card that only pays off *if* it's actually
groceries. That's exactly right for the food-truck / unknown-merchant cases —
and the category card still wins when the category is reliably likely (a clean
grocery store). The arithmetic decides; no special-casing.

```ts
import { recommend, SAMPLE_WALLET } from "@onecard/onecard-engine";

const { recommendedCardId, explanation, prediction } = recommend({
  context: { merchantKey: "walmart", online: { cartItemNames: ["Gillette razor"] } },
  wallet: SAMPLE_WALLET,
  amount: 12,
});
// recommendedCardId === "everywhere_2"
// explanation.detail explains: Walmart codes basket-level; the razor is irrelevant.
```

---

## Ambiguity rules

`ambiguity-rules.ts` encodes the structural multi-MCC situations:

- **Composite venues** (gas + QSR, food court, airport): keep multiple
  candidates; a genuine coin-flip surfaces as `ambiguous` and yields a **split
  recommendation** ("at the pump use X; inside for food use Y").
- **Host-venue bleed** (hotel sundry, stadium, theme park): purchases inside a
  host code as the host. **Cart/item signals are ignored** so a candy bar stays
  *lodging*, not convenience.
- **Mobile / pop-up** (food truck, farmers market): treated as inherently
  ambiguous and low-confidence → the robust catch-all wins via EV.
- **Big-box / supercenter** (Walmart, Target, Costco): the whole basket codes
  under **one** merchant MCC. Cart items may only **shift probability between
  the merchant's own candidate MCCs** (grocery vs discount) — they can **never
  invent a category the merchant won't code** (no "beauty" from a razor). This
  is the razor-bug fix, enforced in `applyItemSignals`.

> Cart/online item data is therefore an **input to the prior**, never an
> override of the merchant MCC.

### Per-program MCC → category mapping

Cards disagree on how they bucket MCCs: some count `5814` fast food as *dining*,
some don't; some exclude superstores from the grocery bonus. The MCC→category
mapping is modeled **per rewards program** (`mccCategoryOverrides`), not
globally — because a global mapping is a real source of wrong recommendations.

---

## Confidence gating (`GATING_MODE`)

The pick is always the EV winner; the mode only controls disclosure.

- **`confidence_gated`** (DEFAULT, recommended): present cleanly only when
  `topConfidence ≥ HIGH` **and** the winner doesn't flip across the material MCC
  candidates. Otherwise still recommend the EV winner, but attach a short
  uncertainty note + a one-tap alternative.
- **`always_silent`** (opt-in, **riskier**): only ever show the single
  highest-EV card, no uncertainty UI. Cleaner, but it can be *confidently wrong*
  on ambiguous merchants — and, as a recommend-only tool, we never get to verify
  the real MCC the way a back-to-back charge did, so we can't guarantee
  correctness. **The default must remain `confidence_gated`.**

Thresholds (`HIGH_CONFIDENCE`, `LOW_CONFIDENCE`, `AMBIGUITY_GAP`) and the mode
live in `config.ts` and can be overridden per call.

---

## Guardrails

- **Recommend-only forever in this module.** No transaction processing, no
  charging, no proxying, no back-to-back funding. If a future request implies
  proxying a charge, it is **out of scope here and legally distinct.**
- **No card numbers / CVV** anywhere — only card identity + reward rules.
- **Curated data only** (no live scraping in V1). The schema makes adding
  merchants / MCCs / rules and refining priors easy.
- **Fail safe**: unknown merchant → low confidence → recommend the robust
  catch-all, never a confident wrong category.
- Online signals first; in-person signals are stubbed behind a clear interface
  for V2.

`guardrails.test.ts` asserts these properties (no PAN/CVV keys, `recommend()`
mutates nothing and emits advice only).

---

## Test fixtures

`data/fixtures/` + `scenarios.test.ts` prove the hard cases (each asserts the
recommended card **and** the confidence/ambiguity flags):

| Fixture | Expected behaviour |
|---------|--------------------|
| Walmart razor | Catch-all wins; item irrelevant; no invented category; discloses |
| Walmart groceries | Grocery cart tips the pick to the grocery card — still a Walmart MCC |
| Costco warehouse | Wholesale; catch-all wins; **clean**; Visa-only acceptance enforced |
| Costco gas | Fuel sub-venue flips it to the gas card |
| Hotel candy bar | Stays lodging (host bleed); travel card wins; candy ignored |
| Gas + Burger King | Composite → ambiguous → split (gas card / dining card) |
| Food truck | Mobile prior → catch-all wins via EV; low confidence |
| Clean grocery | Single MCC; high confidence; clean; grocery card wins |
| Unknown online | Low confidence → catch-all; fail safe |

---

## Develop

```bash
pnpm --filter @onecard/onecard-engine test       # vitest
pnpm --filter @onecard/onecard-engine typecheck
pnpm --filter @onecard/onecard-engine build
```
