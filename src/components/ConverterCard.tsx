/**
 * ConverterCard — the visual centerpiece (MASTERPLAN §6).
 * Instant per-keystroke conversion (no debounce on math), swap preserves
 * input, reserved error line prevents layout shift, copy with feedback,
 * debounced URL sync.
 *
 * Layout v3 (narrow-width bug fix, 2026-09-26): the value and the result each
 * own a FULL-WIDTH row, so a long result can never be squeezed into the
 * one-character-per-line wrap seen on production phones. The result is a
 * full-width hero card: "You get" label + copy in its header, the value on its
 * own line with a size ladder (text-4xl → text-xl by length), then ≈ sq ft /
 * katha equivalence chips. Unit selects pair up beside the swap button at
 * ≥520px and stack below it on phones.
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

/**
 * Value size ladder. Longer strings step down so the number stays on one line
 * in the full-width result card (the result row itself is `break-words` as the
 * last-resort escape hatch).
 */
function valueSizeClass(text: string | null): string {
  const len = text?.length ?? 0;
  if (len <= 9) return "text-4xl sm:text-5xl"; // 20,404.96
  if (len <= 12) return "text-3xl sm:text-4xl"; // 825,759.38
  if (len <= 15) return "text-2xl sm:text-3xl";
  if (len <= 19) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl"; // 1,652,892,561,983.47
}

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
  const { t, lang } = useLang();

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

  /** Captions show the language the select does NOT (select shows the current
   *  UI language first) — keeps the card bilingual in both modes (§11). */
  const captionOf = (unit: (typeof UNITS)[UnitId]) => (lang === "bn" ? unit.en : unit.bn);
  /** Chips read naturally in the current language. */
  const nameOf = (id: UnitId) => (lang === "bn" ? UNITS[id].bn : UNITS[id].en);

  /** Result-card chips: the target unit (in-place context for the number)
   *  followed by ≈-equivalents — the two most useful reference scales. */
  const chips: Array<{ id: string; text: string; strong?: boolean }> = [
    { id: "target", text: nameOf(to), strong: true },
  ];
  if (result !== null) {
    if (to !== "sqft") {
      chips.push({ id: "sqft", text: `≈ ${formatNumber(convert(result, to, "sqft"))} ${nameOf("sqft")}` });
    }
    if (to !== "katha") {
      chips.push({ id: "katha", text: `≈ ${formatNumber(convert(result, to, "katha"))} ${nameOf("katha")}` });
    }
  }

  return (
    <section
      aria-labelledby="converter-heading"
      className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
    >
      <h2 id="converter-heading" className="sr-only">
        {t("resultLabel")} — {t("inputLabel")}
      </h2>

      {/* Value — full-width row: the input never shares space with a select. */}
      <div>
        <label
          htmlFor="area-input"
          className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {t("inputLabel")}
        </label>
        <div className="relative">
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
            className="h-16 w-full min-w-0 rounded-lg border border-border bg-background pr-12 pl-4 text-3xl font-semibold tabular-nums text-card-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          {hasInput && (
            <button
              type="button"
              onClick={() => onInputChange("")}
              aria-label={t("clearInput")}
              className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Source/target pair — stacks on phones, pairs around the swap button
          at ≥520px where both select labels fit without clipping. */}
      <div className="mt-3 flex flex-col items-stretch gap-1 min-[520px]:grid min-[520px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[520px]:items-start min-[520px]:gap-3">
        <div className="min-w-0">
          <UnitSelect
            id="from-unit"
            label={t("fromUnitLabel")}
            value={from}
            onChange={(u) => onUnitsChange(u, to)}
          />
          <p className="mt-1.5 min-h-5 text-xs text-muted-foreground">{captionOf(fromUnit)}</p>
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label={t("swap")}
          className="mx-auto my-1 flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-border bg-card text-card-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 min-[520px]:mt-6 min-[520px]:mb-0"
        >
          <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <UnitSelect
            id="to-unit"
            label={t("toUnitLabel")}
            value={to}
            onChange={(u) => onUnitsChange(from, u)}
          />
          <p className="mt-1.5 min-h-5 text-xs text-muted-foreground">{captionOf(toUnit)}</p>
        </div>
      </div>

      {/* Result hero card — full card width, so long values can never be
          squeezed into a per-character wrap (production bug, 2026-09-26). */}
      <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("youGet")}
          </p>
          <div className="flex items-center gap-2">
            {copied !== "idle" && (
              <p className="text-xs font-medium text-primary" aria-hidden="true">
                {copied === "ok" ? t("copied") : t("copyFailed")}
              </p>
            )}
            <button
              type="button"
              onClick={copyResult}
              disabled={resultText === null}
              aria-label={
                copied === "ok" ? t("copied") : copied === "fail" ? t("copyFailed") : t("copy")
              }
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "ok" ? (
                <Check className="h-5 w-5 text-primary" aria-hidden="true" />
              ) : (
                <Copy className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {/* <output> carries implicit role="status" — one live region only. */}
        <div className="mt-1 flex min-h-12 w-full min-w-0 items-center">
          <span aria-hidden="true" className="sr-only">
            {t("resultLabel")}:{" "}
          </span>
          <output
            htmlFor="area-input"
            className={`min-w-0 break-words font-bold tabular-nums leading-tight ${valueSizeClass(resultText)} ${
              resultText !== null ? "text-primary" : "text-muted-foreground/50"
            }`}
          >
            {resultText ?? t("resultPlaceholder")}
          </output>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium ${
                chip.strong
                  ? "border-primary/30 bg-card text-primary"
                  : "border-primary/15 bg-card text-muted-foreground"
              }`}
            >
              {chip.text}
            </span>
          ))}
        </div>
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
