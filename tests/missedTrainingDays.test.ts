import { expect, test } from 'vitest';
import { createDefaultPlan, type Session } from '../src/db/schema';
import type { AppData } from '../src/db/bootstrap';
import { CATALOG } from '../src/data/exercises';
import { buildExerciseList, createSession, suggestedGroups } from '../src/logic/session';
import { rebalancePending } from '../src/logic/rebalance';

function fixture(): AppData {
  return { custom: {}, plan: createDefaultPlan(), sessions: {
    '2026-11-02': { ...createSession('2026-11-02'), groups: ['pierna', 'hombro'], saved: true, completed: { glute_bridge: true, lateral_raise_db: true } },
    '2026-11-03': { ...createSession('2026-11-03'), groups: ['pecho', 'tricep'], programmed: ['pushup', 'rope_pressdown'], planner: { source: 'adaptive', week: '2026-11-02' } },
    '2026-11-04': { ...createSession('2026-11-04'), groups: ['hombro', 'core'], programmed: ['lateral_raise_db', 'bird_dog'], planner: { source: 'adaptive', week: '2026-11-02' } },
    '2026-11-05': { ...createSession('2026-11-05'), groups: ['espalda', 'bicep'], programmed: ['pullup', 'hammer_curl_db'], planner: { source: 'adaptive', week: '2026-11-02' } },
  } };
}
test('Wednesday prioritizes groups not performed this week despite missed Tuesday and future Thursday drafts', () => {
  const before = fixture();
  const after = rebalancePending(before, '2026-11-04');
  expect(after.sessions['2026-11-04'].groups).not.toContain('hombro');
  expect(after.sessions['2026-11-04'].groups).not.toContain('pierna');
  expect(after.sessions['2026-11-02']).toBe(before.sessions['2026-11-02']);
  expect(after.sessions['2026-11-03']).toBe(before.sessions['2026-11-03']);
  expect(rebalancePending(after, '2026-11-04')).toBe(after);
});

test('missed drafts and future reservations never force repeating already performed groups', () => {
  const before = fixture();
  const onlyHistory = { '2026-11-02': before.sessions['2026-11-02'] };
  for (const sessions of [before.sessions, onlyHistory]) {
    const groups = suggestedGroups('2026-11-04', sessions, before.plan);
    expect(groups).not.toContain('hombro');
    expect(groups).not.toContain('pierna');
  }
  const withoutFuture = { ...before.sessions };
  delete withoutFuture['2026-11-05'];
  expect(suggestedGroups('2026-11-04', withoutFuture, before.plan)).toEqual(suggestedGroups('2026-11-04', onlyHistory, before.plan));
});

test.each([
  ['saved', { saved: true }], ['manual', { manuallyEdited: true }],
  ['empty selection', { selectedExercises: [] }], ['replacement', { replacements: { lateral_raise_db: 'face_pull_h' } }],
  ['extra', { extras: ['pullup'] }], ['locked', { planner: { source: 'adaptive', week: '2026-11-02', locked: true } }],
  ['activity', { completed: { lateral_raise_db: true } }],
] as [string, Partial<Session>][])('preserves a %s Wednesday choice while repairing drafts', (_label, patch) => {
  const before = fixture();
  const protectedSession = { ...before.sessions['2026-11-04'], ...patch };
  before.sessions['2026-11-04'] = protectedSession;
  expect(rebalancePending(before, '2026-11-04').sessions['2026-11-04']).toBe(protectedSession);
});


test('extended format automatic extra remains inside the repaired pending groups', () => {
  const before = fixture();
  before.sessions['2026-11-04'] = { ...before.sessions['2026-11-04'], format: 'ext', extraTarget: 'auto' };
  const after = rebalancePending(before, '2026-11-04');
  const session = after.sessions['2026-11-04'];
  const entries = buildExerciseList(session, CATALOG, after.sessions);
  expect(entries).toHaveLength(5);
  for (const entry of entries) {
    expect(session.groups).toContain(entry.group);
    expect(['hombro', 'pierna']).not.toContain(entry.group);
  }
});

test('checking only a shoulder exercise leaves the unperformed leg group pending', () => {
  const before = fixture();
  before.sessions['2026-11-02'] = { ...before.sessions['2026-11-02'], saved: false, completed: { lateral_raise_db: true } };
  before.sessions['2026-11-04'] = { ...before.sessions['2026-11-04'], format: 'ext', extraTarget: 'auto' };
  const after = rebalancePending(before, '2026-11-04');
  const session = after.sessions['2026-11-04'];
  expect(session.groups).not.toContain('hombro');
  const entries = buildExerciseList(session, CATALOG, after.sessions);
  expect(entries).toHaveLength(5);
  for (const entry of entries) {
    expect(session.groups).toContain(entry.group);
    expect(entry.group).not.toBe('hombro');
  }
  // A session's planned groups do not turn unmarked legs into performed work.
  const onlyShoulder = { ...before.sessions['2026-11-02'], groups: ['hombro'] as Session['groups'] };
  expect(suggestedGroups('2026-11-04', { '2026-11-02': before.sessions['2026-11-02'] }, before.plan))
    .toEqual(suggestedGroups('2026-11-04', { '2026-11-02': onlyShoulder }, before.plan));
});
