import { GROUPS } from '../data/exercises';
import type { AppData } from '../db/bootstrap';
import type { GroupId, Session } from '../db/schema';
import { hasActivity } from './activity';
import { createSession } from './session';

// Only the requested routine is distributed. Personal backups and activity
// records must never be bundled with the public application.
export const ROUTINE_ID = '2026-09-28-r1';
export const ROUTINE_START = '2026-09-28';
export const ROUTINE_END = '2026-10-04';
export const WEEK_ROUTINE: { date: string; groups: GroupId[]; ids: string[] }[] = [
  { date: '2026-09-28', groups: ['espalda', 'bicep'],
    ids: ['pullup', 'seated_row_machine', 'dumbbell_curl', 'hammer_curl_db'] },
  { date: '2026-09-29', groups: ['pierna', 'hombro'],
    ids: ['hip_thrust', 'leg_ext', 'lying_leg_curl', 'dumbbell_shoulder_press', 'lateral_raise_db'] },
  { date: '2026-10-01', groups: ['pecho', 'tricep'],
    ids: ['incline_bench_press', 'pec_deck', 'straight_bar_pressdown', 'overhead_triceps_db'] },
  { date: '2026-10-03', groups: ['pierna', 'core'],
    ids: ['leg_press_incline', 'calf_machine', 'plank_short', 'side_plank', 'reverse_crunch', 'russian_twist'] },
];

/** One-time, additive delivery. Never import/replace the user's database. */
export function applyPublishedRoutine(data: AppData, today: string, force = false): AppData {
  if (today < ROUTINE_START || today > ROUTINE_END || data.plan.routineRevision === ROUTINE_ID) return data;
  const hasRecentHistory = Object.values(data.sessions).some((s) =>
    s.date >= '2026-09-21' && s.date < ROUTINE_START && hasActivity(s));
  // Do not inject a personal routine into an empty install or an unrelated backup.
  if (!force && !hasRecentHistory) return data;
  const sessions = { ...data.sessions };
  for (const day of WEEK_ROUTINE) {
    const existing = sessions[day.date];
    if (day.date < today || (existing && (hasActivity(existing) || existing.manuallyEdited || existing.selectedExercises !== undefined))) continue;
    sessions[day.date] = {
      ...createSession(day.date), groups: day.groups, programmed: day.ids,
      format: day.ids.length === 5 ? 'ext' : 'base',
      programTitle: `Semana revisada · ${day.groups.map((g) => GROUPS[g].label).join(' + ')}`,
    } satisfies Session;
  }
  const legacyFestival = /festival/i.test(data.plan.objective);
  return {
    ...data, sessions,
    plan: {
      ...data.plan, routineRevision: ROUTINE_ID, week: '28 sep – 4 oct',
      focus: 'Fuerza equilibrada', secondary: 'Prioridad bíceps · core · aeróbico opcional',
      objective: 'Retomar el trabajo directo de bíceps, cubrir todos los grupos y variar los complementarios.',
      rule: legacyFestival ? 'Cargas que puedas controlar, sin buscar el fallo. No entrenes sobre dolor.' : data.plan.rule,
      notes: 'Cuatro sesiones: lunes, martes, jueves y sábado. Dominadas estrictas y máquinas de cuádriceps/isquios conservadas. Core: cuatro ejercicios. Bici o remo como complemento, no como grupo principal. Sin aumentos de carga automáticos: faltan datos de esfuerzo y recuperación.',
    },
  };
}
