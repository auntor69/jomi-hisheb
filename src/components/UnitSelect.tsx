/**
 * UnitSelect — accessible native <select> over the unit registry.
 * MASTERPLAN §6: current-language name first, other language in parentheses.
 */
import { UNITS_LIST, type UnitId } from "../data/units.ts";
import { useLang } from "./LangContext.tsx";

interface UnitSelectProps {
  id: string;
  label: string;
  value: UnitId;
  onChange: (unit: UnitId) => void;
}

export default function UnitSelect({ id, label, value, onChange }: UnitSelectProps) {
  const { lang } = useLang();

  return (
    <>
      {/* Visually hidden but screen-reader/label associated */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as UnitId)}
        className="h-14 shrink-0 rounded-lg border border-border bg-card px-3 text-base font-medium text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {[...UNITS_LIST]
          .sort((a, b) => a.order - b.order)
          .map((unit) => {
            const primary = lang === "bn" ? unit.bn : unit.en;
            const secondary = lang === "bn" ? unit.en : unit.bn;
            return (
              <option key={unit.id} value={unit.id}>
                {primary === secondary ? primary : `${primary} (${secondary})`}
              </option>
            );
          })}
      </select>
    </>
  );
}
