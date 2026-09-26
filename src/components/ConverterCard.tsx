/**
 * ConverterCard — the visual centerpiece (MASTERPLAN §6).
 * Instant per-keystroke conversion (no debounce on math), swap preserves
 * input, reserved error line prevents layout shift, copy with feedback,
 * debounced URL sync.
 *
 * Layout notes (post-overhaul):
 * - Result box uses `min-h-16` (not fixed `h-16`): long values like
 *   "4,059.5" at very narrow widths GROW the box instead of spilling over
 *   the caption below (screenshot bug fix). Text steps down to text-2xl for
 *   long outputs; `break-words` + `min-w-0` stay as the wrapping escape hatch.
 * - Rows keep the two-column grid `grid-cols-[minmax(0,1fr)_auto]` with the
 *   380px stacking fallback; input, selects, and the result box still share
 *   one visual height when the result fits on one line.
 * - The result box is the hero: primary-tinted border/background, "You get"
 *   label above, and an ≈-equivalents chip row (sq ft + katha) underneath.
 * - Copy sits inside the result box, right-aligned; a clear (×) button sits
 *   inside the input box and appears only when there is something to clear.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, Copy, AlertCircle, X } from "lucide-react";
import { convert } from "../lib/convert.ts";
import { formatNumber, formatCopyText } from "../lib/format.ts";
import { parseAreaInput, type ParseErrorReason } from "../lib/validate.ts";
import { UNITS } from "../data/units.ts";
import type { UnitId } from "../data/units.ts";
import { useLang } from "./LangContext.tsx";
import UnitSelect from "./UnitSelect.tsx";

const ERROR_KEYS: Record<ParseErrorReason, "errNegative" | "errNotANumber" | "errOverflow" | null> = {
  "empty": null,
  "not-a-number": "errNotANumber",
  "negative": "errNegative",
  "overflow": "errOverflow",
};

const COPY_RESET_MS = 1500;
/** Results longer than this step down one size so they stay on one line. */
const LONG_RESULT_LEN = 7;

interface ConverterCardProps {
  /** Fully controlled by App: units + input live there so quick chips,
   *  all-units cards and shareable-URL params drive one coherent state. */
  input: string;
  onInputChange: (value: string) => void;
  from: UnitId;
  to: UnitId;
  onUnitsChange: (from: UnitId, to: UnitId) => void;
}

export default function ConverterCard({
  input,
  onInputChange,
  from,
  to,
  onUnitsChange,
}: ConverterCardProps) {
  const { t } = useLang();

  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const parsed = parseAreaInput(input);
  const errorKey = parsed.ok ? null : ERROR_KEYS[parsed.reason];

  // Instant conversion — plain arithmetic in render, no memoization needed.
  const result = parsed.ok ? convert(parsed.value, from, to) : null;
  const resultText = result !== null ? formatNumber(result) : null;

  const hasInput = input.trim() !== "";

  const swap = () => {
    onUnitsChange(to, from);
    // Input preserved by design (MASTERPLAN §6 interaction rule 3).
  };

  const copyResult = async () => {
    if (result === null || resultText === null) return;
    const text = formatCopyText(parsed.ok ? parsed.value : 0, from, to, result);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("clipboard unavailable");
      }
      setCopied("ok");
    } catch {
      // Legacy fallback for non-secure contexts / older browsers.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied("ok");
      } catch {
        setCopied("fail");
      }
    }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied("idle"), COPY_RESET_MS);
  };

  const fromUnit = UNITS[from];
  const toUnit = UNITS[to];

  /** Caption shows the language the select does NOT (select shows current UI
   *  language first) — keeps the card bilingual in both modes (MASTERPLAN §11). */
  const captionOf = (unit: (typeof UNITS)[UnitId]) => (t("langLabel") === "ভাষা" ? unit.en : unit.bn);

  /** ≈-equivalents: the two most useful reference scales for any result. */
  const chips: Array<{ id: UnitId; text: string }> = [];
  if (result !== null) {
    const sqft = formatNumber(convert(result, to, "sqft"));
    const katha = formatNumber(convert(result, to, "katha"));
    if (to !== "sqft") chips.push({ id: "sqft", text: `≈ ${sqft} ${captionOf(UNITS.sqft)}` });
    if (from !== "katha" && to !== "katha") chips.push({ id: "katha", text: `≈ ${katha} ${captionOf(UNITS.katha)}` });
  }

  // Long results step down a size instead of wrapping into the caption.
  const resultSizeClass =
    resultText !== null && resultText.length > LONG_RESULT_LEN ? "text-2xl" : "text-3xl sm:text-4xl";

  return (
    <section
      aria-labelledby="converter-heading"
      className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
    >
      <h2 id="converter-heading" className="sr-only">
        {t("resultLabel")} — {t("inputLabel")}
      </h2>

      {/* Source row — value field flexes, select takes only its content width.
          Stacks below 380px (documented responsive fallback, MASTERPLAN §8). */}
      <div className="flex flex-col items-stretch gap-2 min-[380px]:grid min-[380px]:grid-cols-[minmax(0,1fr)_auto] min-[380px]:items-center min-[380px]:gap-3">
        <div className="relative min-w-0">
          <label htmlFor="area-input" className="sr-only">
            {t("inputLabel")}
          </label>
          <input
            id="area-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            aria-invalid={errorKey !== null}
            aria-describedby={errorKey !== null ? "input-error" : undefined}
            className="h-16 w-full min-w-0 rounded-lg border border-border bg-card pr-12 pl-4 text-3xl font-semibold tabular-nums text-card-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          {hasInput && (
            <button
              type="button"
              onClick={() => onInputChange("")}
              aria-label={t("clearInput")}
              className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <UnitSelect
          id="from-unit"
          label={t("fromUnitLabel")}
          value={from}
          onChange={(u) => onUnitsChange(u, to)}
        />
      </div>
      <p className="mt-1.5 min-h-5 text-xs text-muted-foreground">{captionOf(fromUnit)}</p>

      {/* Swap button */}
      <div className="relative flex justify-center py-1">
        <div className="absolute inset-x-16 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden="true" />
        <button
          type="button"
          onClick={swap}
          aria-label={t("swap")}
          className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-card-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
        >
          <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Result row — same grid as the source row so both align */}
      <div className="flex flex-col items-stretch gap-2 min-[380px]:grid min-[380px]:grid-cols-[minmax(0,1fr)_auto] min-[380px]:items-center min-[380px]:gap-3">
        {/* <output> below has an implicit role="status" — keep a single live region
            so screen readers announce the result exactly once. The box uses
            min-h (not h) so a long result grows the box instead of clipping. */}
        <div className="min-w-0" aria-live="polite">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("youGet")}
          </p>
          <div
            className={`flex min-h-16 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/[0.04] px-4 font-semibold tabular-nums ${resultSizeClass} ${
              resultText !== null ? "text-primary" : "text-muted-foreground/50"
            }`}
          >
            <span aria-hidden="true" className="sr-only">
              {t("resultLabel")}:{" "}
            </span>
            <output
              htmlFor="area-input"
              className="min-w-0 break-words leading-snug"
            >
              {resultText ?? t("resultPlaceholder")}
            </output>
            <button
              type="button"
              onClick={copyResult}
              disabled={resultText === null}
              aria-label={
                copied === "ok" ? t("copied") : copied === "fail" ? t("copyFailed") : t("copy")
              }
              className="-mr-1 ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "ok" ? (
                <Check className="h-5 w-5 text-primary" aria-hidden="true" />
              ) : (
                <Copy className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <UnitSelect
          id="to-unit"
          label={t("toUnitLabel")}
          value={to}
          onChange={(u) => onUnitsChange(from, u)}
        />
      </div>
      <div className="mt-1.5 flex min-h-5 flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <p className="text-xs text-muted-foreground">{captionOf(toUnit)}</p>
        {copied !== "idle" && (
          <p
            className="text-xs font-medium text-primary"
            aria-hidden="true"
          >
            {copied === "ok" ? t("copied") : t("copyFailed")}
          </p>
        )}
      </div>

      {/* ≈-equivalent chips — quick reference scales for the current result */}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex h-7 items-center rounded-full border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground"
            >
              {chip.text}
            </span>
          ))}
        </div>
      )}

      {/* Reserved 20px error line — no layout shift (MASTERPLAN §6) */}
      <p
        id="input-error"
        role="alert"
        className={`mt-1 flex min-h-5 items-center gap-1 text-sm text-destructive ${
          errorKey === null ? "invisible" : ""
        }`}
      >
        {errorKey !== null && (
          <>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {t(errorKey)}
          </>
        )}
      </p>
    </section>
  );
}
