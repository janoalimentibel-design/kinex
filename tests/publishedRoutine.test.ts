import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { createDefaultPlan } from '../src/db/schema';
import type { AppData } from '../src/db/bootstrap';
import { createSession, buildExerciseList } from '../src/logic/session';
import { activityGroups, completedIds, hasActivity } from '../src/logic/activity';
import { applyPublishedRoutine, ROUTINE_ID, WEEK_ROUTINE } from '../src/logic/publishedRoutine';
import { sessionsPerWeek } from '../src/logic/stats';

function fixture(): AppData {
  const s = { ...createSession('2026-09-23'), groups: ['espalda', 'core'] as const };
  return { custom: {}, plan: createDefaultPlan(), sessions: {
    [s.date]: { ...s, groups: [...s.groups], completed: { pullup: true, dead_bug: false } },
  } };
}

test('one-tap activity counts without saving and does not count an unperformed group', () => {
  const data = fixture(), session = data.sessions['2026-09-23'];
  expect(session.saved).toBe(false);
  expect(hasActivity(session)).toBe(true);
  expect(activityGroups(session)).toEqual(['espalda']);
  expect(sessionsPerWeek(data.sessions, 2, '2026-09-28')[0].count).toBe(1);
});

test('explicit unchecking overrides a stale log', () => {
  const s = fixture().sessions['2026-09-23'];
  s.exerciseLog = [{ id: 'dead_bug', name: 'Dead Bug', group: 'core', completed: true }];
  expect(completedIds(s)).toEqual(['pullup']);
});

test('delivers the revised four sessions without mutating any history or custom data', () => {
  const before = fixture(), snapshot = JSON.stringify(before);
  const after = applyPublishedRoutine(before, '2026-09-28');
  expect(JSON.stringify(before)).toBe(snapshot);
  expect(after.sessions['2026-09-23']).toBe(before.sessions['2026-09-23']);
  expect(after.custom).toBe(before.custom);
  expect(after.plan.routineRevision).toBe(ROUTINE_ID);
  expect(after.sessions['2026-09-28'].groups).toEqual(['espalda', 'bicep']);
  expect(after.sessions['2026-09-28'].programmed).toContain('dumbbell_curl');
  expect(after.sessions['2026-09-29'].programmed).toEqual(expect.arrayContaining(['leg_ext', 'lying_leg_curl']));
  expect(after.sessions['2026-10-03'].programmed?.filter((id) => CATALOG[id].group === 'core')).toHaveLength(4);
  for (const day of WEEK_ROUTINE) for (const id of day.ids) expect(CATALOG[id]).toBeDefined();
});

test('preserves a started current day, saved days, and past days; delivery is idempotent', () => {
  const data = fixture();
  const started = { ...createSession('2026-09-28'), completed: { leg_ext: true } };
  data.sessions[started.date] = started;
  const saved = { ...createSession('2026-09-29'), saved: true };
  data.sessions[saved.date] = saved;
  const after = applyPublishedRoutine(data, '2026-09-28');
  expect(after.sessions[started.date]).toBe(started);
  expect(after.sessions[saved.date]).toBe(saved);
  expect(applyPublishedRoutine(after, '2026-09-28')).toBe(after);
  const late = applyPublishedRoutine(fixture(), '2026-10-01');
  expect(late.sessions['2026-09-28']).toBeUndefined();
});

test('does not activate outside its week or silently change empty/unrelated installations', () => {
  const data = fixture();
  expect(applyPublishedRoutine(data, '2026-10-05')).toBe(data);
  expect(applyPublishedRoutine(data, '2026-09-27')).toBe(data);
  const empty = { ...data, sessions: {} };
  expect(applyPublishedRoutine(empty, '2026-09-28')).toBe(empty);
  expect(applyPublishedRoutine(empty, '2026-09-28', true).plan.routineRevision).toBe(ROUTINE_ID);
});

test('historical checked exercises are not regenerated, even without saved=true', () => {
  const data = fixture();
  const list = buildExerciseList(data.sessions['2026-09-23'], CATALOG, data.sessions, new Date('2026-09-28T12:00:00'));
  expect(list.map((e) => e.id)).toEqual(['pullup']);
});

test('programmed routines support manual replacements and additions without duplicate entries', () => {
  const s = { ...createSession('2026-09-28'), groups: ['espalda', 'bicep'] as ['espalda', 'bicep'],
    programmed: ['pullup', 'seated_row_machine'], extras: ['cable_curl', 'pullup'],
    replacements: { seated_row_machine: 'dumbbell_row' } };
  expect(buildExerciseList(s, CATALOG, {}).map((e) => e.id)).toEqual(['pullup', 'dumbbell_row', 'cable_curl']);
});

test('a planned but unperformed priority is not counted as already completed this week', () => {
  const past = { ...createSession('2026-09-28'), groups: ['espalda'] as ['espalda'], programmed: ['pullup'], saved: true };
  const now = { ...createSession('2026-10-01'), groups: ['espalda'] as ['espalda'] };
  expect(buildExerciseList(now, CATALOG, { [past.date]: past }).map((e) => e.id)).toContain('pullup');
});
