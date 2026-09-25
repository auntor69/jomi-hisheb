/**
 * Responsive + caption assertions — MASTERPLAN §8 (stacking fallback) and §11 (captions).
 * Verifies the compiled class contract: rows are grid side-by-side ≥380px,
 * stack below it, the result never truncates (screenshot-critique fix), and
 * unit captions show the *other* language in each mode.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App from "../App.tsx";
import { UNITS } from "../data/units.ts";
import { STRINGS as STRINGS_HELPER } from "../lib/i18n.ts";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

function sourceRowClass(): string {
  const input = screen.getByLabelText("মান") as HTMLInputElement;
  // The row is the input's flex-column/flex-row container.
  return input.closest("div.flex")?.className ?? "";
}

describe("responsive converter card", () => {
  it("rows use the 380px stacking contract (column below, grid above)", () => {
    render(<App />);
    const cls = sourceRowClass();
    expect(cls).toContain("flex-col");
    expect(cls).toContain("min-[380px]:grid");
    expect(cls).toContain("min-[380px]:grid-cols-[minmax(0,1fr)_auto]");
  });

  it("both rows (source and result) carry the stacking contract", () => {
    render(<App />);
    const rows = document.querySelectorAll("div.flex.flex-col");
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it("result output never truncates (screenshot-critique regression guard)", () => {
    render(<App />);
    const status = screen.getByRole("status") as HTMLElement;
    // The value-bearing element must not carry the `truncate` class.
    expect(status.className).not.toContain("truncate");
    // The whole result box is kept wide (full width of its grid column).
    const box = status.closest("div.h-16");
    expect(box?.className).toContain("w-full");
  });

  it("input and result boxes share one height for row alignment", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    const box = (screen.getByRole("status") as HTMLElement).closest("div.h-16");
    expect(input.className).toContain("h-16");
    expect(box?.className).toContain("h-16");
  });

  it("swap button stays tappable (44px) in stacked layout", () => {
    render(<App />);
    const swap = screen.getByRole("button", { name: /অদল-বদল/ }) as HTMLButtonElement;
    expect(swap.className).toContain("h-11");
    expect(swap.className).toContain("w-11");
  });
});

describe("bilingual captions (i18n fix verification)", () => {
  it("BN mode shows English caption under the source row", () => {
    render(<App />);
    expect(screen.getByText(UNITS.katha.en)).toBeTruthy();
  });

  it("EN mode shows Bengali caption under the source row", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByText(UNITS.katha.bn)).toBeTruthy();
  });

  it("captions follow the selected units, not just the default", () => {
    render(<App />);
    const chipLabel = STRINGS_HELPER.bn.quickAria
      .replace("{from}", UNITS.acre.bn)
      .replace("{to}", UNITS.decimal.bn);
    fireEvent.click(screen.getByRole("button", { name: chipLabel }));
    expect(screen.getByText(UNITS.acre.en)).toBeTruthy();
    expect(screen.getByText(UNITS.decimal.en)).toBeTruthy();
  });
});
