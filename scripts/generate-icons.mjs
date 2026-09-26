#!/usr/bin/env bun
/**
 * Deterministic app-icon generator — zero dependencies.
 * Renders the brand mark (indigo field + cream trend-line plot glyph: the same
 * glyph as `favicon.svg`, the header mark, and the OG card) at the sizes the
 * web manifest and iOS need. Full-bleed by design — iOS and Chrome apply their
 * own masking, and the glyph sits well inside the maskable safe zone.
 *
 * Run: `bun scripts/generate-icons.mjs` → public/icon-512.png, icon-192.png, apple-touch-icon.png
 */
import { writeFileSync } from "node:fs";
import { createCanvas, encodePng } from "./lib/png.mjs";

const PRIMARY = [0x2b, 0x4c, 0x9b];
const CREAM = [0xf7, 0xf5, 0xef];

/** Trend-line mark in a 64×64 viewBox: M18 40 L28 22 L38 32 L46 26 (+ end dot). */
const MARK_POINTS = [
  [18, 40],
  [28, 22],
  [38, 32],
  [46, 26],
];
const DOT = [46, 26];

function renderIcon(size) {
  const canvas = createCanvas(size, size, PRIMARY);
  const p = ([x, y]) => [Math.round((x / 64) * size), Math.round((y / 64) * size)];
  const thickness = Math.max(3, Math.round((4.5 / 64) * size));

  for (let i = 0; i < MARK_POINTS.length - 1; i++) {
    const [x0, y0] = p(MARK_POINTS[i]);
    const [x1, y1] = p(MARK_POINTS[i + 1]);
    canvas.line(x0, y0, x1, y1, thickness, CREAM);
  }
  const [dx, dy] = p(DOT);
  canvas.disc(dx, dy, Math.max(3, Math.round((4 / 64) * size)), CREAM);

  return canvas;
}

const targets = [
  ["public/icon-512.png", 512],
  ["public/icon-192.png", 192],
  ["public/apple-touch-icon.png", 180],
];

for (const [path, size] of targets) {
  const png = encodePng(renderIcon(size));
  writeFileSync(path, png);
  console.log(`${path} written (${png.length} bytes, ${size}x${size})`);
}
