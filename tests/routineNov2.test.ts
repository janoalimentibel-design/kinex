import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { automaticInGym } from '../src/data/gym';
import { toAppData, toExportData, type AppData } from '../src/db/bootstrap';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { createDefaultPlan, emptyTrainingProfile, type Session } from '../src/db/schema';
import { createSession, buildExerciseList } from '../src/logic/session';
import { rebalancePending } from '../src/logic/rebalance';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';
import { applyNov2Routine, NOV2_DAYS, NOV2_ID } from '../src/logic/routineNov2';

// Synthetic activity only; no personal backup or profile is used.
function fixture(): AppData {
  const previous = { ...createSession('2026-10-29'), completed: { pushup: true } };
  return {
    plan: { ...createDefaultPlan(), routineRevision: '2026-10-26-r1', rule: 'Synthetic personal rule' },
    profile: emptyTrainingProfile(), custom: {}, sessions: { [previous.date]: previous },
  };
}

test('starts with legs on Monday, covers seven groups and uses confirmed equipment without manufacturing activity', () => {
  const before = fixture(), snapshot = JSON.stringify(before);
  const after = rebalancePending(applyPublishedRoutine(before, '2026-11-02'), '2026-11-02');
  expect(JSON.stringify(before)).toBe(snapshot);
  expect(after.plan.routineRevision).toBe(NOV2_ID);
  expect(after.profile).toBe(before.profile);
  expect(after.custom).toBe(before.custom);
  expect(after.plan.rule).toBe(before.plan.rule);
  expect(after.sessions['2026-10-29']).toBe(before.sessions['2026-10-29']);
  expect(NOV2_DAYS.map(day => day.date)).toEqual(['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-07']);
  expect(after.sessions['2026-11-02'].groups).toEqual(['pierna', 'hombro']);
  expect(new Set(NOV2_DAYS.flatMap(day => day.groups))).toEqual(new Set(['pierna', 'hombro', 'pecho', 'tricep', 'espalda', 'bicep', 'core']));
  for (const day of NOV2_DAYS) {
    const session = after.sessions[day.date];
    expect(session.programmed).toEqual(day.ids);
    expect(buildExerciseList(session, CATALOG, after.sessions).map(item => item.id)).toEqual(day.ids);
    expect(session.saved).toBe(false);
    expect(session.completed).toEqual({});
    expect(session.setLogs).toBeUndefined();
    expect(new Set(day.ids).size).toBe(day.ids.length);
    for (const id of day.ids) {
      expect(CATALOG[id], id).toBeDefined();
      expect(session.groups, id).toContain(CATALOG[id].group);
      expect(automaticInGym(id), id).toBe(true);
    }
  }
  for (const date of ['2026-11-04', '2026-11-06', '2026-11-08']) expect(after.sessions[date]).toBeUndefined();
});

test.each([
  ['completed', { completed: { bird_dog: true } }],
  ['saved', { saved: true }],
  ['edited', { manuallyEdited: true }],
  ['replacement', { replacements: { bird_dog: 'pallof' } }],
  ['extra', { extras: ['pallof'] }],
  ['explicitly empty', { selectedExercises: [] }],
  ['selected', { selectedExercises: ['bird_dog'] }],
  ['programmed', { programmed: ['bird_dog'], programTitle: 'Synthetic external program' }],
  ['partial sets', { setLogs: { bird_dog: [{ reps: 6, load: null, rpe: null, done: true }, { reps: 6, load: null, rpe: null, done: false }] } }],
  ['historical name', { exerciseLog: [{ id: 'bird_dog', name: 'Synthetic historical name', group: 'core', completed: true }] }],
] as [string, Partial<Session>][])('preserves %s when loading the new week', (_label, patch) => {
  const before = fixture();
  const existing = { ...createSession('2026-11-02'), groups: ['core'] as Session['groups'], ...patch };
  before.sessions[existing.date] = existing;
  const after = applyNov2Routine(before, '2026-11-02', true);
  expect(after.sessions[existing.date]).toBe(existing);
  expect(after.sessions['2026-11-03'].programmed).toEqual(NOV2_DAYS[1].ids);
});

test('late delivery preserves past sessions and never fabricates missed training', () => {
  const before = fixture();
  const existing = { ...createSession('2026-11-03'), selectedExercises: [] };
  before.sessions[existing.date] = existing;
  const after = applyNov2Routine(before, '2026-11-05', true);
  expect(after.sessions['2026-11-02']).toBeUndefined();
  expect(after.sessions[existing.date]).toBe(existing);
  expect(after.sessions['2026-11-05'].programmed).toEqual(NOV2_DAYS[2].ids);
});

test('only recent activity enables automatic delivery and force stays inside the week', () => {
  const empty = { ...fixture(), sessions: {} };
  expect(applyNov2Routine(empty, '2026-11-02')).toBe(empty);
  expect(applyNov2Routine(empty, '2026-11-02', true).plan.routineRevision).toBe(NOV2_ID);
  for (const date of ['2026-10-31', '2026-11-09']) expect(applyNov2Routine(fixture(), date, true)).toEqual(fixture());
  const stale = { ...empty, sessions: { '2026-09-01': { ...createSession('2026-09-01'), saved: true } } };
  expect(applyNov2Routine(stale, '2026-11-02')).toBe(stale);
});

test('reload and a v2 backup roundtrip preserve the delivered routine and its history', () => {
  const after = applyNov2Routine(fixture(), '2026-11-02');
  expect(applyNov2Routine(after, '2026-11-02', true)).toBe(after);
  const restored = toAppData(parseBackup(serializeBackup(toExportData(after), new Date('2026-11-02T12:00:00Z'))).data);
  expect(restored).toEqual(after);
  expect(applyPublishedRoutine(restored, '2026-11-03')).toBe(restored);
});


test('an untouched adaptive draft and an adjacent Sunday draft cannot displace requested Monday legs', () => {
  const before = fixture();
  before.sessions['2026-11-01'] = { ...createSession('2026-11-01'), groups: ['pierna', 'hombro'], programmed: ['glute_bridge'], planner: { source: 'adaptive', week: '2026-10-26' } };
  before.sessions['2026-11-02'] = { ...createSession('2026-11-02'), groups: ['espalda', 'bicep'], programmed: ['pullup'], planner: { source: 'adaptive', week: '2026-11-02' } };
  const after = rebalancePending(applyPublishedRoutine(before, '2026-11-02'), '2026-11-02');
  expect(after.sessions['2026-11-02'].groups).toEqual(['pierna', 'hombro']);
  expect(after.sessions['2026-11-02'].programmed).toEqual(NOV2_DAYS[0].ids);
  expect(after.sessions['2026-11-02'].planner).toBeUndefined();
  expect(after.sessions['2026-11-01']).toBe(before.sessions['2026-11-01']);
});
