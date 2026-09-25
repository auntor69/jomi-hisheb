/**
 * Conversion engine — the one authoritative conversion path.
 * MASTERPLAN §3.
 *
 * All conversions go through square feet (canonical base):
 *   areaInSqFt = value × UNITS[from].sqftPerUnit
 *   result     = areaInSqFt ÷ UNITS[to].sqftPerUnit
 *
 * This file is intentionally framework-free and DOM-free so it is directly
 * unit-testable and reusable outside React.
 */

import { UNITS, type UnitId } from "../data/units.ts";

/**
 * Convert a value from one unit to another via square feet.
 *
 * - No intermediate rounding: full float64 precision is preserved.
 * - Same-unit conversion returns the value unchanged (identity).
 * - Throws only on programmer error (unknown unit ids) — user-facing input
 *   problems are handled by validate.ts, never here.
 */
export function convert(value: number, from: UnitId, to: UnitId): number {
  if (!Number.isFinite(value)) {
    // Guard: NaN/±Infinity never enter the engine from validated UI input;
    // reject defensively so a bug upstream cannot propagate silently.
    throw new RangeError(`convert: value must be finite, got ${value}`);
  }

  const source = UNITS[from];
  const target = UNITS[to];
  if (!source || !target) {
    throw new Error(`convert: unknown unit id (from=${String(from)}, to=${String(to)})`);
  }

  if (source.id === target.id) {
    return value;
  }

  const areaInSqFt = value * source.sqftPerUnit;
  return areaInSqFt / target.sqftPerUnit;
}

/**
 * Non-throwing variant for render paths: returns NaN for non-finite input
 * instead of throwing, so the UI can decide how to present it.
 */
export function convertSafe(value: number, from: UnitId, to: UnitId): number {
  try {
    return convert(value, from, to);
  } catch {
    return NaN;
  }
}
