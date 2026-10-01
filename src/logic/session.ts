// Lógica pura de sesiones — portada 1:1 de A2.8 (src/session.js + funciones de app.js).
// Mismas reglas: 2 grupos por sesión, candidatos ordenados por nivel y nombre,
// avanzados excluidos de la selección automática, extra del Extendido al grupo
// menos trabajado en los últimos 7 días.
import { COMBOS, FORMATS } from '../data/exercises';
import type { CatalogExercise, Format, GroupId, Mode, Plan, Session } from '../db/schema';
import { activityGroups, activityLog, completedIds, hasActivity } from './activity';

export type ExerciseMap = Record<string, CatalogExercise>;

// Preferencia personal: la versión con banda queda disponible en Biblioteca
// como adaptación manual, pero no vuelve a entrar en una rutina sugerida.
const AUTOMATIC_EXERCISE_EXCLUSIONS = new Set(['pullup_band', 'chin_assist']);

// Prioridades semanales personalizadas. Solo se fuerzan cuando el modo de la
// sesión admite el ejercicio; así una sesión explícitamente sin peso no recibe
// una máquina y una sesión solo con peso no recibe una dominada estricta.
const WEEKLY_GROUP_PRIORITIES: Partial<Record<GroupId, string[]>> = {
  espalda: ['pullup'],
  pierna: ['leg_ext', 'lying_leg_curl'],
};

export interface SessionEntry {
  id: string;
  group: GroupId;
  src: 'auto' | 'extra-auto' | 'extra' | 'reemplazo';
  from?: string;
}

export function isoDate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function isModeCompatible(exercise: CatalogExercise, mode: Mode): boolean {
  return mode === 'mix' || exercise.modes.includes(mode);
}

export function levelScore(level: CatalogExercise['level']): number {
  return level === 'Inicial' ? 1 : level === 'Progresivo' ? 2 : 3;
}

export interface NextSessionSuggestion {
  groups: [GroupId, GroupId];
  reason: string;
}

// Calendar neighbours include the other side of a week boundary and future
// pinned routines. A completed replacement can belong to a different group.
export function adjacentGroups(date: string, sessions: Record<string, Session>, all?: ExerciseMap): Set<GroupId> {
  const groups = new Set<GroupId>();
  for (const offset of [-1, 1]) {
    const day = new Date(`${date}T12:00:00`);
    day.setDate(day.getDate() + offset);
    const neighbour = sessions[isoDate(day)];
    if (!neighbour) continue;
    for (const group of [...neighbour.groups, ...activityGroups(neighbour, all)]) {
      if (group !== 'aerobico') groups.add(group);
    }
  }
  return groups;
}

export function suggestedGroups(date: string, sessions: Record<string, Session> = {}, _plan?: Plan, all?: ExerciseMap): [GroupId, GroupId] {
  // El cardio cotidiano del usuario no debe secuestrar la sesión de fuerza.
  // Aeróbico se registra únicamente cuando el usuario lo elige como sesión aparte.
  const blocked = adjacentGroups(date, sessions, all);
  let pool = COMBOS.filter((pair) => pair.every((group) => !blocked.has(group)));
  // Neighbours may reserve groups absent from the usual pair combinations.
  // Keep the no-repeat rule instead of silently falling back to a conflict.
  if (!pool.length) {
    const available = (['pierna', 'espalda', 'pecho', 'hombro', 'bicep', 'tricep', 'core'] as GroupId[]).filter((g) => !blocked.has(g));
    pool = available.flatMap((a, i) => available.slice(i + 1).map((b): [GroupId, GroupId] => [a, b]));
  }
  // Pathological imported sessions can record every group across neighbours.
  // The caller can expose that conflict; avoid crashing historical views.
  if (!pool.length) pool = COMBOS;
  const preferredIndex = (new Date(`${date}T12:00:00`).getDay() + 1) % COMBOS.length;
  const start = weekStart(date);
  const groupLoad = new Map<GroupId, number>();

  // Cuenta sólo la semana calendario en curso. Una modificación anterior —sin
  // guardar todavía— también cuenta, para que el próximo día se reequilibre.
  for (const [otherDate, session] of Object.entries(sessions)) {
    if (otherDate < start || otherDate >= date) continue;
    for (const group of hasActivity(session) ? activityGroups(session, all) : session.groups) groupLoad.set(group, (groupLoad.get(group) ?? 0) + 1);
  }

  const ranked = pool.map((combo, index) => {
    const used = (groupLoad.get(combo[0]) ?? 0) + (groupLoad.get(combo[1]) ?? 0);
    const samePair = Object.entries(sessions).some(([otherDate, session]) => {
      return otherDate >= start && otherDate < date && session.groups.includes(combo[0]) && session.groups.includes(combo[1]);
    });
    // Se conserva una preferencia semanal estable solo como desempate.
    const originalIndex = COMBOS.findIndex((pair) => pair[0] === combo[0] && pair[1] === combo[1]);
    const weeklyDistance = ((originalIndex < 0 ? index : originalIndex) - preferredIndex + COMBOS.length) % COMBOS.length;
    return { combo, score: used * 10 + (samePair ? 5 : 0) + weeklyDistance / 100 };
  });
  const best = ranked.sort((a, b) => a.score - b.score)[0].combo;
  return [best[0], best[1]];
}

// Cuatro sesiones dejan ocho espacios: es el mínimo para cubrir los siete
// grupos de fuerza una vez por semana y repetir sólo un foco al final. El
// cuarto acompañante de core se elige por menor carga reciente del historial.
const WEEKLY_COVERAGE_BASE: [GroupId, GroupId][] = [
  ['pierna', 'hombro'],
  ['pecho', 'tricep'],
  ['espalda', 'bicep'],
];

function groupUsageCount(sessions: Record<string, Session>, group: GroupId, beforeDate: string): number {
  return Object.entries(sessions).reduce((count, [date, session]) => (
    date < beforeDate && hasActivity(session) && activityGroups(session).includes(group) ? count + 1 : count
  ), 0);
}

export function weeklyCoveragePairs(sessions: Record<string, Session>, weekDate: string): [GroupId, GroupId][] {
  const corePartner = (['pierna', 'espalda', 'pecho', 'hombro', 'bicep', 'tricep'] as GroupId[])
    .map((group, index) => ({ group, count: groupUsageCount(sessions, group, weekDate), index }))
    .sort((a, b) => a.count - b.count || a.index - b.index)[0].group;
  return [...WEEKLY_COVERAGE_BASE, ['core', corePartner]];
}

export function nextSessionSuggestion(date: string, sessions: Record<string, Session> = {}, plan?: Plan): NextSessionSuggestion {
  const groups = suggestedGroups(date, sessions, plan);
  const saved = Object.values(sessions).filter(hasActivity).length;
  return {
    groups,
    reason: saved
      ? `Considera tus ${saved} sesiones con actividad registrada. Los ejercicios tildados cuentan sin guardar un formulario. El aeróbico va aparte si hoy querés registrarlo.`
      : `Es una combinación inicial equilibrada. Al guardar entrenamientos, la siguiente sugerencia rota según tu historial. El aeróbico va aparte si hoy querés registrarlo.`,
  };
}

export function createSession(date: string, sessions: Record<string, Session> = {}, plan?: Plan): Session {
  return {
    date,
    groups: suggestedGroups(date, sessions, plan),
    mode: 'mix',
    format: 'base',
    extraTarget: 'auto',
    completed: {},
    replacements: {},
    extras: [],
    saved: false,
    metrics: null,
  };
}

// Cantidad de series objetivo a partir del string del catálogo ("3", "2–3", "4").
export function targetSets(sets: string): number {
  const n = parseInt(sets, 10);
  return Number.isNaN(n) ? 3 : Math.min(6, Math.max(1, n));
}

// Segundos de descanso a partir del string del catálogo ("60s", "75s", "2min").
export function restSeconds(rest: string): number {
  const match = rest.match(/(\d+)\s*(min|s)?/);
  if (!match) return 60;
  const value = Number(match[1]);
  return match[2] === 'min' ? value * 60 : value;
}

export function candidates(all: ExerciseMap, group: GroupId, mode: Mode, includeAdvanced = false): CatalogExercise[] {
  return Object.values(all)
    .filter((e) => e.group === group && isModeCompatible(e, mode) && (includeAdvanced || e.level !== 'Avanzado'))
    .sort((a, b) => levelScore(a.level) - levelScore(b.level) || a.name.localeCompare(b.name));
}

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

function sessionUsesExercise(session: Session, id: string): boolean {
  return completedIds(session).includes(id);
}

function weekStart(date: string): string {
  const value = new Date(`${date}T12:00:00`);
  const daysSinceMonday = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - daysSinceMonday);
  return isoDate(value);
}

function usedEarlierThisWeek(sessions: Record<string, Session>, id: string, beforeDate: string): boolean {
  const start = weekStart(beforeDate);
  return Object.entries(sessions).some(([date, session]) => (
    date >= start && date < beforeDate && hasActivity(session) && sessionUsesExercise(session, id)
  ));
}

function exerciseUsage(sessions: Record<string, Session>, id: string, beforeDate: string): { count: number; lastDate: string | null } {
  let count = 0;
  let lastDate: string | null = null;
  for (const [date, session] of Object.entries(sessions)) {
    if (!hasActivity(session) || date >= beforeDate) continue;
    const used = sessionUsesExercise(session, id);
    if (!used) continue;
    count++;
    if (lastDate === null || date > lastDate) lastDate = date;
  }
  return { count, lastDate };
}

function automaticExercises(
  all: ExerciseMap,
  group: GroupId,
  mode: Mode,
  amount: number,
  sessions: Record<string, Session>,
  date: string,
  allow: (e: CatalogExercise) => boolean,
  excluded: string[] = [],
): CatalogExercise[] {
  const target = new Date(`${date}T12:00:00`);
  const priority = (WEEKLY_GROUP_PRIORITIES[group] ?? [])
    .filter((id) => !usedEarlierThisWeek(sessions, id, date))
    .map((id) => all[id])
    .filter((exercise): exercise is CatalogExercise => Boolean(exercise))
    .filter((exercise) => isModeCompatible(exercise, mode) && allow(exercise))
    .filter((exercise) => !AUTOMATIC_EXERCISE_EXCLUSIONS.has(exercise.id))
    .filter((exercise) => !excluded.includes(exercise.id));
  const automatic = candidates(all, group, mode, false)
    .filter(allow)
    .filter((e) => !AUTOMATIC_EXERCISE_EXCLUSIONS.has(e.id))
    .filter((e) => !excluded.includes(e.id) && !priority.some((forced) => forced.id === e.id))
    .map((exercise) => {
      const usage = exerciseUsage(sessions, exercise.id, date);
      const daysSince = usage.lastDate
        ? Math.max(0, Math.round((target.getTime() - new Date(`${usage.lastDate}T12:00:00`).getTime()) / 864e5))
        : 999;
      // Primero evita los ejercicios usados, luego penaliza los muy recientes.
      // El hash rota los nunca usados entre días sin introducir aleatoriedad.
      const recencyPenalty = daysSince < 21 ? (21 - daysSince) * 10 : 0;
      return { exercise, score: usage.count * 1_000 + recencyPenalty + (hash(`${date}:${group}:${exercise.id}`) % 97) };
    })
    .sort((a, b) => a.score - b.score || a.exercise.name.localeCompare(b.exercise.name))
    .map(({ exercise }) => exercise);
  return [...priority, ...automatic].slice(0, amount);
}

export function recentGroupCount(sessions: Record<string, Session>, group: GroupId, now: Date = new Date()): number {
  let count = 0;
  for (const [date, session] of Object.entries(sessions)) {
    if (!hasActivity(session)) continue;
    const diff = (now.getTime() - new Date(date).getTime()) / 864e5;
    if (diff <= 7 && diff >= -1 && activityGroups(session).includes(group)) count++;
  }
  return count;
}

export function extendedTargetGroup(session: Session, sessions: Record<string, Session>, now: Date = new Date()): GroupId {
  if (session.extraTarget === 'g1') return session.groups[0];
  if (session.extraTarget === 'g2' && session.groups[1]) return session.groups[1];
  const [a, b = a] = session.groups;
  return recentGroupCount(sessions, a, now) <= recentGroupCount(sessions, b, now) ? a : b;
}

export function buildExerciseList(
  session: Session,
  all: ExerciseMap,
  sessions: Record<string, Session>,
  now: Date = new Date(),
  allow: (e: CatalogExercise) => boolean = () => true, // filtro del motor (engine.ts) sobre la selección automática
): SessionEntry[] {
  // Historical views use the recorded exercises, never today's random selector.
  if (session.date < isoDate(now) && hasActivity(session) && (session.exerciseLog?.length || completedIds(session).length)) {
    return activityLog(session, all).map((e) => ({ id: e.id, group: e.group, src: 'auto' as const }));
  }
  // Una rutina cargada desde Plan es explícita: no se reemplaza por el selector
  // automático al reabrirla. Si el usuario cambia los grupos, se muestran solo
  // los ejercicios que siguen correspondiendo a esos grupos.
  if (session.programmed?.length) {
    const planned = session.programmed
      .map((id) => all[id])
      .filter((exercise): exercise is CatalogExercise => Boolean(exercise) && session.groups.includes(exercise.group))
      .map((exercise) => ({ id: exercise.id, group: exercise.group, src: 'auto' as const }));
    const entries: SessionEntry[] = [...planned, ...session.extras
      .filter((id) => all[id] && session.groups.includes(all[id].group))
      .map((id) => ({ id, group: all[id].group, src: 'extra' as const }))];
    // Repair the display of drafts already broken by previous versions: a
    // stale pinned list must never hide a newly selected muscle group.
    for (const group of session.groups) {
      if (entries.some((entry) => entry.group === group)) continue;
      const amount = group === 'core' ? Math.max(4, FORMATS[session.format].perGroup) : FORMATS[session.format].perGroup;
      for (const exercise of automaticExercises(all, group, session.mode, amount, sessions, session.date, allow)) {
        entries.push({ id: exercise.id, group, src: 'auto' });
      }
    }
    return entries.map((entry): SessionEntry => {
      const replacement = session.replacements[entry.id];
      return replacement && all[replacement]
        ? { id: replacement, group: all[replacement].group, src: 'reemplazo', from: entry.id } : entry;
    }).filter((entry, i, list) => list.findIndex((other) => other.id === entry.id) === i);
  }
  const format = FORMATS[session.format as Format] ?? FORMATS.base;
  const entries: SessionEntry[] = [];
  for (const group of session.groups) {
    // Core se programa como bloque real, no como un accesorio de dos ejercicios.
    const perGroup = group === 'core' ? Math.max(4, format.perGroup) : format.perGroup;
    for (const e of automaticExercises(all, group, session.mode, perGroup, sessions, session.date, allow)) {
      entries.push({ id: e.id, group, src: 'auto' });
    }
  }
  if (format.extraOne && session.groups.length === 2) {
    const target = extendedTargetGroup(session, sessions, now);
    const already = entries.map((x) => x.id);
    const extra = automaticExercises(all, target, session.mode, 1, sessions, session.date, allow, already)[0];
    if (extra) entries.push({ id: extra.id, group: target, src: 'extra-auto' });
  }
  for (const id of session.extras) {
    const e = all[id];
    if (e && session.groups.includes(e.group)) entries.push({ id, group: e.group, src: 'extra' });
  }
  return entries.map((entry) => {
    const replacement = session.replacements[entry.id];
    if (!replacement) return entry;
    return { id: replacement, group: all[replacement]?.group ?? entry.group, src: 'reemplazo', from: entry.id };
  });
}

// Selector congelado de v3.6 y anteriores. Solo se usa para reconstruir la
// foto fija de sesiones antiguas que no tenían exerciseLog. No debe usarse
// para sugerencias nuevas: esas sí rotan según el historial reciente.
export function buildLegacyExerciseList(session: Session, all: ExerciseMap, sessions: Record<string, Session>): SessionEntry[] {
  const format = FORMATS[session.format as Format] ?? FORMATS.base;
  const entries: SessionEntry[] = [];
  for (const group of session.groups) {
    for (const exercise of candidates(all, group, session.mode, false).slice(0, format.perGroup)) {
      entries.push({ id: exercise.id, group, src: 'auto' });
    }
  }
  if (format.extraOne && session.groups.length === 2) {
    const target = extendedTargetGroup(session, sessions, new Date(`${session.date}T12:00:00`));
    const already = entries.map((entry) => entry.id);
    const extra = candidates(all, target, session.mode, false).find((exercise) => !already.includes(exercise.id));
    if (extra) entries.push({ id: extra.id, group: target, src: 'extra-auto' });
  }
  for (const id of session.extras) {
    const exercise = all[id];
    if (exercise && session.groups.includes(exercise.group)) entries.push({ id, group: exercise.group, src: 'extra' });
  }
  return entries.map((entry) => {
    const replacement = session.replacements[entry.id];
    if (!replacement) return entry;
    return { id: replacement, group: all[replacement]?.group ?? entry.group, src: 'reemplazo', from: entry.id };
  });
}
