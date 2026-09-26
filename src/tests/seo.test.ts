/**
 * SEO, metadata, PWA and repository-hygiene regression tests.
 *
 * These guard the "discoverability" and "open-source safety" surface, which is
 * easy to break silently: a renamed file, a dropped meta tag, or a placeholder
 * domain would never fail the conversion suite. Everything here is checked
 * against the real files on disk, not a snapshot.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const html = read("index.html");
const DOMAIN = "https://jomihisheb.vercel.app";

/** Read width/height from a PNG IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(join(ROOT, file));
  expect(buf.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function metaContent(prop: string): string | undefined {
  const patterns = [
    new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`),
    new RegExp(`<meta\\s+name="${prop}"\\s+content="([^"]*)"`),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return undefined;
}

function jsonLdBlocks(): Array<Record<string, unknown>> {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Record<string, unknown>,
  );
}

describe("SEO — document metadata", () => {
  it("has exactly one title, inside the recommended length", () => {
    expect(html.match(/<title>/g)).toHaveLength(1);
    const title = html.match(/<title>([^<]*)<\/title>/)![1];
    expect(title.length).toBeGreaterThan(20);
    expect(title.length).toBeLessThanOrEqual(80);
    expect(title).toContain("জমির হিসাব");
    expect(title).toMatch(/কাঠা/);
  });

  it("has a substantial meta description with no HTML tags", () => {
    const description = metaContent("description");
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThanOrEqual(80);
    expect(description!.length).toBeLessThanOrEqual(320);
    expect(description!).not.toMatch(/</);
  });

  it("declares a canonical URL on the production domain", () => {
    expect(html).toContain(`<link rel="canonical" href="${DOMAIN}/" />`);
  });

  it("is indexable", () => {
    expect(metaContent("robots")).toMatch(/index, follow/);
  });

  it("declares language, direction, viewport, theme colour and fonts", () => {
    expect(html).toMatch(/<html lang="bn" dir="ltr">/);
    expect(html).toContain('name="viewport"');
    expect(html).toContain('name="theme-color" content="#2B4C9B"');
    expect(html).toContain("Noto+Sans+Bengali");
    expect(html).toContain("display=swap");
  });

  it("links the manifest and app icons", () => {
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
    expect(html).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg"');
  });

  it("has no leftover placeholder domain anywhere on disk", () => {
    const placeholder = ["jomi-hisheb", "example.com"].join(".");
    const files = [...walk("src"), ...walk("public"), ...walk("scripts"), "index.html", "README.md"];
    const scanned = files.filter((f) => !f.endsWith("seo.test.ts"));
    expect(scanned.length).toBeGreaterThan(20);
    for (const file of scanned) {
      expect(read(file)).not.toContain(placeholder);
    }
  });
});

describe("SEO — social cards", () => {
  it("publishes Open Graph website metadata", () => {
    expect(metaContent("og:type")).toBe("website");
    expect(metaContent("og:site_name")).toContain("Jomi Hisheb");
    expect(metaContent("og:title")).toBeTruthy();
    expect(metaContent("og:description")).toBeTruthy();
    expect(metaContent("og:url")).toBe(`${DOMAIN}/`);
    expect(metaContent("og:locale")).toBe("bn_BD");
    expect(metaContent("og:locale:alternate")).toBe("en_US");
  });

  it("points og:image and twitter:image at a real 1200×630 PNG", () => {
    for (const key of ["og:image", "twitter:image"]) {
      expect(metaContent(key)).toBe(`${DOMAIN}/og-image.png`);
    }
    expect(metaContent("og:image:width")).toBe("1200");
    expect(metaContent("og:image:height")).toBe("630");
    expect(metaContent("og:image:alt")).toBeTruthy();
    expect(metaContent("twitter:card")).toBe("summary_large_image");

    expect(existsSync(join(ROOT, "public/og-image.png"))).toBe(true);
    expect(pngSize("public/og-image.png")).toEqual({ width: 1200, height: 630 });
  });
});

describe("SEO — structured data", () => {
  const blocks = jsonLdBlocks();
  const byType = (type: string) => blocks.find((b) => b["@type"] === type);

  it("ships four parsable JSON-LD blocks with a schema.org context", () => {
    expect(blocks.length).toBeGreaterThanOrEqual(4);
    for (const block of blocks) {
      expect(block["@context"]).toBe("https://schema.org");
      expect(typeof block["@type"]).toBe("string");
    }
  });

  it("describes the app as a free WebApplication", () => {
    const app = byType("WebApplication")!;
    expect(app.name).toContain("Jomi Hisheb");
    expect(app.url).toBe(`${DOMAIN}/`);
    expect(app.applicationCategory).toBe("UtilitiesApplication");
    expect(app.isAccessibleForFree).toBe(true);
    expect(app.publisher).toMatchObject({ name: "Afterclass Studio" });
  });

  it("exposes a FAQPage whose answers are also in the crawlable HTML", () => {
    const faq = byType("FAQPage")!;
    const questions = faq.mainEntity as Array<Record<string, unknown>>;
    expect(questions.length).toBe(6);
    for (const q of questions) {
      expect(typeof q.name).toBe("string");
      const answer = q.acceptedAnswer as Record<string, unknown>;
      expect(typeof answer.text).toBe("string");
      // The same text must be present in the static (no-JS) markup too.
      expect(html).toContain(String(q.name));
      expect(html).toContain(String(answer.text));
    }
  });

  it("credits Afterclass Studio as the Organization and publishes a WebSite entity", () => {
    expect(byType("Organization")).toMatchObject({ name: "Afterclass Studio" });
    const site = byType("WebSite")!;
    expect(site.url).toBe(`${DOMAIN}/`);
    expect(site.publisher).toMatchObject({ name: "Afterclass Studio" });
  });
});

describe("SEO — crawlable content without JavaScript", () => {
  it("renders real content inside #root before hydration", () => {
    const root = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script type="module"/)![1];
    expect(root.length).toBeGreaterThan(2000);
    expect(root).toContain("<h1");
    expect(root).toContain("জমির হিসাব");
  });

  it("includes the full 11-unit conversion table", () => {
    for (const unit of [
      "বর্গফুট",
      "বর্গমিটার",
      "কাঠা",
      "বিঘা",
      "ছটাক",
      "শতাংশ",
      "ডেসিমেল",
      "গন্ডা",
      "কানি (২০ গন্ডা)",
      "কানি (৪০ শতাংশ)",
      "একর",
    ]) {
      expect(html).toContain(unit);
    }
    for (const factor of ["৭২০", "১৪,৪০০", "৪৩৫.৬", "৮৬৪", "১৭,২৮০", "১৭,৪২৪", "৪৩,৫৬০"]) {
      expect(html).toContain(factor);
    }
  });

  it("includes how-to-use steps, common conversions and a noscript notice", () => {
    expect(html).toContain("কীভাবে ব্যবহার করবেন");
    expect(html).toContain("প্রচলিত রূপান্তর");
    expect(html).toContain("সাধারণ জিজ্ঞাসা");
    expect(html).toContain("<noscript>");
  });
});

describe("SEO — robots, sitemap and manifest", () => {
  it("robots.txt allows crawling and advertises the sitemap", () => {
    const robots = read("public/robots.txt");
    expect(robots).toMatch(/User-agent: \*/);
    expect(robots).toMatch(/Allow: \//);
    expect(robots).toContain(`Sitemap: ${DOMAIN}/sitemap.xml`);
  });

  it("sitemap.xml is valid, absolute, dated and single-URL", () => {
    const sitemap = read("public/sitemap.xml");
    expect(sitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(sitemap.match(/<loc>/g)).toHaveLength(1);
    expect(sitemap).toContain(`<loc>${DOMAIN}/</loc>`);
    expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });

  it("manifest is valid JSON with matching on-disk PNG icons", () => {
    const manifest = JSON.parse(read("public/manifest.webmanifest")) as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      theme_color: string;
      background_color: string;
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
    };
    expect(manifest.name).toContain("জমির হিসাব");
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#2B4C9B");
    expect(manifest.background_color).toBe("#FAF9F4");

    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
      const file = `public${icon.src}`;
      expect(existsSync(join(ROOT, file))).toBe(true);
      const [w, h] = icon.sizes.split("x").map(Number);
      expect(pngSize(file)).toEqual({ width: w, height: h });
    }
  });

  it("ships a maskable icon and an apple-touch icon at the right sizes", () => {
    const manifest = JSON.parse(read("public/manifest.webmanifest")) as {
      icons: Array<{ purpose?: string }>;
    };
    expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
    expect(pngSize("public/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
  });
});

describe("open-source hygiene", () => {
  it("ignores local environment files", () => {
    const ignore = read(".gitignore");
    expect(ignore).toContain(".env");
    expect(ignore).toContain("!.env.example");
  });

  it("ships a licence, security policy and contribution guide", () => {
    for (const file of ["LICENSE", "SECURITY.md", "CONTRIBUTING.md", "README.md"]) {
      expect(existsSync(join(ROOT, file))).toBe(true);
    }
    expect(read("LICENSE")).toContain("MIT License");
    expect(read("LICENSE")).toContain("Afterclass Studio");
  });

  it("keeps CI least-privileged (read-only contents)", () => {
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toContain("permissions:");
    expect(ci).toContain("contents: read");
    // Every step the README promises CI runs must actually exist.
    for (const step of ["bun typecheck", "bun run test", "bun run build"]) {
      expect(ci).toContain(step);
    }
  });

  it("keeps every tracked source file free of credential-shaped strings", () => {
    const patterns = [
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /\bgh[pousr]_[A-Za-z0-9]{20,}/,
      /\bAKIA[0-9A-Z]{16}\b/,
      /\bsk_live_[A-Za-z0-9]{10,}/,
      /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
      /\b(?:api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-./+]{16,}["']/i,
    ];
    const files = [
      ...walk("src"),
      ...walk("public"),
      ...walk("scripts"),
      ...walk(".github"),
      "index.html",
      "package.json",
      "vite.config.ts",
      "vitest.config.ts",
    ];
    for (const file of files) {
      const content = read(file);
      for (const pattern of patterns) {
        expect(pattern.test(content), `${file} matched ${pattern}`).toBe(false);
      }
    }
  });
});

/** List every file under a directory (relative paths), skipping build output. */
function walk(dir: string): string[] {
  const skip = new Set(["node_modules", "dist", "coverage", ".git"]);
  const out: string[] = [];
  const visit = (current: string) => {
    for (const entry of readdirSync(join(ROOT, current))) {
      if (skip.has(entry)) continue;
      const rel = `${current}/${entry}`;
      if (statSync(join(ROOT, rel)).isDirectory()) visit(rel);
      else out.push(rel);
    }
  };
  if (existsSync(join(ROOT, dir))) visit(dir);
  return out;
}
