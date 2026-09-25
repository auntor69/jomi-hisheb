/**
 * FAQ — native <details>/<summary> accordions (MASTERPLAN §6 item 6).
 * Zero JS needed; keyboard and screen-reader accessible for free.
 */
import { useLang } from "./LangContext.tsx";
import type { StringKey } from "../lib/i18n.ts";

const ITEMS: Array<{ q: StringKey; a: StringKey }> = [
  { q: "faq1q", a: "faq1a" },
  { q: "faq2q", a: "faq2a" },
  { q: "faq3q", a: "faq3a" },
  { q: "faq4q", a: "faq4a" },
  { q: "faq5q", a: "faq5a" },
];
export default function FAQ() {
  const { t } = useLang();

  return (
    <section aria-labelledby="faq-heading" className="mt-10">
      <h2 id="faq-heading" className="text-lg font-semibold text-card-foreground">
        {t("faqTitle")}
      </h2>
      <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
        {ITEMS.map((item) => (
          <details key={item.q} name="faq" className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-card-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              {t(item.q)}
              <span
                aria-hidden="true"
                className="text-muted-foreground transition-transform duration-150 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{t(item.a)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
