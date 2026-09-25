/**
 * UnitSelect — accessible native <select> over the unit registry.
 *
 * Shows the unit name in the *current UI language only*. The other language
 * is already visible as the caption under each row (ConverterCard §11
 * bilingual mechanism), so repeating it here — "কাঠা (Katha)" — just made the
 * closed select hog row width on mobile and starve the value field
 * (documented deviation from the §6 parenthetical-label note, MASTERPLAN §19).
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
        className="h-16 max-w-full rounded-lg border border-border bg-card pl-3 pr-8 text-base font-medium text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {[...UNITS_LIST]
          .sort((a, b) => a.order - b.order)
          .map((unit) => (
            <option key={unit.id} value={unit.id}>
              {lang === "bn" ? unit.bn : unit.en}
            </option>
          ))}
      </select>
    </>
  );
}
