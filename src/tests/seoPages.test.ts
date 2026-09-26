/**
 * Programmatic conversion pages (src/lib/seoPages.ts) — contract tests.
 *
 * These pages are the long-tail SEO surface: each must render real, correct,
 * self-contained HTML with unique metadata, a correct conversion table, and a
 * link back to the calculator. A regression here publishes wrong land math, so
 * the table values are checked against the registry factors directly.
 */
import { describe, it, expect } from "vitest";
import {
  SEO_PAGES,
  SEO_PAGE_PATHS,
  seoPageForPath,
  renderSeoPage,
  renderSitemap,
  formatFactor,
} from "../lib/seoPages.ts";
import { UNITS, UNIT_IDS } from "../data/units.ts";

describe("page registry", () => {
  it("curates a meaningful set of pages (enough to matter, few enough to stay unique)", () => {
    expect(SEO_PAGES.length).toBeGreaterThanOrEqual(15);
    expect(SEO_PAGES.length).toBeLessThanOrEqual(40);
  });

  it("has globally unique paths and URL-safe slugs", () => {
    const paths = SEO_PAGES.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) {
      expect(path).toMatch(/^\/[a-z0-9-]+-to-[a-z0-9-]+$/);
    }
  });

  it("never pairs a unit with itself", () => {
    for (const page of SEO_PAGES) {
      expect(page.from).not.toBe(page.to);
    }
  });

  it("only uses known unit ids", () => {
    for (const page of SEO_PAGES) {
      expect(UNIT_IDS).toContain(page.from);
      expect(UNIT_IDS).toContain(page.to);
    }
  });

  it("computes each factor from the registry (from.sqft / to.sqft — the direction the page converts)", () => {
    for (const page of SEO_PAGES) {
      expect(page.factor).toBeCloseTo(
        UNITS[page.from].sqftPerUnit / UNITS[page.to].sqftPerUnit,
        12,
      );
    }
  });

  it("produces real-world-correct headline rates (regression: the direction was once inverted)", () => {
    const rate = (from: string, to: string) =>
      SEO_PAGES.find((p) => p.from === from && p.to === to)!.factor;
    expect(rate("bigha", "katha")).toBeCloseTo(20, 9); // 1 bigha = 20 katha
    expect(rate("katha", "decimal")).toBeCloseTo(720 / 435.6, 9); // ≈ 1.6529
    expect(rate("decimal", "katha")).toBeCloseTo(435.6 / 720, 9); // ≈ 0.605
    expect(rate("kani", "decimal")).toBeCloseTo(17280 / 435.6, 9); // 1 kani = 39.6694 decimal
    expect(rate("acre", "decimal")).toBeCloseTo(100, 9); // 1 acre = 100 decimal
  });

  it("gives every page a unique, length-bounded title and description", () => {
    const titles = SEO_PAGES.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const page of SEO_PAGES) {
      expect(page.title.length).toBeLessThanOrEqual(80);
      expect(page.description.length).toBeGreaterThanOrEqual(80);
      expect(page.description.length).toBeLessThanOrEqual(320);
    }
  });

  it("resolves lookups by path and returns null for unknown routes", () => {
    expect(seoPageForPath("/katha-to-decimal")?.from).toBe("katha");
    expect(seoPageForPath("/katha-to-decimal")?.to).toBe("decimal");
    expect(seoPageForPath("/nope-to-nothing")).toBeNull();
    expect(seoPageForPath("/")).toBeNull();
  });

  it("lists every page path for the sitemap", () => {
    expect(SEO_PAGE_PATHS).toEqual(SEO_PAGES.map((p) => p.path));
  });
});

describe("rendered page HTML", () => {
  const page = seoPageForPath("/katha-to-decimal")!;
  const html = renderSeoPage(page);

  it("is a complete standalone document", () => {
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain("</html>");
    expect(html).toContain('<html lang="bn" dir="ltr">');
    expect(html).not.toContain("<script src"); // no framework JS — pure HTML
  });

  it("carries unique, self-referencing metadata", () => {
    expect(html).toContain(`<title>${page.title}</title>`);
    expect(html).toContain(`<link rel="canonical" href="https://jomihisheb.vercel.app${page.path}" />`);
    expect(html).toContain('name="robots" content="index, follow"');
    expect(html).toContain(`<meta property="og:url" content="https://jomihisheb.vercel.app${page.path}" />`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("states the exact rate with a worked table whose values match the registry", () => {
    // 1 katha = 720 sq ft; 1 decimal = 435.6 sq ft → 1 katha = 720/435.6 decimal.
    const factor = UNITS.katha.sqftPerUnit / UNITS.decimal.sqftPerUnit;
    expect(page.factor).toBeCloseTo(factor, 12);
    expect(html).toContain(`1 Katha (কাঠা) = ${formatFactor(factor)} Decimal (ডেসিমেল)`);
    // Table rows: 1 → factor, 5 → 5×factor, 100 → 100×factor.
    expect(html).toContain(`<tr><td>1</td><td>${formatFactor(1 * factor)}</td></tr>`);
    expect(html).toContain(`<tr><td>5</td><td>${formatFactor(5 * factor)}</td></tr>`);
    expect(html).toContain(`<tr><td>100</td><td>${formatFactor(100 * factor)}</td></tr>`);
  });

  it("targets the Bengali search intent in both visible text and FAQPage schema", () => {
    expect(html).toContain("১ কাঠা সমান কত ডেসিমেল");
    expect(html).toContain('"@type": "FAQPage"');
    // The question must be parseable JSON inside the ld+json block.
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1]) as Record<string, unknown>,
    );
    const faq = blocks.find((b) => b["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    expect(faq.mainEntity).toHaveLength(2);
    expect(faq.mainEntity[0].name).toContain("কাঠা");
    expect(faq.mainEntity[0].acceptedAnswer.text).toContain("ডেসিমেল");
    expect(faq.mainEntity[1].name).toContain("How many");
  });

  it("links to the calculator with pre-filled state and back to the page set", () => {
    expect(html).toContain('href="/?from=katha&to=decimal&value=1"');
    expect(html).toContain('href="/"');
  });

  it("links to the reverse page when it exists in the set", () => {
    const withReverse = SEO_PAGES.find((p) => seoPageForPath(p.reversePath));
    expect(withReverse).toBeDefined();
    const reverseHtml = renderSeoPage(withReverse!);
    expect(reverseHtml).toContain(`href="${withReverse!.reversePath}"`);
  });

  it("renders distinct HTML for every page (no thin duplicates)", () => {
    const rendered = SEO_PAGES.map((p) => renderSeoPage(p));
    expect(new Set(rendered).size).toBe(rendered.length);
    for (const html of rendered) {
      expect(html.length).toBeGreaterThan(4000); // real content, not a shell
    }
  });
});

describe("generated sitemap", () => {
  const xml = renderSitemap();

  it("includes the homepage and every conversion page with absolute URLs", () => {
    expect(xml).toContain("<loc>https://jomihisheb.vercel.app/</loc>");
    for (const path of SEO_PAGE_PATHS) {
      expect(xml).toContain(`<loc>https://jomihisheb.vercel.app${path}</loc>`);
    }
    // One <loc> per page, no duplicates.
    const locs = xml.match(/<loc>/g) ?? [];
    expect(locs).toHaveLength(SEO_PAGE_PATHS.length + 1);
  });

  it("stays valid sitemap XML with dates and priorities", () => {
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g)!.length).toBe(SEO_PAGE_PATHS.length + 1);
    expect(xml).toContain("<priority>1.0</priority>"); // homepage outranks pages
  });
});

describe("factor display helper", () => {
  it("rounds for display only, with magnitude-appropriate precision", () => {
    expect(formatFactor(720 / 435.6)).toBe("1.6529");
    expect(formatFactor(14400 / 720)).toBe("20");
    expect(formatFactor(17280 / 435.6)).toBe("39.6694");
  });
});
