/**
 * Conversion engine tests — MASTERPLAN §17.
 *
 * Expected values are computed directly from the documented factor table
 * (MASTERPLAN §2) — NOT by calling convert() — so the tests genuinely
 * verify the engine rather than echo it.
 */
import { describe, it, expect } from "vitest";
import { convert, convertSafe } from "../lib/convert.ts";
import { UNIT_IDS, UNITS, UNITS_LIST, type UnitId } from "../data/units.ts";

const FACTOR: Record<UnitId, number> = {
  sqft: 1,
  sqm: 10.7639104167,
  katha: 720,
  bigha: 14400,
  chotak: 45,
  shotangsho: 435.6,
  decimal: 435.6,
  gonda: 864,
  kani: 17280,
  kani40: 17424,
  acre: 43560,
};

function relDiff(actual: number, expected: number): number {
  if (expected === 0) return Math.abs(actual);
  return Math.abs(actual - expected) / Math.abs(expected);
}

describe("convert — full 121-pair matrix", () => {
  it("matches hand-derived spot checks", () => {
    // 5 katha = 3600 sq ft = 8.2648… decimal
    expect(relDiff(convert(5, "katha", "decimal"), 3600 / 435.6)).toBeLessThan(1e-12);
    // 1 bigha = 14400 sq ft = 0.330579… acre
    expect(relDiff(convert(1, "bigha", "acre"), 14400 / 43560)).toBeLessThan(1e-12);
    // 1 sq m = 10.7639104167 sq ft (exact stored constant)
    expect(convert(1, "sqm", "sqft")).toBe(10.7639104167);
    // 2 acre = 87120 sq ft = 121 katha
    expect(relDiff(convert(2, "acre", "katha"), 121)).toBeLessThan(1e-12);
  });

  it("covers every ordered pair (121 combinations) against the factor table", () => {
    let pairCount = 0;
    for (const from of UNIT_IDS) {
      for (const to of UNIT_IDS) {
        pairCount += 1;
        const expected = FACTOR[from] / FACTOR[to];
        const result = convert(1, from, to);
        expect(
          relDiff(result, expected),
          `convert(1, ${from}, ${to}) = ${result}, expected ${expected}`,
        ).toBeLessThan(1e-9);
      }
    }
    expect(pairCount).toBe(121);
  });

  it("covers every ordered pair with fractional and large values", () => {
    for (const from of UNIT_IDS) {
      for (const to of UNIT_IDS) {
        for (const value of [0.5, 2.75, 1e12]) {
          const expected = (value * FACTOR[from]) / FACTOR[to];
          const result = convert(value, from, to);
          expect(
            relDiff(result, expected === 0 ? 1 : expected),
            `convert(${value}, ${from}, ${to}) = ${result}, expected ${expected}`,
          ).toBeLessThan(1e-9);
          expect(Number.isFinite(result)).toBe(true);
        }
      }
    }
  });
});

describe("convert — same-unit identity", () => {
  it("returns the value unchanged for every unit", () => {
    for (const u of UNIT_IDS) {
      expect(convert(123.456, u, u)).toBe(123.456);
      expect(convert(0, u, u)).toBe(0);
      expect(convert(1e12, u, u)).toBe(1e12);
    }
  });
});

describe("convert — documented invariants (MASTERPLAN §2)", () => {
  it("1 bigha = 20 katha", () => {
    expect(convert(1, "bigha", "katha")).toBeCloseTo(20, 12);
  });

  it("1 acre = 100 decimal", () => {
    expect(convert(1, "acre", "decimal")).toBeCloseTo(100, 12);
  });

  it("1 shotangsho = 1 decimal", () => {
    expect(convert(1, "shotangsho", "decimal")).toBeCloseTo(1, 12);
    expect(convert(1, "decimal", "shotangsho")).toBeCloseTo(1, 12);
  });

  it("1 acre = 43560 sq ft", () => {
    expect(convert(1, "acre", "sqft")).toBe(43560);
  });

  it("1 sq m = 10.7639104167 sq ft", () => {
    expect(convert(1, "sqm", "sqft")).toBe(10.7639104167);
  });

  it("100 decimal = 1 acre (reverse direction)", () => {
    expect(convert(100, "decimal", "acre")).toBeCloseTo(1, 12);
  });

  it("1 kani (20 gonda) = 20 gonda exactly", () => {
    expect(convert(1, "kani", "gonda")).toBeCloseTo(20, 12);
    expect(convert(20, "gonda", "kani")).toBeCloseTo(1, 12);
  });

  it("1 kani (20 gonda) = 17280 sq ft (8-hat-nol chain)", () => {
    expect(convert(1, "kani", "sqft")).toBe(17280);
  });

  it("1 kani (40 shotok) = 40 decimal exactly", () => {
    expect(convert(1, "kani40", "decimal")).toBeCloseTo(40, 12);
    expect(convert(40, "decimal", "kani40")).toBeCloseTo(1, 12);
  });

  it("1 kani (40 shotok) = 17424 sq ft", () => {
    expect(convert(1, "kani40", "sqft")).toBe(17424);
  });

  it("1 katha = 16 chotak", () => {
    expect(convert(1, "katha", "chotak")).toBeCloseTo(16, 12);
    expect(convert(16, "chotak", "katha")).toBeCloseTo(1, 12);
  });

  it("1 chotak = 45 sq ft", () => {
    expect(convert(1, "chotak", "sqft")).toBe(45);
  });

  it("the two kani standards differ by exactly 40 shotok vs 20 gonda, ≈0.83%", () => {
    const ratio = convert(1, "kani", "kani40");
    expect(ratio).toBeCloseTo(17280 / 17424, 12);
    expect(ratio).toBeLessThan(1);
  });
});

describe("convert — round-trips and reverse consistency", () => {
  const VALUES = [1e-9, 1, 1234.5678, 1e15];

  it("round-trip a→b→a stays within 1e-9 relative error for all pairs", () => {
    for (const a of UNIT_IDS) {
      for (const b of UNIT_IDS) {
        for (const v of VALUES) {
          const roundTrip = convert(convert(v, a, b), b, a);
          expect(
            relDiff(roundTrip, v),
            `round-trip ${v} ${a}→${b}→${a} = ${roundTrip}`,
          ).toBeLessThan(1e-9);
        }
      }
    }
  });

  it("convert(1,A,B) × convert(1,B,A) ≈ 1 for all pairs", () => {
    for (const a of UNIT_IDS) {
      for (const b of UNIT_IDS) {
        const product = convert(1, a, b) * convert(1, b, a);
        expect(Math.abs(product - 1)).toBeLessThan(1e-9);
      }
    }
  });
});

describe("convert — defensive behavior", () => {
  it("convert() throws on non-finite input; convertSafe returns NaN", () => {
    expect(() => convert(Number.NaN, "katha", "decimal")).toThrow(RangeError);
    expect(() => convert(Infinity, "katha", "decimal")).toThrow(RangeError);
    expect(() => convert(-Infinity, "katha", "decimal")).toThrow(RangeError);
    expect(convertSafe(Number.NaN, "katha", "decimal")).toBeNaN();
    expect(convertSafe(Infinity, "katha", "decimal")).toBeNaN();
  });

  it("convert() throws on unknown unit ids (defensive path)", () => {
    expect(() => convert(1, "bogus" as unknown as UnitId, "decimal")).toThrow();
    expect(() => convert(1, "katha", "bogus" as unknown as UnitId)).toThrow();
  });
});

describe("registry sanity (MASTERPLAN §17)", () => {
  it("every factor is finite and positive", () => {
    for (const id of UNIT_IDS) {
      expect(UNITS[id].sqftPerUnit).toBeGreaterThan(0);
      expect(Number.isFinite(UNITS[id].sqftPerUnit)).toBe(true);
    }
  });

  it("UNITS_LIST has 11 entries sorted by display order", () => {
    expect(UNITS_LIST).toHaveLength(11);
    for (let i = 1; i < UNITS_LIST.length; i++) {
      expect(UNITS_LIST[i].order).toBeGreaterThan(UNITS_LIST[i - 1].order);
    }
  });

  it("exposes EN and BN names and a symbol for every unit", () => {
    for (const id of UNIT_IDS) {
      expect(UNITS[id].en.length).toBeGreaterThan(0);
      expect(UNITS[id].bn.length).toBeGreaterThan(0);
      expect(UNITS[id].symbol.length).toBeGreaterThan(0);
    }
  });

  it("has 11 unique unit ids", () => {
    expect(new Set(UNIT_IDS).size).toBe(11);
  });
});
