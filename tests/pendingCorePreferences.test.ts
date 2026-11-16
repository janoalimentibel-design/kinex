import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { createDefaultPlan, emptyTrainingProfile, type Session } from '../src/db/schema';
import type { AppData } from '../src/db/bootstrap';
import { createSession } from '../src/logic/session';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';

const today = '2026-11-16';
function draft(date = today): Session {
  return {
    ...createSession(date), groups: ['pierna', 'core'],
    programmed: ['romanian_deadlift', 'tibialis', 'farmer', 'suitcase', 'dead_bug', 'pallof'],
    programTitle: 'Próxima semana · Piernas + Core',
  };
}
function fixture(session = draft()): AppData {
  return { sessions: { [session.date]: session }, custom: {}, plan: { ...createDefaultPlan(), routineRevision: '2026-11-09-r3' }, profile: emptyTrainingProfile() };
}

test('current and future automatic proposals receive the requested core mix after the old published week has expired', () => {
  const before = fixture();
  before.sessions['2026-11-21'] = draft('2026-11-21');
  const snapshot = structuredClone(before);
  const after = applyPublishedRoutine(before, today);
  expect(before).toEqual(snapshot);
  for (const date of [today, '2026-11-21']) {
    const programmed = after.sessions[date].programmed!;
    expect(programmed.slice(0, 2)).toEqual(['romanian_deadlift', 'tibialis']);
    const core = programmed.filter(id => CATALOG[id].group === 'core');
    expect(core.map(id => CATALOG[id].level).sort()).toEqual(['Avanzado', 'Inicial', 'Progresivo', 'Progresivo']);
    expect(core).not.toContain('farmer');
    expect(core).not.toContain('suitcase');
  }
  expect(applyPublishedRoutine(after, today)).toBe(after);
});

test.each([
  { date: '2026-11-15' }, { saved: true }, { manuallyEdited: true },
  { selectedExercises: ['farmer', 'suitcase'] }, { completed: { farmer: false } },
  { completed: { farmer: true } }, { setLogs: { farmer: [] } },
  { setLogs: { farmer: [{ reps: 8, load: null, rpe: null, done: false }] } },
  { exerciseLog: [{ id: 'farmer', name: 'Synthetic carry', group: 'core', completed: false }] },
  { extras: ['bird_dog'] }, { replacements: { farmer: 'bird_dog' } },
  { programTitle: 'Mi programa personal' },
  { planner: { source: 'adaptive', week: '2026-11-16', locked: true } },
] as Partial<Session>[])('delivery preserves history and any user-owned or touched program: %j', patch => {
  const session = { ...draft(), ...patch };
  const before = fixture(session);
  expect(applyPublishedRoutine(before, today)).toBe(before);
  expect(before.sessions[session.date]).toBe(session);
});

test('a weight-only automatic proposal keeps the equipment constraint and remains idempotent', () => {
  const after = applyPublishedRoutine(fixture({ ...draft(), mode: 'peso' }), today);
  const core = after.sessions[today].programmed!.filter(id => CATALOG[id].group === 'core');
  expect(core.length).toBeGreaterThan(0);
  for (const id of core) expect(CATALOG[id].modes).toContain('peso');
  expect(applyPublishedRoutine(after, today)).toBe(after);
});
