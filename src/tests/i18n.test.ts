/**
 * i18n contract tests — MASTERPLAN §11.
 */
import { describe, it, expect } from "vitest";
import { STRINGS, type StringKey } from "../lib/i18n.ts";

const enKeys = Object.keys(STRINGS.en).sort();
const bnKeys = Object.keys(STRINGS.bn).sort();

describe("i18n string maps", () => {
  it("EN and BN expose exactly the same keys", () => {
    expect(bnKeys).toEqual(enKeys);
  });

  it("every key has a non-empty string in both languages", () => {
    for (const key of enKeys as StringKey[]) {
      expect(typeof STRINGS.en[key]).toBe("string");
      expect((STRINGS.en[key] as string).length).toBeGreaterThan(0);
      expect(typeof STRINGS.bn[key]).toBe("string");
      expect((STRINGS.bn[key] as string).length).toBeGreaterThan(0);
    }
  });

  it("error strings are fully translated in BN (no ASCII-English leakage)", () => {
    for (const key of ["errNegative", "errNotANumber", "errOverflow"] as StringKey[]) {
      expect(/[A-Za-z]{3,}/.test(STRINGS.bn[key] as string)).toBe(false);
    }
  });

  it("swap/copy labels are fully translated in BN", () => {
    for (const key of ["swap", "copy", "copied", "copyFailed"] as StringKey[]) {
      expect(/[A-Za-z]{3,}/.test(STRINGS.bn[key] as string)).toBe(false);
    }
  });

  it("brand names stay identical across languages (they are proper nouns)", () => {
    expect(STRINGS.en.brandEn).toBe(STRINGS.bn.brandEn);
    expect(STRINGS.en.brandBn).toBe(STRINGS.bn.brandBn);
  });
});
