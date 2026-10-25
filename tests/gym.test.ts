import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { RETIRED_EXERCISES, UNCONFIRMED_EQUIPMENT, MANUAL_ONLY_EXERCISES } from '../src/data/gym';
import { buildExerciseList, createSession } from '../src/logic/session';
import type { GroupId } from '../src/db/schema';
import { createDefaultPlan } from '../src/db/schema';
import { parseBackup, serializeBackup } from '../src/db/backup';

test('las nuevas sugerencias respetan el equipo confirmado y las exclusiones en todos los modos', () => {
  const excluded = new Set([...RETIRED_EXERCISES, ...UNCONFIRMED_EQUIPMENT, ...MANUAL_ONLY_EXERCISES]);
  for (let day = 1; day <= 28; day++) for (const mode of ['mix', 'peso', 'sinpeso'] as const) {
    for (const format of ['base', 'ext', 'long'] as const) for (const group of ['pierna', 'espalda', 'pecho', 'hombro', 'bicep', 'tricep', 'core', 'aerobico'] as GroupId[]) {
      const session = { ...createSession(`2026-11-${String(day).padStart(2, '0')}`), groups: [group], mode, format };
      const entries = buildExerciseList(session, CATALOG, {});
      expect(entries.length, `${group}/${mode}/${format}`).toBeGreaterThan(0);
      for (const entry of entries) expect(excluded.has(entry.id), entry.id).toBe(false);
    }
  }
});

test('las exclusiones no borran elecciones explícitas ni registros anteriores', () => {
  const selected = { ...createSession('2026-11-01'), selectedExercises: ['bracing_90', 'knee_pushup', 'bench_crunch'] };
  expect(buildExerciseList(selected, CATALOG, {}).map(e => e.id)).toEqual(selected.selectedExercises);
  const past = { ...createSession('2026-10-12'), completed: { knee_pushup: true, bracing_90: true } };
  expect(buildExerciseList(past, CATALOG, {}, new Date('2026-10-17T12:00:00')).map(e => e.id)).toEqual(['knee_pushup', 'bracing_90']);
  const programmed = { ...createSession('2026-11-01'), groups: ['core'] as GroupId[], programmed: ['bench_crunch'] };
  expect(buildExerciseList(programmed, CATALOG, {}).map(e => e.id)).toEqual(['bench_crunch']);
});

test('la extensión retirada sigue legible en elecciones, actividad y backups anteriores', () => {
  const selected = { ...createSession('2026-10-12'), selectedExercises: ['leg_ext'] };
  const recorded = { ...createSession('2026-10-13'), completed: { leg_ext: true }, saved: true };
  const programmed = { ...createSession('2026-10-14'), groups: ['pierna'] as GroupId[], programmed: ['leg_ext'] };
  const sessions = [selected, recorded, programmed];
  const restored = parseBackup(serializeBackup({ sessions, customExercises: [], plan: createDefaultPlan() })).data;
  expect(restored.sessions).toEqual(sessions);
  for (const session of restored.sessions) {
    expect(buildExerciseList(session, CATALOG, {}, new Date('2026-10-25T12:00:00')).map(e => e.id)).toEqual(['leg_ext']);
  }
  expect(CATALOG.leg_ext.name).toBe('Extensión de cuádriceps en máquina');
});
