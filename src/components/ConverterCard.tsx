/**
 * ConverterCard — the visual centerpiece (MASTERPLAN §6).
 * Instant per-keystroke conversion (no debounce on math), swap preserves
 * input, reserved error line prevents layout shift, copy with feedback,
 * debounced URL sync.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Check, Copy, AlertCircle } from "lucide-react";
import { convert } from "../lib/convert.ts";
import { formatNumber, formatCopyText } from "../lib/format.ts";
import { parseAreaInput, type ParseErrorReason } from "../lib/validate.ts";
import { UNITS } from "../data/units.ts";
import {
  buildSearch,
  createUrlWriter,
  DEFAULT_FROM,
  DEFAULT_TO,
  readStateFromUrl,
} from "../lib/share.ts";
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
  from: UnitId;
  to: UnitId;
  /** Controlled units: App owns them so quick-conversion chips can set them too.
   *  The input text stays internal to this card (MASTERPLAN §6). */
  onUnitsChange: (from: UnitId, to: UnitId) => void;
}

export default function ConverterCard({ from, to, onUnitsChange }: ConverterCardProps) {
  const { t } = useLang();

  // URL state is read exactly once on mount (MASTERPLAN §10).
  const initial = useMemo(() => readStateFromUrl(window.location.search), []);

  const [input, setInput] = useState(initial.value);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeUrl = useMemo(() => createUrlWriter(), []);

  // Sync URL (debounced) whenever state settles; default state keeps URL clean.
  useEffect(() => {
    const isDefault =
      from === DEFAULT_FROM && to === DEFAULT_TO && input === "" && !initial.hasParams;
    writeUrl(isDefault ? "" : buildSearch(from, to, input));
  }, [from, to, input, writeUrl, initial.hasParams]);

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

  return (
    <section
      aria-labelledby="converter-heading"
      className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 id="converter-heading" className="sr-only">
        {t("resultLabel")} — {t("inputLabel")}
      </h2>

      {/* Source row */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
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
            onChange={(e) => setInput(e.target.value)}
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
      <p className="mt-1 h-5 text-xs text-muted-foreground">{t("brandBn") ? fromUnit.bn : ""}</p>

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

      {/* Result row */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1" role="status" aria-live="polite">
          <span aria-hidden="true" className="sr-only">
            {t("resultLabel")}:{" "}
          </span>
          <output
            htmlFor="area-input"
            className={`block h-16 truncate rounded-lg border border-border bg-background px-4 text-3xl font-semibold tabular-nums leading-[3.5rem] ${
              resultText !== null ? "text-primary" : "text-muted-foreground/50"
            }`}
          >
            {resultText ?? t("resultPlaceholder")}
          </output>
        </div>
        <UnitSelect
          id="to-unit"
          label={t("toUnitLabel")}
          value={to}
          onChange={(u) => onUnitsChange(from, u)}
        />
      </div>
      <div className="mt-1 flex h-5 items-center justify-between">
        <p className="text-xs text-muted-foreground">{toUnit.bn}</p>
        <button
          type="button"
          onClick={copyResult}
          disabled={resultText === null}
          aria-label={
            copied === "ok" ? t("copied") : copied === "fail" ? t("copyFailed") : t("copy")
          }
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-card-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied === "ok" ? (
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          <span aria-live="polite">
            {copied === "ok" ? t("copied") : copied === "fail" ? t("copyFailed") : t("copy")}
          </span>
        </button>
      </div>

      {/* Reserved 20px error line — no layout shift (MASTERPLAN §6) */}
      <p
        id="input-error"
        role="alert"
        className={`mt-1 flex h-5 items-center gap-1 text-sm text-destructive ${
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
