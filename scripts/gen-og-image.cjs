// Generates public/assets/og-image.png (1200x630) with pure Node (zlib + PNG chunks).
// Brand: dark bg + electric blue timer ring + play glyph + "UniTracker" wordmark.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const ACCENT = [30, 144, 255];   // --accent-primary #1e90ff
const WHITE = [240, 244, 255];
const MUTED = [130, 138, 155];
const BG = [10, 12, 18];
const BG2 = [18, 22, 34];

// ─── 5x7 pixel font (A-Z + a few symbols) ───────────────────────────────────
const F = {
  A:'01110,10001,10001,11111,10001,10001,10001',B:'11110,10001,10001,11110,10001,10001,11110',
  C:'01110,10001,10000,10000,10000,10001,01110',D:'11110,10001,10001,10001,10001,10001,11110',
  E:'11111,10000,10000,11110,10000,10000,11111',F:'11111,10000,10000,11110,10000,10000,10000',
  G:'01110,10001,10000,10111,10001,10001,01110',H:'10001,10001,10001,11111,10001,10001,10001',
  I:'11111,00100,00100,00100,00100,00100,11111',J:'00111,00010,00010,00010,00010,10010,01100',
  K:'10001,10010,10100,11000,10100,10010,10001',L:'10000,10000,10000,10000,10000,10000,11111',
  M:'10001,11011,10101,10101,10001,10001,10001',N:'10001,11001,10101,10011,10001,10001,10001',
  O:'01110,10001,10001,10001,10001,10001,01110',P:'11110,10001,10001,11110,10000,10000,10000',
  Q:'01110,10001,10001,10001,10101,10010,01101',R:'11110,10001,10001,11110,10100,10010,10001',
  S:'01111,10000,10000,01110,00001,00001,11110',T:'11111,00100,00100,00100,00100,00100,00100',
  U:'10001,10001,10001,10001,10001,10001,01110',V:'10001,10001,10001,10001,10001,01010,00100',
  W:'10001,10001,10001,10101,10101,11011,10001',X:'10001,10001,01010,00100,01010,10001,10001',
  Y:'10001,10001,01010,00100,00100,00100,00100',Z:'11111,00001,00010,00100,01000,10000,11111',
  '&':'01100,10010,10100,01000,10101,10010,01101','-':'00000,00000,00000,11111,00000,00000,00000',
  '.':'00000,00000,00000,00000,00000,00110,00110','·':'00000,00000,00000,00100,00000,00000,00000',
  ' ':'00000,00000,00000,00000,00000,00000,00000',
};
for (const k in F) F[k] = F[k].split(',');

const px = Buffer.alloc(W * H * 3);
const get = (x, y) => {
  const i = (y * W + x) * 3;
  return [px[i], px[i + 1], px[i + 2]];
};
const set = (x, y, [r, g, b]) => {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = r; px[i + 1] = g; px[i + 2] = b;
};
const blend = (x, y, c, a) => {
  const [r, g, b] = get(x, y);
  set(x, y, [
    Math.round(r * (1 - a) + c[0] * a),
    Math.round(g * (1 - a) + c[1] * a),
    Math.round(b * (1 - a) + c[2] * a),
  ]);
};

const drawText = (text, x, y, scale, color) => {
  let cx0 = x;
  for (const ch of text.toUpperCase()) {
    const glyph = F[ch] || F[' '];
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 5; col++)
        if (glyph[row][col] === '1')
          for (let dy = 0; dy < scale; dy++)
            for (let dx = 0; dx < scale; dx++)
              set(cx0 + col * scale + dx, y + row * scale + dy, color);
    cx0 += 6 * scale;
  }
  return cx0;
};
const textWidth = (text, scale) => text.length * 6 * scale - scale;

// ─── Background ──────────────────────────────────────────────────────────────
for (let y = 0; y < H; y++) {
  const t = y / H;
  const c = BG.map((v, i) => Math.round(v + (BG2[i] - v) * t));
  for (let x = 0; x < W; x++) set(x, y, c);
}

// Soft accent glow bottom-right
{
  const gx = W * 0.82, gy = H * 0.9;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - gx, y - gy);
      if (d < 500) blend(x, y, ACCENT, 0.07 * (1 - d / 500));
    }
}

// ─── Centered wordmark + tagline + bullets ──────────────────────────────────
{
  const sc = 11;
  const wmW = textWidth('UNITRACKER', sc);
  const x0 = (W - wmW) / 2, y0 = 170;
  let x = drawText('UNI', x0, y0, sc, WHITE);
  drawText('TRACKER', x, y0, sc, ACCENT);

  // Tagline centered
  const t1 = 'FREE POMODORO TIMER & TASK MANAGER';
  drawText(t1, (W - textWidth(t1, 3)) / 2, y0 + 115, 3, MUTED);

  // Feature line centered
  const t2 = 'OFFLINE-FIRST · OPEN SOURCE · NO ADS';
  drawText(t2, (W - textWidth(t2, 3)) / 2, y0 + 165, 3, MUTED);
}

// ─── PNG encode ──────────────────────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  px.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, '..', 'public', 'assets', 'og-image.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
