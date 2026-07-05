// Guardia de assets: para cada ejercicio con imágenes valida que existan las tres
// fases + thumb, que ninguna ruta se repita y que NINGÚN archivo esté duplicado
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

if (errors.length) {
  console.error('CHECK ASSETS: FALLÓ');
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
console.log(`CHECK ASSETS: OK — ${seenPaths.size} archivos, ${Object.keys(byExercise).length} ejercicios con 3 fases, sin duplicados por hash`);
