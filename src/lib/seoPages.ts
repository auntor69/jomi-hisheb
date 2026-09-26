/**
 * Programmatic conversion pages — the "long tail" SEO layer.
 *
 * Each entry becomes a static, fully crawlable page at build time
 * (see vite.config.ts): `/katha-to-decimal`, `/bigha-to-sq-feet`, …
 * targeting real search intents like "১ কাঠা সমান কত ডেসিমেল".
 *
 * Design rules:
 *  - Slugs are hand-curated (not all 110 ordered pairs) so every page has a
 *    genuine search intent; generated pages are plain HTML, no framework, so
 *    they stay fast and never depend on JS.
 *  - Every page is bilingual (Bengali-first headings, English summary),
 *    mirrors the main app's honesty rules, and links back to the calculator.
 *  - A page is always paired with a reciprocal link to its reverse page,
 *    giving the set internal linkage Google can follow.
 */

import { UNITS, type UnitId } from "../data/units.ts";

/** Ordered pair of unit ids for one page. */
export interface ConversionPair {
  readonly from: UnitId;
  readonly to: UnitId;
}

/**
 * Curated page set — highest-intent conversions only. Every pair here is a
 * question people actually ask (deeds mix units freely in Bangladesh).
 * Each pair also gets its reverse (decimal→katha etc.) so the set is fully
 * interlinked; extend PAIRS to add pages, everything downstream is generated.
 */
const PAIRS: readonly ConversionPair[] = [
  { from: "katha", to: "decimal" },
  { from: "katha", to: "sqft" },
  { from: "bigha", to: "katha" },
  { from: "bigha", to: "decimal" },
  { from: "kani", to: "decimal" },
  { from: "kani", to: "sqft" },
  { from: "kani40", to: "decimal" },
  { from: "gonda", to: "katha" },
  { from: "shotangsho", to: "katha" },
  { from: "decimal", to: "sqft" },
  { from: "chotak", to: "sqft" },
  { from: "acre", to: "decimal" },
  { from: "katha", to: "sqm" },
  { from: "decimal", to: "sqm" },
  { from: "acre", to: "katha" },
  { from: "bigha", to: "sqft" },
  { from: "shotangsho", to: "decimal" },
  { from: "gonda", to: "sqft" },
];

/** PAIRS plus their reverses, deduplicated by resulting path. */
const ALL_PAIRS: readonly ConversionPair[] = (() => {
  const seen = new Set<string>();
  const out: ConversionPair[] = [];
  for (const pair of [...PAIRS, ...PAIRS.map((p) => ({ from: p.to, to: p.from }))]) {
    const key = `${pair.from}>${pair.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pair);
  }
  return out;
})();

export interface SeoPage {
  /** URL path, e.g. "/katha-to-decimal". */
  readonly path: string;
  readonly from: UnitId;
  readonly to: UnitId;
  /** Slug tokens, e.g. ["katha", "decimal"]. */
  readonly parts: readonly string[];
  /** 1 {from} = ? {to}. */
  readonly factor: number;
  readonly title: string;
  readonly description: string;
  readonly reversePath: string;
}

const slugFor = (id: UnitId): string => ID_TO_SLUG[id];

const ID_TO_SLUG: Record<UnitId, string> = {
  sqft: "sq-feet",
  sqm: "sq-meters",
  katha: "katha",
  bigha: "bigha",
  chotak: "chotak",
  shotangsho: "shotangsho",
  decimal: "decimal",
  gonda: "gonda",
  kani: "kani",
  kani40: "kani-40-shotok",
  acre: "acre",
};

function buildPair(from: UnitId, to: UnitId): SeoPage {
  // value_in_to = value_in_from × (sqftPerUnit[from] / sqftPerUnit[to]).
  // Example: 1 bigha = 14400 sq ft = 14400/720 = 20 katha.
  const factor = UNITS[from].sqftPerUnit / UNITS[to].sqftPerUnit;
  const fromName = UNITS[from].en;
  const toName = UNITS[to].en;
  const parts = [slugFor(from), slugFor(to)];
  const path = `/${parts.join("-to-")}`;
  return {
    path,
    from,
    to,
    parts,
    factor,
    title: `${fromName} to ${toName} Converter | Jomi Hisheb`,
    description: `1 ${fromName} = ${formatFactor(factor)} ${toName} (Bangladesh convention). Free instant converter with a full conversion table — ফ্রি জমির হিসাব।`,
    reversePath: `/${slugFor(to)}-to-${slugFor(from)}`,
  };
}

/** 1 {from} = ? {to}, rounded for display (never used for actual math). */
export function formatFactor(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}

const PATHS: string[] = ALL_PAIRS.map((p) => buildPair(p.from, p.to).path);
if (new Set(PATHS).size !== PATHS.length) {
  throw new Error(`Duplicate conversion page slugs: ${PATHS.join(", ")}`);
}

export const SEO_PAGES: readonly SeoPage[] = ALL_PAIRS.map((p) => buildPair(p.from, p.to));

const PAGE_INDEX: Record<string, SeoPage> = Object.fromEntries(
  SEO_PAGES.map((p) => [p.path, p]),
);

/** Look up a page by its path (e.g. "/katha-to-decimal"); null if unknown. */
export function seoPageForPath(path: string): SeoPage | null {
  return PAGE_INDEX[path] ?? null;
}

/** All conversion page paths (for sitemap and tests). */
export const SEO_PAGE_PATHS: readonly string[] = SEO_PAGES.map((p) => p.path);

/** Realistic sample values for each page's conversion table. */
const SAMPLES = [1, 2, 3, 5, 10, 20, 50, 100];

function fmt(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}

const DOMAIN = "https://jomihisheb.vercel.app";

/**
 * Render the complete standalone HTML document for one conversion page.
 * Pure function of the page definition — no filesystem, no framework.
 */
export function renderSeoPage(page: SeoPage): string {
  const from = UNITS[page.from];
  const to = UNITS[page.to];
  const fromName = `${from.en} (${from.bn})`;
  const toName = `${to.en} (${to.bn})`;
  const url = `${DOMAIN}${page.path}`;

  const tableRows = SAMPLES.map((v) => {
    const result = v * page.factor;
    return `            <tr><td>${fmt(v)}</td><td>${fmt(result)}</td></tr>`;
  }).join("\n");

  const reverse = seoPageForPath(page.reversePath);

  return `<!doctype html>
<html lang="bn" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${page.title}</title>
    <meta name="description" content="${page.description}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta name="author" content="Afterclass Studio" />
    <meta name="theme-color" content="#2B4C9B" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${DOMAIN}/og-image-v3.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${DOMAIN}/og-image-v3.png" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "${page.title}",
        "url": "${url}",
        "description": "${page.description}",
        "isPartOf": { "@id": "${DOMAIN}/#website" },
        "about": { "@id": "${DOMAIN}/#app" },
        "inLanguage": "bn-BD",
        "publisher": { "@type": "Organization", "name": "Afterclass Studio" }
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "১ ${from.bn} সমান কত ${to.bn}?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "১ ${from.bn} = ${fmt(page.factor)} ${to.bn} (বাংলাদেশের প্রচলিত মান অনুযায়ী: ১ ${from.bn} = ${fmt(from.sqftPerUnit)} বর্গফুট)।"
            }
          },
          {
            "@type": "Question",
            "name": "How many ${toName} in 1 ${fromName}?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "1 ${fromName} = ${fmt(page.factor)} ${toName} under the Bangladesh land-unit convention (1 ${fromName} = ${fmt(from.sqftPerUnit)} sq ft)."
            }
          }
        ]
      }
    </script>
  </head>
  <body style="margin:0;background:#FAF9F4;color:#1C2321;font-family:'Noto Sans Bengali','Noto Sans',ui-sans-serif,system-ui,sans-serif;">
    <main style="max-width:720px;margin:0 auto;padding:32px 16px;">
      <p style="font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#5D5D5A;margin:0 0 8px;">
        <a href="/" style="color:#2B4C9B;text-decoration:none;">জমির হিসাব · Jomi Hisheb</a>
      </p>
      <h1 style="font-size:26px;line-height:1.35;margin:0 0 12px;">${fromName} থেকে ${toName} রূপান্তর</h1>
      <p style="font-size:15px;line-height:1.6;color:#5D5D5A;margin:0 0 20px;">
        ${fromName} to ${toName} converter (Bangladesh convention).
        ১ ${from.bn} = ${fmt(page.factor)} ${to.bn} — নিচের টেবিলে প্রচলিত মানগুলো দেওয়া আছে।
      </p>

      <div style="background:#FFFFFF;border:1px solid #E4E1D6;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#5D5D5A;margin:0 0 6px;">The exact rate</p>
        <p style="font-size:22px;font-weight:600;margin:0 0 4px;">1 ${fromName} = ${fmt(page.factor)} ${toName}</p>
        <p style="font-size:13px;color:#5D5D5A;margin:0;">1 ${from.bn} = ${fmt(from.sqftPerUnit)} বর্গফুট &nbsp;·&nbsp; 1 ${to.bn} = ${fmt(to.sqftPerUnit)} বর্গফুট</p>
      </div>

      <h2 style="font-size:19px;margin:0 0 10px;">রূপান্তর টেবিল — ${from.bn} থেকে ${to.bn}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 24px;">
        <thead>
          <tr>
            <th style="text-align:left;border-bottom:2px solid #E4E1D6;padding:8px 8px 8px 0;">${from.bn}</th>
            <th style="text-align:left;border-bottom:2px solid #E4E1D6;padding:8px 8px 8px 0;">${to.bn}</th>
          </tr>
        </thead>
        <tbody>
${tableRows}
        </tbody>
      </table>

      <h2 style="font-size:19px;margin:0 0 10px;">নিজে হিসাব করুন</h2>
      <p style="font-size:14px;line-height:1.6;color:#5D5D5A;margin:0 0 16px;">
        যেকোনো মান লিখলেই সাথে সাথে ১১টি এককে ফলাফল দেখুন — ফ্রি, বিজ্ঞাপনমুক্ত, সবকিছু আপনার ব্রাউজারেই।
      </p>
      <p style="margin:0 0 28px;">
        <a href="/?from=${page.from}&to=${page.to}&value=1"
           style="display:inline-block;background:#2B4C9B;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
          ক্যালকুলেটরে এই রূপান্তর খুলুন →
        </a>
      </p>

      <h2 style="font-size:19px;margin:0 0 10px;">সাধারণ জিজ্ঞাসা</h2>
      <p style="font-weight:600;margin:0 0 4px;">১ ${from.bn} সমান কত ${to.bn}?</p>
      <p style="font-size:14px;line-height:1.6;color:#5D5D5A;margin:0 0 16px;">
        বাংলাদেশের প্রচলিত মান অনুযায়ী ১ ${from.bn} = ${fmt(page.factor)} ${to.bn} (১ ${from.bn} = ${fmt(from.sqftPerUnit)} বর্গফুট)।
      </p>
      <p style="font-weight:600;margin:0 0 4px;">How many ${toName} in 1 ${fromName}?</p>
      <p style="font-size:14px;line-height:1.6;color:#5D5D5A;margin:0 0 16px;">
        1 ${fromName} = ${fmt(page.factor)} ${toName} under the Bangladesh land-unit convention (1 ${fromName} = ${fmt(from.sqftPerUnit)} sq ft).
      </p>
      <p style="font-weight:600;margin:0 0 4px;">এই মান কি সব জায়গায় এক?</p>
      <p style="font-size:14px;line-height:1.6;color:#5D5D5A;margin:0 0 24px;">
        না। কাঠা ও বিঘা অঞ্চলভেদে ভিন্ন হয় (যেমন ভারতের বিহারে ১ কাঠা = ১,৩৬১.২৫ বর্গফুট)। এখানে বাংলাদেশের প্রচলিত মান ব্যবহৃত হয়েছে। দলিল বা জরিপের সঙ্গে মিলিয়ে নিন।
      </p>

      <div style="border-top:1px solid #E4E1D6;padding-top:16px;font-size:13px;color:#5D5D5A;">
        ${reverse ? `<p style="margin:0 0 8px;">উল্টো দিকে: <a href="${reverse.path}" style="color:#2B4C9B;">${to.bn} থেকে ${from.bn}</a></p>` : ""}
        <p style="margin:0 0 8px;"><a href="/" style="color:#2B4C9B;">সব একক একসাথে রূপান্তর করুন — জমির হিসাব ক্যালকুলেটর</a></p>
        <p style="margin:0;">© 2026 Afterclass Studio · Uses the Bangladesh land-unit convention. Not a legal survey tool.</p>
      </div>
    </main>
  </body>
</html>
`;
}

/**
 * Full sitemap XML including the homepage and every conversion page.
 * Replaces the hand-maintained public/sitemap.xml at build time.
 */
export function renderSitemap(): string {
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: `${DOMAIN}/`, priority: "1.0" },
    ...SEO_PAGE_PATHS.map((p) => ({ loc: `${DOMAIN}${p}`, priority: "0.8" })),
  ];
  const body = entries
    .map(
      (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
