import { expect, test } from 'vitest';
import type { AppData } from '../src/db/bootstrap';
import { createDefaultPlan, emptyTrainingProfile } from '../src/db/schema';
import { activityGroups, hasActivity } from '../src/logic/activity';
import { createSession } from '../src/logic/session';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';
import { rebalancePending } from '../src/logic/rebalance';

function syntheticData(): AppData {
  return { plan: createDefaultPlan(), profile: emptyTrainingProfile(), custom: {}, sessions: {} };
}

test('completed Sunday legs without the optional saved form cannot be followed by an untouched Monday legs draft', () => {
  const data = syntheticData();
  const sunday = { ...createSession('2026-11-08'), groups: ['pierna', 'core'] as const, completed: { glute_bridge: true, bird_dog: true }, saved: false };
  data.sessions[sunday.date] = { ...sunday, groups: [...sunday.groups] };
  expect(hasActivity(data.sessions[sunday.date])).toBe(true);
  expect(activityGroups(data.sessions[sunday.date])).toEqual(['pierna', 'core']);
  const before = JSON.stringify(data);
  const after = rebalancePending(applyPublishedRoutine(data, '2026-11-09'), '2026-11-09');
  expect(after.sessions['2026-11-09'].groups).toEqual(['pecho', 'tricep']);
  expect(after.sessions[sunday.date]).toBe(data.sessions[sunday.date]);
  expect(JSON.stringify(data)).toBe(before);
  expect(after.sessions['2026-11-09'].saved).toBe(false);
  expect(after.sessions['2026-11-09'].completed).toEqual({});
});

test('loading the corrected week leaves a user-authored Monday program and unchecked set notes intact', () => {
  const data = syntheticData();
  data.sessions['2026-11-08'] = { ...createSession('2026-11-08'), completed: { glute_bridge: true }, saved: false };
  const monday = { ...createSession('2026-11-09'), groups: ['pierna'] as const, programmed: ['glute_bridge'], programTitle: 'Synthetic personal program', setLogs: { glute_bridge: [{ reps: 9, load: 7, rpe: null, done: false }] } };
  data.sessions['2026-11-09'] = { ...monday, groups: [...monday.groups] };
  const after = rebalancePending(applyPublishedRoutine(data, '2026-11-09', true), '2026-11-09');
  expect(after.sessions['2026-11-09']).toBe(data.sessions['2026-11-09']);
  expect(after.sessions['2026-11-09'].setLogs).toEqual(monday.setLogs);
});

test('repeated reconciliation never reintroduces a performed neighbour muscle after fallback', () => {
  const examples = ['glute_bridge', 'pushup', 'pullup', 'dumbbell_shoulder_press', 'dumbbell_curl', 'straight_bar_pressdown', 'bird_dog'];
  for (const first of examples) for (const second of examples) {
    let data = applyPublishedRoutine(syntheticData(), '2026-11-09', true);
    data = { ...data, sessions: { ...data.sessions,
      '2026-11-11': { ...createSession('2026-11-11'), completed: { [first]: true, [second]: true }, saved: false },
    } };
    const blocked = activityGroups(data.sessions['2026-11-11']);
    const after = rebalancePending(data, '2026-11-11');
    const thursday = after.sessions['2026-11-12'];
    expect(thursday.groups.filter(group => blocked.includes(group)), `${first}/${second}`).toEqual([]);
    const again = rebalancePending(after, '2026-11-11');
    expect(again.sessions['2026-11-12'].groups.filter(group => blocked.includes(group)), `${first}/${second} reload`).toEqual([]);
  }
});

test('an untouched proposal becomes explicitly empty when actual neighbours cover all strength groups', () => {
  let data = applyPublishedRoutine(syntheticData(), '2026-11-09', true);
  data.sessions['2026-11-11'] = { ...createSession('2026-11-11'), completed: { glute_bridge: true, pushup: true, pullup: true, dumbbell_shoulder_press: true, dumbbell_curl: true, straight_bar_pressdown: true, bird_dog: true } };
  const after = rebalancePending(data, '2026-11-11');
  expect(after.sessions['2026-11-12'].selectedExercises).toEqual([]);
  expect(rebalancePending(after, '2026-11-11').sessions['2026-11-12'].selectedExercises).toEqual([]);
});

test('weekly fallback cannot override the explicit exclusion of a recorded next-day muscle', () => {
  const data = applyPublishedRoutine(syntheticData(), '2026-11-09', true);
  data.sessions['2026-11-09'] = { ...createSession('2026-11-09'), completed: { pushup: true, straight_bar_pressdown: true } };
  data.sessions['2026-11-10'] = { ...createSession('2026-11-10'), completed: { pullup: true, dumbbell_curl: true } };
  data.sessions['2026-11-11'] = { ...createSession('2026-11-11'), completed: { dumbbell_shoulder_press: true } };
  data.sessions['2026-11-13'] = { ...createSession('2026-11-13'), completed: { glute_bridge: true, bird_dog: true } };
  const after = rebalancePending(data, '2026-11-12');
  expect(after.sessions['2026-11-12'].groups).not.toContain('pierna');
  expect(after.sessions['2026-11-12'].groups).not.toContain('core');
});

test('new neighbouring activity can adjust a previously repaired proposal again', () => {
  const data = applyPublishedRoutine(syntheticData(), '2026-11-09', true);
  data.sessions['2026-11-09'] = { ...createSession('2026-11-09'), completed: { pushup: true, straight_bar_pressdown: true } };
  data.sessions['2026-11-10'] = { ...createSession('2026-11-10'), completed: { pullup: true, dumbbell_curl: true } };
  data.sessions['2026-11-13'] = { ...createSession('2026-11-13'), completed: { glute_bridge: true } };
  const first = rebalancePending(data, '2026-11-12');
  const firstGroups = first.sessions['2026-11-12'].groups;
  expect(firstGroups).not.toContain('pierna');
  const example: Record<string, string> = { pierna: 'glute_bridge', pecho: 'pushup', espalda: 'pullup', hombro: 'dumbbell_shoulder_press', bicep: 'dumbbell_curl', tricep: 'straight_bar_pressdown', core: 'bird_dog' };
  const newActivity = { ...createSession('2026-11-13'), completed: Object.fromEntries(firstGroups.map(group => [example[group], true])) };
  const changed = { ...first, sessions: { ...first.sessions, [newActivity.date]: newActivity } };
  const after = rebalancePending(changed, '2026-11-12');
  expect(after.sessions['2026-11-12'].groups.filter(group => firstGroups.includes(group))).toEqual([]);
  expect(after.sessions[newActivity.date]).toBe(newActivity);
});
