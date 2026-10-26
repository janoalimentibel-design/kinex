import type { Session } from '../db/schema';

export type ActivityData = Pick<Session, 'aerobicActivities' | 'trainingCalories' | 'trainingCaloriesIncludeAerobic'>;
export function activitySignature(session: ActivityData): string {
  return JSON.stringify([session.aerobicActivities ?? [], session.trainingCalories ?? null, session.trainingCaloriesIncludeAerobic ?? false]);
}
export function activityTotals(session: ActivityData) {
  const activities = session.aerobicActivities ?? [];
  const sumOptional = (field: 'calories' | 'distanceKm') => {
    const values = activities.flatMap(item => item[field] === undefined ? [] : [item[field]!]);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  };
  const aerobicCalories = sumOptional('calories');
  const training = session.trainingCalories;
  return {
    minutes: activities.reduce((sum, item) => sum + item.minutes, 0),
    distanceKm: sumOptional('distanceKm'),
    aerobicCalories,
    totalCalories: training === undefined ? aerobicCalories
      : session.trainingCaloriesIncludeAerobic ? training : training + (aerobicCalories ?? 0),
  };
}
