/**
 * Number formatting tests — MASTERPLAN §4.
 */
import { describe, it, expect } from "vitest";
import { formatNumber, formatCopyText } from "../lib/format.ts";

describe("formatNumber", () => {
  it("strips trailing zeros", () => {
    expect(formatNumber(8.26)).toBe("8.26");
    expect(formatNumber(5)).toBe("5");
    expect(formatNumber(0.5)).toBe("0.5");
  });

  it("groups thousands", () => {
    expect(formatNumber(14400)).toBe("14,400");
    expect(formatNumber(43560)).toBe("43,560");
    expect(formatNumber(1234567.89)).toBe("1,234,567.89");
  });

  it("keeps up to 4 decimals for values ≥ 1 and < 1000", () => {
    // 1 katha in decimal: 720/435.6 = 1.652894…
    expect(formatNumber(720 / 435.6)).toBe("1.6529");
  });

  it("keeps up to 2 decimals for values ≥ 1000", () => {
    expect(formatNumber(14400.456)).toBe("14,400.46");
  });

  it("keeps up to 6 decimals for values < 1", () => {
    // 1 sq ft in katha: 1/720 = 0.001388…
    expect(formatNumber(1 / 720)).toBe("0.001389");
  });

  it("formats zero without sign artifacts", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("returns empty string for non-finite values", () => {
    expect(formatNumber(Number.NaN)).toBe("");
    expect(formatNumber(Infinity)).toBe("");
    expect(formatNumber(-Infinity)).toBe("");
  });

  it("formats very large values via exponential fallback without crashing", () => {
    const out = formatNumber(1e21);
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("formatCopyText", () => {
  it('formats "5 Katha = 8.26 Decimal"', () => {
    const result = (5 * 720) / 435.6;
    expect(formatCopyText(5, "katha", "decimal", result)).toBe(
      `5 Katha = ${formatNumber(result)} Decimal`,
    );
  });

  it("matches on-screen display precision for grouped numbers", () => {
    const result = 14400 / 43560; // 0.330579…
    expect(formatCopyText(1, "bigha", "acre", result)).toBe(
      `1 Bigha = ${formatNumber(result)} Acre`,
    );
  });

  it("uses unit names, not symbols or Bengali, in copy text", () => {
    // Full precision internally; display/copy shows 4 decimals for values ≥ 1 (MASTERPLAN §4).
    expect(formatCopyText(1, "sqm", "sqft", 10.7639104167)).toBe(
      "1 Square Meters = 10.7639 Square Feet",
    );
  });
});
