import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { RETIRED_EXERCISES } from '../src/data/gym';
import type { AppData } from '../src/db/bootstrap';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { toAppData, toExportData } from '../src/db/bootstrap';
import { createDefaultPlan } from '../src/db/schema';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';
import { buildExerciseList, createSession } from '../src/logic/session';

const today = '2026-11-06';
function fixture(): AppData {
  return { plan: { ...createDefaultPlan(), routineRevision: '2026-11-02-r1' }, custom: {}, sessions: {} };
}

test('removes only requested pending exercises from today and future explicit choices', () => {
  const before = fixture();
  before.sessions[today] = { ...createSession(today), groups: ['espalda', 'bicep'], selectedExercises: ['pullup', 'band_pulldown', 'towel_hold', 'hammer_curl_db'], completed: { pullup: true }, exerciseLog: [{ id: 'band_pulldown', name: 'Pending', group: 'espalda', completed: false }, { id: 'pullup', name: 'Recorded', group: 'espalda', completed: true }], manuallyEdited: true };
  before.sessions['2026-11-09'] = { ...createSession('2026-11-09'), groups: ['espalda', 'bicep'], programmed: ['band_pulldown', 'hammer_curl_db'], extras: ['towel_hold'], planner: { source: 'adaptive', week: '2026-11-09', locked: true } };
  const snapshot = JSON.stringify(before);
  const after = applyPublishedRoutine(before, today);
  expect(JSON.stringify(before)).toBe(snapshot);
  expect(after.sessions[today].selectedExercises).toEqual(['pullup', 'hammer_curl_db']);
  expect(after.sessions[today].completed).toBe(before.sessions[today].completed);
  expect(after.sessions[today].manuallyEdited).toBe(true);
  expect(after.sessions[today].exerciseLog?.map(e => e.id)).toEqual(['pullup']);
  expect(after.sessions['2026-11-09'].programmed).toEqual(['hammer_curl_db']);
  expect(after.sessions['2026-11-09'].extras).toEqual([]);
  expect(after.plan).toBe(before.plan);
  expect(applyPublishedRoutine(after, today)).toBe(after);
  const imported = toAppData(parseBackup(serializeBackup(toExportData(before))).data);
  expect(applyPublishedRoutine(imported, today)).toEqual(after);
});

test('preserves past sessions and target activity, partial sets and completed logs today', () => {
  for (const patch of [
    { completed: { towel_hold: true } },
    { setLogs: { towel_hold: [{ reps: 4, load: null, rpe: null, done: false }] } },
    { exerciseLog: [{ id: 'towel_hold', name: 'Historical grip', group: 'bicep' as const, completed: true }] },
  ]) {
    const data = fixture();
    const past = { ...createSession('2026-11-05'), selectedExercises: ['band_pulldown', 'towel_hold'] };
    data.sessions[past.date] = past;
    data.sessions[today] = { ...createSession(today), selectedExercises: ['band_pulldown', 'towel_hold'], ...patch };
    const after = applyPublishedRoutine(data, today);
    expect(after.sessions[past.date]).toBe(past);
    expect(after.sessions[today].selectedExercises).toEqual(['towel_hold']);
    expect(after.sessions[today]).toMatchObject(patch);
  }
});

test('keeps personal replacements of retired originals, and removes replacements targeting them', () => {
  const data = fixture();
  data.sessions[today] = { ...createSession(today), groups: ['espalda', 'bicep'], programmed: ['band_pulldown', 'hammer_curl_db', 'pullup'], extras: ['towel_hold'], replacements: { band_pulldown: 'chest_supported_db_row', hammer_curl_db: 'towel_hold', towel_hold: 'incline_db_curl' } };
  const after = applyPublishedRoutine(data, today);
  expect(buildExerciseList(after.sessions[today], CATALOG, after.sessions).map(e => e.id)).toEqual(['chest_supported_db_row', 'pullup', 'incline_db_curl']);
});

test('retired exercises remain readable in catalog and cannot reenter automatic routines', () => {
  for (const id of ['band_pulldown', 'towel_hold']) {
    expect(CATALOG[id]).toBeDefined();
    expect(RETIRED_EXERCISES.has(id)).toBe(true);
  }
  for (const mode of ['mix', 'peso', 'sinpeso'] as const) for (let day = 6; day <= 30; day++) {
    const session = { ...createSession(`2026-11-${String(day).padStart(2, '0')}`), groups: ['espalda', 'bicep'] as ['espalda', 'bicep'], mode, format: 'long' as const };
    expect(buildExerciseList(session, CATALOG, {}).map(e => e.id)).not.toEqual(expect.arrayContaining(['band_pulldown']));
    expect(buildExerciseList(session, CATALOG, {}).map(e => e.id)).not.toContain('towel_hold');
  }
});
