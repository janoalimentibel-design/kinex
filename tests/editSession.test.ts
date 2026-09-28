import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { buildExerciseList, createSession } from '../src/logic/session';
import { editSession } from '../src/logic/editSession';

const now = new Date('2026-09-28T12:00:00');
const pinned = {
  ...createSession('2026-09-28'), groups: ['espalda', 'bicep'] as ['espalda', 'bicep'],
  programmed: ['pullup', 'seated_row_machine', 'dumbbell_curl', 'hammer_curl_db'],
  programTitle: 'Semana revisada · Espalda + Bíceps',
  completed: { pullup: true },
  exerciseLog: [{ id: 'pullup', name: 'Dominadas estrictas', group: 'espalda' as const, completed: true }],
};

test('changing muscles releases the old pinned plan and retains completed exercise records', () => {
  const edited = editSession(pinned, { groups: ['pecho', 'tricep'], completed: {}, saved: false });
  expect(edited.programmed).toBeUndefined();
  expect(edited.programTitle).toBeUndefined();
  expect(edited.completed).toEqual({ pullup: true });
  expect(edited.exerciseLog).toBe(pinned.exerciseLog);
  const list = buildExerciseList(edited, CATALOG, {}, now);
  expect(list).toHaveLength(4);
  expect(new Set(list.map((e) => e.group))).toEqual(new Set(['pecho', 'tricep']));
  expect(pinned.programmed).toHaveLength(4);
});

test('already broken saved drafts show exercises for both newly selected muscles', () => {
  const broken = { ...pinned, groups: ['pierna', 'core'] as ['pierna', 'core'], completed: {}, exerciseLog: [] };
  const list = buildExerciseList(broken, CATALOG, {}, now);
  expect(list.filter((e) => e.group === 'pierna')).toHaveLength(2);
  expect(list.filter((e) => e.group === 'core')).toHaveLength(4);
});

test('format and equipment changes regenerate the plan without erasing activity', () => {
  const long = editSession(pinned, { format: 'long' });
  expect(buildExerciseList(long, CATALOG, {}, now)).toHaveLength(6);
  const bodyweight = editSession(pinned, { mode: 'sinpeso' });
  expect(buildExerciseList(bodyweight, CATALOG, {}, now).every((e) => CATALOG[e.id].modes.includes('sinpeso'))).toBe(true);
  expect(bodyweight.completed).toEqual(pinned.completed);
});

test('marking or unmarking an exercise never invalidates the pinned routine', () => {
  const edited = editSession(pinned, { completed: { pullup: false } });
  expect(edited.programmed).toBe(pinned.programmed);
  expect(edited.completed.pullup).toBe(false);
});
