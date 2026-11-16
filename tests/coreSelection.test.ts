import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import type { Format, Session } from '../src/db/schema';
import { buildExerciseList, createSession } from '../src/logic/session';

const day = (date = '2026-11-18'): Session => ({ ...createSession(date), groups: ['core', 'bicep'] });
const coreIds = (session: Session, history: Record<string, Session> = {}) =>
  buildExerciseList(session, CATALOG, history).filter(entry => entry.group === 'core').map(entry => entry.id);

test.each(['base', 'ext', 'long'] as Format[])('%s gives four core options with one advanced, two intermediate and one easy', format => {
  for (let date = 1; date <= 28; date++) {
    const ids = coreIds({ ...day(`2026-12-${String(date).padStart(2, '0')}`), format });
    expect(ids).toHaveLength(4);
    const levels = ids.map(id => CATALOG[id].level);
    expect(levels.filter(level => level === 'Avanzado')).toHaveLength(1);
    expect(levels.filter(level => level === 'Progresivo')).toHaveLength(2);
    expect(levels.filter(level => level === 'Inicial')).toHaveLength(1);
    expect(ids.filter(id => ['bear_hold', 'hollow_reg'].includes(id))).toHaveLength(1);
    expect(ids).toContain('mountain_climber');
    for (const id of ['farmer', 'suitcase', 'ab_wheel', 'rot_expl', 'russian_twist']) expect(ids).not.toContain(id);
  }
});

test('core rotates the isometric alternative based on performed work rather than repeating nearly identical holds', () => {
  const first = day('2026-11-17');
  const previous = coreIds(first);
  const recorded = { ...first, selectedExercises: previous, completed: Object.fromEntries(previous.map(id => [id, true])) };
  const next = coreIds(day('2026-11-18'), { [recorded.date]: recorded });
  const firstHold = previous.find(id => ['bear_hold', 'hollow_reg'].includes(id));
  expect(next).not.toContain(firstHold);
  expect(next.filter(id => ['bear_hold', 'hollow_reg'].includes(id))).toHaveLength(1);
  expect(next.find(id => CATALOG[id].level === 'Inicial')).not.toBe(previous.find(id => CATALOG[id].level === 'Inicial'));
});

test('Extended skips a core bonus without redirecting volume, and keeps the other group bonus when chosen', () => {
  const targetCore = { ...day(), format: 'ext' as const, extraTarget: 'g1' as const };
  const entries = buildExerciseList(targetCore, CATALOG, {});
  expect(entries.filter(entry => entry.group === 'core')).toHaveLength(4);
  expect(entries.filter(entry => entry.group === 'bicep')).toHaveLength(2);
  expect(entries).toHaveLength(6);
  const targetBiceps = buildExerciseList({ ...targetCore, extraTarget: 'g2' }, CATALOG, {});
  expect(targetBiceps.filter(entry => entry.group === 'core')).toHaveLength(4);
  expect(targetBiceps.filter(entry => entry.group === 'bicep')).toHaveLength(3);
});

test('mode and exercise filters take precedence over a missing difficulty slot', () => {
  const bodyweight = coreIds({ ...day(), mode: 'sinpeso' });
  expect(bodyweight).toHaveLength(4);
  for (const id of bodyweight) expect(CATALOG[id].modes).toContain('sinpeso');
  const weighted = coreIds({ ...day(), mode: 'peso' });
  expect(weighted.length).toBeGreaterThan(0);
  for (const id of weighted) expect(CATALOG[id].modes).toContain('peso');
  const filtered = buildExerciseList(day(), CATALOG, {}, new Date('2026-11-18T12:00:00'), exercise => exercise.level !== 'Avanzado');
  expect(filtered.filter(entry => entry.group === 'core')).toHaveLength(4);
  for (const entry of filtered) expect(CATALOG[entry.id].level).not.toBe('Avanzado');
});

test('manual carries, explicit programs and recorded carry history keep their IDs', () => {
  const ids = ['farmer', 'suitcase'];
  expect(coreIds({ ...day(), selectedExercises: ids })).toEqual(ids);
  expect(coreIds({ ...day(), programmed: ids })).toEqual(ids);
  const recorded = { ...day('2026-11-10'), completed: { farmer: true, suitcase: true } };
  expect(coreIds(recorded)).toEqual(ids);
});

test('the requested advanced exception applies only to core, leaving other groups unchanged', () => {
  for (const group of ['pierna', 'espalda', 'pecho', 'hombro', 'bicep', 'tricep'] as const) {
    const entries = buildExerciseList({ ...day(), groups: [group], format: 'long' }, CATALOG, {});
    for (const entry of entries) expect(CATALOG[entry.id].level).not.toBe('Avanzado');
  }
});
