#!/usr/bin/env bun
/**
 * Deterministic OG-image generator (1200×630) — zero dependencies.
 * Renders the social-share card (indigo gradient, survey grid, plot-map motif,
 * brand mark, pixel-font copy) using the shared raster/PNG helpers.
 *
 * Run: `bun scripts/generate-og.mjs` → overwrites the OUT path below.
 * Committed output: regenerate only when the design changes.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createCanvas, encodePng, textWidth } from "./lib/png.mjs";

const W = 1200;
const H = 630;

const BG_TOP = [0x2b, 0x4c, 0x9b];
const BG_BOT = [0x1d, 0x33, 0x69];
const WHITE = [0xf7, 0xf5, 0xef];
const MUTED = [0xb6, 0xc3, 0xe4];
const GRID = [0x3d, 0x5b, 0xa5];

// ---------- Background: vertical gradient + subtle survey grid ----------
const canvas = createCanvas(W, H, BG_TOP);
for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  const c = [
    Math.round(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t),
    Math.round(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t),
    Math.round(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t),
  ];
  canvas.fillRect(0, y, W, 1, c);
}
for (let x = 60; x < W; x += 60) canvas.fillRect(x, 0, 1, H, GRID);
for (let y = 60; y < H; y += 60) canvas.fillRect(0, y, W, 1, GRID);

// ---------- Right-side plot-map motif (nested plots + subdivision lines) ----------
const plotX = 780;
const plotY = 120;
const plotS = 330;
canvas.strokeRect(plotX, plotY, plotS, plotS, 3, MUTED);
canvas.strokeRect(plotX + 40, plotY + 40, plotS - 80, plotS - 80, 2, GRID);
canvas.fillRect(plotX + 165, plotY, 1, plotS, GRID);
canvas.fillRect(plotX, plotY + 210, plotS, 1, GRID);
canvas.fillRect(plotX + 42, plotY + 212, 121, 116, GRID);
canvas.strokeRect(plotX + 42, plotY + 212, 121, 116, 3, WHITE);

// ---------- Brand mark (plot + trend line, from favicon/Header) ----------
const mx = 96;
const my = 150;
const ms = 150;
canvas.strokeRect(mx, my, ms, ms, 8, WHITE);
const map = (vx, vy) => [mx + 16 + ((vx - 4) / 56) * (ms - 32), my + 16 + ((vy - 4) / 56) * (ms - 32)];
const [ax, ay] = map(18, 40);
const [bx, by] = map(28, 22);
const [cx2, cy2] = map(38, 32);
const [dx, dy] = map(46, 26);
canvas.line(Math.round(ax), Math.round(ay), Math.round(bx), Math.round(by), 9, WHITE);
canvas.line(Math.round(bx), Math.round(by), Math.round(cx2), Math.round(cy2), 9, WHITE);
canvas.line(Math.round(cx2), Math.round(cy2), Math.round(dx), Math.round(dy), 9, WHITE);
canvas.disc(Math.round(dx), Math.round(dy), 8, WHITE);

// ---------- Copy ----------
/** Wordmark geometry. Scale is capped by the plot motif — see the layout guard. */
const WORDMARK = "JOMI HISHEB";
const WORDMARK_X = 96;
const WORDMARK_Y = 372;
const WORDMARK_SCALE = 9;

canvas.drawText(96, 96, "11 UNITS", 4, MUTED);
canvas.drawText(WORDMARK_X, WORDMARK_Y, WORDMARK, WORDMARK_SCALE, WHITE); // 63px tall
canvas.drawText(96, 470, "LAND UNIT CONVERTER - BANGLADESH", 4, MUTED);

let chipX = 96;
const chipY = 540;
const chipH = 56;
for (const label of ["KATHA", "BIGHA", "DECIMAL", "KANI", "ACRE"]) {
  const tw = textWidth(label, 3);
  canvas.strokeRect(chipX, chipY, tw + 40, chipH, 2, GRID);
  canvas.drawText(chipX + 20, chipY + 18, label, 3, WHITE);
  chipX += tw + 40 + 16;
}

/**
 * Output path. The filename is a cache-busting lever: social crawlers cache OG
 * images hard, so a redesign ships under a NEW name (og-image-v3.png) with
 * `index.html` updated in the same change. An optional argv[2] overrides it.
 * Keep this default in sync with the `og:image` meta tag — `src/tests/ogImage.test.ts`
 * fails if the generator and `index.html` ever drift apart.
 */
const OUT = process.argv[2] ?? "public/og-image-v3.png";

mkdirSync(dirname(OUT), { recursive: true });

// ---------- Layout guard ----------
// The wordmark used to be drawn at scale 11 (715px wide, ending at x=811) while
// the plot-motif box starts at x=780 — so the final "B" of HISHEB straddled the
// box border and sat inside it. Fail loud instead of shipping a collision.
const MIN_GAP = 20;
const wordmarkRight = WORDMARK_X + textWidth(WORDMARK, WORDMARK_SCALE);
if (wordmarkRight > plotX - MIN_GAP) {
  throw new Error(
    `OG layout collision: "${WORDMARK}" at scale ${WORDMARK_SCALE} ends at x=${wordmarkRight}, ` +
      `but the plot motif starts at x=${plotX} (needs ${MIN_GAP}px clearance). ` +
      `Lower WORDMARK_SCALE to ${Math.floor(((plotX - MIN_GAP - WORDMARK_X) / (6 * WORDMARK.length - 1)) * 10) / 10} or less.`,
  );
}

const png = encodePng(canvas);
writeFileSync(OUT, png);
console.log(`${OUT} written (${png.length} bytes, ${W}x${H})`);
