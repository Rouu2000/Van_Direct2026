/**
 * Logo resize script — run once after `npm install sharp --save-dev`
 * Usage: node scripts/resize-logo.mjs
 *
 * Produces: public/images/vandirect-{64,128,256,512}.png
 *           public/images/vandirect-{256,512}.webp
 *           public/images/favicon-32.png
 *           public/images/favicon-192.png
 *           public/images/apple-touch-icon.png  (180x180)
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../public/images/vandirect.png');
const out = resolve(__dirname, '../public/images');

const sizes = [
  { name: 'vandirect-64.png',         w: 64,  fmt: 'png' },
  { name: 'vandirect-128.png',        w: 128, fmt: 'png' },
  { name: 'vandirect-256.png',        w: 256, fmt: 'png' },
  { name: 'vandirect-512.png',        w: 512, fmt: 'png' },
  { name: 'vandirect-256.webp',       w: 256, fmt: 'webp' },
  { name: 'vandirect-512.webp',       w: 512, fmt: 'webp' },
  { name: 'favicon-32.png',           w: 32,  fmt: 'png' },
  { name: 'favicon-192.png',          w: 192, fmt: 'png' },
  { name: 'apple-touch-icon.png',     w: 180, fmt: 'png' },
];

for (const s of sizes) {
  await sharp(src).resize(s.w, s.w, { fit: 'contain', background: { r:255,g:255,b:255,alpha:0 } })
    [s.fmt]()[s.fmt === 'webp' ? 'webp' : 'png']()
    .toFile(`${out}/${s.name}`);
  console.log(`✓  ${s.name}`);
}
console.log('Done.');
