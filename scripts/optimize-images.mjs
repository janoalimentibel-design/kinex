// Convierte los originales de assets-src/ a WebP optimizado en public/assets/:
// - <fase>.webp (galería, máx. 800 px de ancho, q80)
// - thumb.webp (Biblioteca, 320 px de ancho, generado desde inicio)
// Los originales PNG/JPG quedan archivados en assets-src/, fuera del bundle público.
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = new URL('../assets-src/exercises/', import.meta.url).pathname;
const OUT = new URL('../public/assets/exercises/', import.meta.url).pathname;
const PHASES = ['inicio', 'medio', 'final'];

let total = 0;
const selected = process.argv.slice(2);
for (const exercise of readdirSync(SRC).filter((d) => !d.startsWith('.') && (!selected.length || selected.includes(d)))) {
  const srcDir = join(SRC, exercise);
  const outDir = join(OUT, exercise);
  mkdirSync(outDir, { recursive: true });
  const files = readdirSync(srcDir);
  // New sequences declare only useful frames; legacy folders keep three phases.
  const manifest = join(srcDir, 'frames.json');
  const config = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : { frames: PHASES, thumbnail: 'inicio' };
  const phases = config.frames;
  if (!Array.isArray(phases) || !phases.length || new Set(phases).size !== phases.length || phases.some(p => typeof p !== 'string' || !/^[a-z][a-z0-9-]*$/.test(p) || p === 'thumb') || !phases.includes(config.thumbnail)) {
    throw new Error(`${exercise}: frames.json inválido`);
  }
  for (const phase of phases) {
    const original = files.find((f) => f.startsWith(phase + '.'));
    if (!original) throw new Error(`${exercise}: falta la fase "${phase}" en assets-src`);
    await sharp(join(srcDir, original))
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(join(outDir, `${phase}.webp`));
    total++;
  }
  const inicio = files.find((f) => f.startsWith(config.thumbnail + '.'));
  await sharp(join(srcDir, inicio))
    .resize({ width: 320, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(join(outDir, 'thumb.webp'));
  total++;
}
console.log(`OK: ${total} archivos WebP generados en public/assets/exercises/`);
