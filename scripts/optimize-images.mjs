// Convierte los originales de assets-src/ a WebP optimizado en public/assets/:
// - <fase>.webp (galería, máx. 800 px de ancho, q80)
// - thumb.webp (Biblioteca, 320 px de ancho, generado desde inicio)
// Los originales PNG/JPG quedan archivados en assets-src/, fuera del bundle público.
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = new URL('../assets-src/exercises/', import.meta.url).pathname;
const OUT = new URL('../public/assets/exercises/', import.meta.url).pathname;
const PHASES = ['inicio', 'medio', 'final'];

let total = 0;
for (const exercise of readdirSync(SRC).filter((d) => !d.startsWith('.'))) {
  const srcDir = join(SRC, exercise);
  const outDir = join(OUT, exercise);
  mkdirSync(outDir, { recursive: true });
  const files = readdirSync(srcDir);
  for (const phase of PHASES) {
    const original = files.find((f) => f.startsWith(phase + '.'));
    if (!original) throw new Error(`${exercise}: falta la fase "${phase}" en assets-src`);
    await sharp(join(srcDir, original))
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(join(outDir, `${phase}.webp`));
    total++;
  }
  const inicio = files.find((f) => f.startsWith('inicio.'));
  await sharp(join(srcDir, inicio))
    .resize({ width: 320, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(join(outDir, 'thumb.webp'));
  total++;
}
console.log(`OK: ${total} archivos WebP generados en public/assets/exercises/`);
