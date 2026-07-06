// Estadísticas derivadas del historial — funciones puras sobre fechas YYYY-MM-DD.
// Todo en UTC para ser coherente con isoDate() (que usa toISOString).
import type { Session } from '../db/schema';

export function mondayOf(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  const shift = (d.getUTCDay() + 6) % 7; // lunes = 0
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function savedDates(sessions: Record<string, Session>): string[] {
  return Object.values(sessions).filter((s) => s.saved).map((s) => s.date).sort();
}

// Racha: semanas consecutivas (lunes a domingo) con al menos una sesión guardada,
// contando hacia atrás. La semana actual no rompe la racha si todavía no entrenaste.
export function weeklyStreak(sessions: Record<string, Session>, today: string): number {
  const weeks = new Set(savedDates(sessions).map(mondayOf));
  if (!weeks.size) return 0;
  let monday = mondayOf(today);
  let streak = 0;
  if (weeks.has(monday)) streak = 1;
  // si la semana actual aún no tiene sesión, se empieza a contar desde la anterior
  monday = addDays(monday, -7);
  while (weeks.has(monday)) {
    streak++;
    monday = addDays(monday, -7);
  }
  return streak;
}

// Sesiones por semana para las últimas N semanas (incluida la actual), en orden cronológico.
export interface WeekCount {
  monday: string;
  count: number;
}

export function sessionsPerWeek(sessions: Record<string, Session>, weeks: number, today: string): WeekCount[] {
  const counts = new Map<string, number>();
  for (const date of savedDates(sessions)) {
    const key = mondayOf(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out: WeekCount[] = [];
  let monday = mondayOf(today);
  for (let i = 0; i < weeks; i++) {
    out.unshift({ monday, count: counts.get(monday) ?? 0 });
    monday = addDays(monday, -7);
  }
  return out;
}

// Series de métricas (0-10) de las últimas N sesiones guardadas con métricas, cronológicas.
export interface MetricPoint {
  date: string;
  lumbarBefore: number;
  lumbarAfter: number;
  knee: number;
}

export function metricSeries(sessions: Record<string, Session>, limit = 12): MetricPoint[] {
  return Object.values(sessions)
    .filter((s) => s.saved && s.metrics)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)
    .map((s) => ({
      date: s.date,
      lumbarBefore: s.metrics!.lumbarBefore,
      lumbarAfter: s.metrics!.lumbarAfter,
      knee: s.metrics!.knee,
    }));
}

// Días entrenados de un mes dado (year, month 0-11) para el calendario.
export function trainedDaysOfMonth(sessions: Record<string, Session>, year: number, month: number): Set<number> {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  const days = new Set<number>();
  for (const date of savedDates(sessions)) {
    if (date.startsWith(prefix)) days.add(Number(date.slice(8, 10)));
  }
  return days;
}
