#!/usr/bin/env bun
/**
 * Deterministic OG-image generator (1200×630) — zero dependencies.
 * Renders the social-share card (indigo gradient, plot-map motif, brand mark,
 * Latin text via an embedded 5×7 pixel font) pixel-by-pixel and encodes PNG.
 *
 * Run: `bun scripts/generate-og.mjs` → overwrites public/og-image.png.
 * Committed output: regenerating is only needed if the design changes.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const W = 1200;
const H = 630;

// ---------- 5×7 pixel font (subset: chars used by the card copy) ----------
const FONT = {
  A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  B: ["XXXX.", "X...X", "X...X", "XXXX.", "X...X", "X...X", "XXXX."],
  C: [".XXXX", "X....", "X....", "X....", "X....", "X....", ".XXXX"],
  D: ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."],
  E: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"],
  G: [".XXXX", "X....", "X....", "X..XX", "X...X", "X...X", ".XXXX"],
  H: ["X...X", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  I: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
  K: ["X...X", "X..X.", "X.X..", "XX...", "X.X..", "X..X.", "X...X"],
  L: ["X....", "X....", "X....", "X....", "X....", "X....", "XXXXX"],
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
  N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X", "X...X", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  R: ["XXXX.", "X...X", "X...X", "XXXX.", "X.X..", "X..X.", "X...X"],
  S: [".XXXX", "X....", "X....", ".XXX.", "....X", "....X", "XXXX."],
  T: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "..X.."],
  U: ["X...X", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  V: ["X...X", "X...X", "X...X", "X...X", "X...X", ".X.X.", "..X.."],
  "1": ["..X..", ".XX..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
  "-": [".....", ".....", ".....", "XXXXX", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".XX..", ".XX.."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

// ---------- Colors ----------
const BG_TOP = [0x2b, 0x4c, 0x9b];
const BG_BOT = [0x1d, 0x33, 0x69];
const WHITE = [0xf7, 0xf5, 0xef];
const MUTED = [0xb6, 0xc3, 0xe4];
const GRID = [0x3d, 0x5b, 0xa5];

const img = Buffer.alloc(W * H * 3, 0);

function setPx(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  img[o] = r;
  img[o + 1] = g;
  img[o + 2] = b;
}

function fillRect(x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPx(x, y, color);
}

function strokeRect(x0, y0, w, h, t, color) {
  fillRect(x0, y0, w, t, color);
  fillRect(x0, y0 + h - t, w, t, color);
  fillRect(x0, y0, t, h, color);
  fillRect(x0 + w - t, y0, t, h, color);
}

function drawText(x, y, text, scale, color) {
  let cx = x;
  for (const ch of text) {
    const glyph = FONT[ch] ?? FONT[" "];
    for (let ry = 0; ry < 7; ry++) {
      for (let rx = 0; rx < 5; rx++) {
        if (glyph[ry][rx] === "X") fillRect(cx + rx * scale, y + ry * scale, scale, scale, color);
      }
    }
    cx += 6 * scale; // 5 cols + 1 col spacing
  }
  return cx - scale; // width used (minus trailing spacing)
}

function textWidth(text, scale) {
  return text.length * 6 * scale - scale;
}

// ---------- Background ----------
for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  const c = [
    Math.round(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t),
    Math.round(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t),
    Math.round(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t),
  ];
  for (let x = 0; x < W; x++) setPx(x, y, c);
}

// Subtle survey grid (every 60px)
for (let x = 60; x < W; x += 60) for (let y = 0; y < H; y++) setPx(x, y, GRID);
for (let y = 60; y < H; y += 60) for (let x = 0; x < W; x++) setPx(x, y, GRID);

// ---------- Right-side plot-map motif (nested plots + dividing lines) ----------
const plotX = 780, plotY = 120, plotS = 330;
strokeRect(plotX, plotY, plotS, plotS, 3, MUTED);
strokeRect(plotX + 40, plotY + 40, plotS - 80, plotS - 80, 2, GRID);
// dividing lines: one vertical, one horizontal (subdivision feel)
for (let y = plotY; y < plotY + plotS; y++) setPx(plotX + 165, y, GRID);
for (let x = plotX; x < plotX + plotS; x++) setPx(x, plotY + 210, GRID);
// accent plot: filled quarter
fillRect(plotX + 42, plotY + 212, 121, 116, GRID);
strokeRect(plotX + 42, plotY + 212, 121, 116, 3, WHITE);

// ---------- Brand mark (plot + trend line, from favicon/Header) ----------
const mx = 96, my = 150, ms = 150;
strokeRect(mx, my, ms, ms, 8, WHITE);
// polyline "M18 40 L28 22 L38 32 L46 26" mapped from a 64-box to (ms-32)
const map = (vx, vy) => [mx + 16 + ((vx - 4) / 56) * (ms - 32), my + 16 + ((vy - 4) / 56) * (ms - 32)];
function thickLine(x0, y0, x1, y1, t, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    fillRect(x - (t >> 1), y - (t >> 1), t, t, color);
  }
}
const [ax, ay] = map(18, 40);
const [bx, by] = map(28, 22);
const [cx2, cy2] = map(38, 32);
const [dx, dy] = map(46, 26);
thickLine(ax, ay, bx, by, 9, WHITE);
thickLine(bx, by, cx2, cy2, 9, WHITE);
thickLine(cx2, cy2, dx, dy, 9, WHITE);
const [ex, ey] = map(46, 26);
fillRect(ex - 8, ey - 8, 16, 16, WHITE);

// ---------- Copy ----------
const title = "JOMI HISHEB";
const subtitle = "LAND UNIT CONVERTER - BANGLADESH";
const chips = ["KATHA", "BIGHA", "DECIMAL", "KANI", "ACRE"];

drawText(96, 360, title, 11, WHITE); // 77px tall
drawText(96, 470, subtitle, 4, MUTED);

// Chip row: bordered pills with 5×7 text
let chipX = 96;
const chipY = 540, chipH = 56;
for (const label of chips) {
  const tw = textWidth(label, 3);
  strokeRect(chipX, chipY, tw + 40, chipH, 2, GRID);
  drawText(chipX + 20, chipY + 18, label, 3, WHITE);
  chipX += tw + 40 + 16;
}

// Big unit count, top-right of the copy block
drawText(96, 96, "11 UNITS", 4, MUTED);

// ---------- PNG encode ----------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor RGB
// raw scanlines with filter byte 0
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync("public", { recursive: true });
writeFileSync("public/og-image.png", png);
console.log(`public/og-image.png written (${png.length} bytes, ${W}x${H})`);
