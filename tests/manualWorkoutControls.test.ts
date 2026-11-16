import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { createDefaultPlan, type Session } from '../src/db/schema';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { buildExerciseList, createSession } from '../src/logic/session';
import { editExercise } from '../src/logic/exerciseEdits';
import { editSession } from '../src/logic/editSession';

const now = new Date('2026-11-16T12:00:00');
const ids = (session: Session) => buildExerciseList(session, CATALOG, {}, now).map(entry => entry.id);
function chosen(): Session {
  let session: Session = {
    ...createSession('2026-11-16'), groups: ['pecho', 'bicep'],
    programmed: ['pec_deck', 'incline_bench_press', 'dumbbell_curl', 'hammer_curl_db'],
  };
  for (const edit of [
    { type: 'replace', id: 'pec_deck', replacement: 'pushup' },
    { type: 'replace', id: 'hammer_curl_db', replacement: 'preacher_curl' },
    { type: 'remove', id: 'incline_bench_press' },
  ] as const) session = editExercise(session, edit, CATALOG, {}, now);
  return session;
}

test('expanding a manually chosen workout preserves replacements and does not refill the removed slot', () => {
  const original = chosen();
  const extended = editSession(original, { format: 'ext', extraTarget: 'g1' }, CATALOG, {}, now);
  expect(ids(extended)).toEqual(expect.arrayContaining(['pushup', 'dumbbell_curl', 'preacher_curl']));
  expect(ids(extended)).toHaveLength(4);
  const longer = editSession(extended, { format: 'long' }, CATALOG, {}, now);
  expect(ids(longer)).toEqual(expect.arrayContaining(ids(extended)));
  expect(ids(longer)).toHaveLength(5);
  for (const session of [extended, longer]) {
    for (const id of ['pec_deck', 'incline_bench_press', 'hammer_curl_db']) expect(ids(session)).not.toContain(id);
    expect(new Set(ids(session)).size).toBe(ids(session).length);
  }
  expect(ids(original)).toEqual(['pushup', 'dumbbell_curl', 'preacher_curl']);
});

test('changing one muscle keeps the other muscles chosen exercises, checks and partial sets', () => {
  const original = {
    ...chosen(), completed: { dumbbell_curl: true, incline_bench_press: false, pec_deck: false, hammer_curl_db: false },
    setLogs: { dumbbell_curl: [{ reps: 9, load: 8, rpe: 6, done: false }] },
  };
  const changed = editSession(original, { groups: ['espalda', 'bicep'] }, CATALOG, {}, now);
  expect(ids(changed).filter(id => CATALOG[id].group === 'bicep')).toEqual(['dumbbell_curl', 'preacher_curl']);
  expect(ids(changed).filter(id => CATALOG[id].group === 'espalda')).toHaveLength(2);
  expect(changed.completed).toBe(original.completed);
  expect(changed.exerciseLog).toBe(original.exerciseLog);
  expect(changed.setLogs).toBe(original.setLogs);
  const restored = parseBackup(serializeBackup({ sessions: [changed], customExercises: [], plan: createDefaultPlan() })).data.sessions[0];
  expect(ids(restored)).toEqual(ids(changed));
  expect(restored.setLogs).toEqual(changed.setLogs);
});

test('an intentionally empty retained muscle stays empty while a newly selected muscle receives suggestions', () => {
  const empty: Session = { ...createSession('2026-11-16'), groups: ['pecho', 'bicep'], selectedExercises: [], manuallyEdited: true };
  const changed = editSession(empty, { groups: ['espalda', 'bicep'] }, CATALOG, {}, now);
  expect(ids(changed).every(id => CATALOG[id].group === 'espalda')).toBe(true);
  expect(ids(changed)).toHaveLength(2);
});

test('changing equipment replaces only incompatible choices and retains existing compatible ones', () => {
  const original = chosen();
  const changed = editSession(original, { mode: 'sinpeso' }, CATALOG, {}, now);
  expect(ids(changed)).toContain('pushup');
  expect(ids(changed)).not.toContain('pec_deck');
  for (const id of ids(changed)) expect(CATALOG[id].modes).toContain('sinpeso');
  expect(changed.completed).toBe(original.completed);
});
