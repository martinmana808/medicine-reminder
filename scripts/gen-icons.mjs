// Generates app icons as PNGs with no external dependencies.
// A teal square with a white medical cross. Replace any time with real artwork.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const crcTable = (() => {
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
  for (let i = 0; i < buf.length; i++)
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function png(size) {
  const bg = [13, 148, 136, 255]; // teal-600
  const fg = [255, 255, 255, 255];
  const armW = Math.round(size * 0.18);
  const armL = Math.round(size * 0.56);
  const c0 = (size - armW) / 2;
  const c1 = (size + armW) / 2;
  const l0 = (size - armL) / 2;
  const l1 = (size + armL) / 2;

  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const vert = x >= c0 && x < c1 && y >= l0 && y < l1;
      const horiz = y >= c0 && y < c1 && x >= l0 && x < l1;
      const col = vert || horiz ? fg : bg;
      raw[p++] = col[0];
      raw[p++] = col[1];
      raw[p++] = col[2];
      raw[p++] = col[3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const out = (name) => new URL("../public/" + name, import.meta.url);
writeFileSync(out("icon-192.png"), png(192));
writeFileSync(out("icon-512.png"), png(512));
writeFileSync(out("apple-touch-icon.png"), png(180));
console.log("icons written: icon-192.png, icon-512.png, apple-touch-icon.png");
