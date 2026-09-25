/**
 * Unit registry — the single source of truth for all conversion factors.
 * MASTERPLAN §2.
 *
 * Factors are "square feet per 1 unit" (canonical base = square foot).
 * Factors were re-verified against independent sources on 2026-09-25:
 *   - Katha (unit), Wikipedia: BD katha = 720 sq ft; 20 katha = 1 bigha = 14,400 sq ft.
 *   - BD land-law references: 1 decimal (shotangsho/shotok) = 4.356 sq m = 435.6 sq ft = 1/100 acre.
 *   - 1 sq ft = 0.09290304 m² exactly → 1 m² = 10.7639104167 sq ft (stored constant).
 */

export const UNIT_IDS = [
  "sqft",
  "sqm",
  "katha",
  "bigha",
  "shotangsho",
  "decimal",
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
  shotangsho: {
    id: "shotangsho",
    en: "Shotangsho",
    bn: "শতাংশ",
    symbol: "শতাংশ",
    sqftPerUnit: 435.6,
    order: 4,
  },
  decimal: {
    id: "decimal",
    en: "Decimal",
    bn: "ডেসিমেল",
    symbol: "ডেসিমেল",
    sqftPerUnit: 435.6,
    order: 5,
  },
  acre: {
    id: "acre",
    en: "Acre",
    bn: "একর",
    symbol: "acre",
    sqftPerUnit: 43560,
    order: 6,
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
