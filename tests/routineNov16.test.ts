import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { toAppData, toExportData, type AppData } from '../src/db/bootstrap';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { createDefaultPlan, emptyTrainingProfile, type Session } from '../src/db/schema';
import { buildExerciseList, createSession } from '../src/logic/session';
import { applyPublishedRoutine } from '../src/logic/publishedRoutine';
import { applyNov16Routine, nov16Prescription, NOV16_AVAILABLE, NOV16_DAYS, NOV16_END, NOV16_ID, NOV16_PREVIOUS_ID, NOV16_START } from '../src/logic/routineNov16';

const lightDays: Record<string, string[]> = {
  '2026-11-16': ['dumbbell_floor_press', 'dumbbell_curl'],
  '2026-11-19': ['bench_leg_extension', 'straight_bar_pressdown'],
  '2026-11-21': ['chest_supported_db_row', 'seated_calf_raise_db'],
};

// Synthetic session data only. No personal symptoms or private profile.
function fixture(): AppData {
  return { sessions: {}, custom: {}, plan: { ...createDefaultPlan(), routineRevision: '2026-11-09-r3' }, profile: emptyTrainingProfile() };
}

test('the gentle week is offered without being injected into an empty install or unrelated backup', () => {
  const before = fixture();
  expect(applyNov16Routine(before, NOV16_START)).toBe(before);
  expect(applyPublishedRoutine(before, NOV16_START)).toBe(before);
  expect(NOV16_AVAILABLE).toBe(NOV16_START);
});

test('explicit loading creates three short controlled options and four empty activity days without automatic filler or advanced core', () => {
  const before = fixture(), snapshot = structuredClone(before);
  const after = applyPublishedRoutine(before, NOV16_START, true);
  expect(before).toEqual(snapshot);
  expect(after.plan.routineRevision).toBe(NOV16_ID);
  expect(after.plan.week).toBe('16–22 nov');
  expect(after.plan.focus).toBe('Descarga activa');
  expect(NOV16_DAYS.map(day => day.date)).toEqual([
    '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22',
  ]);
  for (const day of NOV16_DAYS) {
    expect(day.label.length).toBeGreaterThan(0);
    expect(day.walkingText.length).toBeGreaterThan(0);
    const session = after.sessions[day.date];
    const ids = lightDays[day.date] ?? [];
    expect(session.groups).toEqual(ids.length ? [...new Set(ids.map(id => CATALOG[id].group))] : ['aerobico']);
    expect(session.selectedExercises).toEqual(ids);
    if (!ids.length) expect(session.mode).toBe('sinpeso');
    expect(session.saved).toBe(false);
    expect(session.completed).toEqual({});
    const entries = buildExerciseList(session, CATALOG, after.sessions, new Date(`${day.date}T12:00:00`));
    expect(entries.map(entry => entry.id)).toEqual(ids);
    for (const entry of entries) {
      expect(CATALOG[entry.id].level).not.toBe('Avanzado');
      expect(CATALOG[entry.id].group).not.toBe('core');
    }
  }
  expect(after.custom).toBe(before.custom);
  expect(after.profile).toBe(before.profile);
});

test.each([
  { saved: true }, { manuallyEdited: true },
  { selectedExercises: [] }, { selectedExercises: ['bird_dog'] },
  { programmed: ['bird_dog'], programTitle: 'Synthetic personal program' },
  { completed: { bird_dog: false } }, { completed: { bird_dog: true } },
  { setLogs: { bird_dog: [{ reps: 6, load: null, rpe: null, done: false }] } },
  { exerciseLog: [{ id: 'bird_dog', name: 'Synthetic historical name', group: 'core', completed: false }] },
  { replacements: { bird_dog: 'dead_bug' } }, { extras: ['dead_bug'] },
  { planner: { source: 'adaptive', week: NOV16_START, locked: true } },
  { metrics: { lumbarBefore: 0, lumbarAfter: 0, knee: 0, energy: 'media', notes: 'Synthetic' } },
  { checkin: { lumbar: 0, knee: 0, energy: 'media', timeMinutes: 10 } },
] as Partial<Session>[])('loading preserves an existing choice or record: %j', patch => {
  const before = fixture();
  const existing = { ...createSession(NOV16_START), ...patch };
  before.sessions[existing.date] = existing;
  const snapshot = structuredClone(existing);
  const after = applyNov16Routine(before, NOV16_START, true);
  expect(after.sessions[existing.date]).toBe(existing);
  expect(after.sessions[existing.date]).toEqual(snapshot);
  expect(after.sessions['2026-11-17'].selectedExercises).toEqual([]);
});

test('late loading preserves past entries and does not manufacture earlier days', () => {
  const before = fixture();
  const past = { ...createSession(NOV16_START), saved: true, completed: { pushup: true } };
  before.sessions[past.date] = past;
  const after = applyNov16Routine(before, '2026-11-19', true);
  expect(after.sessions[past.date]).toBe(past);
  expect(after.sessions['2026-11-17']).toBeUndefined();
  expect(after.sessions['2026-11-18']).toBeUndefined();
  expect(after.sessions['2026-11-19'].selectedExercises).toEqual(lightDays['2026-11-19']);
  expect(after.sessions[NOV16_END].selectedExercises).toEqual([]);
});

test('loading is idempotent and remains within its week without downgrading a later revision', () => {
  const before = fixture();
  const after = applyNov16Routine(before, NOV16_START, true);
  expect(applyNov16Routine(after, NOV16_START, true)).toBe(after);
  expect(applyPublishedRoutine(after, NOV16_START)).toBe(after);
  for (const date of ['2026-11-15', '2026-11-23']) expect(applyNov16Routine(before, date, true)).toBe(before);
  for (const revision of ['2026-11-16-descarga-r3', '2026-11-23-r1']) {
    const newer = { ...before, plan: { ...before.plan, routineRevision: revision } };
    expect(applyNov16Routine(newer, NOV16_START, true)).toBe(newer);
  }
});

test('the delivered mixed week survives a backup roundtrip without adding automatic filler on reload', () => {
  const after = applyNov16Routine(fixture(), NOV16_START, true);
  const restored = toAppData(parseBackup(serializeBackup(toExportData(after))).data);
  expect(restored).toEqual(after);
  expect(applyPublishedRoutine(restored, '2026-11-17')).toBe(restored);
  for (const session of Object.values(restored.sessions)) {
    expect(buildExerciseList(session, CATALOG, restored.sessions).map(entry => entry.id)).toEqual(lightDays[session.date] ?? []);
  }
});

test('an explicit r1 update replaces only its untouched empty days and keeps personal choices and past activity', () => {
  const before = fixture();
  before.plan.routineRevision = NOV16_PREVIOUS_ID;
  for (const day of NOV16_DAYS) before.sessions[day.date] = {
    ...createSession(day.date), groups: ['aerobico'], mode: 'sinpeso', format: 'base',
    selectedExercises: [], programTitle: `Semana suave · 16–22 nov · ${day.label}`,
  };
  const manual = { ...before.sessions['2026-11-18'], selectedExercises: ['bird_dog'], manuallyEdited: true };
  before.sessions[manual.date] = manual;
  const historical = { ...createSession('2026-11-15'), completed: { bird_dog: true }, saved: true };
  before.sessions[historical.date] = historical;
  const snapshot = structuredClone(before);
  expect(applyPublishedRoutine(before, NOV16_START)).toBe(before);
  const after = applyPublishedRoutine(before, NOV16_START, true);
  expect(before).toEqual(snapshot);
  expect(after.plan.routineRevision).toBe(NOV16_ID);
  for (const [date, ids] of Object.entries(lightDays)) expect(after.sessions[date].selectedExercises).toEqual(ids);
  expect(after.sessions[manual.date]).toBe(manual);
  expect(after.sessions[historical.date]).toBe(historical);
  expect(applyPublishedRoutine(after, NOV16_START, true)).toBe(after);
});

test('the light prescription is limited to its selected date and exercise and keeps the catalog unchanged', () => {
  const original = structuredClone(CATALOG);
  for (const [date, ids] of Object.entries(lightDays)) for (const id of ids) {
    const prescription = nov16Prescription(date, id);
    expect(prescription).toMatchObject({ sets: '1–2', reps: '10–12', rest: '60–90s' });
    expect(prescription!.instruction).toContain('Probá una serie');
    expect(prescription!.instruction).toContain('solo si no reproduce el pinchazo');
    expect(prescription!.instruction).toContain('No busques fatiga ni fallo');
  }
  expect(nov16Prescription('2026-11-17', 'dumbbell_curl')).toBeUndefined();
  expect(nov16Prescription('2026-11-16', 'hanging_leg_raise')).toBeUndefined();
  expect(CATALOG).toEqual(original);
});
