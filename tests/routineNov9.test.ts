import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { automaticInGym } from '../src/data/gym';
import { toAppData, toExportData, type AppData } from '../src/db/bootstrap';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { createDefaultPlan, emptyTrainingProfile, type Session } from '../src/db/schema';
import { createSession, buildExerciseList } from '../src/logic/session';
import { rebalancePending } from '../src/logic/rebalance';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';
import { applyNov9Routine, NOV9_DAYS, NOV9_ID, NOV9_PREVIOUS_DAYS, NOV9_PREVIOUS_ID, NOV9_SECOND_ID, NOV9_SECOND_DAYS } from '../src/logic/routineNov9';

// Synthetic activity only; no personal backup or profile is used.
function fixture(): AppData {
  const previous = { ...createSession('2026-10-29'), completed: { pushup: true } };
  return {
    plan: { ...createDefaultPlan(), routineRevision: '2026-10-26-r1', rule: 'Synthetic personal rule' },
    profile: emptyTrainingProfile(), custom: {}, sessions: { [previous.date]: previous },
  };
}

test('starts with chest on Monday, covers seven groups and uses confirmed equipment without manufacturing activity', () => {
  const before = fixture(), snapshot = JSON.stringify(before);
  const after = rebalancePending(applyPublishedRoutine(before, '2026-11-09'), '2026-11-09');
  expect(JSON.stringify(before)).toBe(snapshot);
  expect(after.plan.routineRevision).toBe(NOV9_ID);
  expect(after.profile).toBe(before.profile);
  expect(after.custom).toBe(before.custom);
  expect(after.plan.rule).toBe(before.plan.rule);
  expect(after.sessions['2026-10-29']).toBe(before.sessions['2026-10-29']);
  expect(NOV9_DAYS.map(day => day.date)).toEqual(['2026-11-09', '2026-11-10', '2026-11-12', '2026-11-14']);
  expect(after.sessions['2026-11-09'].groups).toEqual(['pecho', 'tricep']);
  expect(new Set(NOV9_DAYS.flatMap(day => day.groups))).toEqual(new Set(['pierna', 'hombro', 'pecho', 'tricep', 'espalda', 'bicep', 'core']));
  for (const day of NOV9_DAYS) {
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
      expect(id === 'seated_calf_raise_db' || automaticInGym(id), id).toBe(true);
      expect(['standing_calf_raise', 'calf_machine', 'band_pulldown', 'towel_hold']).not.toContain(id);
    }
  }
  for (const date of ['2026-11-11', '2026-11-13', '2026-11-15']) expect(after.sessions[date]).toBeUndefined();
});

test.each([
  ['completed', { completed: { bird_dog: true } }],
  ['saved', { saved: true }],
  ['locked', { planner: { source: 'adaptive', week: '2026-11-09', locked: true } }],
  ['uncompleted set notes', { setLogs: { bird_dog: [{ reps: 6, load: 10, rpe: null, done: false }] } }],
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
  const existing = { ...createSession('2026-11-09'), groups: ['core'] as Session['groups'], ...patch };
  before.sessions[existing.date] = existing;
  const after = applyNov9Routine(before, '2026-11-09', true);
  expect(after.sessions[existing.date]).toBe(existing);
  expect(after.sessions['2026-11-10'].programmed).toEqual(NOV9_DAYS[1].ids);
});

test('late delivery preserves past sessions and never fabricates missed training', () => {
  const before = fixture();
  const existing = { ...createSession('2026-11-10'), selectedExercises: [] };
  before.sessions[existing.date] = existing;
  const after = applyNov9Routine(before, '2026-11-12', true);
  expect(after.sessions['2026-11-09']).toBeUndefined();
  expect(after.sessions[existing.date]).toBe(existing);
  expect(after.sessions['2026-11-12'].programmed).toEqual(NOV9_DAYS[2].ids);
});

test('only recent activity enables automatic delivery and force stays inside the week', () => {
  const empty = { ...fixture(), sessions: {} };
  expect(applyNov9Routine(empty, '2026-11-09')).toBe(empty);
  expect(applyNov9Routine(empty, '2026-11-09', true).plan.routineRevision).toBe(NOV9_ID);
  for (const date of ['2026-11-07', '2026-11-16']) expect(applyNov9Routine(fixture(), date, true)).toEqual(fixture());
  const stale = { ...empty, sessions: { '2026-09-01': { ...createSession('2026-09-01'), saved: true } } };
  expect(applyNov9Routine(stale, '2026-11-09')).toBe(stale);
});

test('reload and a v2 backup roundtrip preserve the delivered routine and its history', () => {
  const after = applyNov9Routine(fixture(), '2026-11-09');
  expect(applyNov9Routine(after, '2026-11-09', true)).toBe(after);
  const restored = toAppData(parseBackup(serializeBackup(toExportData(after), new Date('2026-11-09T12:00:00Z'))).data);
  expect(restored).toEqual(after);
  expect(applyPublishedRoutine(restored, '2026-11-10')).toBe(restored);
});


test('an untouched adaptive draft and an adjacent Sunday draft cannot displace requested Monday chest', () => {
  const before = fixture();
  before.sessions['2026-11-08'] = { ...createSession('2026-11-08'), groups: ['pierna', 'hombro'], programmed: ['glute_bridge'], planner: { source: 'adaptive', week: '2026-10-26' } };
  before.sessions['2026-11-09'] = { ...createSession('2026-11-09'), groups: ['espalda', 'bicep'], programmed: ['pullup'], planner: { source: 'adaptive', week: '2026-11-09' } };
  const after = rebalancePending(applyPublishedRoutine(before, '2026-11-09'), '2026-11-09');
  expect(after.sessions['2026-11-09'].groups).toEqual(['pecho', 'tricep']);
  expect(after.sessions['2026-11-09'].programmed).toEqual(NOV9_DAYS[0].ids);
  expect(after.sessions['2026-11-09'].planner).toBeUndefined();
  expect(after.sessions['2026-11-08']).toBe(before.sessions['2026-11-08']);
});

test('Sunday preview delivers the next week without replacing today or downgrading on reload', () => {
  const before = fixture();
  const sunday = { ...createSession('2026-11-08'), completed: { bird_dog: true } };
  before.sessions[sunday.date] = sunday;
  const after = applyPublishedRoutine(before, '2026-11-08');
  expect(after.plan.routineRevision).toBe(NOV9_ID);
  expect(after.sessions[sunday.date]).toBe(sunday);
  expect(after.sessions['2026-11-09'].programmed).toEqual(NOV9_DAYS[0].ids);
  expect(applyPublishedRoutine(after, '2026-11-08', true)).toBe(after);
});

function previousRoutine(): AppData {
  const data = fixture();
  data.plan.routineRevision = NOV9_PREVIOUS_ID;
  for (const day of NOV9_PREVIOUS_DAYS) data.sessions[day.date] = {
    ...createSession(day.date), groups: day.groups.slice(), programmed: day.ids.slice(), format: 'ext', programTitle: 'Rutina semanal · 9–15 nov',
  };
  return data;
}

test('migrates untouched r1 after unsaved Sunday activity and stays stable on reload', () => {
  const before = previousRoutine();
  before.sessions['2026-11-08'] = { ...createSession('2026-11-08'), completed: { glute_bridge: true, bird_dog: true }, saved: false };
  const snapshot = structuredClone(before);
  const after = rebalancePending(applyPublishedRoutine(before, '2026-11-09'), '2026-11-09');
  expect(before).toEqual(snapshot);
  expect(after.plan.routineRevision).toBe(NOV9_ID);
  for (const day of NOV9_DAYS) expect(after.sessions[day.date].programmed).toEqual(day.ids);
  expect(after.sessions['2026-11-08']).toBe(before.sessions['2026-11-08']);
  expect(rebalancePending(applyPublishedRoutine(after, '2026-11-09'), '2026-11-09')).toBe(after);
});

test.each([
  { completed: { bench_leg_extension: true } }, { completed: { bench_leg_extension: false } },
  { manuallyEdited: true }, { selectedExercises: [] }, { mode: 'sinpeso' }, { format: 'base' }, { extraTarget: 'g1' },
  { checkin: { lumbar: 0, knee: 0, energy: 'alta', timeMinutes: 20 } },
  { metrics: { lumbarBefore: 0, lumbarAfter: 0, knee: 0, energy: 'alta', notes: 'Synthetic note' } },
  { setLogs: { bench_leg_extension: [{ reps: 6, load: 9, rpe: null, done: false }] } },
  { exerciseLog: [{ id: 'bench_leg_extension', name: 'Synthetic', group: 'pierna', completed: false }] },
  { replacements: { bench_leg_extension: 'glute_bridge' } }, { extras: ['tibialis'] },
  { planner: { source: 'adaptive', week: '2026-11-09' } }, { programTitle: 'Someone else' },
] as Partial<Session>[])('migration preserves r1 with any recorded or explicit change: %j', patch => {
  const before = previousRoutine();
  before.sessions['2026-11-09'] = { ...before.sessions['2026-11-09'], ...patch };
  const after = applyPublishedRoutine(before, '2026-11-09');
  expect(after.sessions['2026-11-09']).toBe(before.sessions['2026-11-09']);
  expect(after.sessions['2026-11-10'].groups).toEqual(['espalda', 'bicep']);
});

test('r2 detects new adjacent unsaved work and rebalance cannot undo its repair', () => {
  const before = applyNov9Routine(fixture(), '2026-11-08');
  before.sessions['2026-11-08'] = { ...createSession('2026-11-08'), completed: { pushup: true }, saved: false };
  const after = rebalancePending(applyPublishedRoutine(before, '2026-11-09'), '2026-11-09');
  expect(after.sessions['2026-11-09'].groups).not.toContain('pecho');
  expect(after.sessions['2026-11-09'].programmed).not.toContain('pushup');
  expect(after.sessions['2026-11-08']).toBe(before.sessions['2026-11-08']);
  expect(rebalancePending(applyPublishedRoutine(after, '2026-11-09'), '2026-11-09')).toBe(after);
});

test('later revisions never degrade on the overlapping Sunday', () => {
  const before = previousRoutine();
  before.plan.routineRevision = '2026-11-09-r4';
  expect(applyPublishedRoutine(before, '2026-11-08', true)).toBe(before);
});

test.each([
  { manuallyEdited: true }, { selectedExercises: [] }, { completed: { bird_dog: false } },
  { setLogs: { bird_dog: [{ reps: 6, load: 3, rpe: null, done: false }] } },
  { metrics: { lumbarBefore: 0, lumbarAfter: 0, knee: 0, energy: 'alta', notes: 'Synthetic' } },
  { checkin: { lumbar: 0, knee: 0, energy: 'alta', timeMinutes: 20 } },
] as Partial<Session>[])('does not readjust a repaired proposal after an explicit edit or recorded payload: %j', patch => {
  let before = applyNov9Routine(fixture(), '2026-11-08');
  before.sessions['2026-11-11'] = { ...createSession('2026-11-11'), completed: { glute_bridge: true } };
  before = rebalancePending(before, '2026-11-11');
  expect(before.sessions['2026-11-12'].programTitle).toBe('Próxima semana · Ajustada a la actividad registrada');
  const existing = { ...before.sessions['2026-11-12'], ...patch };
  before.sessions['2026-11-12'] = existing;
  before.sessions['2026-11-11'] = { ...createSession('2026-11-11'), completed: { pushup: true, bird_dog: true, dumbbell_shoulder_press: true } };
  const after = rebalancePending(applyPublishedRoutine(before, '2026-11-11'), '2026-11-11');
  expect(after.sessions['2026-11-12']).toBe(existing);
});

function secondRoutine(): AppData {
  const data = fixture();
  data.plan.routineRevision = NOV9_SECOND_ID;
  for (const day of NOV9_SECOND_DAYS) data.sessions[day.date] = {
    ...createSession(day.date), groups: day.groups.slice(), programmed: day.ids.slice(), format: 'ext', programTitle: 'Rutina semanal · 9–15 nov',
  };
  return data;
}

test('revised Tuesday pairs a supinated bar curl with one neutral hammer without adding volume', () => {
  const before = secondRoutine();
  const after = applyPublishedRoutine(before, '2026-11-10');
  const ids = buildExerciseList(after.sessions['2026-11-10'], CATALOG, after.sessions).map(entry => entry.id);
  expect(ids.filter(id => CATALOG[id].group === 'bicep')).toEqual(['barbell_curl', 'hammer_curl_db']);
  expect(ids).toHaveLength(before.sessions['2026-11-10'].programmed!.length);
  for (const date of ['2026-11-09', '2026-11-12', '2026-11-14']) expect(after.sessions[date]).toBe(before.sessions[date]);
  expect(automaticInGym('barbell_curl')).toBe(true);
  expect(CATALOG.barbell_curl.sets).toBe(CATALOG.dumbbell_curl.sets);
  expect(applyPublishedRoutine(after, '2026-11-10')).toBe(after);
});

test('biceps revision preserves a past Tuesday exactly and never rewrites performed exercise IDs', () => {
  const before = secondRoutine();
  const session = before.sessions['2026-11-10'];
  const after = applyPublishedRoutine(before, '2026-11-11');
  expect(after.sessions['2026-11-10']).toBe(session);
  expect(session.programmed).toContain('dumbbell_curl');
  expect(after.plan.routineRevision).toBe(NOV9_ID);
});

test.each([
  { completed: { dumbbell_curl: true } },
  { saved: true },
  { manuallyEdited: true },
  { selectedExercises: ['dumbbell_curl', 'hammer_curl_db'] },
  { replacements: { dumbbell_curl: 'cable_curl' } },
  { setLogs: { dumbbell_curl: [{ reps: 10, load: 5, rpe: null, done: false }] } },
  { exerciseLog: [{ id: 'dumbbell_curl', name: 'Synthetic curl record', group: 'bicep', completed: true }] },
] as Partial<Session>[])('biceps migration leaves Tuesday activity and explicit choices intact: %j', patch => {
  const before = secondRoutine();
  const session = { ...before.sessions['2026-11-10'], ...patch };
  before.sessions['2026-11-10'] = session;
  const snapshot = structuredClone(before);
  const after = applyPublishedRoutine(before, '2026-11-10');
  expect(before).toEqual(snapshot);
  expect(after.sessions['2026-11-10']).toBe(session);
});
