/**
 * Footer — one honest line (MASTERPLAN §6 item 7).
 */
import { useLang } from "./LangContext.tsx";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="mt-12 border-t border-border py-6 text-center">
      <p className="text-xs text-muted-foreground">{t("footerDisclaimer")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("footerTag")}</p>
    </footer>
  );
}
