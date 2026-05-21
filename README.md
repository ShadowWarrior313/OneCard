# OneCard

One physical/digital **phantom card** that routes each purchase to the underlying credit or debit card that maximizes rewards.

## Monorepo layout

```
apps/
  web/                 # Next.js 14 — investor-facing dashboard
  api/                 # NestJS — routing API, Plaid/Stripe stubs later
packages/
  shared-types/        # Domain types shared across apps
  rewards-engine/      # Pure routing brain + unit tests
```

**Tooling:** pnpm workspaces + Turborepo. Node 20+.

## Stack choices

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 14, Tailwind, Framer Motion, Recharts | SSR for demo links, strong React ecosystem for motion/charts |
| Backend | **NestJS** (Node) | Same language as engine + web types; easy workspace imports of `@onecard/rewards-engine` |
| DB (later) | Postgres + Redis | Transactional truth + routing-decision cache |
| Card data | Curated JSON (source of truth) | Issuer scraping is fragile/ToS-sensitive; Playwright enrichment is swappable |
| Phantom card MVP | Stripe Issuing (stub) | Fastest path to tokenized PAN without owning a bank |

## Routing modes (three architectures)

| Mode | ID | Summary |
|------|-----|---------|
| A | `network_dependent` | Visa/MC rails → processor → push to underlying card |
| B | `closed_loop` | OneCard captures merchant, async charge to underlying |
| C | `virtual_provisioning` | Dynamic single-use VCN via Apple/Google Pay tokenization |

Mode metadata (latency, settlement risk, acceptance) lives in `packages/rewards-engine/src/modes/`. Card **selection math is mode-agnostic in v1**; modes affect settlement/regulatory metadata only.

## Development

```bash
pnpm install
pnpm build
pnpm test          # rewards-engine unit tests
pnpm dev           # web :3000, api :3001 (when wired in turbo)
```

## Regulatory & partnership reality (read before pitching)

OneCard is **not** a weekend side project from a compliance perspective:

1. **Issuing bank partner** — You cannot issue a card without a licensed issuer (sponsor bank). Stripe Issuing/Marqeta sit on top of sponsor banks.
2. **Network sponsorship** — Scenario A requires Visa/Mastercard membership or a BIN sponsor program.
3. **Canada (OSFI / FINTRAC)** — If targeting Canadian users: MSB registration, KYC/AML program, PIPEDA privacy, and potentially credit-broker licensing depending on product positioning.
4. **US** — Money transmitter / state licenses if holding funds; Reg Z if credit is involved.
5. **PCI** — Never store full PANs; tokenize via network/issuer vaults (design assumption in codebase).
6. **Rewards accuracy** — MCC assignment at auth time is merchant-dependent; post-settlement category can differ (chargebacks, recoding).

Scraping issuer reward pages: treat as **enrichment only**; curated JSON in-repo is the legal/commercial source of truth for demos.

## What ships next

1. Implement `routeTransaction` + full test matrix
2. Seed 15–20 CA/US cards (`packages/rewards-data` or JSON in engine)
3. Dashboard with mock transactions, Sankey, simulator
4. Postgres schema + API route `POST /route`

## License

Private — demo / investor use.
# OneCard
