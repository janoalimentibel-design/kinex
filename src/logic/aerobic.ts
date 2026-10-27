import type { Session } from '../db/schema';

export type ActivityData = Pick<Session, 'aerobicActivities' | 'trainingCalories' | 'trainingCaloriesIncludeAerobic' | 'gymMinutes'>;
export function activitySignature(session: ActivityData): string {
  return JSON.stringify([session.aerobicActivities ?? [], session.trainingCalories ?? null, session.trainingCaloriesIncludeAerobic ?? false, session.gymMinutes ?? null]);
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
    gymMinutes: session.gymMinutes ?? null,
    aerobicMinutes: activities.length ? activities.reduce((sum, item) => sum + item.minutes, 0) : null,
    trainingCalories: training ?? null,
    minutes: activities.reduce((sum, item) => sum + item.minutes, 0),
    distanceKm: sumOptional('distanceKm'),
    aerobicCalories,
    totalCalories: training === undefined ? aerobicCalories
      : session.trainingCaloriesIncludeAerobic ? training : training + (aerobicCalories ?? 0),
  };
}


export type ActivityRange = 'week' | 'month' | 'all';
/** Calendar periods in local dates. Gym is elapsed stay; cardio is reported separately, never added. */
export function summarizeActivity(sessions: Session[], range: ActivityRange, today: string) {
  const date = new Date(`${today}T12:00:00`);
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const iso = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const start = range === 'week' ? iso(monday) : range === 'month' ? `${today.slice(0, 7)}-01` : '';
  const selected = sessions.filter(session => session.date <= today && session.date >= start);
  const totals = selected.map(activityTotals);
  const sum = (key: 'gymMinutes' | 'aerobicMinutes' | 'trainingCalories' | 'aerobicCalories' | 'totalCalories' | 'distanceKm') => {
    const values = totals.flatMap(total => total[key] === null ? [] : [total[key]!]);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  return {
    gymMinutes: sum('gymMinutes'), aerobicMinutes: sum('aerobicMinutes'),
    trainingCalories: sum('trainingCalories'), aerobicCalories: sum('aerobicCalories'),
    totalCalories: sum('totalCalories'), distanceKm: sum('distanceKm'),
    days: totals.filter(total => total.gymMinutes !== null || total.aerobicMinutes !== null || total.totalCalories !== null).length,
    gymRecordedDays: totals.filter(total => total.gymMinutes !== null).length,
    aerobicRecordedDays: totals.filter(total => total.aerobicMinutes !== null).length,
    calorieRecordedDays: totals.filter(total => total.totalCalories !== null).length,
  };
}
