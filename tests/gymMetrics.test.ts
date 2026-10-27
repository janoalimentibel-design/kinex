import { expect, test } from 'vitest';
import { zSession } from '../src/db/schema';
import { createSession } from '../src/logic/session';
import { activitySignature, activityTotals, summarizeActivity } from '../src/logic/aerobic';
import { hasActivity, activityGroups } from '../src/logic/activity';
import { changedRecordedDates, daySyncState, sessionBaselines, sessionFingerprint } from '../src/sync/sessionReview';
import type { SyncConnection } from '../src/sync/protocol';

const base = () => createSession('2026-10-27', {});
const connection: SyncConnection = { endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64), device: '6b0788f1-c377-456d-9700-fbe93d029c71', version: 2, lastSync: '2026-10-27T10:00:00Z' };

test('gym minutes are additive, finite and bounded; missing differs from an explicitly logged zero', () => {
  expect(zSession.parse(base()).gymMinutes).toBeUndefined();
  for (const gymMinutes of [0, 15.5, 1440]) expect(zSession.parse({ ...base(), gymMinutes }).gymMinutes).toBe(gymMinutes);
  for (const gymMinutes of [-1, 1441, NaN, Infinity]) expect(zSession.safeParse({ ...base(), gymMinutes }).success).toBe(false);
  expect(activitySignature(base())).not.toBe(activitySignature({ ...base(), gymMinutes: 0 }));
  expect(hasActivity({ ...base(), gymMinutes: 0 })).toBe(true);
  expect(activityGroups({ ...base(), gymMinutes: 45 })).toEqual([]);
});

test('gym is elapsed stay and is never summed with cardio; raw calorie measures remain separate', () => {
  const session = { ...base(), gymMinutes: 80, trainingCalories: 400, trainingCaloriesIncludeAerobic: true, aerobicActivities: [{ id: 'bike', type: 'Bici', minutes: 20, calories: 100, distanceKm: 4 }] };
  expect(activityTotals(session)).toMatchObject({ gymMinutes: 80, aerobicMinutes: 20, trainingCalories: 400, aerobicCalories: 100, totalCalories: 400 });
  expect(activityTotals({ ...session, trainingCaloriesIncludeAerobic: false }).totalCalories).toBe(500);
  expect(activityTotals(base())).toMatchObject({ gymMinutes: null, aerobicMinutes: null, trainingCalories: null, totalCalories: null });
  expect(activityTotals({ ...base(), gymMinutes: 0, trainingCalories: 0 })).toMatchObject({ gymMinutes: 0, trainingCalories: 0, totalCalories: 0 });
});

test('calendar summaries apply week/month/all cutoff and sum daily nonduplicated calories', () => {
  const sessions = [
    { ...base(), date: '2026-09-30', gymMinutes: 30 },
    { ...base(), date: '2026-10-25', gymMinutes: 40 },
    { ...base(), date: '2026-10-26', gymMinutes: 60, trainingCalories: 300, trainingCaloriesIncludeAerobic: true, aerobicActivities: [{ id: 'a', type: 'Bici', minutes: 20, calories: 90 }] },
    { ...base(), gymMinutes: 0, trainingCalories: 200, aerobicActivities: [{ id: 'b', type: 'Bici', minutes: 15, calories: 50 }] },
    { ...base(), date: '2026-10-28', gymMinutes: 100, trainingCalories: 999 },
    { ...base(), date: '2026-10-24' },
  ];
  expect(summarizeActivity(sessions, 'week', '2026-10-27')).toMatchObject({ gymMinutes: 60, aerobicMinutes: 35, trainingCalories: 500, aerobicCalories: 140, totalCalories: 550, gymRecordedDays: 2, aerobicRecordedDays: 2, calorieRecordedDays: 2 });
  expect(summarizeActivity(sessions, 'month', '2026-10-27').gymMinutes).toBe(100);
  expect(summarizeActivity(sessions, 'all', '2026-10-27').gymMinutes).toBe(130);
  expect(summarizeActivity([base()], 'week', '2026-10-27')).toMatchObject({ gymMinutes: null, aerobicMinutes: null, totalCalories: null, days: 0 });
});

test('only a matching confirmed ACK is sent; first calories or gym minutes after ACK become pending immediately', () => {
  const before = { ...base(), saved: true };
  const confirmed = { ...connection, sessionReview: sessionBaselines([before]), sessionReviewOrigin: 'confirmed' as const };
  expect(daySyncState(confirmed, before, before.date)).toBe('sent');
  for (const after of [{ ...before, trainingCalories: 0 }, { ...before, gymMinutes: 60 }]) {
    expect(daySyncState(confirmed, after, after.date)).toBe('pending');
    expect(changedRecordedDates(confirmed.sessionReview, [after])).toEqual([before.date]);
  }
  expect(daySyncState(null, before, before.date)).toBe('disconnected');
  expect(daySyncState({ ...confirmed, sessionReviewOrigin: 'observed' }, before, before.date)).toBe('unverified');
  expect(daySyncState(confirmed, { ...before, date: '2026-10-28' }, '2026-10-28')).toBe('local');
  expect(daySyncState(confirmed, undefined, before.date)).toBe('pending');
});


test('v3.47 confirmed fingerprints remain identical when gym minutes were never logged', () => {
  const before = { ...base(), saved: true };
  const stored = JSON.parse(sessionFingerprint(before)!);
  delete stored.gymMinutes;
  const v347 = { ...connection, sessionReview: { [before.date]: JSON.stringify(stored) }, sessionReviewOrigin: 'confirmed' as const };
  expect(daySyncState(v347, before, before.date)).toBe('sent');
  expect(daySyncState(v347, { ...before, gymMinutes: undefined }, before.date)).toBe('sent');
  expect(changedRecordedDates(v347.sessionReview, [before])).toEqual([]);
  expect(daySyncState(v347, { ...before, gymMinutes: 0 }, before.date)).toBe('pending');
});
