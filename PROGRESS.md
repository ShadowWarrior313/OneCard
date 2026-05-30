# OneCard — Project Progress

---

## Steps Done

- **Added Chrome Extension** — overlay recommendation engine that detects checkout pages, scores the best card from the user's wallet, and autofills card details into payment forms (card number, expiry, CVC) with a single tap
- Landing page with hero section, card showcase, and how-it-works components
- Card finder tool — lets users search and compare reward cards by category and issuer
- Wallet page — view linked cards and estimated rewards
- Spend simulator — runs hypothetical transactions through the routing engine
- Waitlist / signup flow with email capture and API route
- Merchant category engine — expanded from 10 categories to 20 (dining, fine dining, electronics, adventure, fitness, education, beauty, home improvement, clothing, pets, and more) with 298 domain rules so "other" is rarely shown
- Favicon updated to OneCard brand mark across the web app
- Homepage polish — phone bill pay demo, card showcase section, hero section refinements

---

## Steps Still Pending

- **Demo video and how it works page** — full animated walkthrough and production-ready how-it-works flow
- **Backend verification of Apple Wallet or online payment use** — confirming card routing decisions are reflected in actual Apple Pay / Google Pay provisioning or equivalent payment rails
- **Secure storage and use of user credit card information** — collecting card number, expiry, CVV, and card type on the platform with a cybersecurity layer users can trust (PCI-DSS compliance, tokenization, encrypted storage, trust UI/UX)
