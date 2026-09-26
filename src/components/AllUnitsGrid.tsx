/**
 * AllUnitsGrid — "all units at a glance" (competitor-beating feature).
 * Shows the current input converted into EVERY unit simultaneously, live as
 * the user types — the competitor's unit-card grid is static/unrelated to the
 * input; ours is fully reactive and tappable (tap a card to target it).
 */
import { convert } from "../lib/convert.ts";
import { formatNumber } from "../lib/format.ts";
import { parseAreaInput } from "../lib/validate.ts";
import { UNITS, UNITS_LIST } from "../data/units.ts";
import type { UnitId } from "../data/units.ts";
import type { StringKey } from "../lib/i18n.ts";
import { useLang } from "./LangContext.tsx";

interface AllUnitsGridProps {
  input: string;
  from: UnitId;
  onPick: (unit: UnitId) => void;
}

export default function AllUnitsGrid({ input, from, onPick }: AllUnitsGridProps) {
  const { t, lang } = useLang();

  const parsed = parseAreaInput(input);
  const active = parsed.ok;

  const nameOf = (id: UnitId) => (lang === "bn" ? UNITS[id].bn : UNITS[id].en);

  return (
    <section aria-labelledby="allunits-heading" className="mt-8">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="allunits-heading" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t("allUnitsTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("allUnitsSub")}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
        {UNITS_LIST.map((unit) => {
          const isSource = unit.id === from;
          const valueText = active && !isSource ? formatNumber(convert(parsed.value, from, unit.id)) : "—";
          const label = nameOf(unit.id);
          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => onPick(unit.id)}
              aria-label={t("allUnitsAria" as StringKey).replace("{unit}", label)}
              aria-pressed={isSource}
              disabled={isSource}
              className={`rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                isSource
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40 hover:bg-background"
              }`}
            >
              <span
                className={`block truncate text-xs font-medium ${isSource ? "text-primary-foreground/80" : "text-muted-foreground"}`}
              >
                {label}
                <span aria-hidden="true" className={isSource ? "" : "opacity-70"}>
                  {" "}
                  {lang === "bn" ? unit.en : unit.bn}
                </span>
              </span>
              <span
                className={`mt-1 block text-base font-semibold tabular-nums ${
                  isSource ? "text-primary-foreground" : active ? "text-card-foreground" : "text-muted-foreground/50"
                }`}
              >
                {valueText}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
