import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { buildExerciseList, createSession } from '../src/logic/session';
import { editExercise } from '../src/logic/exerciseEdits';
import { completedIds } from '../src/logic/activity';
import { createDefaultPlan, type Session } from '../src/db/schema';
import { rebalancePending } from '../src/logic/rebalance';
import { parseBackup, serializeBackup } from '../src/db/backup';

const now = new Date('2026-10-01T12:00:00');
const original: Session = { ...createSession('2026-10-01'), groups: ['pecho', 'bicep'], programmed: ['pec_deck', 'incline_bench_press', 'dumbbell_curl', 'hammer_curl_db'] };
const ids = (s: Session) => buildExerciseList(s, CATALOG, {}, now).map(e => e.id);

test('repeated replacements replace exactly one slot without accumulating exercises', () => {
  const first = editExercise(original, { type: 'replace', id: 'pec_deck', replacement: 'pushup' }, CATALOG, {}, now);
  expect(ids(first)).toEqual(['pushup', 'incline_bench_press', 'dumbbell_curl', 'hammer_curl_db']);
  const second = editExercise(first, { type: 'replace', id: 'pushup', replacement: 'pec_deck' }, CATALOG, {}, now);
  expect(ids(second)).toEqual(original.programmed);
});

test('remove automatic, pinned, replaced and final exercise; an empty list stays empty', () => {
  let session = original;
  for (const id of ids(session)) session = editExercise(session, { type: 'remove', id }, CATALOG, {}, now);
  expect(ids(session)).toEqual([]);
  const backup = parseBackup(serializeBackup({ sessions: [session], customExercises: [], plan: createDefaultPlan() }));
  expect(ids(backup.data.sessions[0])).toEqual([]);
  const added = editExercise(session, { type: 'add', id: 'pec_deck' }, CATALOG, {}, now);
  expect(ids(added)).toEqual(['pec_deck']);
});

test('historical Monday remains editable and preserves all unrelated checks and metrics', () => {
  const monday: Session = { ...original, date: '2026-09-28', groups: ['espalda', 'bicep'], saved: true, completed: { pec_deck: true, dumbbell_curl: true }, exerciseLog: [
    { id: 'pec_deck', name: 'Pec deck', group: 'pecho', completed: true },
    { id: 'dumbbell_curl', name: 'Curl', group: 'bicep', completed: true },
  ] };
  const snapshot = JSON.stringify(monday);
  const replaced = editExercise(monday, { type: 'replace', id: 'pec_deck', replacement: 'pushup' }, CATALOG, {}, now);
  expect(ids(replaced)).toEqual(['pushup', 'dumbbell_curl']);
  expect(completedIds(replaced)).toEqual(['dumbbell_curl']);
  expect(replaced.saved).toBe(true);
  expect(JSON.stringify(monday)).toBe(snapshot);
  expect(ids(editExercise(replaced, { type: 'remove', id: 'pushup' }, CATALOG, {}, now))).toEqual(['dumbbell_curl']);
});

test('checking and unchecking never regenerates the selected exercises', () => {
  const selected = ids(original);
  const checked = editExercise(original, { type: 'toggle', id: selected[0] }, CATALOG, {}, now);
  const unchecked = editExercise(checked, { type: 'toggle', id: selected[0] }, CATALOG, {}, now);
  expect(ids(checked)).toEqual(selected);
  expect(ids(unchecked)).toEqual(selected);
  expect(completedIds(unchecked)).toEqual([]);
});

test('automatic rebalancing respects a manual replacement even before activity', () => {
  const edited = editExercise(original, { type: 'replace', id: 'pec_deck', replacement: 'pushup' }, CATALOG, {}, now);
  const before = { sessions: { [edited.date]: edited, '2026-09-30': { ...original, date: '2026-09-30' } }, custom: {}, plan: createDefaultPlan() };
  expect(rebalancePending(before, '2026-10-01').sessions[edited.date]).toBe(edited);
});

test('manual selection cannot make the group/format controls inert', async () => {
  const { editSession } = await import('../src/logic/editSession');
  const edited = editExercise(original, { type: 'replace', id: 'pec_deck', replacement: 'pushup' }, CATALOG, {}, now);
  const changed = editSession(edited, { groups: ['pierna', 'core'] });
  expect(changed.selectedExercises).toBeUndefined();
  expect(new Set(buildExerciseList(changed, CATALOG, {}, now).map(e => e.group))).toEqual(new Set(['pierna', 'core']));
});
