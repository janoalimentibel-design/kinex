import type { AppData } from '../db/bootstrap';
import type { GroupId, Session } from '../db/schema';
import { CATALOG } from '../data/exercises';
import { activityGroups, hasActivity } from './activity';
import { buildExerciseList, createSession, isoDate, suggestedGroups } from './session';

export const NOV9_PREVIOUS_ID = '2026-11-09-r1';
export const NOV9_ID = '2026-11-09-r2';
export const NOV9_START = '2026-11-09';
export const NOV9_END = '2026-11-15';
export const NOV9_AVAILABLE = '2026-11-08';
export const NOV9_PREVIOUS_DAYS: { date: string; groups: GroupId[]; ids: string[] }[] = [
  { date: '2026-11-09', groups: ['pierna', 'hombro'], ids: ['bench_leg_extension', 'glute_bridge', 'seated_calf_raise_db', 'dumbbell_shoulder_press', 'lateral_raise_db'] },
  { date: '2026-11-10', groups: ['pecho', 'tricep'], ids: ['bench_press', 'pec_deck', 'pushup', 'straight_bar_pressdown', 'overhead_triceps_db'] },
  { date: '2026-11-12', groups: ['espalda', 'bicep'], ids: ['pullup', 'cable_low_row', 'pull_apart_back', 'dumbbell_curl', 'hammer_curl_db'] },
  { date: '2026-11-14', groups: ['pierna', 'core'], ids: ['romanian_deadlift', 'tibialis', 'dead_bug', 'side_plank', 'pallof'] },
];

export const NOV9_DAYS: { date: string; groups: GroupId[]; ids: string[] }[] = [
  { date: '2026-11-09', groups: ['pecho', 'tricep'], ids: ['bench_press', 'pec_deck', 'pushup', 'straight_bar_pressdown', 'overhead_triceps_db'] },
  { date: '2026-11-10', groups: ['espalda', 'bicep'], ids: ['pullup', 'cable_low_row', 'pull_apart_back', 'dumbbell_curl', 'hammer_curl_db'] },
  { date: '2026-11-12', groups: ['pierna', 'hombro'], ids: ['bench_leg_extension', 'glute_bridge', 'seated_calf_raise_db', 'dumbbell_shoulder_press', 'lateral_raise_db'] },
  { date: '2026-11-14', groups: ['pierna', 'core'], ids: ['romanian_deadlift', 'tibialis', 'dead_bug', 'side_plank', 'pallof'] },
];


const TITLE = 'Rutina semanal · 9–15 nov';
const same = (a: string[] | undefined, b: string[]) => a?.length === b.length && a.every((item, index) => item === b[index]);

function hasUntouchedPayload(session: Session): boolean {
  return session.mode === 'mix' && session.format === 'ext' && session.extraTarget === 'auto' &&
    !hasActivity(session) && !session.manuallyEdited && session.selectedExercises === undefined &&
    Object.keys(session.completed).length === 0 && Object.keys(session.replacements).length === 0 && session.extras.length === 0 &&
    Object.keys(session.setLogs ?? {}).length === 0 && !session.exerciseLog?.length && !session.checkin && !session.metrics &&
    session.trainingCaloriesIncludeAerobic === undefined;
}

/** Fingerprint only application-owned, wholly untouched published sessions. */
export function isUntouchedNov9Session(session: Session, previous = false): boolean {
  const day = (previous ? NOV9_PREVIOUS_DAYS : NOV9_DAYS).find(day => day.date === session.date);
  return Boolean(day && session.programTitle === TITLE && same(session.programmed, day.ids) && same(session.groups, day.groups) &&
    session.planner === undefined && hasUntouchedPayload(session));
}

/** The guard's adaptive marker remains eligible until the user records or edits anything. */
export function isUntouchedNov9Adjustment(session: Session): boolean {
  return session.programTitle === 'Próxima semana · Ajustada a la actividad registrada' &&
    session.planner?.source === 'adaptive' && session.planner.week === NOV9_START && !session.planner.locked &&
    Boolean(session.programmed?.length) && new Set(session.programmed).size === session.programmed?.length &&
    session.programmed!.every(id => CATALOG[id] && session.groups.includes(CATALOG[id].group)) && hasUntouchedPayload(session);
}

/** Real neighbouring work wins over an untouched published proposal, even unsaved checks. */
export function reconcileNov9Activity(data: AppData, today: string, keepDate?: string): AppData {
  if (data.plan.routineRevision !== NOV9_ID || today > NOV9_END || today < NOV9_AVAILABLE) return data;
  const sessions = { ...data.sessions };
  const all = { ...CATALOG, ...data.custom };
  let changed = false;
  for (const day of NOV9_DAYS) {
    const existing = sessions[day.date];
    if (day.date < today || day.date === keepDate || !existing || (!isUntouchedNov9Session(existing) && !isUntouchedNov9Adjustment(existing))) continue;
    const blocked = new Set<GroupId>();
    for (const offset of [-1, 1]) {
      const date = new Date(`${day.date}T12:00:00`);
      date.setDate(date.getDate() + offset);
      const neighbour = sessions[isoDate(date)];
      if (neighbour && hasActivity(neighbour)) {
        for (const group of activityGroups(neighbour, all)) if (group !== 'aerobico') blocked.add(group);
      }
    }
    if (!existing.groups.some(group => blocked.has(group))) continue;
    const suggested = suggestedGroups(day.date, sessions, data.plan, all, today);
    const available: GroupId[] = ['pecho', 'tricep', 'espalda', 'bicep', 'pierna', 'hombro', 'core'].filter((group): group is GroupId => !blocked.has(group as GroupId));
    const groups = suggested.every(group => !blocked.has(group)) ? suggested : available.slice(0, 2);
    const updated: Session = {
      ...existing, groups: groups.length ? groups : existing.groups,
      programmed: undefined,
      programTitle: groups.length ? 'Próxima semana · Ajustada a la actividad registrada' : 'Recuperación · Sin ejercicios programados tras actividad contigua',
      planner: { source: 'adaptive', week: NOV9_START },
      ...(groups.length ? {} : { selectedExercises: [] }),
    };
    sessions[day.date] = groups.length
      ? { ...updated, programmed: buildExerciseList(updated, all, sessions).map(entry => entry.id) }
      : updated;
    changed = true;
  }
  return changed ? { ...data, sessions } : data;
}

/** Add the reviewed week without replacing any exercise choice or activity. */
export function applyNov9Routine(data: AppData, today: string, force = false): AppData {
  if (today < NOV9_AVAILABLE || today > NOV9_END) return data;
  if (data.plan.routineRevision === NOV9_ID) return reconcileNov9Activity(data, today);
  // A later revision must never be replaced by an older release.
  if (data.plan.routineRevision?.startsWith('2026-11-09-r') && data.plan.routineRevision !== NOV9_PREVIOUS_ID) return data;
  const migrating = data.plan.routineRevision === NOV9_PREVIOUS_ID;
  const recentActivity = Object.values(data.sessions).some(session =>
    session.date >= '2026-10-26' && session.date < NOV9_START && hasActivity(session));
  if (!force && !recentActivity && !migrating) return data;
  const sessions = { ...data.sessions };
  for (const day of NOV9_DAYS) {
    const existing = sessions[day.date];
    if (migrating && existing && !isUntouchedNov9Session(existing, true)) continue;
    if (day.date < today || (existing && (
      Boolean(existing.metrics || existing.checkin || existing.exerciseLog?.length) || hasActivity(existing) || Object.values(existing.setLogs ?? {}).some(sets => sets.length > 0) || existing.saved || existing.manuallyEdited || existing.planner?.locked === true ||
      Object.keys(existing.replacements).length > 0 || existing.extras.length > 0 ||
      existing.selectedExercises !== undefined || (Boolean(existing.programmed?.length) && existing.planner?.source !== 'adaptive' && !(migrating && isUntouchedNov9Session(existing, true)))
    ))) continue;
    sessions[day.date] = {
      ...createSession(day.date, data.sessions, data.plan),
      groups: day.groups.slice(), programmed: day.ids.slice(),
      format: day.ids.length === 5 ? 'ext' : 'long',
      // This requested program is explicit, so automatic rebalancing preserves it.
      programTitle: 'Rutina semanal · 9–15 nov',
    } satisfies Session;
  }
  return reconcileNov9Activity({
    ...data, sessions,
    plan: {
      ...data.plan, routineRevision: NOV9_ID, week: '9–15 nov',
      focus: 'Fuerza equilibrada', secondary: 'Core · técnica controlada',
      objective: 'Propuesta: lunes pecho y tríceps; martes espalda y bíceps; jueves piernas y hombros; sábado: piernas y core. Miércoles, viernes y domingo: recuperación.',
      notes: 'Usá cargas controladas, dejando 2–3 repeticiones en reserva. No se aumenta el peso automáticamente ni se fijan kilos: faltan registros de carga. Parar si aparece molestia lumbar o irradiada. Gemelos sentado con mancuerna reemplaza la elevación de pie: usa el banco y las mancuernas confirmados. Bici o remo como complemento opcional.',
    },
  }, today);
}
