/**
 * Responsive + caption assertions — MASTERPLAN §8 (layout v3) and §11 (captions).
 * Verifies the compiled class contract of the post-2026-09-26 layout:
 * - the value input and the unit selects each own a full-width row, so a long
 *   result can never be squeezed into a one-character-per-line wrap
 * - the result value row uses `min-h` (grows) and a size ladder by length
 * - captions show the *other* language in each mode
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

/** The result value row (the div wrapping the <output>). */
function valueRow(): HTMLElement {
  const status = screen.getByRole("status") as HTMLElement;
  const row = status.closest("div.min-h-12");
  if (!row) throw new Error("result value row not found");
  return row as HTMLElement;
}

describe("responsive converter card (layout v3)", () => {
  it("value input and unit selects each own a full-width row (no squeeze)", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    const fromSelect = screen.getByLabelText(/যে একক থেকে/) as HTMLSelectElement;
    const toSelect = screen.getByLabelText(/যে এককে/) as HTMLSelectElement;

    expect(input.className).toContain("w-full");
    expect(fromSelect.className).toContain("w-full");
    expect(toSelect.className).toContain("w-full");
  });

  it("unit pair row pairs the selects around the swap button at ≥520px", () => {
    render(<App />);
    const swap = screen.getByRole("button", { name: /অদল-বদল/ });
    const pairRow = swap.parentElement as HTMLElement;
    expect(pairRow.className).toContain("flex-col");
    expect(pairRow.className).toContain("min-[520px]:grid");
    expect(pairRow.className).toContain(
      "min-[520px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
    );
  });

  it("result value row is full width and grows instead of clipping", () => {
    render(<App />);
    const row = valueRow();
    expect(row.className).toContain("w-full");
    expect(row.className).toContain("min-h-12");
    // A fixed height on this row is exactly what clipped values before.
    expect(row.className).not.toMatch(/(?<![\w-])h-12(?![\w-])/);
    // And the value element itself never truncates.
    const status = screen.getByRole("status") as HTMLElement;
    expect(status.className).not.toContain("truncate");
    expect(status.className).toContain("break-words");
  });

  it("input keeps the shared control height", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    expect(input.className).toContain("h-16");
  });

  it("swap button stays tappable (44px) in the stacked layout", () => {
    render(<App />);
    const swap = screen.getByRole("button", { name: /অদল-বদল/ }) as HTMLButtonElement;
    expect(swap.className).toContain("h-11");
    expect(swap.className).toContain("w-11");
  });
});

describe("result value size ladder (production overflow bug)", () => {
  it("production case: 12345 katha → 20,404.96 decimal uses the hero size", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12345" } });
    const status = screen.getByRole("status") as HTMLElement;
    expect(status.textContent).toContain("20,404.96");
    expect(valueRow().className).toContain("min-h-12");
    expect(status.className).toContain("text-4xl");
  });

  it("screenshot case: 12345 katha → 825,759.38 sq meters steps down one size", () => {
    render(<App />);
    const toSelect = screen.getByLabelText(/যে এককে/) as HTMLSelectElement;
    fireEvent.change(toSelect, { target: { value: "sqm" } });
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12345" } });
    const status = screen.getByRole("status") as HTMLElement;
    expect(status.textContent).toContain("825,759.38");
    expect(status.className).toContain("text-3xl");
    // The ≈ square-feet chip is present with the current-language unit name.
    expect(screen.getByText(/≈ 8,888,400/)).toBeTruthy();
  });

  it("very long values keep stepping down instead of wrapping", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "3141592653" } });
    const status = screen.getByRole("status") as HTMLElement;
    expect(status.textContent).toContain("5,192,715,128.93");
    expect(status.className).toContain("text-xl");

    fireEvent.change(input, { target: { value: "1000000000000" } });
    expect(status.textContent).toContain("1,652,892,561,983.47");
    expect(status.className).toContain("text-lg");
  });

  it("short results keep the largest hero size", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5" } });
    expect((screen.getByRole("status") as HTMLElement).className).toContain("text-4xl");
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
