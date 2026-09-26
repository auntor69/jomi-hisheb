/**
 * Header — brand + language toggle (MASTERPLAN §6 page anatomy item 1).
 * Brand block follows the current language (title = the language the reader
 * is using, subtitle = the other) so the header always leads with clarity.
 */
import { useLang } from "./LangContext.tsx";
import type { Lang } from "../lib/i18n.ts";

function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 shrink-0" aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="14" fill="var(--color-primary)" />
      <path
        d="M18 40 L28 22 L38 32 L46 26"
        fill="none"
        stroke="var(--color-primary-foreground)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="26" r="4" fill="var(--color-primary-foreground)" />
    </svg>
  );
}

export default function Header() {
  const { lang, setLang, t } = useLang();

  const options: Array<{ id: Lang; label: string }> = [
    { id: "bn", label: "বাং" },
    { id: "en", label: "EN" },
  ];

  return (
    <header className="flex items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-3">
        <BrandMark />
        <div className="leading-tight">
          <p className="text-lg font-bold text-card-foreground">
            {lang === "bn" ? t("brandBn") : t("brandEn")}
          </p>
          <p className="text-sm text-muted-foreground">
            {lang === "bn" ? t("brandEn") : t("brandBn")}
          </p>
        </div>
      </div>

      <nav
        aria-label={t("langLabel")}
        className="flex rounded-full border border-border bg-card p-0.5 shadow-sm"
      >
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLang(opt.id)}
            aria-pressed={lang === opt.id}
            className={`h-9 min-w-11 rounded-full px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              lang === opt.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
