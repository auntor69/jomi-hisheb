/**
 * Input validation — MASTERPLAN §3 (ParseOutcome) and §16 (error matrix).
 * Separate from conversion: the engine takes numbers; parsing/validation
 * happens once at the input boundary and never feeds formatted strings back.
 */

export type ParseErrorReason = "empty" | "not-a-number" | "negative" | "overflow";

export type ParseOutcome =
  | { ok: true; value: number }
  | { ok: false; reason: ParseErrorReason };

/** Values whose absolute magnitude is beyond this are treated as overflow. */
const OVERFLOW_LIMIT = Number.MAX_VALUE * 0.5;

/**
 * Numeric input grammar (MASTERPLAN §16):
 *   - optional leading '-' (rejected as `negative` by the semantic check below)
 *   - digits with optional single '.' anywhere except alone (".", "5." accepted as still-typing)
 *   - optional scientific exponent (e.g. "1e3") — accepted, engine handles magnitude
 */
const NUMERIC_RE = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Parse raw user input into a validated, finite, non-negative number.
 *
 * Rules (MASTERPLAN §16):
 *   "" / whitespace-only / "5." / "."  → empty (still typing — placeholder, not an error)
 *   "abc", "1.2.3", "--5"              → not-a-number
 *   "-5", "-0.5"                       → negative
 *   "1e400" (overflowing)              → overflow
 *   "  42  "                           → 42
 *   "1e3"                              → 1000
 */
export function parseAreaInput(raw: string): ParseOutcome {
  const trimmed = raw.trim();

  // Empty or "not finished typing" states.
  if (trimmed === "" || trimmed === "." || trimmed === "-") {
    return { ok: false, reason: "empty" };
  }
  // A trailing "." means the user is mid-decimal ("5."), still typing.
  if (trimmed.endsWith(".")) {
    return { ok: false, reason: "empty" };
  }

  if (!NUMERIC_RE.test(trimmed)) {
    return { ok: false, reason: "not-a-number" };
  }

  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    return { ok: false, reason: "not-a-number" };
  }
  if (value < 0) {
    return { ok: false, reason: "negative" };
  }
  if (!Number.isFinite(value) || value > OVERFLOW_LIMIT) {
    return { ok: false, reason: "overflow" };
  }

  return { ok: true, value };
}
