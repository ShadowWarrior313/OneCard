# OneCard website — where HTML & CSS live

This app uses **Next.js**, not separate `.html` pages. The browser still receives normal HTML; React builds it at compile time.

## CSS files (edit styling here)

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Entry point — imports Tailwind + `src/styles/` |
| `src/styles/variables.css` | Colors, spacing, radii |
| `src/styles/layout.css` | Header, footer, containers |
| `src/styles/components.css` | Buttons, forms, stat cards |
| `src/styles/sections.css` | Hero, flow, simulator, waitlist |
| `tailwind.config.ts` | Tailwind theme extensions |

Classes use the `oc-` prefix (e.g. `oc-hero`, `oc-btn-primary`).

## “HTML” — page structure (TSX = markup)

| What you’d call HTML | Actual file |
|----------------------|-------------|
| Full page shell | `src/app/layout.tsx` — `<html>`, `<body>` |
| Home page sections | `src/app/page.tsx` |
| Site header | `src/components/Header.tsx` |
| Transaction diagram | `src/components/TransactionFlow.tsx` |
| Card simulator | `src/components/ScenarioSimulator.tsx` |
| Waitlist signup | `src/components/Waitlist.tsx` |
| Footer | `src/components/Footer.tsx` |

## Static reference HTML (optional preview)

`public/preview.html` — standalone snapshot for designers; **not** used by Next.js routing. The live site is always the TSX components above.

## Run locally

```bash
pnpm --filter @onecard/web dev
```
