/**
 * Footer — studio credit + two honest lines (MASTERPLAN §6 item 7).
 * The studio line is language-independent apart from the brand name, so it is
 * composed here from the registry brand strings rather than a new i18n key.
 */
import { useLang } from "./LangContext.tsx";

export default function Footer() {
  const { t, lang } = useLang();

  return (
    <footer className="mt-12 border-t border-border py-6 text-center">
      <p className="text-xs font-medium text-card-foreground">
        © 2026 Afterclass Studio · {lang === "bn" ? t("brandBn") : t("brandEn")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{t("footerDisclaimer")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("footerTag")}</p>
    </footer>
  );
}
