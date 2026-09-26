/**
 * Social-card generator regression tests.
 *
 * These exist because of a real shipped bug: `FONT` was missing the letter `J`,
 * and `drawText` fell back to a blank glyph. The wordmark rendered as
 * "OMI HISHEB" on the live OG card. `drawText` now throws instead of drawing
 * blank, and these tests make sure a glyph never goes missing again and that
 * the generator's output filename never drifts from the `og:image` meta tag.
 *
 * The font and generator live in `scripts/` (plain `.mjs`, outside the tsconfig
 * `include`), so they are read as source text rather than imported.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const fontSource = read("scripts/lib/png.mjs");
const ogSource = read("scripts/generate-og.mjs");
const html = read("index.html");

/** Glyph keys declared in the `FONT` map, from either `A: [` or `"1": [`. */
const glyphKeys = new Set<string>();
for (const line of fontSource.split("\n")) {
  const m = line.match(/^\s{2}"?([A-Za-z0-9 ,:!?/()+=.-])"?:\s*\[/);
  if (m) glyphKeys.add(m[1]);
}

/** Uppercase copy strings drawn onto the card (wordmark, subtitle, chips). */
const cardCopy = [...ogSource.matchAll(/"([A-Z0-9][A-Z0-9 ,:!?/()+=.-]*)"/g)].map((m) => m[1]);

describe("OG image — pixel font", () => {
  it("parses a non-trivial glyph set out of scripts/lib/png.mjs", () => {
    expect(glyphKeys.size).toBeGreaterThan(30);
  });

  it("covers the whole uppercase alphabet and all digits", () => {
    const required = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."0123456789"];
    const missing = required.filter((c) => !glyphKeys.has(c));
    expect(missing).toEqual([]);
  });

  it("has a glyph for every character the card actually draws", () => {
    expect(cardCopy.length).toBeGreaterThan(0);
    const missing = [
      ...new Set(
        cardCopy
          .join("")
          .split("")
          .filter((c) => !glyphKeys.has(c)),
      ),
    ];
    // This is the exact assertion that would have caught the missing `J`.
    expect(missing).toEqual([]);
  });

  it("spells the wordmark as JOMI HISHEB, not OMI HISHEB", () => {
    expect(cardCopy).toContain("JOMI HISHEB");
  });

  it("never falls back to a blank glyph for an unknown character", () => {
    expect(fontSource).not.toMatch(/FONT\[\s*ch\s*\]\s*\?\?/);
    expect(fontSource).toMatch(/has no glyph for/);
  });
});

describe("OG image — layout", () => {
  const num = (name: string) => Number(ogSource.match(new RegExp(`const ${name} = (\\d+);`))?.[1]);

  it("keeps the wordmark clear of the plot-motif box", () => {
    // The wordmark was drawn at scale 11, ending at x=811, while the motif box
    // starts at x=780 — so the final "B" of HISHEB sat inside the box.
    const word = ogSource.match(/const WORDMARK = "([^"]+)"/)?.[1] ?? "";
    const scale = num("WORDMARK_SCALE");
    const right = num("WORDMARK_X") + (word.length * 6 * scale - scale);
    expect(word).toBe("JOMI HISHEB");
    expect(right).toBeLessThanOrEqual(num("plotX") - 20);
  });

  it("keeps the wordmark inside the canvas", () => {
    const word = ogSource.match(/const WORDMARK = "([^"]+)"/)?.[1] ?? "";
    const scale = num("WORDMARK_SCALE");
    expect(num("WORDMARK_X") + (word.length * 6 * scale - scale)).toBeLessThanOrEqual(1200);
    expect(num("WORDMARK_Y") + 7 * scale).toBeLessThanOrEqual(630);
  });

  it("guards the layout at generation time rather than shipping a collision", () => {
    expect(ogSource).toMatch(/OG layout collision/);
  });
});

describe("OG image — generator output", () => {
  const outPath = ogSource.match(/process\.argv\[2\]\s*\?\?\s*"([^"]+)"/)?.[1];
  const cardPath = outPath?.replace(/^public\//, "/");

  it("writes to a 1200×630 PNG that actually exists on disk", () => {
    expect(outPath).toBe("public/og-image-v3.png");
    expect(existsSync(join(ROOT, outPath!))).toBe(true);
  });

  it("publishes exactly the file the generator produces, everywhere", () => {
    // Covers og:image, twitter:image AND the JSON-LD screenshot on the homepage.
    const refs = [...html.matchAll(/\/og-image[\w.-]*\.png/g)].map((m) => m[0]);
    expect(refs.length).toBeGreaterThanOrEqual(3);
    expect(new Set(refs)).toEqual(new Set([cardPath]));
  });

  it("points the 36 conversion pages at the same card", () => {
    const refs = [...read("src/lib/seoPages.ts").matchAll(/\$\{DOMAIN\}(\/og-image[\w.-]*\.png)/g)]
      .map((m) => m[1]);
    expect(refs.length).toBeGreaterThanOrEqual(2);
    expect(new Set(refs)).toEqual(new Set([cardPath]));
  });
});
