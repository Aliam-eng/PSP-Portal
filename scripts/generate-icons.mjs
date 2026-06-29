// Generates PWA PNG icons with zero dependencies (Node zlib only).
// Draws "PSP" on the brand background using a small 5x7 bitmap font.
// Output: public/icon-192.png, icon-512.png, apple-touch-icon.png, favicon.png
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public");
mkdirSync(OUT, { recursive: true });

const BG = [0x00, 0xa6, 0x3e]; // giv.trade brand green
const FG = [255, 255, 255];

// 5x7 glyphs for the letters we need.
const FONT = {
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
};

function drawText(buf, size, text) {
  const cols = 5, rows = 7, gap = 1;
  const totalCols = text.length * cols + (text.length - 1) * gap;
  const scale = Math.floor((size * 0.6) / totalCols);
  const textW = totalCols * scale;
  const textH = rows * scale;
  const startX = Math.floor((size - textW) / 2);
  const startY = Math.floor((size - textH) / 2);

  text.split("").forEach((ch, ci) => {
    const glyph = FONT[ch];
    if (!glyph) return;
    const gx = startX + ci * (cols + gap) * scale;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (glyph[r][c] !== "1") continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const x = gx + c * scale + dx;
            const y = startY + r * scale + dy;
            const i = (y * size + x) * 4;
            buf[i] = FG[0];
            buf[i + 1] = FG[1];
            buf[i + 2] = FG[2];
            buf[i + 3] = 255;
          }
        }
      }
    }
  });
}

function makePixels(size, text) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = BG[0];
    buf[i * 4 + 1] = BG[1];
    buf[i * 4 + 2] = BG[2];
    buf[i * 4 + 3] = 255;
  }
  if (text) drawText(buf, size, text);
  return buf;
}

// --- PNG encoder ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)
  // filtered scanlines: filter byte 0 per row
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const targets = [
  { file: "icon-192.png", size: 192, text: "PSP" },
  { file: "icon-512.png", size: 512, text: "PSP" },
  { file: "apple-touch-icon.png", size: 180, text: "PSP" },
  { file: "favicon.png", size: 32, text: "P" },
];

for (const t of targets) {
  const png = encodePNG(t.size, makePixels(t.size, t.text));
  writeFileSync(join(OUT, t.file), png);
  console.log(`wrote public/${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}
