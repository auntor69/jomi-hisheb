/**
 * UnitSelect — accessible native <select> over the unit registry.
 *
 * Shows the unit name in the *current UI language only*; the other language is
 * visible as the caption under each select (ConverterCard §11 bilingual
 * mechanism). The visible label makes the from/to relationship explicit at a
 * glance (the previous sr-only label hid it), and `w-full` lets the select own
 * its grid column so long names never clip the value beside them.
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
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as UnitId)}
        className="h-14 w-full rounded-lg border border-border bg-card pl-3 pr-8 text-base font-medium text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {[...UNITS_LIST]
          .sort((a, b) => a.order - b.order)
          .map((unit) => (
            <option key={unit.id} value={unit.id}>
              {lang === "bn" ? unit.bn : unit.en}
            </option>
          ))}
      </select>
    </div>
  );
}
