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
    // The result box keeps the full width of its grid column and grows in
    // height (min-h) instead of clipping long values.
    const box = status.closest("div.min-h-16");
    expect(box?.className).toContain("w-full");
    expect(box?.className).toContain("min-h-16");
  });

  it("input keeps the shared control height; result box can grow (overflow fix)", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    const box = (screen.getByRole("status") as HTMLElement).closest("div.min-h-16");
    expect(input.className).toContain("h-16");
    expect(box?.className).toContain("min-h-16");
    // The old fixed h-16 on the result box is exactly what clipped values —
    // guard against it coming back.
    expect(box?.className).not.toContain("\bh-16");
  });

  it("swap button stays tappable (44px) in stacked layout", () => {
    render(<App />);
    const swap = screen.getByRole("button", { name: /অদল-বদল/ }) as HTMLButtonElement;
    expect(swap.className).toContain("h-11");
    expect(swap.className).toContain("w-11");
  });
});

describe("bilingual captions (i18n fix verification)", () => {
  // Captions live in <p> elements; the all-units grid also shows unit names
  // inside its cards (<span>), so scope the query to paragraphs.
  it("BN mode shows English caption under the source row", () => {
    render(<App />);
    expect(screen.getByText(UNITS.katha.en, { selector: "p" })).toBeTruthy();
  });

  it("EN mode shows Bengali caption under the source row", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByText(UNITS.katha.bn, { selector: "p" })).toBeTruthy();
  });

  it("captions follow the selected units, not just the default", () => {
    render(<App />);
    const chipLabel = STRINGS_HELPER.bn.quickAria
      .replace("{from}", UNITS.acre.bn)
      .replace("{to}", UNITS.decimal.bn);
    fireEvent.click(screen.getByRole("button", { name: chipLabel }));
    expect(screen.getByText(UNITS.acre.en, { selector: "p" })).toBeTruthy();
    expect(screen.getByText(UNITS.decimal.en, { selector: "p" })).toBeTruthy();
  });
});

describe("long-result overflow fix (narrow-width screenshot bug)", () => {
  it("a long result keeps text-primary and never carries fixed h-16 clipping", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    // 12345 katha → 20,404.96 decimal — the exact input from the bug screenshot.
    fireEvent.change(input, { target: { value: "12345" } });
    const status = screen.getByRole("status") as HTMLElement;
    expect(status.textContent).toContain("20,404.96");
    const box = status.closest("div.min-h-16") as HTMLElement;
    expect(box.className).toContain("min-h-16");
    // The OLD fixed `h-16` (exactly what clipped values) must not come back —
    // match h-16 NOT preceded by "min-" and NOT part of another class.
    expect(box.className).not.toMatch(/(?<![\w-])h-16(?![\w-])/);
    // Long results step down the font size so they fit on one line.
    expect(box.className).toContain("text-2xl");
  });

  it("short results keep the large hero size", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5" } });
    const status = screen.getByRole("status") as HTMLElement;
    expect((status.closest("div.min-h-16") as HTMLElement).className).toContain("text-3xl");
  });
});
