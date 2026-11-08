import type { AppData } from '../db/bootstrap';
import type { GroupId, Session } from '../db/schema';
import { hasActivity } from './activity';
import { createSession } from './session';

export const NOV9_ID = '2026-11-09-r1';
export const NOV9_START = '2026-11-09';
export const NOV9_END = '2026-11-15';
export const NOV9_AVAILABLE = '2026-11-08';
export const NOV9_DAYS: { date: string; groups: GroupId[]; ids: string[] }[] = [
  { date: '2026-11-09', groups: ['pierna', 'hombro'], ids: ['bench_leg_extension', 'glute_bridge', 'seated_calf_raise_db', 'dumbbell_shoulder_press', 'lateral_raise_db'] },
  { date: '2026-11-10', groups: ['pecho', 'tricep'], ids: ['bench_press', 'pec_deck', 'pushup', 'straight_bar_pressdown', 'overhead_triceps_db'] },
  { date: '2026-11-12', groups: ['espalda', 'bicep'], ids: ['pullup', 'cable_low_row', 'pull_apart_back', 'dumbbell_curl', 'hammer_curl_db'] },
  { date: '2026-11-14', groups: ['pierna', 'core'], ids: ['romanian_deadlift', 'tibialis', 'dead_bug', 'side_plank', 'pallof'] },
];

/** Add the reviewed week without replacing any exercise choice or activity. */
export function applyNov9Routine(data: AppData, today: string, force = false): AppData {
  if (today < NOV9_AVAILABLE || today > NOV9_END || data.plan.routineRevision === NOV9_ID) return data;
  const recentActivity = Object.values(data.sessions).some(session =>
    session.date >= '2026-10-26' && session.date < NOV9_START && hasActivity(session));
  if (!force && !recentActivity) return data;
  const sessions = { ...data.sessions };
  for (const day of NOV9_DAYS) {
    const existing = sessions[day.date];
    if (day.date < today || (existing && (
      hasActivity(existing) || Object.values(existing.setLogs ?? {}).some(sets => sets.length > 0) || existing.saved || existing.manuallyEdited || existing.planner?.locked === true ||
      Object.keys(existing.replacements).length > 0 || existing.extras.length > 0 ||
      existing.selectedExercises !== undefined || (Boolean(existing.programmed?.length) && existing.planner?.source !== 'adaptive')
    ))) continue;
    sessions[day.date] = {
      ...createSession(day.date, data.sessions, data.plan),
      groups: day.groups.slice(), programmed: day.ids.slice(),
      format: day.ids.length === 5 ? 'ext' : 'long',
      // This requested program is explicit, so automatic rebalancing preserves it.
      programTitle: 'Rutina semanal · 9–15 nov',
    } satisfies Session;
  }
  return {
    ...data, sessions,
    plan: {
      ...data.plan, routineRevision: NOV9_ID, week: '9–15 nov',
      focus: 'Fuerza equilibrada', secondary: 'Core · técnica controlada',
      objective: 'Arrancar el lunes con piernas y hombros. Martes: pecho y tríceps; jueves: espalda y bíceps; sábado: piernas y core. Miércoles, viernes y domingo: recuperación.',
      notes: 'Usá cargas controladas, dejando 2–3 repeticiones en reserva. No se aumenta el peso automáticamente ni se fijan kilos: faltan registros de carga. Parar si aparece molestia lumbar o irradiada. Gemelos sentado con mancuerna reemplaza la elevación de pie: usa el banco y las mancuernas confirmados. Bici o remo como complemento opcional.',
    },
  };
}
