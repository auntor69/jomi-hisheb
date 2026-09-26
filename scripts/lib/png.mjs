/**
 * Tiny zero-dependency raster + PNG encoder shared by the asset generators
 * (`generate-og.mjs`, `generate-icons.mjs`).
 *
 * Why hand-rolled: the project ships no image tooling and no build-time image
 * dependency (MASTERPLAN §13 keeps the dependency budget at zero runtime deps).
 * These scripts are run manually and their PNG output is committed.
 */
import { deflateSync } from "node:zlib";

/** 5×7 pixel font — only the glyphs the asset copy needs. */
export const FONT = {
  A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  B: ["XXXX.", "X...X", "X...X", "XXXX.", "X...X", "X...X", "XXXX."],
  C: [".XXXX", "X....", "X....", "X....", "X....", "X....", ".XXXX"],
  D: ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."],
  E: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"],
  F: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "X...."],
  G: [".XXXX", "X....", "X....", "X..XX", "X...X", "X...X", ".XXXX"],
  H: ["X...X", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  I: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
  J: ["..XXX", "...X.", "...X.", "...X.", "...X.", "X..X.", ".XX.."],
  K: ["X...X", "X..X.", "X.X..", "XX...", "X.X..", "X..X.", "X...X"],
  L: ["X....", "X....", "X....", "X....", "X....", "X....", "XXXXX"],
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
  N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X", "X...X", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  P: ["XXXX.", "X...X", "X...X", "XXXX.", "X....", "X....", "X...."],
  Q: [".XXX.", "X...X", "X...X", "X...X", "X.X.X", "X..X.", ".XX.X"],
  R: ["XXXX.", "X...X", "X...X", "XXXX.", "X.X..", "X..X.", "X...X"],
  S: [".XXXX", "X....", "X....", ".XXX.", "....X", "....X", "XXXX."],
  T: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "..X.."],
  U: ["X...X", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  V: ["X...X", "X...X", "X...X", "X...X", "X...X", ".X.X.", "..X.."],
  W: ["X...X", "X...X", "X...X", "X.X.X", "X.X.X", "XX.XX", "X...X"],
  X: ["X...X", "X...X", ".X.X.", "..X..", ".X.X.", "X...X", "X...X"],
  Y: ["X...X", "X...X", ".X.X.", "..X..", "..X..", "..X..", "..X.."],
  Z: ["XXXXX", "....X", "...X.", "..X..", ".X...", "X....", "XXXXX"],
  "0": [".XXX.", "X...X", "X..XX", "X.X.X", "XX..X", "X...X", ".XXX."],
  "1": ["..X..", ".XX..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
  "2": [".XXX.", "X...X", "....X", "...X.", "..X..", ".X...", "XXXXX"],
  "3": ["XXXX.", "....X", "....X", ".XXX.", "....X", "....X", "XXXX."],
  "4": ["...X.", "..XX.", ".X.X.", "X..X.", "XXXXX", "...X.", "...X."],
  "5": ["XXXXX", "X....", "X....", "XXXX.", "....X", "....X", "XXXX."],
  "6": [".XXX.", "X....", "X....", "XXXX.", "X...X", "X...X", ".XXX."],
  "7": ["XXXXX", "....X", "...X.", "..X..", ".X...", ".X...", ".X..."],
  "8": [".XXX.", "X...X", "X...X", ".XXX.", "X...X", "X...X", ".XXX."],
  "9": [".XXX.", "X...X", "X...X", ".XXXX", "....X", "....X", ".XXX."],
  "-": [".....", ".....", ".....", "XXXXX", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".XX..", ".XX.."],
  ",": [".....", ".....", ".....", ".....", ".XX..", ".XX..", "XX..."],
  ":": [".....", ".XX..", ".XX..", ".....", ".XX..", ".XX..", "....."],
  "!": ["..X..", "..X..", "..X..", "..X..", "..X..", ".....", "..X.."],
  "?": [".XXX.", "X...X", "....X", "...X.", "..X..", ".....", "..X.."],
  "/": ["....X", "....X", "...X.", "..X..", ".X...", "X....", "X...."],
  "(": ["...X.", "..X..", ".X...", ".X...", ".X...", "..X..", "...X."],
  ")": [".X...", "..X..", "...X.", "...X.", "...X.", "..X..", ".X..."],
  "+": [".....", "..X..", "..X..", "XXXXX", "..X..", "..X..", "....."],
  "=": [".....", ".....", "XXXXX", ".....", "XXXXX", ".....", "....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

/** Create an RGB canvas filled with `fill`. */
export function createCanvas(width, height, fill = [0, 0, 0]) {
  const data = Buffer.alloc(width * height * 3, 0);
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = fill[0];
    data[i * 3 + 1] = fill[1];
    data[i * 3 + 2] = fill[2];
  }

  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const o = (y * width + x) * 3;
    data[o] = color[0];
    data[o + 1] = color[1];
    data[o + 2] = color[2];
  };

  const fillRect = (x0, y0, w, h, color) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, color);
  };

  const strokeRect = (x0, y0, w, h, t, color) => {
    fillRect(x0, y0, w, t, color);
    fillRect(x0, y0 + h - t, w, t, color);
    fillRect(x0, y0, t, h, color);
    fillRect(x0 + w - t, y0, t, h, color);
  };

  /** Rounded rectangle (filled, with square corner pixels excluded). */
  const roundRect = (x0, y0, w, h, r, color) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x < r ? r - x : x >= w - r ? x - (w - r - 1) : 0;
        const dy = y < r ? r - y : y >= h - r ? y - (h - r - 1) : 0;
        if (dx * dx + dy * dy <= r * r) set(x0 + x, y0 + y, color);
      }
    }
  };

  const disc = (cx, cy, r, color) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) set(cx + x, cy + y, color);
    }
  };

  /** Thick line via square brush along the segment (deterministic, no AA). */
  const line = (x0, y0, x1, y1, t, color) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / steps);
      const y = Math.round(y0 + ((y1 - y0) * i) / steps);
      fillRect(x - (t >> 1), y - (t >> 1), t, t, color);
    }
  };

  const drawText = (x, y, text, scale, color) => {
    let cx = x;
    for (const ch of text) {
      const glyph = FONT[ch];
      // Fail loud. This used to fall back to the blank-space glyph, which
      // silently shipped the wordmark as "OMI HISHEB" (J was missing from FONT).
      if (!glyph) {
        throw new Error(
          `FONT has no glyph for ${JSON.stringify(ch)} (in ${JSON.stringify(text)}). ` +
            `Add it to scripts/lib/png.mjs — a missing glyph must never render as blank.`,
        );
      }
      for (let ry = 0; ry < 7; ry++) {
        for (let rx = 0; rx < 5; rx++) {
          if (glyph[ry][rx] === "X") fillRect(cx + rx * scale, y + ry * scale, scale, scale, color);
        }
      }
      cx += 6 * scale;
    }
  };

  return { width, height, data, set, fillRect, strokeRect, roundRect, disc, line, drawText };
}

export function textWidth(text, scale) {
  return text.length * 6 * scale - scale;
}

// ---------- PNG encoding ----------
function crc32(buf) {
  if (!crc32.table) {
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    crc32.table = table;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crc32.table[(crc ^ buf[i]) & 0xff];
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

/** Encode a canvas as a truecolour (RGB) PNG buffer. */
export function encodePng(canvas) {
  const { width, height, data } = canvas;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB

  const stride = 1 + width * 3;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    data.copy(raw, y * stride + 1, y * width * 3, (y + 1) * width * 3);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
