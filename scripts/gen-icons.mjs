// Genera los iconos PWA desde un SVG con la identidad de KINEX (oscuro + neón).
// El maskable lleva más aire alrededor para la zona segura de Android.
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const OUT = new URL('../public/icons/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const svg = (pad) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 96}" fill="#0a0c10"/>
  <text x="256" y="${pad ? 330 : 340}" text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif" font-weight="900"
    font-size="${pad ? 200 : 240}" fill="#c6f24e" letter-spacing="-8">KX</text>
</svg>`);

await sharp(svg(false)).resize(192, 192).png().toFile(OUT + 'icon-192.png');
await sharp(svg(false)).resize(512, 512).png().toFile(OUT + 'icon-512.png');
await sharp(svg(true)).resize(512, 512).png().toFile(OUT + 'icon-maskable-512.png');
await sharp(svg(false)).resize(180, 180).png().toFile(OUT + 'apple-touch-icon.png');
console.log('OK: iconos generados en public/icons/');
