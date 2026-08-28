// 生成极简圆形图标：warm.bg 背景 + warm.ball 实心圆，无文字
// 输出 PNG（RGBA，8-bit）。自绘避免 ffmpeg geq 解析问题。
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function makeCircleIcon(size, outPath) {
  const bg = [0xF5, 0xF0, 0xEA, 0xFF];
  const ball = [0xC4, 0xA4, 0x8A, 0xFF];
  const cx = size / 2, cy = size / 2;
  const r = size * 0.28; // 略小于 1/3，留白
  const r2 = r * r;
  const w = size, h = size;
  // PNG 编码：每行加 filter 字节 0
  const rowLen = w * 4 + 1;
  const raw = Buffer.alloc(rowLen * h);
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      const d2 = dx * dx + dy * dy;
      const c = d2 <= r2 ? ball : bg;
      const o = y * rowLen + 1 + x * 4;
      raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = c[3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  // PNG 文件拼装
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0);
    return Buffer.concat([len, t, data, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  writeFileSync(outPath, png);
}

// CRC32
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return c ^ 0xFFFFFFFF;
}

mkdirSync('public/icons', { recursive: true });
makeCircleIcon(192, 'public/icons/icon-192.png');
makeCircleIcon(512, 'public/icons/icon-512.png');
console.log('ICONS_OK');
