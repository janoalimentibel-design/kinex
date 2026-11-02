import type { AppData } from '../db/bootstrap';
import type { GroupId, Session } from '../db/schema';
import { hasActivity } from './activity';
import { createSession } from './session';

export const NOV2_ID = '2026-11-02-r1';
export const NOV2_START = '2026-11-02';
export const NOV2_END = '2026-11-08';
export const NOV2_AVAILABLE = '2026-11-02';
export const NOV2_DAYS: { date: string; groups: GroupId[]; ids: string[] }[] = [
  { date: '2026-11-02', groups: ['pierna', 'hombro'], ids: ['bench_leg_extension', 'glute_bridge', 'standing_calf_raise', 'dumbbell_shoulder_press', 'lateral_raise_db'] },
  { date: '2026-11-03', groups: ['pecho', 'tricep'], ids: ['incline_bench_press', 'pec_deck', 'pushup', 'rope_pressdown', 'supported_db_kickback'] },
  { date: '2026-11-05', groups: ['espalda', 'bicep'], ids: ['pullup', 'chest_supported_db_row', 'pull_apart_back', 'incline_db_curl', 'hammer_curl_db'] },
  { date: '2026-11-07', groups: ['pierna', 'core'], ids: ['romanian_deadlift', 'tibialis', 'bird_dog', 'side_plank', 'pallof'] },
];

/** Add the reviewed week without replacing any exercise choice or activity. */
export function applyNov2Routine(data: AppData, today: string, force = false): AppData {
  if (today < NOV2_AVAILABLE || today > NOV2_END || data.plan.routineRevision === NOV2_ID) return data;
  const recentActivity = Object.values(data.sessions).some(session =>
    session.date >= '2026-10-19' && session.date < NOV2_START && hasActivity(session));
  if (!force && !recentActivity) return data;
  const sessions = { ...data.sessions };
  for (const day of NOV2_DAYS) {
    const existing = sessions[day.date];
    if (day.date < today || (existing && (
      hasActivity(existing) || existing.saved || existing.manuallyEdited || existing.planner?.locked === true ||
      Object.keys(existing.replacements).length > 0 || existing.extras.length > 0 ||
      existing.selectedExercises !== undefined || (Boolean(existing.programmed?.length) && existing.planner?.source !== 'adaptive')
    ))) continue;
    sessions[day.date] = {
      ...createSession(day.date, data.sessions, data.plan),
      groups: day.groups.slice(), programmed: day.ids.slice(),
      format: day.ids.length === 5 ? 'ext' : 'long',
      // This requested program is explicit, so automatic rebalancing preserves it.
      programTitle: 'Rutina semanal · 2–8 nov',
    } satisfies Session;
  }
  return {
    ...data, sessions,
    plan: {
      ...data.plan, routineRevision: NOV2_ID, week: '2–8 nov',
      focus: 'Fuerza equilibrada', secondary: 'Core · técnica controlada',
      objective: 'Arrancar el lunes con piernas y hombros. Martes: pecho y tríceps; jueves: espalda y bíceps; sábado: piernas y core. Miércoles, viernes y domingo: recuperación.',
      notes: 'Usá cargas controladas, dejando 2–3 repeticiones en reserva. No se aumenta el peso automáticamente ni se fijan kilos: faltan registros de carga. Parar si aparece molestia lumbar o irradiada. Bici o remo como complemento opcional.',
    },
  };
}
