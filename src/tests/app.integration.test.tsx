/**
 * Integration tests — App ↔ ConverterCard ↔ QuickConversions wiring.
 * Confirms shareable-URL units are honored (regression test for the
 * controlled-state refactor) and the language toggle re-labels the UI.
 * Uses @testing-library/react for DOM rendering.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App from "../App.tsx";
import { UNITS } from "../data/units.ts";
import { STRINGS } from "../lib/i18n.ts";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("App integration", () => {
  it("renders title, converter, quick conversions, FAQ, footer in default (BN) state", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByLabelText(/যে একক থেকে/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /অদল-বদল/ })).toBeTruthy();
    expect(screen.getByText("দ্রুত রূপান্তর")).toBeTruthy();
    expect(screen.getByText("সাধারণ জিজ্ঞাসা")).toBeTruthy();
  });

  it("FAQ includes the two-Kani item (6 items total)", () => {
    render(<App />);
    // Open the 6th accordion and check its answer text (summary text is unique).
    fireEvent.click(screen.getByText(STRINGS.bn.faq6q));
    expect(screen.getByText(STRINGS.bn.faq6a)).toBeTruthy();
  });

  it("all-units grid shows every unit converting the live input, tap retargets", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1" } });

    // 1 katha = 720 sq ft, shown live in the grid (label carries both languages).
    const sqftCard = screen.getByRole("button", {
      name: STRINGS.bn.allUnitsAria.replace("{unit}", "বর্গফুট"),
    });
    expect(sqftCard.textContent).toContain("720");

    // Tap the acre card → converter target becomes acre (input preserved).
    const acreCard = screen.getByRole("button", {
      name: STRINGS.bn.allUnitsAria.replace("{unit}", UNITS.acre.bn),
    });
    fireEvent.click(acreCard);
    const toSelect = screen.getByLabelText(/যে এককে/) as HTMLSelectElement;
    expect(toSelect.value).toBe("acre");
    expect((screen.getByLabelText("মান") as HTMLInputElement).value).toBe("1");
    // 1 katha in acre ≈ 0.0165
    expect(screen.getByRole("status").textContent).toContain("0.0165");
  });

  it("result box carries the You-get label and a working clear button", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12" } });

    expect(screen.getByText(STRINGS.bn.youGet)).toBeTruthy();

    const clear = screen.getByRole("button", { name: STRINGS.bn.clearInput });
    fireEvent.click(clear);
    expect((screen.getByLabelText("মান") as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("button", { name: STRINGS.bn.clearInput })).toBeNull();
  });

  it("initializes units AND input from shareable URL (?from=acre&to=katha&value=2)", () => {
    window.history.replaceState(null, "", "/?from=acre&to=katha&value=2");
    render(<App />);

    const fromSelect = screen.getByLabelText("যে একক থেকে") as HTMLSelectElement;
    const toSelect = screen.getByLabelText("যে এককে") as HTMLSelectElement;
    const input = screen.getByLabelText("মান") as HTMLInputElement;

    expect(fromSelect.value).toBe("acre");
    expect(toSelect.value).toBe("katha");
    expect(input.value).toBe("2");

    // 2 acre = 87120 sq ft = 121 katha, formatted with grouping.
    const result = screen.getByRole("status").textContent ?? "";
    expect(result).toContain("121");
  });

  it("computes result live as the user types (5 katha → 8.2645 decimal)", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5" } });
    expect(screen.getByRole("status").textContent).toContain("8.2645");
  });

  it("swap flips units and preserves input", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5" } });

    fireEvent.click(screen.getByRole("button", { name: /অদল-বদল/ }));

    const fromSelect = screen.getByLabelText(/যে একক থেকে/) as HTMLSelectElement;
    const toSelect = screen.getByLabelText(/যে এককে/) as HTMLSelectElement;
    expect(fromSelect.value).toBe("decimal");
    expect(toSelect.value).toBe("katha");
    expect((input as HTMLInputElement).value).toBe("5");
    // 5 decimal in katha = 3.0264…
    expect(screen.getByRole("status").textContent).toContain("3.025");
  });

  it("quick chip sets units and preserves the typed value", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "7" } });

    const chipLabel = STRINGS.bn.quickAria
      .replace("{from}", UNITS.bigha.bn)
      .replace("{to}", UNITS.katha.bn);
    fireEvent.click(screen.getByRole("button", { name: chipLabel }));

    const fromSelect = screen.getByLabelText(/যে একক থেকে/) as HTMLSelectElement;
    const toSelect = screen.getByLabelText(/যে এককে/) as HTMLSelectElement;
    expect(fromSelect.value).toBe("bigha");
    expect(toSelect.value).toBe("katha");
    expect((input as HTMLInputElement).value).toBe("7");
  });

  it("language toggle switches labels and unit-name order", () => {
    render(<App />);
    // Switch to English.
    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByLabelText(/From unit/)).toBeTruthy();
    expect(screen.getByText("Quick conversions")).toBeTruthy();

    const fromSelect = screen.getByLabelText(/From unit/) as HTMLSelectElement;
    // Options show the current UI language only (captions carry the other one).
    const firstOption = fromSelect.options[0]?.textContent ?? "";
    expect(firstOption).toBe("Square Feet");

    // Captions swap: EN mode shows the Bengali name under the row.
    expect(screen.getByText(UNITS.katha.bn, { selector: "p" })).toBeTruthy();
  });

  it("default BN mode shows English caption under the source row", () => {
    render(<App />);
    expect(screen.getByText(UNITS.katha.en, { selector: "p" })).toBeTruthy();
  });

  it("negative input shows a polite error, not a crash", () => {
    render(<App />);
    const input = screen.getByLabelText("মান") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "-5" } });
    expect(screen.getByRole("alert").textContent).toContain("ঋণাত্মক");
    expect((input as HTMLInputElement).getAttribute("aria-invalid")).toBe("true");
  });
});
