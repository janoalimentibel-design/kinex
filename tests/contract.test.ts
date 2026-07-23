// Contratos heredados de A2.8 (tests/kinex.test.js) — mismas garantías, nueva base.
import fs from 'node:fs';
import { expect, test } from 'vitest';
import { CATALOG, FORMATS, GROUPS } from '../src/data/exercises';
import { REAL_IMAGES } from '../src/data/images';
import { buildExerciseList, createSession, isModeCompatible, suggestedGroups } from '../src/logic/session';

test('las cuatro vistas y controles principales siguen presentes', () => {
  const sources = fs
    .readdirSync(new URL('../src/components', import.meta.url))
    .map((f) => fs.readFileSync(new URL('../src/components/' + f, import.meta.url), 'utf8'))
    .join('\n');
  for (const id of ['view-today', 'view-lib', 'view-hist', 'view-plan']) expect(sources).toContain(id);
  for (const label of ['Marcar hecha', 'Exportar backup', 'Importar', 'Copiar resumen']) expect(sources).toContain(label);
});

test('formatos y grupos mantienen el contrato de A2.6', () => {
  expect(Object.keys(FORMATS)).toEqual(['base', 'ext', 'long']);
  expect(FORMATS.base.perGroup).toBe(2);
  expect(FORMATS.ext.extraOne).toBe(true);
  expect(FORMATS.long.perGroup).toBe(3);
  expect(Object.keys(GROUPS)).toHaveLength(7);
});

test('el catálogo incluye la base original y los ejercicios de fuerza solicitados', () => {
  const all = Object.values(CATALOG);
  expect(all).toHaveLength(135);
  const byGroup: Record<string, number> = {};
  for (const e of all) byGroup[e.group] = (byGroup[e.group] ?? 0) + 1;
  expect(byGroup).toEqual({ pierna: 34, espalda: 19, pecho: 15, hombro: 13, bicep: 15, tricep: 16, core: 23 });
  for (const id of ['back_squat', 'romanian_deadlift', 'bench_press', 'dumbbell_curl', 'ab_wheel', 'rowing_erg', 'reverse_crunch', 'russian_twist', 'bicycle_crunch']) {
    expect(CATALOG[id], `falta ${id}`).toBeDefined();
  }
});

test('ninguna ficha usa la plantilla genérica de cues heredada del prototipo', () => {
  // La plantilla genérica de A2.8 ("Controlá el movimiento", ...) fue reemplazada
  // por técnica específica en cada ficha; este test evita que vuelva a entrar.
  for (const e of Object.values(CATALOG)) {
    expect(e.cues.length, `${e.name}: sin puntos técnicos`).toBeGreaterThanOrEqual(3);
    expect(e.errors.length, `${e.name}: sin errores comunes`).toBeGreaterThanOrEqual(2);
    expect(e.cues[0], `${e.name}: cues genéricas`).not.toBe('Controlá el movimiento');
  }
});

test('la sesión inicial conserva modo mixto y dos grupos', () => {
  const session = createSession('2026-06-27');
  expect(session.mode).toBe('mix');
  expect(session.format).toBe('base');
  expect(session.groups).toHaveLength(2);
});

test('compatibilidad de modo respeta peso, sinpeso y mixto', () => {
  expect(isModeCompatible(CATALOG.pushup, 'sinpeso')).toBe(true);
  expect(isModeCompatible(CATALOG.pushup, 'peso')).toBe(false);
  expect(isModeCompatible(CATALOG.pushup, 'mix')).toBe(true);
});

test('Base arma 4 ejercicios, Extendido 5 y Largo 6, sin avanzados automáticos', () => {
  const session = createSession('2026-07-06');
  expect(buildExerciseList(session, CATALOG, {})).toHaveLength(4);
  expect(buildExerciseList({ ...session, format: 'ext' }, CATALOG, {})).toHaveLength(5);
  const long = buildExerciseList({ ...session, format: 'long' }, CATALOG, {});
  expect(long).toHaveLength(6);
  for (const entry of long) expect(CATALOG[entry.id].level).not.toBe('Avanzado');
});

test('Core propone un bloque mínimo de cuatro y los grupos anteriores reequilibran la semana', () => {
  const session = { ...createSession('2026-07-07'), groups: ['pierna', 'core'] as ['pierna', 'core'] };
  expect(buildExerciseList(session, CATALOG, {}).filter((entry) => entry.group === 'core')).toHaveLength(4);

  const monday = { ...createSession('2026-07-06'), groups: ['pierna', 'core'] as ['pierna', 'core'] };
  expect(suggestedGroups('2026-07-07', { '2026-07-06': monday })).not.toEqual(['pierna', 'core']);
});

test.each([
  ['Batch 1', ['pushup', 'pullup', 'step_bajo']],
  ['Batch 2', ['dead_bug', 'bird_dog', 'wall_sit']],
  ['Batch Core', ['plank_short', 'side_plank', 'reverse_crunch']],
])('%s tiene tres assets externos distintos por ejercicio', (_batch, ids) => {
  for (const id of ids) {
    const phases = Object.values(REAL_IMAGES[id].phases);
    expect(phases).toHaveLength(3);
    expect(new Set(phases).size).toBe(3);
    for (const asset of phases) {
      expect(asset.startsWith('data:')).toBe(false);
      // Los assets ahora viven en public/ (Vite los sirve en la raíz).
      const onDisk = new URL('../public/' + asset.replace(/^\.\//, ''), import.meta.url);
      expect(fs.existsSync(onDisk), `${id}: falta ${asset}`).toBe(true);
    }
  }
});
