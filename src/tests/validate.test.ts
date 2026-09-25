/**
 * Input validation tests — MASTERPLAN §16 (error handling matrix).
 */
import { describe, it, expect } from "vitest";
import { parseAreaInput } from "../lib/validate.ts";

describe("parseAreaInput — empty / still-typing states (not errors)", () => {
  it('treats "" as empty', () => {
    expect(parseAreaInput("")).toEqual({ ok: false, reason: "empty" });
  });

  it('treats whitespace-only as empty', () => {
    expect(parseAreaInput("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it('treats "." as empty', () => {
    expect(parseAreaInput(".")).toEqual({ ok: false, reason: "empty" });
  });

  it('treats "-" as empty (minus typed, no digits yet)', () => {
    expect(parseAreaInput("-")).toEqual({ ok: false, reason: "empty" });
  });

  it('treats "5." as empty (mid-decimal typing)', () => {
    expect(parseAreaInput("5.")).toEqual({ ok: false, reason: "empty" });
  });
});

describe("parseAreaInput — invalid numbers", () => {
  it('rejects "abc"', () => {
    expect(parseAreaInput("abc")).toEqual({ ok: false, reason: "not-a-number" });
  });

  it('rejects "1.2.3"', () => {
    expect(parseAreaInput("1.2.3")).toEqual({ ok: false, reason: "not-a-number" });
  });

  it('rejects "--5"', () => {
    expect(parseAreaInput("--5")).toEqual({ ok: false, reason: "not-a-number" });
  });

  it('rejects "1,234" (grouping separators are not valid input)', () => {
    expect(parseAreaInput("1,234")).toEqual({ ok: false, reason: "not-a-number" });
  });

  it('rejects "5-"', () => {
    expect(parseAreaInput("5-")).toEqual({ ok: false, reason: "not-a-number" });
  });

  it('rejects "1e" (dangling exponent)', () => {
    expect(parseAreaInput("1e")).toEqual({ ok: false, reason: "not-a-number" });
  });
});

describe("parseAreaInput — negative values", () => {
  it('rejects "-5" as negative', () => {
    expect(parseAreaInput("-5")).toEqual({ ok: false, reason: "negative" });
  });

  it('rejects "-0.5" as negative', () => {
    expect(parseAreaInput("-0.5")).toEqual({ ok: false, reason: "negative" });
  });

  it('rejects "  -3  " (trimmed) as negative', () => {
    expect(parseAreaInput("  -3  ")).toEqual({ ok: false, reason: "negative" });
  });
});

describe("parseAreaInput — overflow", () => {
  it('rejects "1e400" as overflow', () => {
    expect(parseAreaInput("1e400")).toEqual({ ok: false, reason: "overflow" });
  });

  it('rejects "1e309" as overflow', () => {
    expect(parseAreaInput("1e309")).toEqual({ ok: false, reason: "overflow" });
  });

  it('rejects a 400-digit literal as overflow', () => {
    expect(parseAreaInput("9".repeat(400))).toEqual({ ok: false, reason: "overflow" });
  });
});

describe("parseAreaInput — valid inputs", () => {
  it('parses "  42  " with surrounding whitespace', () => {
    expect(parseAreaInput("  42  ")).toEqual({ ok: true, value: 42 });
  });

  it('parses "1e3" as 1000', () => {
    expect(parseAreaInput("1e3")).toEqual({ ok: true, value: 1000 });
  });

  it('parses "2.5e2" as 250', () => {
    expect(parseAreaInput("2.5e2")).toEqual({ ok: true, value: 250 });
  });

  it('parses "0" as zero (valid — 0 katha = 0)', () => {
    expect(parseAreaInput("0")).toEqual({ ok: true, value: 0 });
  });

  it('parses "0.000001" as 1e-6', () => {
    expect(parseAreaInput("0.000001")).toEqual({ ok: true, value: 1e-6 });
  });

  it('parses "3.25" as a fractional katha value', () => {
    expect(parseAreaInput("3.25")).toEqual({ ok: true, value: 3.25 });
  });

  it("never produces NaN or Infinity for ok results", () => {
    for (const raw of ["0", "42", "3.25", "1e3", "1e300", ".5", "123456789"]) {
      const outcome = parseAreaInput(raw);
      if (outcome.ok) {
        expect(Number.isFinite(outcome.value)).toBe(true);
      }
    }
  });
});
