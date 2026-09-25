/**
 * ConverterCard — the visual centerpiece (MASTERPLAN §6).
 * Instant per-keystroke conversion (no debounce on math), swap preserves
 * input, reserved error line prevents layout shift, copy with feedback,
 * debounced URL sync.
 *
 * Layout notes (screenshot-critique fix):
 * - Rows use a two-column grid `grid-cols-[minmax(0,1fr)_auto]`: the value
 *   field always gets the flexible share of width and the select takes only
 *   what its content needs. Below 380px rows stack full-width.
 * - Input, output, and selects share one height (h-16) so rows align.
 * - The result never truncates: no `truncate`; `min-w-0` + `break-words`
 *   handle long values gracefully instead of clipping them.
 * - Copy sits inside the result box, right-aligned — integrated, not floating.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, Copy, AlertCircle } from "lucide-react";
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

interface ConverterCardProps {
  /** Fully controlled by App: units + input live there so quick chips and
   *  shareable-URL params drive one coherent state (see App.tsx note). */
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
        <div className="min-w-0">
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
            className="h-16 w-full min-w-0 rounded-lg border border-border bg-card px-4 text-3xl font-semibold tabular-nums text-card-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
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
            so screen readers announce the result exactly once. No `truncate`:
            clipping real results is worse than wrapping them. */}
        <div className="min-w-0" aria-live="polite">
          <span aria-hidden="true" className="sr-only">
            {t("resultLabel")}:{" "}
          </span>
          <div
            className={`flex h-16 w-full min-w-0 items-center justify-between rounded-lg border border-border bg-background px-4 text-3xl font-semibold tabular-nums ${
              resultText !== null ? "text-primary" : "text-muted-foreground/50"
            }`}
          >
            <output
              htmlFor="area-input"
              className="min-w-0 break-words leading-tight"
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
      <div className="mt-1.5 flex min-h-5 items-start justify-between gap-2">
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
