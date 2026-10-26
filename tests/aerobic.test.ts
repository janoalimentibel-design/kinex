import { expect, test } from 'vitest';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { createDefaultPlan, zSession, type Session } from '../src/db/schema';
import { activityGroups, completedIds, hasActivity } from '../src/logic/activity';
import { createSession } from '../src/logic/session';
import { trainedDaysOfMonth } from '../src/logic/stats';

const bike = { id: 'bike-1', type: 'Bicicleta', minutes: 18.5, calories: 125, distanceKm: 6.2 };
const cardioDay = (): Session => ({ ...createSession('2026-10-19'), aerobicActivities: [bike] });

test('un día solo aeróbico cuenta en historial y calendario sin inventar fuerza realizada', () => {
  const session = cardioDay();
  expect(session.saved).toBe(false);
  expect(hasActivity(session)).toBe(true);
  expect(completedIds(session)).toEqual([]);
  expect(activityGroups(session)).toEqual(['aerobico']);
  expect([...trainedDaysOfMonth({ [session.date]: session }, 2026, 9)]).toEqual([19]);
  expect(hasActivity({ ...session, aerobicActivities: [] })).toBe(false);
});

test('backup conserva múltiples actividades, campos ausentes, ceros y calorías inclusivas', () => {
  const session: Session = { ...cardioDay(), aerobicActivities: [bike, { id: 'walk-2', type: 'Caminar', minutes: 20 }, { id: 'row-3', type: 'Remo', minutes: 5, calories: 0, distanceKm: 0 }], trainingCalories: 350, trainingCaloriesIncludeAerobic: true };
  const data = { sessions: [session], customExercises: [], plan: createDefaultPlan() };
  const restored = parseBackup(serializeBackup(data)).data.sessions[0];
  expect(restored).toEqual(session);
  expect(restored.aerobicActivities?.[1]).not.toHaveProperty('calories');
  expect(restored.aerobicActivities?.[1]).not.toHaveProperty('distanceKm');
  expect(restored.aerobicActivities?.[2].calories).toBe(0);
  const legacy = parseBackup(serializeBackup({ ...data, sessions: [createSession('2026-10-18')] })).data.sessions[0];
  expect(legacy.aerobicActivities).toBeUndefined();
  expect(legacy.trainingCalories).toBeUndefined();
});

test('datos imposibles no se aceptan y cero sigue permitido en kcal y km', () => {
  for (const patch of [{ minutes: 0 }, { minutes: -1 }, { minutes: NaN }, { minutes: Infinity }, { calories: -1 }, { distanceKm: -1 }, { type: '' }]) {
    expect(zSession.safeParse({ ...cardioDay(), aerobicActivities: [{ ...bike, ...patch }] }).success).toBe(false);
  }
  for (const trainingCalories of [-1, NaN, Infinity]) {
    expect(zSession.safeParse({ ...cardioDay(), trainingCalories }).success).toBe(false);
  }
  expect(zSession.safeParse({ ...cardioDay(), trainingCalories: 0, aerobicActivities: [{ ...bike, calories: 0, distanceKm: 0 }] }).success).toBe(true);
});

test('totales suman cardio opcional y evitan duplicar las calorías incluidas por el reloj', async () => {
  const { activityTotals } = await import('../src/logic/aerobic');
  expect(activityTotals(createSession('2026-10-19')).totalCalories).toBeNull();
  const session = { ...cardioDay(), aerobicActivities: [bike, { id: 'walk', type: 'Caminar', minutes: 20, calories: 75, distanceKm: 2 }], trainingCalories: 350 };
  expect(activityTotals(session)).toMatchObject({ minutes: 38.5, distanceKm: 8.2, aerobicCalories: 200, totalCalories: 550 });
  expect(activityTotals({ ...session, trainingCaloriesIncludeAerobic: true }).totalCalories).toBe(350);
  expect(activityTotals({ ...session, trainingCalories: 0, trainingCaloriesIncludeAerobic: true }).totalCalories).toBe(0);
  expect(activityTotals({ ...cardioDay(), aerobicActivities: [{ id: 'walk', type: 'Caminar', minutes: 20 }] })).toMatchObject({ minutes: 20, distanceKm: null, aerobicCalories: null, totalCalories: null });
});
