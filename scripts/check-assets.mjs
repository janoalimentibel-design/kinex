// Guardia de assets: valida fotogramas declarados (o tres fases heredadas),
// archivos y que NINGÚN archivo distinto esté duplicado
// por hash (el problema histórico de A2.6: fases repetidas con nombre distinto).
// Nota: hashes distintos no garantizan fases visualmente distintas — la revisión
// visual en móvil sigue siendo obligatoria para cada batch nuevo.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const imagesTs = readFileSync(new URL('../src/data/images.ts', import.meta.url), 'utf8');
const paths = [...imagesTs.matchAll(/'(\.\/assets\/[^']+)'/g)].map((m) => m[1]);
if (!paths.length) { console.error('ERROR: no se encontraron rutas en src/data/images.ts'); process.exit(1); }

const errors = [];
const seenPaths = new Set();
const hashes = new Map();

for (const rel of paths) {
  if (seenPaths.has(rel)) continue; // thumb puede repetir la ruta de una fase solo si es archivo propio; se valida por hash igual
  seenPaths.add(rel);
  const abs = new URL('../public/' + rel.replace(/^\.\//, ''), import.meta.url);
  if (!existsSync(abs)) { errors.push(`Falta el archivo: ${rel}`); continue; }
  const hash = createHash('md5').update(readFileSync(abs)).digest('hex');
  if (hashes.has(hash)) errors.push(`Archivo duplicado por hash: ${rel} == ${hashes.get(hash)}`);
  else hashes.set(hash, rel);
}

// Fases de un mismo ejercicio deben ser tres rutas distintas
const byExercise = {};
for (const rel of paths) {
  const match = rel.match(/exercises\/([^/]+)\/(inicio|medio|final)\.webp$/);
  if (match) (byExercise[match[1]] ??= new Set()).add(match[2]);
}
for (const [exercise, phases] of Object.entries(byExercise)) {
  if (phases.size !== 3) errors.push(`${exercise}: se esperaban 3 fases distintas, hay ${phases.size}`);
}

// Sequences with two useful views and holds declare real frames explicitly.
let declared = 0;
const folders = new Set(paths.map(rel => rel.match(/exercises\/([^/]+)\//)?.[1]).filter(Boolean));
for (const folder of folders) {
  const manifest = new URL(`../assets-src/exercises/${folder}/frames.json`, import.meta.url);
  if (!existsSync(manifest)) continue;
  try {
    const { frames, thumbnail } = JSON.parse(readFileSync(manifest, 'utf8'));
    if (!Array.isArray(frames) || !frames.length || new Set(frames).size !== frames.length || !frames.includes(thumbnail)) throw new Error('fotogramas inválidos');
    const prefix = `./assets/exercises/${folder}/`;
    const referenced = [...seenPaths].filter(rel => rel.startsWith(prefix) && !rel.endsWith('/thumb.webp'));
    if (referenced.length !== frames.length || frames.some(frame => !seenPaths.has(`${prefix}${frame}.webp`))) throw new Error('el mapa no coincide con frames.json');
    declared++;
  } catch (error) { errors.push(`${folder}: ${error.message}`); }
}

if (errors.length) {
  console.error('CHECK ASSETS: FALLÓ');
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
console.log(`CHECK ASSETS: OK — ${seenPaths.size} archivos, ${Object.keys(byExercise).length} carpetas con 3 fases heredadas, ${declared} secuencias declaradas, sin duplicados por hash`);
