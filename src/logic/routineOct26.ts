import type { AppData } from '../db/bootstrap';
import type { GroupId, Session } from '../db/schema';
import { hasActivity } from './activity';
import { createSession } from './session';

export const OCT26_ID = '2026-10-26-r1';
export const OCT26_START = '2026-10-26';
export const OCT26_END = '2026-11-01';
export const OCT26_AVAILABLE = '2026-10-25';
export const OCT26_DAYS: { date: string; groups: GroupId[]; ids: string[] }[] = [
  { date: '2026-10-26', groups: ['pecho', 'tricep'], ids: ['incline_bench_press', 'pec_deck', 'pushup', 'rope_pressdown', 'supported_db_kickback'] },
  { date: '2026-10-27', groups: ['espalda', 'bicep'], ids: ['pullup', 'chest_supported_db_row', 'pull_apart_back', 'incline_db_curl', 'hammer_curl_db'] },
  { date: '2026-10-29', groups: ['pierna', 'hombro'], ids: ['bench_leg_extension', 'glute_bridge', 'standing_calf_raise', 'dumbbell_shoulder_press', 'lateral_raise_db'] },
  { date: '2026-10-31', groups: ['pierna', 'core'], ids: ['romanian_deadlift', 'tibialis', 'bird_dog', 'side_plank', 'pallof', 'decline_bench_crunch'] },
];

/** Add the reviewed week without replacing any exercise choice or activity. */
export function applyOct26Routine(data: AppData, today: string, force = false): AppData {
  if (today < OCT26_AVAILABLE || today > OCT26_END || data.plan.routineRevision === OCT26_ID) return data;
  const recentActivity = Object.values(data.sessions).some(session =>
    session.date >= '2026-10-12' && session.date <= OCT26_AVAILABLE && hasActivity(session));
  if (!force && !recentActivity) return data;
  const sessions = { ...data.sessions };
  for (const day of OCT26_DAYS) {
    const existing = sessions[day.date];
    if (day.date < today || (existing && (
      hasActivity(existing) || existing.saved || existing.manuallyEdited ||
      existing.selectedExercises !== undefined || Boolean(existing.programmed?.length)
    ))) continue;
    sessions[day.date] = {
      ...createSession(day.date, data.sessions, data.plan),
      groups: day.groups.slice(), programmed: day.ids.slice(),
      format: day.ids.length === 5 ? 'ext' : 'long',
      programTitle: 'Semana revisada · 26 oct – 1 nov',
    } satisfies Session;
  }
  return {
    ...data, sessions,
    plan: {
      ...data.plan, routineRevision: OCT26_ID, week: '26 oct – 1 nov',
      focus: 'Fuerza equilibrada', secondary: 'Core · técnica controlada',
      objective: 'Cuatro días de fuerza: lunes, martes, jueves y sábado. Miércoles, viernes y domingo quedan para recuperación.',
      notes: 'Usá cargas controladas, dejando 2–3 repeticiones en reserva. No se aumenta el peso automáticamente ni se fijan kilos: faltan registros de carga. Parar si aparece molestia lumbar o irradiada. El abdominal en banco inclinado es condicional a tolerancia e indicaciones: sin peso y con recorrido recortado. Si molesta o no está indicado, omitilo; Bird Dog ya está incluido. Bici o remo como complemento opcional.',
    },
  };
}
