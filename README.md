# Jomi Hisheb — জমির হিসাব

A fast, accurate, mobile-first **Bangladeshi land-unit converter**. One page, one input, instant results. No backend, no database, no accounts, no ads, no tracking.

## Features

- Convert instantly between **11 units**: Katha (কাঠা), Bigha (বিঘা), Chotak (ছটাক), Shotangsho (শতাংশ), Decimal (ডেসিমেল), Gonda (গন্ডা), Kani 20-Gonda (কানি), Kani 40-Shotok (কানি), Square Feet (বর্গফুট), Square Meters (বর্গমিটার), Acre (একর)
- **All units at a glance**: a live grid converts your input into every unit simultaneously; tap a card to target that unit
- Hero result box (never clips long values), ≈ sq ft / katha equivalents chips, one-tap clear, copy with feedback
- Full **English / বাংলা** interface toggle (default: Bengali)
- Swap units, quick-conversion shortcuts, shareable URLs (`?from=katha&to=decimal&value=5`)
- Input validation (negatives, invalid numbers, overflow) with accessible, non-intrusive messages
- WCAG 2.2 AA practices: labeled controls, keyboard operability, visible focus, `aria-live` results, reduced-motion support

## Conversion standards (Bangladesh convention)

| Unit | Bangla | sq ft per unit |
|---|---|---|
| Square Foot | বর্গফুট | 1 |
| Square Meter | বর্গমিটার | 10.7639104167 |
| Katha | কাঠা | 720 |
| Bigha | বিঘা | 14,400 (= 20 katha) |
| Chotak | ছটাক | 45 (= katha / 16) |
| Shotangsho | শতাংশ | 435.6 |
| Decimal | ডেসিমেল | 435.6 |
| Gonda | গন্ডা | 864 |
| Kani (20 Gonda) | কানি | 17,280 (= 20 gonda, 8-hat-nol system) |
| Kani (40 Shotok) | কানি | 17,424 (= 40 decimal) |
| Acre | একর | 43,560 (= 100 decimal) |

> **Two Kani standards.** Bangladesh uses both the '20 Gonda' kani (17,280 sq ft, the 8-hat-nol traditional system) and the '40 Shotok' kani (17,424 sq ft, ≈0.8% larger). This tool ships them as **separate units** — pick the one your deed or local practice uses.

> **Regional disclosure:** katha and bigha have different sizes in other regions and historical records (e.g. some Indian calculators use 1 katha = 1,361.25 sq ft — the Bihar standard). This tool uses the **Bangladesh convention** only.
>
> **Not a legal tool.** Jomi Hisheb does not determine legal ownership, cadastral boundaries, or official survey measurements. Always verify against official documents.

All factors live in one file: `src/data/units.ts`. Verified against independent sources (see `MASTERPLAN.md` §2).

## Run

```bash
bun install
bun run dev        # dev server (binds 0.0.0.0:5173)
```

## Test & verify

```bash
bun run test       # Vitest suite (99 tests: conversion matrix, validation, formatting, i18n, URL state, UI contracts)
bun run typecheck  # tsc, strict mode
bun run build      # production build → dist/
```

## Architecture

```
src/
├── data/units.ts        # Unit registry — single source of truth (factors, names, symbols)
├── lib/
│   ├── convert.ts       # Conversion engine (sq ft canonical base; framework-free)
│   ├── validate.ts      # Input parsing/validation (ParseOutcome)
│   ├── format.ts        # Display + copy formatting (Intl-based)
│   ├── share.ts         # Shareable URL state (read/serialize, debounced writes)
│   └── i18n.ts          # EN/BN string maps (~40 keys, no i18n library)
├── components/          # Header, ConverterCard, UnitSelect, AllUnitsGrid, QuickConversions, AboutUnits, FAQ, Footer, LangContext
├── tests/               # Vitest suites (engine matrix, validation, formatting, i18n, URL)
└── index.css            # Tailwind v4 tokens (indigo-blue palette, AA contrast)
```

Key decisions and rationale: see `MASTERPLAN.md` (§2 standards, §5 architecture, §21 decisions log).

## Data handling

- **Stored:** your language preference (`localStorage`, first-party, never transmitted).
- **Sent:** nothing. All conversion happens in your browser. No analytics, no cookies, no third-party scripts (fonts are the only external resource, loaded with `display=swap` and safe system fallbacks).

## Deployment

Static build (`vite build` → `dist/`); no server or environment variables required.

- **Freebuff hosting (primary):** install `bun install`, build `vite build`, output `dist/`.
- **GitHub Pages / Cloudflare Pages:** upload `dist/`; include `.nojekyll` for GitHub Pages. SPA fallback not needed (single route).
- Social card: `public/og-image.png` (1200×630) — regenerate with `bun scripts/generate-og.mjs` after design changes.

**Before going live:** replace the documented placeholder domain `https://jomi-hisheb.example.com/` in `index.html` (canonical, OG url, JSON-LD), `public/robots.txt`, and `public/sitemap.xml` with the real domain.
