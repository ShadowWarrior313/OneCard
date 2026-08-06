# OneCard Checkout Recommender Extension

Manifest V3 Chrome extension that recommends the best linked card at checkout using merchant category code (MCC) scoring. V1 is recommend-only: it does not autofill card numbers, submit payments, move money, or send cart data anywhere.

## Load Unpacked

1. Build the extension:

   ```bash
   pnpm --dir onecard-extension build
   ```

2. Open Chrome and go to `chrome://extensions`.
3. Turn on `Developer mode`.
4. Click `Load unpacked`.
5. Select this folder: `onecard-extension`.
6. After code changes, run the build command again and click the extension card's reload button.

## Try The Test Pages

Serve the included fixture pages:

```bash
python3 -m http.server 8080 --directory onecard-extension/test-pages
```

Open:

- `http://localhost:8080/walmart-razors.html`
- `http://localhost:8080/amazon-electronics.html`
- `http://localhost:8080/generic-stripe.html`
- `http://localhost:8080/non-checkout.html`

Expected manual checks:

- Walmart-like page: detects checkout, resolves Walmart primarily to MCC `5310` (discount/retail), recommends a flat/base-rate card rather than a grocery-bonus card, and explains that a razor/household cart still posts on the merchant category.
- Amazon-like page: detects checkout, resolves Amazon to its curated MCC candidate, and recommends from that MCC category.
- Generic Stripe-style page: detects checkout and degrades to generic/localhost merchant mapping.
- Non-checkout page: no banner is shown.

## Debugging

- Content script: open the test page, then open Chrome DevTools for that page.
- Service worker: go to `chrome://extensions`, find `OneCard Checkout Recommender`, and click `service worker`.
- If no banner appears, check that the page URL is covered by `manifest.json` `content_scripts.matches`.

## Architecture

- `src/content/detect.ts`: generic checkout, merchant, total, and cart detection. It re-runs on DOM mutations with debouncing for SPA checkouts.
- `src/content/inject-ui.ts`: shadow-DOM banner injection, isolated from host page styles.
- `src/background/service-worker.ts`: message handler and scoring orchestration.
- `src/engine/mcc-map.ts`: curated merchant/domain to MCC candidate mapping.
- `src/engine/rewards-rules.ts`: curated linked-card rewards rules and future offer-rule shape.
- `src/engine/score.ts`: MCC-primary recommendation logic with cart mismatch explanation.
- `src/data/cards.sample.ts`: local sample wallet used for V1 testing.

## Add A Merchant Adapter

1. Add or update the merchant in `src/engine/mcc-map.ts` with likely MCC candidates and confidence.
2. If generic detection is not enough, add an entry to the `ADAPTERS` array in `src/content/detect.ts`.
3. Keep adapters narrow: match by hostname or an explicit fixture marker, return merchant identity, cart items, total, signals, and a small confidence boost.
4. Rebuild and test with a local fixture before trying a real checkout page.

## Add Reward Rules

1. Add the card or rule in `src/data/cards.sample.ts` or `src/engine/rewards-rules.ts`.
2. Use MCC categories as the primary source of truth. Cart contents may add an explanatory mismatch note, but should not override the MCC recommendation.
3. Store-specific offers belong in `STORE_OFFER_RULES`. A store offer may change the winner only when it is a real curated rule that earns more.

## Guardrails

- Permissions are intentionally narrow: `activeTab`, `storage`, localhost fixtures, Walmart, Amazon, and Stripe Checkout.
- No `<all_urls>` host permission in V1. Add explicit host patterns when validating another merchant.
- No remote code execution and no live deal scraping.
- Cart, merchant, and wallet data stay local in Chrome storage and extension memory.
- Any detection or scoring error hides the UI silently and does not block checkout.
