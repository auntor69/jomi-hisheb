#!/usr/bin/env bun
/**
 * Deterministic OG-image generator (1200×630) — zero dependencies.
 * Renders the social-share card (indigo gradient, survey grid, plot-map motif,
 * brand mark, pixel-font copy) using the shared raster/PNG helpers.
 *
 * Run: `bun scripts/generate-og.mjs` → overwrites public/og-image.png.
 * Committed output: regenerate only when the design changes.
 */
import { writeFileSync, mkdirSync } from "node:fs";
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
canvas.drawText(96, 96, "11 UNITS", 4, MUTED);
canvas.drawText(96, 360, "JOMI HISHEB", 11, WHITE); // 77px tall
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

mkdirSync("public", { recursive: true });
const png = encodePng(canvas);
writeFileSync("public/og-image.png", png);
console.log(`public/og-image.png written (${png.length} bytes, ${W}x${H})`);
