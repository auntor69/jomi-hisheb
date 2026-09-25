/**
 * Shareable URL state — MASTERPLAN §10.
 * ?from=katha&to=decimal&value=5
 * Read once on mount; each param validated independently; invalid → default.
 * Writes are debounced (500ms) history.replaceState — never pushState.
 */
import { isUnitId, type UnitId } from "../data/units.ts";
import { parseAreaInput } from "./validate.ts";

export const DEFAULT_FROM: UnitId = "katha";
export const DEFAULT_TO: UnitId = "decimal";

export interface ConverterUrlState {
  from: UnitId;
  to: UnitId;
  /** Raw input string ("" when absent/invalid) so typing states are preserved. */
  value: string;
  /** True when any valid param was present (used to keep non-default URLs). */
  hasParams: boolean;
}

/** Read and validate URL params. Never throws; each param falls back independently. */
export function readStateFromUrl(search: string): ConverterUrlState {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return { from: DEFAULT_FROM, to: DEFAULT_TO, value: "", hasParams: false };
  }

  const fromRaw = params.get("from") ?? "";
  const toRaw = params.get("to") ?? "";
  const valueRaw = params.get("value") ?? "";

  const from = isUnitId(fromRaw) ? (fromRaw.toLowerCase() as UnitId) : DEFAULT_FROM;
  const to = isUnitId(toRaw) ? (toRaw.toLowerCase() as UnitId) : DEFAULT_TO;
  const hasParams = params.toString() !== "";

  // Only accept values that parse as valid non-negative numbers; otherwise "" (placeholder).
  const parsed = parseAreaInput(valueRaw);
  const value = parsed.ok ? valueRaw.trim() : "";

  return { from, to, value, hasParams };
}

/** Build the query string for the given state; omits value when empty. */
export function buildSearch(from: UnitId, to: UnitId, value: string): string {
  const params = new URLSearchParams();
  params.set("from", from);
  params.set("to", to);
  const parsed = parseAreaInput(value);
  if (parsed.ok) params.set("value", value.trim());
  return params.toString();
}

/** Debounced URL writer (MASTERPLAN §10: 500ms, replaceState only). */
export function createUrlWriter(): (search: string) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (search: string) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      const url = search === "" ? location.pathname : `${location.pathname}?${search}`;
      try {
        history.replaceState(null, "", url);
      } catch {
        // replaceState can fail in exotic embeds; the app works without it.
      }
    }, 500);
  };
}
