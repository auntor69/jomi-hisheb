/**
 * Number formatting — MASTERPLAN §4.
 * One formatter used everywhere (main result, quick conversions, copy text).
 * Formats the float64 result for display only; values are never re-parsed
 * from formatted strings.
 */

import { UNITS, type UnitId } from "../data/units.ts";

/**
 * Display precision by magnitude (MASTERPLAN §4):
 *   ≥ 1,000  → 0–2 decimals
 *   ≥ 1      → up to 4 decimals
 *   < 1      → up to 6 decimals (small magnitudes keep significance)
 */
function fractionDigitsFor(n: number): number {
  const abs = Math.abs(n);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 4;
  return 6;
}

/**
 * Format a number for display.
 * - Groups thousands (en-US style "14,400" — Western digits in both languages).
 * - Strips unnecessary trailing zeros (minimumFractionDigits defaults to 0,
 *   so "8.2600" → "8.26" and "5.000" → "5" without extra options).
 * - Values ≥ 1e21 switch to scientific notation (documented fallback).
 * - Falls back to "" for non-finite inputs (callers show a placeholder).
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "";

  // MASTERPLAN §4: ≥ 1e21 uses exponential fallback (plain formatting would
  // produce hundreds of grouped digits for overflow-scale inputs).
  if (Math.abs(n) >= 1e21) {
    const sci = new Intl.NumberFormat("en-US", {
      notation: "scientific",
      maximumFractionDigits: 6,
    });
    return sci.format(n);
  }

  const maxDigits = fractionDigitsFor(n);
  const nf = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxDigits,
  });
  return nf.format(n);
}

/** Unit names for copy text come straight from the registry (single source
 *  of truth — e.g. "Kani (20 Gonda)" stays unambiguous in copied text). */
const unitLabel = (id: UnitId): string => UNITS[id].en;

/**
 * Full copy-to-clipboard string, e.g. "5 Katha = 8.26 Decimal".
 * (MASTERPLAN §10: format reflects the actual calculated result and display precision.)
 */
export function formatCopyText(value: number, from: UnitId, to: UnitId, result: number): string {
  return `${formatNumber(value)} ${unitLabel(from)} = ${formatNumber(result)} ${unitLabel(to)}`;
}
