# Jomi Hisheb (জমির হিসাব) — Masterplan

**Version:** 1.0 · **Status:** Approved for implementation pending owner sign-off · **Date:** 2026-09-25

A fast, accurate, accessible land-unit converter for Bangladesh. One page, one input, instant results. No backend, no database, no accounts, no ads.

---

## 1. Product Overview and Scope

### Problem

Bangladeshis routinely negotiate land in katha, bigha, shotangsho, decimal, acre, square feet, and square meters. Existing online converters are ad-cluttered, slow, and confusing. Jomi Hisheb is one clean, instant, trustworthy tool.

### In scope

- Instant conversion among **7 units**: Katha, Bigha, Shotangsho, Decimal, Square Feet, Square Meters, Acre.
- Mobile-first single-page web app, deployable as a static site.
- Bilingual interface: English and Bengali (full toggle, see §11).
- Quick-conversion shortcuts, copy result, shareable URLs (§9, §10).
- Concise educational content, FAQ, documented conversion standards.

### Out of scope

- Accounts, authentication, database, server API, analytics/tracking, ads, popups.
- Conversion history persistence, cadastral/survey functions, legal claims.
- Non-land unit conversions (length, taka, etc.).

### Honesty & liability framing (mandatory, shown in UI + README)

- Values follow the **commonly used Bangladesh convention**; katha and bigha vary by region and historical record.
- The tool **does not** determine legal ownership, cadastral boundaries, or official survey measurements; it is a calculator aid.

---

## 2. Conversion Standards (Single Source of Truth)

All factors are defined **once** in `src/data/units.ts`. Values are per **1 unit in square feet (sq ft)** — the canonical base:

| Unit | Bengali | Symbol | sq ft per unit | Notes |
|---|---|---|---|---|
| Square Foot | বর্গফুট | sq ft | 1 | base unit |
| Square Meter | বর্গমিটার | m² | 10.7639104167 | exact value used app-wide |
| Katha | কাঠা | কাঠা | 720 | BD convention |
| Bigha | বিঘা | বিঘা | 14,400 (= 20 katha) | BD convention |
| Shotangsho | শতাংশ | শতাংশ | 435.6 | 1 shotangsho = 1 decimal |
| Decimal | ডেসিমেল | ডেসিমেল | 435.6 | 1 acre = 100 decimal |
| Acre | একর | acre | 43,560 | |

**Derivations (documented, not hardcoded ad hoc):**

- 1 bigha = 20 katha = 20 × 720 = 14,400 sq ft ✔
- 1 acre = 100 decimal = 100 × 435.6 = 43,560 sq ft ✔
- 1 m² = 0.09290304 sq ft → 1 sq ft = 1 / 0.09290304 = 10.763910416709722… m⁻¹; **we store 10.7639104167 (sq ft per m²)** as the app's constant, and display round to 2–4 decimals.

**Consistency invariants** (asserted by tests, §17): `bigha = 20 × katha`, `acre = 100 × decimal`, `shotangsho ≡ decimal`, `acre = 43,560 sq ft`.

**Regional variation:** The UI must state (converter footnote + FAQ) that katha/bigha differ by region and history (e.g., in parts of India/West Bengal a katha may be ~720 sq ft in Bangladesh but other values elsewhere; in Bihar/Nepal historically different). We ship **one** profile: Bangladesh standard. No hidden overrides.

---

## 3. Conversion Engine Design

**Location:** `src/lib/convert.ts` — pure functions, **zero framework/DOM dependencies**, directly unit-testable.

### API

```ts
convert(value: number, from: UnitId, to: UnitId): number
// value in `from` units → value in `to` units
// via: areaInSqFt = value * UNITS[from].sqftPerUnit; result = areaInSqFt / UNITS[to].sqftPerUnit

formatResult(n: number, opts?): string
// trims trailing zeros, groups thousands (en-US style in EN, Bengali numerals NOT used — see §11),
// returns "" for non-finite inputs
```

### Rules

1. **One engine.** Every pair (including same-unit, 49 ordered pairs total) goes through `convert`. No pair-specific formulas.
2. **No intermediate rounding.** Full float64 precision internally; round **only at display** (§4 formatting).
3. **Never feed formatted strings back into the engine** — engine takes `number` only; parse once at the input boundary.
4. **Validation lives in `src/lib/validate.ts`**, separate from conversion, returning a discriminated result:

```ts
type ParseOutcome =
  | { ok: true; value: number }
  | { ok: false; reason: "empty" | "not-a-number" | "negative" | "overflow" };
```

- `empty` → show neutral placeholder (not an error).
- `negative` → inline error message ("land area cannot be negative").
- `not-a-number` / malformed → inline error, keep last valid result visible.
- `overflow` → |value × factor| beyond `Number.MAX_VALUE × 0.5` → clamp with message "value too large"; never show `Infinity`.

5. **Determinism.** No Math.random, no Date, no locale-dependent behavior inside the engine.

### Test matrix (§17)

All 7×7 = 49 ordered pairs, plus: zero, tiny decimals (1e-6), large values (1e12 sq ft), round-trips (a→b→a within 1e-9 relative tolerance), reverse-pair consistency, fraction inputs (0.5, 2.75), and formatting cases (trailing zeros, grouping, ≥1e21 exponential fallback).

---

## 4. Number Formatting

Single formatter in `src/lib/format.ts`, used everywhere (main result, quick list, share URLs):

- Use `Intl.NumberFormat` with `maximumFractionDigits` chosen by magnitude:
  - ≥ 1,000 → 0–2 decimals (e.g. `14,400`)
  - ≥ 1 → up to 4 decimals
  - < 1 → up to 6 significant decimals
- Trim trailing zeros (Intl handles via `maximumFractionDigits`; explicitly `trailingZeroDisplay: "stripIfInteger"`).
- **No rounding of stored value** — format the float64 result; never re-parse displayed text.
- Copy format: `5 Katha = 8.26 Decimal` (value + unit name, matching on-screen text).

---

## 5. Technical Architecture & Stack

### Decision: adopt the Vite + React + TypeScript foundation

**Repository state (verified 2026-09-25):** `main` branch, single commit `720e4c9` ("Initial commit"), containing only `README.md` with the repo name. The repository is effectively empty — there is no existing application code to preserve or replace.

The Freebuff workspace provides a maintained **Vite + React + TypeScript + Tailwind (+ shadcn/ui)** template as the app foundation. Decision: **use it**, for these reasons:

- **No backend needed** — the app is a single client-rendered page; Vite produces static `dist/` deployable to any static host (Freebuff hosting, GitHub Pages, Cloudflare Pages).
- React's granularity lets us update the result on each keystroke without touching unrelated DOM.
- TypeScript gives compile-time safety on unit IDs (no stringly-typed bugs).
- Replacing the stack with plain HTML/vanilla JS would discard working tooling for marginal gains; the template is already configured and maintained.

**Deviations from the template for this product (documented, minimal):** the template's starter dashboard, auth pages, and Convex backend scaffolding are **omitted** — this product is a single public page with no accounts and no backend. Tailwind stays as the styling system (tokens via `src/index.css` CSS variables); shadcn/ui primitives are used only where they earn their keep.

### Project structure (adapted to existing repo)

```
/
├── MASTERPLAN.md
├── README.md
├── index.html                 # SEO meta, fonts, lang attr, theme-color
├── public/
│   ├── favicon.svg            # land/plat mark
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.tsx               # createRoot, mounts <App/>, imports index.css
│   ├── App.tsx                # providers (minimal) + <ConverterPage/>
│   ├── index.css              # Tailwind + design tokens (CSS vars)
│   ├── data/
│   │   └── units.ts           # UNITS registry: id, en, bn, symbol, sqftPerUnit, aliases
│   ├── lib/
│   │   ├── convert.ts         # pure conversion engine
│   │   ├── validate.ts        # ParseOutcome validation
│   │   ├── format.ts          # display + copy formatting
│   │   └── share.ts           # URL state read/write (§10)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ConverterCard.tsx  # input, unit selects, swap, result, copy
│   │   ├── UnitSelect.tsx     # accessible native select (EN + BN labels)
│   │   ├── SwapButton.tsx
│   │   ├── QuickConversions.tsx
│   │   ├── AboutUnits.tsx     # educational content
│   │   ├── FAQ.tsx            # <details>-based, no JS needed
│   │   ├── Footer.tsx
│   │   └── LangContext.tsx    # 'en' | 'bn' context + useT() hook
│   └── tests/
│       ├── convert.test.ts    # 49-pair matrix, round-trips, edge cases
│       ├── validate.test.ts
│       └── format.test.ts
└── (tooling: vite.config.ts, tsconfig, tailwind config, package.json — existing)
```

### Data flow (one direction)

```
input string → validate.ts → number → convert.ts → raw number → format.ts → display string
                     ↓ (invalid)                                    ↓
              inline message                             <span aria-live="polite"> + copy button
```

State lives in `ConverterCard` via `useState` only: `input: string`, `from: UnitId`, `to: UnitId`. Derived result is computed in render (cheap arithmetic; no memoization needed, no debounce). No context/global store for conversion state. Language is separate context at App level.

### URL state (§10)

`?from=katha&to=decimal&value=5`

- **Read once** on mount (in `App` or `ConverterCard` initial state); validate each param against the units registry; invalid → ignore that param (fall back to defaults: katha → decimal, empty input).
- **Write** on state change via `history.replaceState` — **debounced 500 ms** so typing doesn't spam history; never `pushState` per keystroke.
- Default state (no params) keeps URL clean (`/`).

### Framework choice rejected

Plain static HTML+JS (no build) was considered and rejected: it loses TypeScript, loses component reuse for the EN/BN toggle across ~40 strings, makes the engine harder to test in isolation, and the workspace already provides a maintained Vite toolchain — hand-rolling an equivalent would be more work for less capability.

---

## 6. UI/UX Specification

### Page anatomy (top → bottom, single column, max-width `max-w-2xl` ≈ 672px)

1. **Header** — brand "Jomi Hisheb" + "জমির হিসাব" beside a small land-plot SVG mark; right side: language toggle (EN|বাং segmented, 2 buttons). Non-sticky to keep the page minimal — the page is short and a sticky bar adds visual weight without value.
2. **Title block** — `<h1>` = "Jomi Hisheb — Bangladesh Land Unit Converter" (EN) / "জমির হিসাব — জমির পরিমাপ রূপান্তরক" (BN). One short subheading sentence. No hero image, no gradient banner.
3. **ConverterCard** — the visual centerpiece (see below).
4. **Quick conversions** — 8 chips/buttons in a flex-wrap row (§9).
5. **About the units** — 3–4 short paragraphs/fact list (§14 content strategy).
6. **FAQ** — `<details>` accordions (native, zero-JS, accessible), 5–6 items.
7. **Footer** — one line: honesty disclaimer + "Built for Bangladesh · No ads, no tracking" + year.

### ConverterCard spec

```
┌──────────────────────────────────────┐
│  [ 5          ] [ Katha ▾          ] │   ← source row
│    কাঠা                               │   ← bengali name under input/select
│              (⇅)                      │   ← swap button, centered
│  [ 8.26       ] [ Decimal ▾        ] │   ← result row
│    ডেসিমেল               [⧉ copy]     │   ← copy button
└──────────────────────────────────────┘
```

- **Source row:** `<input type="text" inputMode="decimal">` (text+inputMode, not type=number — avoids browser spinner weirdness, allows "5." while typing, and gives us full control of validation). Large font (`text-3xl`), `w-full`. Beside it a **native `<select>`** (`UnitSelect`) showing "Katha — কাঠা" options (label includes both languages; option text uses the current UI language first, other language in parentheses). Bengali unit name shown as small muted text under the row.
- **Swap button:** icon-only `<button aria-label="Swap units (অদল-বদল)">`, 44×44px min touch target, centered between rows on a subtle vertical connector line. On click: swap `from`/`to`, **preserve input string**. Subtle rotate animation (150ms, disabled under `prefers-reduced-motion`).
- **Result row:** read-only presentation of the formatted result in `text-3xl font-semibold tabular-nums`; a native `<select>` for the target unit; **copy button** (icon + "Copy"/"কপি" text label for clarity) with 1.5s "Copied ✓"/"কপি হয়েছে ✓" feedback state.
- **Validation messaging:** a reserved 20px-high line under the card (so layout never jumps) showing: nothing (ok/empty), or red-600 error text like "Land area cannot be negative / জমির পরিমাণ ঋণাত্মক হতে পারে না", linked via `aria-describedby` to the input.
- **Placeholder behavior:** empty input → result area shows a muted em-dash "—" with `aria-live="polite"` on the result wrapper so screen readers don't hear stale numbers; no error.
- **Result announcement:** the result element has `role="status"` + `aria-live="polite"` so SRs announce the *final* value politely; we do not announce per-keystroke spam (polite + only when text changes meaningfully).

### Interaction rules

1. Convert instantly on every keystroke — no Calculate button, no debounce on the math (§13).
2. Changing either unit re-computes immediately.
3. Swap preserves the numeric input; result recomputes.
4. Copy writes `5 Katha = 8.26 Decimal` (or current-language unit names) via `navigator.clipboard.writeText`; fallback: legacy `document.execCommand('copy')` path inside try/catch, then a visible "Copy failed" message if both fail (never `alert()`).
5. Unit change never clears the user's typed value.
6. Quick-conversion chips set `from`/`to`, keep the current value, scroll converter into view on mobile if it's off-screen (`scrollIntoView({block:'nearest'})`).

### Copy button accessibility

Icon buttons get `aria-label` in the active language; copy button has visible text + icon; all controls are real `<button>`/`<select>`/`<input>` elements — fully keyboard reachable, visible focus rings (`focus-visible:ring-2 ring-primary`).

---

## 7. Design System (Tokens & Theme)

### Palette (land-inspired, calm)

CSS custom properties in `src/index.css` (Tailwind v4 `@theme` if the template uses v4 — check `tailwind.config` presence; adapt syntax accordingly):

| Token | Value (light) | Usage |
|---|---|---|
| `--primary` | `#1F5132` (deep forest green) | brand, primary buttons, focus rings |
| `--primary-foreground` | `#F7F5EF` | text on primary |
| `--background` | `#FAF9F4` (warm off-white) | page bg |
| `--card` | `#FFFFFF` | converter card, sections |
| `--card-foreground` | `#1C2321` (deep charcoal) | main text |
| `--muted-foreground` | `#5C6B60` (muted gray-green) | secondary text, labels |
| `--border` | `#E4E1D6` (subtle warm gray) | card/section borders |
| `--success` | `#1A7A3C` | copied confirmation |
| `--destructive` | `#B3261E` | validation errors (AA on white) |
| `--ring` | `#1F5132` | focus rings |

Contrast checks (target WCAG AA): `#1C2321` on `#FAF9F4` ≈ 14.9:1; `#5C6B60` on `#FFFFFF` ≈ 5.6:1; `#B3261E` on `#FFFFFF` ≈ 5.9:1. All pass.

### Typography

- **Single family, two scripts:** `Noto Sans` (Latin) + `Noto Sans Bengali` via one Google Fonts request (`display=swap`), `font-display: swap` so text renders immediately with system fallback if fonts fail — the site must remain fully usable offline/failed-font.
- Self-hosting fonts would add build complexity for marginal gain; with `swap` + system fallbacks (`ui-sans-serif, system-ui, ...`) the page is never blocked on fonts. Documented as acceptable trade-off.
- Scale (mobile-first): result/input `text-3xl` (30px) on mobile → `text-4xl` (36px) desktop; h1 `text-2xl`; section h2 `text-lg font-semibold`; body `text-sm/base`; labels `text-xs uppercase tracking-wide muted`.

### Spacing, radius, motion

- Radius: cards `rounded-xl` (12px), buttons/inputs `rounded-lg` (8px), chips `rounded-full`.
- Spacing scale: Tailwind default 4px grid; card padding `p-5` mobile / `p-6` desktop; section gap `gap-6`.
- Touch targets ≥ 44×44px for all interactive controls.
- Motion: 150–200ms ease-out transitions on hover/focus/swap-rotate/copy-check; **all gated behind `@media (prefers-reduced-motion: no-preference)`** — under reduced motion, transitions are 0ms.

---

## 8. Responsive Behavior

- **Mobile-first.** Base styles target 360–430px; the converter card is the full content width minus page padding (`px-4`).
- Input and unit select share one row at every width: input `min-w-0 flex-1`, select `shrink-0`; short option labels ("Katha — কাঠা") fit at 360px — verified during implementation, with select-below-input as the documented fallback if not.
- Swap button sits between rows, centered; on mobile it's still comfortably tappable.
- **Tablet/desktop (≥768px):** content stays `max-w-2xl` centered; converter rows get more breathing room; quick chips wrap to one row; no layout shift.
- **No horizontal overflow** at any width down to 320px. The result uses `tabular-nums` and a responsive font size; for extremely long outputs (e.g. 999,999,999,999 with grouping), the result element alone may scroll horizontally — the page itself never does.
- One-hand use: all primary controls within thumb reach in the top 2/3 of the viewport on mobile.

---

## 9. Quick Conversions

A flex-wrap row of 8 chip buttons under the card. Each chip = `from → to` label in current language (e.g. "কাঠা → শতাংশ" in BN mode, "Katha → Decimal" in EN).

Default chips (fixed order):

1. Katha → Decimal
2. Decimal → Katha
3. Bigha → Katha
4. Katha → Square Feet
5. Decimal → Square Feet
6. Acre → Decimal
7. Square Feet → Square Meters
8. Bigha → Acre

Behavior: set `from`/`to`, **preserve the current input value**, recompute, and on mobile scroll the converter into view if needed. Chips are `<button>`s with `aria-label` describing the pair; active pair (matching current from/to) gets a subtle filled state.

---

## 10. Shareable URLs

Format: `?from=katha&to=decimal&value=5`

- Param names lowercase; values lowercase unit IDs from the registry; `value` parsed with the same `validate.ts` (negative → treated as invalid → ignored → default empty input; keep valid params though).
- Read once on mount; write via `history.replaceState` debounced 500ms after state settles.
- Invalid params never throw or crash — each param independently falls back to default.
- No URL updates when input is empty (keeps `?from&to` only; `value` omitted when input empty).

---

## 11. Bilingual Support (EN / বাংলা)

Full bilingual support **is in scope** (it's cheap once strings are centralized).

- **Mechanism:** `LangContext` with `'en' | 'bn'`, `useT()` returns `t(key)` from a flat string map `src/lib/i18n.ts` (one file, ~50 keys — no i18n library). Toggle: two-button segmented control in header (`EN | বাং`), persisted to `localStorage('jomi-lang')` (privacy-safe, first-party, non-tracking). **Default language: `'bn'`** — the primary audience is Bangladeshi and the product name is Bengali; switching to English is one tap. Trivially changeable, documented here.
- **What translates:** all UI strings, unit names (registry has `en` and `bn` fields), FAQ items, error messages, aria-labels, footer, `<html lang>` attribute (set to `bn` or `en` dynamically via `useEffect` — crawlers see the static `lang="bn"` in index.html which matches the default).
- **What does NOT change:** unit symbols (sq ft, m², acre), conversion factors, number formatting (we keep Western digits `1234.56` in both languages — Bengali numerals (১২৩৪) are beautiful but people doing land math in BD overwhelmingly use Western digits in deeds and calculators; forcing অঙ্ক would hurt usability. Documented decision).
- **No mixed-language sentences** — each string key is fully translated; unit names show the current language first, other language in parentheses in the select options only.
- **Typography:** Bengali gets slightly larger `line-height` (1.6 vs 1.5) via `html[lang="bn"]` CSS rule for proper conjunct rendering space.

---

## 12. Accessibility (WCAG 2.2 AA)

- Semantic HTML: one `<h1>`; `<main>`, `<header>`, `<footer>`, `<section aria-labelledby>` per section; `<label for>` on the input; selects have `<label>` (visually hidden label + visible unit name).
- **Keyboard:** every control tabbable in DOM order; swap/copy reachable; no keyboard traps; visible `focus-visible` rings (2px `--ring`, offset 2px).
- Contrast: all text/controls meet 4.5:1 (body) / 3:1 (large text) — palette in §7 verified.
- `aria-live="polite"` + `role="status"` on result wrapper; error line linked via `aria-describedby`; `aria-invalid` on input when error.
- Icon-only buttons (swap) have `aria-label`; copy has visible text.
- Touch targets ≥44px; `prefers-reduced-motion` respected.
- `<html lang>` matches UI language; Bengali content uses `lang="bn"` (whole page switches).
- FAQ uses native `<details>/<summary>` (keyboard + SR accessible for free).
- Test with keyboard-only navigation and a screen reader smoke test (documented in §20).

---

## 13. Performance

- **No network during conversion.** All math client-side; no API, no analytics, no tracking scripts.
- **No debounce on the converter input** (math is ~nanoseconds). Debounce only URL writes (500ms) — cheap DOM/history op.
- Dependencies: React, React DOM, Vite, Tailwind, shadcn/ui primitives (lucide-react for icons — already in template). **No new runtime deps** beyond what the template ships (no i18n lib, no state lib, no animation lib — CSS transitions suffice; Framer Motion from the template is unused and can be dropped from the bundle by simply not importing it).
- Fonts: one Google Fonts request with `display=swap`; system fallback stack prevents blocking.
- **No layout shift:** reserved error line (§6), fixed-height card sections, `font-display: swap`, explicit favicon/theme-color. Long results: responsive font size + `tabular-nums`.
- Target Lighthouse (prod build): Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95. Document limitations (external font request is the main one; self-hosting fonts is the fallback if score suffers).
- Bundle: route-level code-splitting unnecessary (single page); keep `index.html` lean; shadcn components imported on-demand (tree-shaken).

---

## 14. SEO Strategy

### Metadata (index.html)

- `<title>Jomi Hisheb – জমির হিসাব | Land Unit Converter Bangladesh</title>`
- Meta description (~155 chars, natural, no stuffing): "Convert katha, bigha, shotangsho, decimal, acre, square feet and square meters instantly. Free, accurate Bangladeshi land measurement converter — জমির হিসাব."
- Canonical: `https://jomi-hisheb.example.com/` **placeholder documented in README** — replace when domain is real. (Do not invent a real-looking domain.)
- Open Graph: `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image` (1200×630 PNG, brand card), `og:locale=en_US` + `og:locale:alternate=bn_BD`.
- Twitter card `summary_large_image`.
- `<meta name="theme-color" content="#1F5132">`, favicon SVG + fallback ICO/PNG.
- `<html lang="bn">` static default (matches default UI language); updated client-side on toggle.

### Technical

- `public/robots.txt` (allow all, sitemap ref), `public/sitemap.xml` (single URL).
- **Crawlability:** Vite SSG not configured by default — the SPA ships an `index.html` shell + JS. For meaningful no-JS content, we implement **static prerendering of the default state** into `index.html`... Decision: pragmatic approach — the template's `index.html` is the static shell; we put the **h1, subheading, and core explanatory content** (about-units text in Bengali + English summary) as real HTML inside `index.html`'s `<div id="root">` so crawlers see substance without JS; React hydrates/replaces on mount. This is simple, zero extra tooling, and satisfies "renders meaningful content without user interaction." (Alternative — vite-plugin-ssr/SSG — rejected as overengineering for one page.)
- Structured data: **only** honest `WebApplication` schema (`name`, `description`, `applicationCategory=UtilitiesApplication`, `operatingSystem=Any`, `offers.price=0`) — no fake ratings/reviews/aggregateRating.
- Custom 404: static hosts usually provide SPA fallback; if deploying to Freebuff static hosting, a `404.html` (copy of index.html or minimal styled page) is included. Document per-host.

### Content (concise, factual — in both languages)

- What katha/bigha mean (20 katha = 1 bigha; 720 sq ft each, BD convention).
- Shotangsho = decimal (435.6 sq ft; 100 per acre).
- sq ft ↔ m² relationship.
- Regional variation disclosure (katha/bigha values differ across regions/history).
- The honesty disclaimer (no legal/cadastral authority).

---

## 15. Security & Privacy

- No personal data collected; no accounts; no cookies (except the first-party `localStorage` language preference — not a tracker, documented).
- No conversion data leaves the browser; no fetch/XHR in the app.
- No `dangerouslySetInnerHTML`, no `eval`, no URL-driven code execution; URL params validated against the units registry.
- No third-party scripts beyond the Google Fonts stylesheet (documented; can be self-hosted later).
- README documents honest data handling: what is stored (language pref), what is sent (nothing), what is logged (nothing).

---

## 16. Error Handling Matrix

| Case | Behavior |
|---|---|
| Empty input | Neutral placeholder "—" in result; no error; URL omits `value` |
| Negative number | Inline error "Land area cannot be negative / জমির পরিমাণ ঋণাত্মক হতে পারে না"; result shows "—"; `aria-invalid` |
| Non-numeric ("abc", "1.2.3") | Inline error "Enter a valid number / সঠিক সংখ্যা লিখুন"; keep last valid result hidden; no crash |
| Trailing "." / "5." while typing | Treated as "not finished" → treat as empty-equivalent (placeholder), not error |
| Huge value (> ~1e308 / overflow) | Clamp message "Value too large / মান অতিরিক্ত বড়"; no `Infinity` shown |
| Invalid URL param | Ignore that param only; others honored; safe defaults |
| Clipboard failure | Try `navigator.clipboard`, fall back to `execCommand`, then visible error state on the button (no `alert()`) |
| Font load failure | System fallback fonts; layout intact |
| JS disabled | Static index.html content still explains units + shows h1; converter inert (documented limitation) |
| Component crash | React error boundary at App level showing a retry message instead of white screen |

---

## 17. Testing Strategy

### Unit tests (Vitest, `src/tests/`)

**`convert.test.ts`:**
- All 49 ordered pairs against **independently hand-computed expected values** (spot-checked, e.g. `5 katha → decimal`: 5×720=3600 sq ft → 3600/435.6 = 8.2648…; `1 bigha → acre`: 14400/43560 = 0.33057…; `1 m² → sq ft`: 10.7639104167; `100 decimal → acre` = 1).
- Same-unit conversion identity (`convert(x, u, u) === x` within float tolerance).
- Round-trips: for every pair a→b→a, relative error < 1e-9.
- Reverse consistency: `convert(1,A,B) × convert(1,B,A) ≈ 1`.
- Invariants: `convert(1,'bigha','katha') = 20`, `convert(1,'acre','decimal') = 100`, `convert(1,'shotangsho','decimal') = 1`.
- Zero → zero; negative → engine returns negative (validation is UI's job) but formatted as error upstream; tiny (1e-9) and large (1e15 sq ft) values stay finite.
- Factor registry sanity: every `sqftPerUnit` > 0 and finite.

**`validate.test.ts`:** "", "   ", "abc", "12.3.4", "-5", "5.", ".", "1e3", "1e308", "  42  " → expected `ParseOutcome`s. Rule: trim whitespace; reject `-` anywhere except leading minus (→ negative error); "5." → `empty`-equivalent ("still typing"); scientific notation accepted (engine handles it; display formatting handles magnitude).

**`format.test.ts`:** trailing-zero stripping (`8.2600`→`8.26`), grouping (`14400`→`14,400`), small numbers (0.0001 → 6 decimals), very large (≥1e21 → exponential), copy format (`5 Katha = 8.26 Decimal`).

### UI tests

Vitest + React Testing Library (`@testing-library/react`, already typical in template) if present; otherwise manual QA checklist:

- Type "5" with katha→decimal: result shows 8.26 instantly.
- Change target to bigha with input 5 katha: result updates to 0.25 (5×720=3600 sq ft ÷ 14,400).
- Swap: units flip, input preserved, result recomputes.
- Copy: clipboard contains formatted result; feedback shows.
- Quick chip click: units set, value kept, result updates.
- Empty input: placeholder, no error. Negative: error message. Invalid: error message.
- EN/BN toggle: labels, unit names, errors, `<html lang>` change.
- URL param load: `?from=acre&to=katha&value=2` → 121 katha (2×43,560 = 87,120 sq ft ÷ 720). Verify in test.
- No console errors/warnings in normal flows.

### Regression & build validation

- `bun tsc -b --noEmit` clean.
- `bun vitest run` all green.
- Production build (`vite build`) succeeds; inspect `dist/` size (< 200KB gzipped JS budget; realistically ~150KB with React — acceptable, documented).
- Responsive smoke test at 320, 375, 768, 1280 widths.
- Lighthouse run on prod build if tooling available; document results.

**Do not claim tests pass unless actually executed.**

---

## 18. Deployment

- **Build:** `vite build` → `dist/` static. **No server required.**
- Freebuff static hosting is the primary target (build command `vite build`, output `dist/`, SPA fallback/404 as supported).
- Alternatives documented in README: GitHub Pages (add `.nojekyll`, base path consideration if project-page URL), Cloudflare Pages.
- No environment variables needed (no secrets, no API).
- Custom domain: set canonical/OG URLs in `index.html` + `sitemap.xml` when known (placeholder documented).
- SPA routing: single route `/`; no routing fallback needed beyond host default.

---

## 19. Implementation Phases

| Phase | Deliverable | Done when |
|---|---|---|
| 0 | Masterplan | This doc committed |
| 1 | Foundation | Vite+React+TS+Tailwind foundation established; tokens in index.css; fonts wired |
| 2 | Conversion engine | units.ts + convert/validate/format + full Vitest suite green |
| 3 | Main interface | Header, ConverterCard (input, selects, swap, instant result, copy) working |
| 4 | Supporting content | Quick chips, About, FAQ, Footer, EN/BN toggle complete |
| 5 | Polish | Responsive at 320–1280+, focus states, reduced motion, no overflow, no CLS |
| 6 | SEO & perf | Meta/OG/schema/robots/sitemap; index.html static content; Lighthouse targets checked |
| 7 | QA | tsc + vitest + build green; manual QA checklist pass; console clean |
| 8 | Delivery | README, MASTERPLAN milestone updates, commit |

**Order is strict: each phase builds on the previous. Phase 2 (engine + tests) precedes any UI.**

### Phase 0 verification (2026-09-25)

- [x] Repository inspected: `main` @ `720e4c9`, only `README.md` present — effectively empty repo.
- [x] Masterplan written and committed as the first substantive commit.
- [x] No application code written yet, per Phase Zero instructions.

---

## 20. Acceptance Criteria (Final Checklist)

### Functionality
- [ ] All 7 units supported; every source→target combination works (49 pairs tested).
- [ ] Instant updates on typing/unit change/swap; no Calculate button.
- [ ] Swap preserves input; copy works with feedback; quick conversions work.
- [ ] Validation: empty/negative/invalid/overflow handled gracefully; no crash paths.
- [ ] Factors centralized in one registry; no duplicated formulas.

### Design & UX
- [ ] Converter is the visual focus; no dashboard clutter, no decorative noise.
- [ ] Clean at 320/375/768/1280 widths; no horizontal overflow; ≥44px touch targets.
- [ ] EN/BN consistent; no mixed-language sentences; Bengali line-height handled.
- [ ] Focus-visible rings; hover/active/copy states; `prefers-reduced-motion` respected.

### Engineering
- [ ] No backend/database/accounts/ads/tracking; works offline after assets load.
- [ ] Engine framework-free and unit-tested; no unnecessary dependencies added.
- [ ] `tsc` clean; all tests pass; production build succeeds; no console errors.

### SEO & Accessibility
- [ ] Complete metadata (title, description, canonical placeholder, OG, favicon, theme-color).
- [ ] Semantic HTML, one h1, logical heading order, labels on all controls.
- [ ] Meaningful static content in index.html (crawlable without JS).
- [ ] Keyboard-navigable; aria-live result; contrast AA; language attributes correct.

### Documentation
- [ ] MASTERPLAN.md (this file) with milestones updated at delivery.
- [ ] README: run/test/build/deploy instructions, conversion standards, regional-variation disclosure, data-handling statement.
- [ ] Git history clean: masterplan commit, then implementation commits.

---

## 21. Key Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Keep Vite+React+TS template; strip Convex/auth/router | Single-page no-backend utility; template tooling is working and maintained; stripping unused backend scaffolding reduces weight and maintenance burden for a solo dev |
| 2 | sq ft as canonical base unit | Matches BD mental model (deeds quote sq ft); all 49 pairs via one multiply/divide |
| 3 | m² factor = 10.7639104167 sq ft | Exact standard (1 sq ft = 0.09290304 m²); full float precision internally |
| 4 | `input type="text" inputMode="decimal"` | Full control over validation, supports "5." while typing, no browser spinner quirks |
| 5 | Native `<select>` for units | Best a11y/usability/speed balance; no custom dropdown complexity |
| 6 | Default language: Bengali | Primary audience; product name is Bengali; toggle is one tap; static `lang="bn"` matches |
| 7 | Western digits in both languages | Deeds/calculators in BD use Western digits; Bengali numerals would hurt usability |
| 8 | Static content baked into index.html | Crawlable without JS; zero extra SSG tooling for one page |
| 9 | No Framer Motion / i18n lib / state lib | CSS transitions + 1-file string map + useState suffice; fewer deps |
| 10 | 500ms debounce only on URL writes | Math never debounced; history spam avoided |
| 11 | localStorage for language only | First-party preference, not tracking; documented honestly |

---

## 22. Open Items / To Confirm Later

| Item | Placeholder until | Where it appears |
|---|---|---|
| Production domain | Owner provides | `index.html` canonical + OG url, `sitemap.xml`, README |
| OG image (1200×630) | Phase 6 | `public/og-image.png` |
| Lighthouse scores | Phase 6 audit | README results section |

---

*End of masterplan. Implementation begins after owner approval.*
