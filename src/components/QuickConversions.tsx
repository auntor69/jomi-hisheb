/**
 * QuickConversions — fixed common pairs (MASTERPLAN §9).
 * Sets from/to, preserves the current input value, active pair highlighted.
 * 11 pairs: the 8 core pairs plus 3 regional ones (kani, gonda, bigha↔shotok).
 */
import { useLang } from "./LangContext.tsx";
import { UNITS, type UnitId } from "../data/units.ts";
import type { StringKey } from "../lib/i18n.ts";

const PAIRS: Array<{ from: UnitId; to: UnitId }> = [
  { from: "katha", to: "decimal" },
  { from: "decimal", to: "katha" },
  { from: "bigha", to: "katha" },
  { from: "katha", to: "sqft" },
  { from: "decimal", to: "sqft" },
  { from: "acre", to: "decimal" },
  { from: "sqft", to: "sqm" },
  { from: "bigha", to: "acre" },
  { from: "kani", to: "decimal" },
  { from: "gonda", to: "katha" },
  { from: "bigha", to: "shotangsho" },
];

interface QuickConversionsProps {
  from: UnitId;
  to: UnitId;
  onPick: (from: UnitId, to: UnitId) => void;
}

export default function QuickConversions({ from, to, onPick }: QuickConversionsProps) {
  const { t, lang } = useLang();

  const unitLabel = (id: UnitId) => {
    const u = UNITS[id];
    return lang === "bn" ? u.bn : u.en;
  };

  const ariaFor = (pair: { from: UnitId; to: UnitId }) =>
    t("quickAria" as StringKey)
      .replace("{from}", unitLabel(pair.from))
      .replace("{to}", unitLabel(pair.to));

  return (
    <section aria-labelledby="quick-heading" className="mt-8">
      <h2 id="quick-heading" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {t("quickTitle")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {PAIRS.map((pair) => {
          const active = pair.from === from && pair.to === to;
          return (
            <button
              key={`${pair.from}-${pair.to}`}
              type="button"
              onClick={() => onPick(pair.from, pair.to)}
              aria-label={ariaFor(pair)}
              aria-pressed={active}
              className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-background"
              }`}
            >
              <span>{unitLabel(pair.from)}</span>
              <span aria-hidden="true" className="text-muted-foreground">
                →
              </span>
              <span>{unitLabel(pair.to)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
