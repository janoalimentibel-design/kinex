import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { RETIRED_EXERCISES, UNCONFIRMED_EQUIPMENT } from '../src/data/gym';
import { toAppData, toExportData, type AppData } from '../src/db/bootstrap';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { createDefaultPlan, emptyTrainingProfile, type Session } from '../src/db/schema';
import { createSession, buildExerciseList } from '../src/logic/session';
import { rebalancePending } from '../src/logic/rebalance';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';
import { applyOct26Routine, OCT26_AVAILABLE, OCT26_DAYS, OCT26_END, OCT26_ID, OCT26_START } from '../src/logic/routineOct26';

// Entirely synthetic history: no backups or personal health records are used.
function fixture(): AppData {
  const sunday: Session = {
    ...createSession('2026-10-25'), groups: ['pierna', 'core'],
    completed: { glute_bridge: true, bench_crunch: true },
    exerciseLog: [{ id: 'bench_crunch', name: 'Abdominal corto en banco con rodillos', group: 'core', completed: true }],
  };
  return {
    plan: { ...createDefaultPlan(), rule: 'Regla ficticia conservada', routineRevision: '2026-09-28-r1' },
    custom: { synthetic_curl: { ...CATALOG.dumbbell_curl, id: 'synthetic_curl', name: 'Curl de prueba' } },
    profile: { ...emptyTrainingProfile(), goals: 'Perfil ficticio', updatedAt: '2026-10-25T09:00:00Z' },
    sessions: { [sunday.date]: sunday },
  };
}

test('delivers the approved week on Sunday without mutating history, profile, custom exercises or personal rule', () => {
  const before = fixture(), snapshot = JSON.stringify(before);
  const after = applyOct26Routine(before, '2026-10-25');
  expect([OCT26_AVAILABLE, OCT26_START, OCT26_END, OCT26_ID]).toEqual(['2026-10-25', '2026-10-26', '2026-11-01', '2026-10-26-r1']);
  expect(JSON.stringify(before)).toBe(snapshot);
  expect(after.sessions['2026-10-25']).toBe(before.sessions['2026-10-25']);
  expect(after.custom).toBe(before.custom);
  expect(after.profile).toBe(before.profile);
  expect(after.plan.rule).toBe(before.plan.rule);
  expect(after.plan.routineRevision).toBe(OCT26_ID);
  expect(OCT26_DAYS.map(day => day.date)).toEqual(['2026-10-26', '2026-10-27', '2026-10-29', '2026-10-31']);
  const expected = [
    ['incline_bench_press', 'pec_deck', 'pushup', 'rope_pressdown', 'supported_db_kickback'],
    ['pullup', 'chest_supported_db_row', 'pull_apart_back', 'incline_db_curl', 'hammer_curl_db'],
    ['bench_leg_extension', 'glute_bridge', 'standing_calf_raise', 'dumbbell_shoulder_press', 'lateral_raise_db'],
    ['romanian_deadlift', 'tibialis', 'bird_dog', 'side_plank', 'pallof', 'decline_bench_crunch'],
  ];
  for (const [index, day] of OCT26_DAYS.entries()) {
    expect(day.ids).toEqual(expected[index]);
    expect(after.sessions[day.date].programmed).toEqual(expected[index]);
    expect(after.sessions[day.date].groups).toEqual(day.groups);
    expect(buildExerciseList(after.sessions[day.date], CATALOG, after.sessions).map(entry => entry.id)).toEqual(expected[index]);
  }
});

test('integrated publication and rebalancing respect Sunday and cover the seven strength groups', () => {
  const after = rebalancePending(applyPublishedRoutine(fixture(), '2026-10-25'), '2026-10-25');
  expect(after.plan.routineRevision).toBe(OCT26_ID);
  expect(after.sessions['2026-10-26'].groups).toEqual(['pecho', 'tricep']);
  const groups = new Set(OCT26_DAYS.flatMap(day => after.sessions[day.date].groups));
  expect([...groups].sort()).toEqual(['bicep', 'core', 'espalda', 'hombro', 'pecho', 'pierna', 'tricep']);
  const allIds = OCT26_DAYS.flatMap(day => after.sessions[day.date].programmed ?? []);
  expect(allIds.filter(id => id === 'decline_bench_crunch')).toHaveLength(1);
  for (const day of OCT26_DAYS) {
    const session = after.sessions[day.date];
    expect(session.programmed).toEqual(day.ids);
    expect(new Set(session.programmed).size).toBe(session.programmed?.length);
    expect(session.completed).toEqual({});
    expect(session.setLogs).toBeUndefined();
    expect(session.saved).toBe(false);
    for (const id of session.programmed ?? []) {
      expect(CATALOG[id], id).toBeDefined();
      expect(session.groups, id).toContain(CATALOG[id].group);
      expect(RETIRED_EXERCISES.has(id), id).toBe(false);
      expect(UNCONFIRMED_EQUIPMENT.has(id), id).toBe(false);
    }
  }
  expect(rebalancePending(after, '2026-10-25')).toBe(after);
});

test('a subsequent performed group change adapts conflicting drafts without changing activity', () => {
  const published = applyOct26Routine(fixture(), '2026-10-25');
  const monday: Session = {
    ...published.sessions['2026-10-26'], groups: ['espalda', 'bicep'],
    completed: { pullup: true }, selectedExercises: ['pullup'], manuallyEdited: true,
  };
  const changed = { ...published, sessions: { ...published.sessions, [monday.date]: monday } };
  const after = rebalancePending(changed, '2026-10-26');
  expect(after.sessions[monday.date]).toBe(monday);
  expect(after.sessions['2026-10-25']).toBe(published.sessions['2026-10-25']);
  expect(after.sessions['2026-10-27'].groups).not.toContain('espalda');
  expect(after.sessions['2026-10-27'].groups).not.toContain('bicep');
  expect(after.sessions['2026-10-27'].programmed?.length).toBeGreaterThan(0);
  for (const id of after.sessions['2026-10-27'].programmed ?? []) {
    expect(after.sessions['2026-10-27'].groups).toContain(CATALOG[id].group);
  }
});

test.each([
  ['checked', { completed: { bench_crunch: true } }],
  ['saved', { saved: true }],
  ['manual', { manuallyEdited: true }],
  ['explicitly empty', { selectedExercises: [] }],
  ['selected', { selectedExercises: ['bench_crunch'] }],
  ['already programmed', { programmed: ['bench_crunch'], programTitle: 'Plan ficticio anterior' }],
  ['historical log', { exerciseLog: [{ id: 'bench_crunch', name: 'Nombre histórico ficticio', group: 'core' as const, completed: true }] }],
] as [string, Partial<Session>][])('preserves a %s session including legacy bench_crunch', (_name, patch) => {
  const before = fixture();
  const existing = { ...createSession('2026-10-26'), groups: ['core'] as Session['groups'], ...patch };
  before.sessions[existing.date] = existing;
  const after = rebalancePending(applyOct26Routine(before, '2026-10-25', true), '2026-10-25');
  expect(after.sessions[existing.date]).toBe(existing);
  expect(after.sessions['2026-10-27'].programmed).toEqual(OCT26_DAYS[1].ids);
});

test('late loading does not create or change past days', () => {
  const before = fixture();
  const old = { ...createSession('2026-10-27'), programmed: ['bench_crunch'] };
  before.sessions[old.date] = old;
  const after = applyOct26Routine(before, '2026-10-29', true);
  expect(after.sessions['2026-10-26']).toBeUndefined();
  expect(after.sessions[old.date]).toBe(old);
  expect(after.sessions['2026-10-29'].programmed).toEqual(OCT26_DAYS[2].ids);
});

test('automatic eligibility uses recent activity and force only operates inside the delivery window', () => {
  const empty: AppData = { ...fixture(), sessions: {} };
  expect(applyOct26Routine(empty, '2026-10-25')).toBe(empty);
  expect(applyOct26Routine(empty, '2026-10-25', true).plan.routineRevision).toBe(OCT26_ID);
  for (const date of ['2026-10-24', '2026-11-02']) {
    expect(applyOct26Routine(fixture(), date, true).plan.routineRevision).toBe('2026-09-28-r1');
  }
  for (const date of ['2026-10-12', '2026-10-25']) {
    const recent = { ...empty, sessions: { [date]: { ...createSession(date), completed: { bird_dog: true } } } };
    expect(applyOct26Routine(recent, '2026-10-25').plan.routineRevision).toBe(OCT26_ID);
  }
  const unrelated = { ...empty, sessions: { '2026-10-11': { ...createSession('2026-10-11'), saved: true } } };
  expect(applyOct26Routine(unrelated, '2026-10-25')).toBe(unrelated);
});

test('delivery is idempotent across reload and a synthetic v2 backup roundtrip', () => {
  const after = applyOct26Routine(fixture(), '2026-10-25');
  expect(applyOct26Routine(after, '2026-10-25', true)).toBe(after);
  const restored = toAppData(parseBackup(serializeBackup(toExportData(after), new Date('2026-10-25T12:00:00Z'))).data);
  expect(restored).toEqual(after);
  expect(applyPublishedRoutine(restored, '2026-10-26')).toBe(restored);
  expect(restored.sessions['2026-10-25'].exerciseLog?.[0].id).toBe('bench_crunch');
});
