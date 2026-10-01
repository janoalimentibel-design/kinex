import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { createDefaultPlan, type GroupId, type Session } from '../src/db/schema';
import { createSession, suggestedGroups } from '../src/logic/session';
import { rebalancePending } from '../src/logic/rebalance';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';
import type { AppData } from '../src/db/bootstrap';

const day = (date: string, groups: GroupId[]): Session => ({ ...createSession(date), groups });
const data = (sessions: Session[]): AppData => ({ plan: createDefaultPlan(), custom: {}, sessions: Object.fromEntries(sessions.map(s => [s.date, s])) });

test('Wednesday respects Thursday chest in the published week, with no manual changes', () => {
  const published = applyPublishedRoutine(data([]), '2026-09-28', true);
  const groups = suggestedGroups('2026-09-30', published.sessions);
  expect(groups).not.toContain('pecho');
  expect(groups).not.toContain('tricep');
  expect(groups).not.toContain('pierna');
  expect(groups).not.toContain('hombro');
});

test('repairs the already delivered Thursday after Wednesday chest, without changing any activity', () => {
  const published = applyPublishedRoutine(data([]), '2026-09-28', true);
  const yesterday = { ...day('2026-09-30', ['pecho', 'bicep']), completed: { pec_deck: true } };
  published.sessions[yesterday.date] = yesterday;
  const snapshot = JSON.stringify(published);
  const after = rebalancePending(published, '2026-10-01');
  expect(JSON.stringify(published)).toBe(snapshot);
  expect(after.sessions[yesterday.date]).toBe(yesterday);
  expect(after.sessions['2026-10-01'].groups).not.toContain('pecho');
  for (const id of after.sessions['2026-10-01'].programmed!) expect(after.sessions['2026-10-01'].groups).toContain(CATALOG[id].group);
  expect(rebalancePending(after, '2026-10-01')).toBe(after);
});

test('Monday respects Sunday across the calendar-week boundary', () => {
  const sessions = data([day('2026-10-04', ['espalda', 'bicep'])]).sessions;
  expect(suggestedGroups('2026-10-05', sessions)).not.toContain('espalda');
  expect(suggestedGroups('2026-10-05', sessions)).not.toContain('bicep');
});

test('a manual change is kept and all following conflicting drafts are repaired', () => {
  const before = data([day('2026-09-30', ['pecho', 'bicep']), day('2026-10-01', ['pecho', 'tricep']), day('2026-10-02', ['pierna', 'core'])]);
  const after = rebalancePending(before, '2026-09-30', '2026-09-30');
  expect(after.sessions['2026-09-30']).toBe(before.sessions['2026-09-30']);
  for (const [a, b] of [['2026-09-30', '2026-10-01'], ['2026-10-01', '2026-10-02']]) {
    expect(after.sessions[a].groups.filter(g => after.sessions[b].groups.includes(g))).toEqual([]);
  }
});

test('never rewrites started, saved, past, or cardio sessions', () => {
  const before = data([
    day('2026-09-29', ['pecho']),
    { ...day('2026-09-30', ['pecho']), completed: { pec_deck: true } },
    { ...day('2026-10-01', ['pecho']), saved: true },
    day('2026-10-02', ['aerobico']),
  ]);
  expect(rebalancePending(before, '2026-09-30')).toBe(before);
});

test('actual replacement groups and custom checked exercises count for adjacency', () => {
  const yesterday = { ...day('2026-09-30', ['espalda']), completed: { custom_chest: true } };
  const all = { ...CATALOG, custom_chest: { ...CATALOG.pec_deck, id: 'custom_chest' } };
  expect(suggestedGroups('2026-10-01', { [yesterday.date]: yesterday }, undefined, all)).not.toContain('pecho');
});
