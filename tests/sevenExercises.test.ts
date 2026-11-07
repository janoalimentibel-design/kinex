import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { automaticInGym, RETIRED_EXERCISES } from '../src/data/gym';
import { buildExerciseList, createSession } from '../src/logic/session';
import { editExercise } from '../src/logic/exerciseEdits';
import { createDefaultPlan, type GroupId } from '../src/db/schema';
import { parseBackup, serializeBackup } from '../src/db/backup';

const additions: [string, GroupId][] = [
  ['concentration_curl', 'bicep'], ['cable_overhead_triceps', 'tricep'],
  ['decline_barbell_press', 'pecho'], ['neutral_lat_pulldown', 'espalda'],
  ['front_raise_db', 'hombro'], ['seated_calf_raise_db', 'pierna'], ['kneeling_cable_crunch', 'core'],
];
test.each(additions)('%s can be chosen manually without entering automatic suggestions', (id, group) => {
  expect(CATALOG[id]?.group).toBe(group);
  expect(RETIRED_EXERCISES.has(id)).toBe(false);
  expect(automaticInGym(id)).toBe(false);
  const now = new Date('2026-11-07T12:00:00');
  const initial = { ...createSession('2026-11-07'), groups: [group], selectedExercises: [] };
  const selected = editExercise(initial, { type: 'add', id }, CATALOG, {}, now);
  expect(buildExerciseList(selected, CATALOG, {}, now).map(e => e.id)).toEqual([id]);
  const history = { ...createSession('2026-11-01'), selectedExercises: ['supine_row_band'], completed: { supine_row_band: true }, saved: true };
  const restored = parseBackup(serializeBackup({ sessions: [history, selected], customExercises: [], plan: createDefaultPlan() })).data;
  expect(restored.sessions).toEqual([history, selected]);
  for (let day = 7; day <= 28; day++) for (const mode of ['mix', 'peso', 'sinpeso'] as const) {
    const session = { ...createSession(`2026-11-${String(day).padStart(2, '0')}`), groups: [group], format: 'long' as const, mode };
    expect(buildExerciseList(session, CATALOG, {}).map(e => e.id)).not.toContain(id);
  }
});
