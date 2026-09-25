/**
 * Shareable-URL state tests — MASTERPLAN §10.
 * history/location are stubbed (Node env, no jsdom dependency needed).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readStateFromUrl, buildSearch, createUrlWriter, DEFAULT_FROM, DEFAULT_TO } from "../lib/share.ts";

describe("readStateFromUrl", () => {
  it("returns defaults and hasParams=false for empty search", () => {
    expect(readStateFromUrl("")).toEqual({
      from: DEFAULT_FROM,
      to: DEFAULT_TO,
      value: "",
      hasParams: false,
    });
  });

  it("parses valid params", () => {
    const state = readStateFromUrl("?from=katha&to=decimal&value=5");
    expect(state.from).toBe("katha");
    expect(state.to).toBe("decimal");
    expect(state.value).toBe("5");
    expect(state.hasParams).toBe(true);
  });

  it("is case-insensitive on unit ids", () => {
    expect(readStateFromUrl("?from=KATHA&to=ACRE").from).toBe("katha");
    expect(readStateFromUrl("?from=KATHA&to=ACRE").to).toBe("acre");
  });

  it("falls back per-param for invalid units", () => {
    const state = readStateFromUrl("?from=bogus&to=acre&value=2");
    expect(state.from).toBe(DEFAULT_FROM);
    expect(state.to).toBe("acre");
    expect(state.value).toBe("2");
  });

  it("ignores invalid value but keeps valid unit params", () => {
    const state = readStateFromUrl("?from=acre&to=katha&value=-9");
    expect(state.from).toBe("acre");
    expect(state.to).toBe("katha");
    expect(state.value).toBe("");
  });

  it("ignores garbage without crashing", () => {
    expect(() => readStateFromUrl("?value=<script>alert(1)</script>")).not.toThrow();
    expect(readStateFromUrl("?value=<script>alert(1)</script>").value).toBe("");
  });

  it("handles 2 acre → 121 katha round data", () => {
    const state = readStateFromUrl("?from=acre&to=katha&value=2");
    expect(state.value).toBe("2");
    expect(state.from).toBe("acre");
    expect(state.to).toBe("katha");
  });
});

describe("buildSearch", () => {
  it("builds from/to/value params", () => {
    expect(buildSearch("katha", "decimal", "5")).toBe("from=katha&to=decimal&value=5");
  });

  it("omits value when empty", () => {
    expect(buildSearch("katha", "decimal", "")).toBe("from=katha&to=decimal");
  });

  it("omits value when invalid (negative)", () => {
    expect(buildSearch("katha", "decimal", "-4")).toBe("from=katha&to=decimal");
  });
});

describe("createUrlWriter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function stubBrowserUrl(pathname: string) {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("location", { pathname });
    return replaceState;
  }

  it("debounces multiple calls into one replaceState", () => {
    const replaceState = stubBrowserUrl("/");
    const write = createUrlWriter();
    write("from=katha&to=decimal&value=1");
    write("from=katha&to=decimal&value=12");
    write("from=katha&to=decimal&value=123");
    expect(replaceState).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(String(replaceState.mock.calls[0][2])).toContain("value=123");
  });

  it("writes bare pathname when search is empty", () => {
    const replaceState = stubBrowserUrl("/some/path");
    const write = createUrlWriter();
    write("");
    vi.advanceTimersByTime(600);
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState.mock.calls[0][2]).toBe("/some/path");
  });

  it("replaceState failures are swallowed (app works without it)", () => {
    vi.stubGlobal("history", {
      replaceState: () => {
        throw new Error("blocked");
      },
    });
    vi.stubGlobal("location", { pathname: "/" });
    const write = createUrlWriter();
    expect(() => {
      write("from=katha&to=decimal&value=1");
      vi.advanceTimersByTime(600);
    }).not.toThrow();
  });
});
