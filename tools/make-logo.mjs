// tools/make-logo.mjs  (one-off) traces a flat black-on-white logo to SVG, renders PNGs.
// Needs: npm i --no-save potrace      Usage: node tools/make-logo.mjs <source.jpg>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import potrace from 'potrace';

const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error('Source image not found'); process.exit(1); }
const pub = path.resolve('public');
const BG = '#0b0b0f'; // matches theme_color in manifest

const bw = await sharp(src).flatten({ background: '#ffffff' }).greyscale().threshold(160).png().toBuffer();
const trimmed = await sharp(bw).trim({ background: '#ffffff', threshold: 10 }).png().toBuffer();
const { width: w, height: h } = await sharp(trimmed).metadata();

const traced = await new Promise((res, rej) =>
  potrace.trace(trimmed, { threshold: 128, turdSize: 10, optTolerance: 0.4, color: '#000000', background: 'transparent' },
    (e, s) => (e ? rej(e) : res(s))));

const paths = [...traced.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]);
if (!paths.length) throw new Error('Trace produced no paths');
const tr = (traced.match(/<path\b[^>]*?\stransform="([^"]+)"/) || [])[1];
const mk = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Karibu logo">` +
  `<path fill="${fill}" fill-rule="evenodd"${tr ? ` transform="${tr}"` : ''} d="${paths.join(' ')}"/></svg>\n`;

const white = mk('#ffffff');
fs.writeFileSync(path.join(pub, 'logo.svg'), mk('#000000'));
fs.writeFileSync(path.join(pub, 'logo-white.svg'), white);

async function compose(W, H, bw_, bh_, file) {
  const logo = await sharp(Buffer.from(white), { density: 144 }).resize(bw_, bh_, { fit: 'inside' }).png().toBuffer();
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toFile(path.join(pub, file));
}
await compose(192, 192, 120, 120, 'icon-192.png');
await compose(512, 512, 320, 320, 'icon-512.png');
await compose(1200, 630, 700, 360, 'og-image.png');

for (const f of ['logo.svg', 'logo-white.svg', 'icon-192.png', 'icon-512.png', 'og-image.png'])
  console.log(f.padEnd(16), fs.statSync(path.join(pub, f)).size, 'bytes');