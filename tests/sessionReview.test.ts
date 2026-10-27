import { expect, test } from 'vitest';
import { createSession } from '../src/logic/session';
import { changedRecordedDates, reviewBaseline, sessionBaselines, sessionFingerprint } from '../src/sync/sessionReview';
import type { SyncConnection } from '../src/sync/protocol';

const connection: SyncConnection = { endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64), device: '6b0788f1-c377-456d-9700-fbe93d029c71', version: 8, lastSync: '2026-10-26T12:00:00Z' };
const recorded = (date = '2026-10-26') => ({ ...createSession(date, {}), aerobicActivities: [{ id: 'bike', type: 'Bici', minutes: 20, calories: 80 }] });

test('legacy with many sessions observes locally without inventing modified dates or a server acknowledgement', () => {
  const sessions = Array.from({ length: 50 }, (_, index) => recorded(new Date(Date.UTC(2026, 7, index + 1)).toISOString().slice(0, 10)));
  const review = reviewBaseline(connection, sessions);
  expect(review.origin).toBe('observed');
  expect(changedRecordedDates(review.baseline, sessions)).toEqual([]);
  expect(connection.lastSync).toBe('2026-10-26T12:00:00Z');
  expect(connection.version).toBe(8);
  expect(connection.syncedSessions).toBeUndefined();
});

test('observed baseline persists through reload and protects a subsequent real edit', () => {
  const session = recorded();
  const review = reviewBaseline(connection, [session]);
  const persisted = { ...connection, sessionReview: review.baseline, sessionReviewOrigin: review.origin };
  const changed = { ...session, aerobicActivities: [{ ...session.aerobicActivities[0], minutes: 25 }] };
  const restored = reviewBaseline(persisted, [changed]);
  expect(restored).toEqual(review);
  expect(changedRecordedDates(restored.baseline, [changed])).toEqual([session.date]);
});

test('old confirmed raw JSON migrates without treating key order, future planning and optional defaults as edits', () => {
  const session = { ...recorded(), trainingCalories: 100 };
  const old = { ...connection, syncedSessions: { [session.date]: JSON.stringify(session) } };
  const review = reviewBaseline(old, [session]);
  expect(review.origin).toBe('confirmed');
  const current = { ...session, completed: { unused: false }, trainingCaloriesIncludeAerobic: false, manuallyEdited: true, programmed: ['new-plan'], programTitle: 'A different future routine' };
  expect(changedRecordedDates(review.baseline, [current])).toEqual([]);
  const reordered = Object.fromEntries(Object.entries(current).reverse()) as typeof current;
  expect(sessionFingerprint(reordered)).toBe(sessionFingerprint(current));
  expect(sessionFingerprint(createSession('2026-11-09', {}))).toBeNull();
});

test('new activity is a new record, edits/deletions require review and reverting clears it', () => {
  const before = recorded();
  const baseline = sessionBaselines([before]);
  const newDay = recorded('2026-10-27');
  expect(changedRecordedDates(baseline, [before, newDay])).toEqual([]);
  const changed = { ...before, trainingCalories: 0 };
  expect(changedRecordedDates(baseline, [changed])).toEqual([before.date]);
  expect(changedRecordedDates(baseline, [createSession(before.date, {})])).toEqual([before.date]);
  expect(changedRecordedDates(baseline, [before])).toEqual([]);
});

test('unreadable v3.46 metadata falls back to neutral local observation', () => {
  const review = reviewBaseline({ ...connection, syncedSessions: { '2026-10-26': 'bad json' } }, [recorded()]);
  expect(review.origin).toBe('observed');
  expect(changedRecordedDates(review.baseline, [recorded()])).toEqual([]);
});

test('changing real sets, symptoms, calories or distance is detected', () => {
  const before = { ...recorded(), saved: true, metrics: { lumbarBefore: 0, lumbarAfter: 1, knee: 0, energy: 'media' as const, notes: '' } };
  const baseline = sessionBaselines([before]);
  for (const changed of [
    { ...before, setLogs: { squat: [{ reps: 8, load: 20, rpe: null, done: true }] } },
    { ...before, metrics: { ...before.metrics, notes: 'User correction' } },
    { ...before, aerobicActivities: [{ ...before.aerobicActivities[0], distanceKm: 0 }] },
    { ...before, trainingCalories: 0 },
  ]) expect(changedRecordedDates(baseline, [changed])).toEqual([before.date]);
});

test('malformed legacy exercise logs and set rows never crash or become confirmed', () => {
  for (const broken of [{ ...recorded(), exerciseLog: 'bad' }, { ...recorded(), setLogs: { squat: 'bad' } }, { ...recorded(), aerobicActivities: [{ id: null }] }]) {
    const review = reviewBaseline({ ...connection, syncedSessions: { [broken.date]: JSON.stringify(broken) } }, [recorded()]);
    expect(review.origin).toBe('observed');
    expect(changedRecordedDates(review.baseline, [recorded()])).toEqual([]);
  }
});
