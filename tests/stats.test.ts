// Estadísticas de la Fase 4: racha semanal, sesiones por semana, series de métricas.
import { expect, test } from 'vitest';
import { createSession } from '../src/logic/session';
import { metricSeries, mondayOf, sessionsPerWeek, trainedDaysOfMonth, weeklyStreak } from '../src/logic/stats';
import type { Session } from '../src/db/schema';

function saved(date: string, lumbarAfter = 1, knee = 0): Session {
  return {
    ...createSession(date),
    date,
    saved: true,
    metrics: { lumbarBefore: 2, lumbarAfter, knee, energy: 'media', notes: '' },
  };
}

const asMap = (list: Session[]) => Object.fromEntries(list.map((s) => [s.date, s]));

test('mondayOf: lunes de la semana en UTC, sin drift de zona horaria', () => {
  expect(mondayOf('2026-07-06')).toBe('2026-07-06'); // lunes
  expect(mondayOf('2026-07-12')).toBe('2026-07-06'); // domingo
  expect(mondayOf('2026-07-01')).toBe('2026-06-29'); // cruce de mes
});

test('weeklyStreak: semanas consecutivas; la semana actual sin sesión no rompe la racha', () => {
  // hoy lunes 2026-07-06; sesiones en las 3 semanas anteriores, ninguna esta semana
  const sessions = asMap([saved('2026-06-17'), saved('2026-06-24'), saved('2026-07-01')]);
  expect(weeklyStreak(sessions, '2026-07-06')).toBe(3);
  // con sesión esta semana, suma 4
  expect(weeklyStreak(asMap([saved('2026-06-17'), saved('2026-06-24'), saved('2026-07-01'), saved('2026-07-06')]), '2026-07-06')).toBe(4);
  // hueco de una semana corta la racha
  expect(weeklyStreak(asMap([saved('2026-06-10'), saved('2026-07-01')]), '2026-07-06')).toBe(1);
  // sin sesiones guardadas
  expect(weeklyStreak({}, '2026-07-06')).toBe(0);
  // una sesión sin guardar no cuenta
  expect(weeklyStreak(asMap([{ ...saved('2026-07-01'), saved: false }]), '2026-07-06')).toBe(0);
});

test('sessionsPerWeek: últimas N semanas en orden cronológico con conteos', () => {
  const sessions = asMap([saved('2026-06-30'), saved('2026-07-02'), saved('2026-07-06')]);
  const weeks = sessionsPerWeek(sessions, 3, '2026-07-06');
  expect(weeks).toHaveLength(3);
  expect(weeks[0]).toEqual({ monday: '2026-06-22', count: 0 });
  expect(weeks[1]).toEqual({ monday: '2026-06-29', count: 2 });
  expect(weeks[2]).toEqual({ monday: '2026-07-06', count: 1 });
});

test('metricSeries: solo sesiones guardadas con métricas, cronológicas y limitadas', () => {
  const many = Array.from({ length: 15 }, (_, i) => saved(`2026-06-${String(i + 1).padStart(2, '0')}`, i % 5, i % 3));
  const series = metricSeries(asMap([...many, { ...createSession('2026-06-20'), saved: true, metrics: null }]), 12);
  expect(series).toHaveLength(12);
  expect(series[0].date < series[11].date).toBe(true);
  expect(series.every((p) => p.lumbarAfter >= 0 && p.knee >= 0)).toBe(true);
});

test('trainedDaysOfMonth: días del mes con sesión guardada', () => {
  const sessions = asMap([saved('2026-07-02'), saved('2026-07-06'), saved('2026-06-30')]);
  const days = trainedDaysOfMonth(sessions, 2026, 6); // julio = mes 6 (0-11)
  expect([...days].sort((a, b) => a - b)).toEqual([2, 6]);
});
