/**
 * AboutUnits — concise factual content (MASTERPLAN §6 item 5, §14 content strategy).
 * Each fact gets its own bordered card row for scannability.
 */
import { useLang } from "./LangContext.tsx";

export default function AboutUnits() {
  const { t } = useLang();

  return (
    <section aria-labelledby="about-heading" className="mt-10">
      <h2 id="about-heading" className="text-lg font-semibold text-card-foreground">
        {t("aboutTitle")}
      </h2>
      <div className="mt-3 space-y-2">
        {(["aboutP1", "aboutP2", "aboutP3", "aboutP4"] as const).map((key) => (
          <p
            key={key}
            className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground"
          >
            {t(key)}
          </p>
        ))}
      </div>
    </section>
  );
}
