/**
 * Unit registry — the single source of truth for all conversion factors.
 * MASTERPLAN §2.
 *
 * Factors are "square feet per 1 unit" (canonical base = square foot).
 * Factors were re-verified against independent sources on 2026-09-25:
 *   - Katha (unit), Wikipedia: BD katha = 720 sq ft; 20 katha = 1 bigha = 14,400 sq ft.
 *   - BD land-law references: 1 decimal (shotangsho/shotok) = 4.356 sq m = 435.6 sq ft = 1/100 acre.
 *   - 1 sq ft = 0.09290304 m² exactly → 1 m² = 10.7639104167 sq ft (stored constant).
 *
 * Regional/traditional units added 2026-09-25 (owner decision, from a government
 * land-measurement reference). Kani is ambiguous in the wild — the source mixes
 * two standards — so BOTH are shipped as separate, clearly labeled units:
 *   - kani   — "20 Gonda" kani (8-hat-nol system): 20 gonda = 17,280 sq ft;
 *              chain gonda 864 → kora 216 → kranti 72 → til 3.6 (÷4, ÷3, ÷20).
 *   - kani40 — "40 Shotok" kani: 40 × 435.6 = 17,424 sq ft (≈ +0.83% vs 8-hat-nol).
 *   - gonda  — 17,280 / 20 = 864 sq ft (both kani standards agree gonda = kani/20).
 *   - chotak — 16 chotak = 1 katha → 720 / 16 = 45 sq ft.
 * NOT shipped (tiny fractions: kranti/til/kak; hectare variants): see MASTERPLAN §21.
 */

export const UNIT_IDS = [
  "sqft",
  "sqm",
  "katha",
  "bigha",
  "chotak",
  "shotangsho",
  "decimal",
  "gonda",
  "kani",
  "kani40",
  "acre",
] as const;

export type UnitId = (typeof UNIT_IDS)[number];

export interface UnitDef {
  /** Stable identifier used in code, URL params (?from=...&to=...), and tests. */
  readonly id: UnitId;
  /** English display name. */
  readonly en: string;
  /** Bengali display name. */
  readonly bn: string;
  /** Language-independent symbol (used in math-context strings, never translated). */
  readonly symbol: string;
  /** Square feet per 1 of this unit. The single authoritative factor. */
  readonly sqftPerUnit: number;
  /** Display order in selectors/quick conversions. */
  readonly order: number;
}

export const UNITS: Record<UnitId, UnitDef> = {
  sqft: {
    id: "sqft",
    en: "Square Feet",
    bn: "বর্গফুট",
    symbol: "sq ft",
    sqftPerUnit: 1,
    order: 0,
  },
  sqm: {
    id: "sqm",
    en: "Square Meters",
    bn: "বর্গমিটার",
    symbol: "m²",
    sqftPerUnit: 10.7639104167,
    order: 1,
  },
  katha: {
    id: "katha",
    en: "Katha",
    bn: "কাঠা",
    symbol: "কাঠা",
    sqftPerUnit: 720,
    order: 2,
  },
  bigha: {
    id: "bigha",
    en: "Bigha",
    bn: "বিঘা",
    symbol: "বিঘা",
    sqftPerUnit: 14400,
    order: 3,
  },
  chotak: {
    id: "chotak",
    en: "Chotak",
    bn: "ছটাক",
    symbol: "ছটাক",
    sqftPerUnit: 45, // 16 chotak = 1 katha → 720 / 16
    order: 4,
  },
  shotangsho: {
    id: "shotangsho",
    en: "Shotangsho",
    bn: "শতাংশ",
    symbol: "শতাংশ",
    sqftPerUnit: 435.6,
    order: 5,
  },
  decimal: {
    id: "decimal",
    en: "Decimal",
    bn: "ডেসিমেল",
    symbol: "ডেসিমেল",
    sqftPerUnit: 435.6,
    order: 6,
  },
  gonda: {
    id: "gonda",
    en: "Gonda",
    bn: "গন্ডা",
    symbol: "গন্ডা",
    sqftPerUnit: 864, // kani (20 gonda) = 17,280 sq ft → /20
    order: 7,
  },
  kani: {
    id: "kani",
    en: "Kani (20 Gonda)",
    bn: "কানি (20 গন্ডা)",
    symbol: "কানি",
    sqftPerUnit: 17280, // 8-hat-nol standard: 20 gonda
    order: 8,
  },
  kani40: {
    id: "kani40",
    en: "Kani (40 Shotok)",
    bn: "কানি (40 শতাংশ)",
    symbol: "কানি",
    sqftPerUnit: 17424, // 40 shotok × 435.6 — the "40 shotok" standard
    order: 9,
  },
  acre: {
    id: "acre",
    en: "Acre",
    bn: "একর",
    symbol: "acre",
    sqftPerUnit: 43560,
    order: 10,
  },
}

/** Units sorted for display (registry objects are keyed for O(1) lookup). */
export const UNITS_LIST: readonly UnitDef[] = UNIT_IDS.map((id) => UNITS[id]).sort(
  (a, b) => a.order - b.order,
);

/** Type-safe unit-id lookup (case-insensitive; used by URL param validation in Phase 3). */
export function isUnitId(value: string): value is UnitId {
  return (UNIT_IDS as readonly string[]).includes(value.toLowerCase() as UnitId);
}

/** True when both ids are the same unit (e.g. katha → katha). */
export function isSameUnit(a: UnitId, b: UnitId): boolean {
  return a === b;
}
