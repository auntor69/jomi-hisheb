/**
 * AboutUnits — concise factual content (MASTERPLAN §6 item 5, §14 content strategy).
 */
import { useLang } from "./LangContext.tsx";

export default function AboutUnits() {
  const { t } = useLang();

  return (
    <section aria-labelledby="about-heading" className="mt-10">
      <h2 id="about-heading" className="text-lg font-semibold text-card-foreground">
        {t("aboutTitle")}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>{t("aboutP1")}</p>
        <p>{t("aboutP2")}</p>
        <p>{t("aboutP3")}</p>
      </div>
    </section>
  );
}
