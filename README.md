<div align="center">

# জমির হিসাব · Jomi Hisheb

**A fast, accurate, mobile-first land-unit converter for Bangladesh.**

Convert between 11 traditional and modern land units —
কাঠা · বিঘা · ছটাক · শতাংশ · ডেসিমেল · গন্ডা · কানি · একর · বর্গফুট · বর্গমিটার —
instantly, in the browser, in English or বাংলা.

[![CI](https://github.com/auntor69/jomi-hisheb/actions/workflows/ci.yml/badge.svg)](https://github.com/auntor69/jomi-hisheb/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2B4C9B.svg)](./LICENSE)
[![Built with React](https://img.shields.io/badge/React-19-2B4C9B.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-2B4C9B.svg)](https://www.typescriptlang.org/)

[**Live app →**](https://jomihisheb.vercel.app) &nbsp;·&nbsp; [Report a bug](https://github.com/auntor69/jomi-hisheb/issues) &nbsp;·&nbsp; [Security policy](./SECURITY.md)

</div>

---

## Why

Land documents in Bangladesh mix units freely — a deed may say *"৩ কানি ৫ গন্ডা"*, a map may say *katha*, and a listing may say *decimal*. Turning those into something you can actually compare means juggling factors like `1 katha = 16 chotak = 720 sq ft` in your head, or trusting a calculator that silently picks one of two conflicting **kani** standards.

Jomi Hisheb does it in one place: one input, every unit at once, both standards explicit, and no data leaving your device.

## Features

| | |
|---|---|
| **11 units, one input** | Type a value and see every unit update live — no pressing "convert" |
| **36 conversion pages** | Static pages like [/katha-to-decimal](https://jomihisheb.vercel.app/katha-to-decimal) and [/bigha-to-katha](https://jomihisheb.vercel.app/bigha-to-katha) — exact rate, conversion table, bilingual FAQ, and a deep link that pre-fills the calculator |
| **All units at a glance** | A live grid shows your number in all 11 units simultaneously; tap any card to make it the target |
| **Both Kani standards** | Ships the 20-Gonda kani (17,280 sq ft) **and** the 40-Shotok kani (17,424 sq ft) as separate, clearly labeled units |
| **Bilingual** | Full English / বাংলা interface (Bengali by default), Western digits in both |
| **Shareable links** | The whole calculator state lives in the URL: `?from=katha&to=decimal&value=5` |
| **Built for phones** | The result value owns the full card width, so long numbers never wrap or clip |
| **Accessible** | WCAG 2.2 AA practices: labeled controls, keyboard operable, visible focus, `aria-live` results, reduced-motion support |
| **Private by design** | All conversion happens in the browser. No accounts, no ads, no tracking profiles |

## Conversion standards

Bangladesh convention, with square feet as the canonical base.

| Unit | বাংলা | sq ft per unit | Notes |
|---|---|---|---|
| Square Foot | বর্গফুট | 1 | base unit |
| Square Meter | বর্গমিটার | 10.7639104167 | |
| Katha | কাঠা | 720 | |
| Bigha | বিঘা | 14,400 | = 20 katha |
| Chotak | ছটাক | 45 | = katha ÷ 16 |
| Shotangsho | শতাংশ | 435.6 | |
| Decimal | ডেসিমেল | 435.6 | = 1 shotangsho |
| Gonda | গন্ডা | 864 | |
| Kani (20 Gonda) | কানি | 17,280 | traditional 8-hat-nol system |
| Kani (40 Shotok) | কানি | 17,424 | = 40 decimal |
| Acre | একর | 43,560 | = 100 decimal |

> **Two Kani standards.** Bangladesh uses both the *20-Gonda* kani (17,280 sq ft, the 8-hat-nol traditional system) and the *40-Shotok* kani (17,424 sq ft, ≈0.8% larger). Rather than pick one, Jomi Hisheb ships both as separate units — choose the one your deed or local practice uses.

> **Regional disclosure.** Katha and bigha vary by region and historical record (some Indian calculators use the Bihar standard, 1 katha = 1,361.25 sq ft). This tool uses the **Bangladesh convention only**.

> **Not a legal instrument.** Jomi Hisheb does not determine ownership, cadastral boundaries, or official survey measurements. Always verify against official documents.

Every factor lives in a single file — [`src/data/units.ts`](src/data/units.ts) — and is covered by a full conversion matrix in the test suite. Sourcing and rationale: [`MASTERPLAN.md`](MASTERPLAN.md) §2.

## Quick start

**Requirements:** [Bun](https://bun.sh) (or Node 20+ with npm/yarn/pnpm).

```bash
git clone https://github.com/auntor69/jomi-hisheb.git
cd jomi-hisheb
bun install
bun run dev        # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `bun run dev` | Vite dev server (binds `0.0.0.0:5173`) |
| `bun run build` | Production build → `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run test` | Vitest suite (single run) |
| `bun run test:watch` | Vitest in watch mode |
| `bun run typecheck` | `tsc -b --noEmit`, strict mode |

## Architecture

```
src/
├── data/units.ts          # Unit registry — single source of truth (factors, names, symbols)
├── lib/
│   ├── convert.ts         # Conversion engine (sq ft canonical base; framework-free)
│   ├── validate.ts        # Input parsing/validation (ParseOutcome)
│   ├── format.ts          # Display + copy formatting (Intl-based, Western digits)
│   ├── share.ts           # Shareable URL state (read/serialize, debounced writes)
│   ├── seoPages.ts        # Programmatic conversion pages + sitemap generator (build-time)
│   └── i18n.ts            # EN/BN string maps, with runtime key-parity checks
├── components/            # Header, ConverterCard, UnitSelect, AllUnitsGrid,
│                          # QuickConversions, AboutUnits, FAQ, Footer, LangContext
├── tests/                 # Vitest suites (engine matrix, validation, formatting, i18n, URL, UI contracts, SEO)
└── css / index.css        # Tailwind v4 design tokens (indigo palette, AA contrast)
```

**Design principles**

- **One source of truth.** Adding a unit means editing the registry; the conversion engine, formatter, i18n, and tests all follow from it.
- **Pure logic, thin UI.** Conversion, validation, and formatting are dependency-free modules — the React layer only renders them.
- **No i18n library.** Two typed string maps with a runtime parity check keep the bundle small and the translations honest.
- **Contracts are tested.** The suite asserts conversion invariants, URL round-trips, and structural UI guarantees (e.g. long results can never overflow).
- **Tailwind tokens over ad-hoc styles.** The indigo/`#FAF9F4` palette and typography scale live in `src/index.css`.

Deeper rationale and the decision log: [`MASTERPLAN.md`](MASTERPLAN.md).

## Data handling

- **Stored:** your language preference (`localStorage`, first-party, never transmitted).
- **Converted:** everything, locally — your measurements never leave the browser.
- **Sent:** the static bundle, Google Fonts, and anonymous cookie-free page counts via Vercel Analytics (no personal data, no cross-site profiles, no ads). No accounts, no server-side storage.

## Deployment

Static output — `vite build` produces `dist/`; no server or environment variables required.

- **Vercel (current):** auto-deploys from `main`. Live at **https://jomihisheb.vercel.app**.
- **Netlify / Cloudflare Pages:** build `bun run build`, publish `dist/`.
- **GitHub Pages:** publish `dist/` and add a `.nojekyll` file.

Generated assets are committed and reproducible:

```bash
bun scripts/generate-og.mjs       # public/og-image.png       (1200×630 social card)
bun scripts/generate-icons.mjs    # PWA icons: 192, 512, apple-touch
```

If the domain ever changes, update it in `index.html`, `src/lib/seoPages.ts` (the `DOMAIN` constant — feeds every conversion page and the generated sitemap), `public/robots.txt`, and `public/manifest.webmanifest`.

## SEO & discoverability

The site ships crawlable static content inside `index.html` (hero copy, the unit table, common conversions, FAQ) so it is fully readable without JavaScript, plus:

- **Programmatic conversion pages** — 36 static pages generated at build time from the curated pair list in `src/lib/seoPages.ts` (`/katha-to-decimal`, `/bigha-to-katha`, …), each with unique title/description/canonical, the exact rate, a conversion table verified against the registry, bilingual FAQ schema, and a deep link that opens the calculator pre-filled. Extend the `PAIRS` list to add pages.
- Canonical URL, `robots` meta, Open Graph and Twitter card metadata
- Structured data: `WebApplication`, `FAQPage`, `Organization`, `WebSite` (+ per-page `WebPage`/`FAQPage`)
- `robots.txt` and a build-generated `sitemap.xml` (homepage + all conversion pages)
- Web app manifest + installable icons
- Descriptive page titles and headings targeting real search intent (katha ↔ decimal, bigha, kani, shotangsho conversions)

## Contributing

Contributions are welcome — see [**CONTRIBUTING.md**](./CONTRIBUTING.md) for ground rules, local checks, and the PR checklist. Accuracy changes must come with a cited source.

- **Found a bug or layout problem?** Use the structured [bug report](https://github.com/auntor69/jomi-hisheb/issues/new?template=bug_report.yml) form.
- **Conversion looks wrong?** Use the [accuracy report](https://github.com/auntor69/jomi-hisheb/issues/new?template=accuracy_report.yml) form — a source is required.
- **Security issue?** Follow [**SECURITY.md**](./SECURITY.md) instead of opening a public issue.
- **Everyone participating agrees to the [Code of Conduct](./CODE_OF_CONDUCT.md).**

## License

[MIT](./LICENSE) © [Afterclass Studio](https://github.com/auntor69)

<div align="center">
<sub>Built in Bangladesh 🇧🇩 by <a href="https://github.com/auntor69">Afterclass Studio</a>.</sub>
</div>
