// Lógica pura de sesiones — portada 1:1 de A2.8 (src/session.js + funciones de app.js).
// Mismas reglas: 2 grupos por sesión, candidatos ordenados por nivel y nombre,
// avanzados excluidos de la selección automática, extra del Extendido al grupo
// menos trabajado en los últimos 7 días.
import { COMBOS, FORMATS } from '../data/exercises';
import type { CatalogExercise, Format, GroupId, Mode, Session } from '../db/schema';

export type ExerciseMap = Record<string, CatalogExercise>;

export interface SessionEntry {
  id: string;
  group: GroupId;
  src: 'auto' | 'extra-auto' | 'extra' | 'reemplazo';
  from?: string;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isModeCompatible(exercise: CatalogExercise, mode: Mode): boolean {
  return mode === 'mix' || exercise.modes.includes(mode);
}

export function levelScore(level: CatalogExercise['level']): number {
  return level === 'Inicial' ? 1 : level === 'Progresivo' ? 2 : 3;
}

export function suggestedGroups(date: string, sessions: Record<string, Session> = {}): [GroupId, GroupId] {
  const preferredIndex = (new Date(date).getDay() + 1) % COMBOS.length;
  const target = new Date(`${date}T12:00:00`);
  const groupLoad = new Map<GroupId, number>();

  // Una modificación de grupos hecha en un día anterior de la semana ya cuenta
  // aunque todavía no se haya guardado la sesión. Así las sugerencias futuras
  // se reequilibran inmediatamente en vez de repetir el mismo foco.
  for (const [otherDate, session] of Object.entries(sessions)) {
    const day = new Date(`${otherDate}T12:00:00`);
    const diff = (target.getTime() - day.getTime()) / 864e5;
    if (diff <= 0 || diff > 7) continue;
    for (const group of session.groups) groupLoad.set(group, (groupLoad.get(group) ?? 0) + 1);
  }

  const ranked = COMBOS.map((combo, index) => {
    const used = (groupLoad.get(combo[0]) ?? 0) + (groupLoad.get(combo[1]) ?? 0);
    const samePair = Object.entries(sessions).some(([otherDate, session]) => {
      const diff = (target.getTime() - new Date(`${otherDate}T12:00:00`).getTime()) / 864e5;
      return diff > 0 && diff <= 7 && session.groups.includes(combo[0]) && session.groups.includes(combo[1]);
    });
    // Se conserva una preferencia semanal estable solo como desempate.
    const weeklyDistance = (index - preferredIndex + COMBOS.length) % COMBOS.length;
    return { combo, score: used * 10 + (samePair ? 5 : 0) + weeklyDistance / 100 };
  });
  const best = ranked.sort((a, b) => a.score - b.score)[0].combo;
  return [best[0], best[1]];
}

export function createSession(date: string, sessions: Record<string, Session> = {}): Session {
  return {
    date,
    groups: suggestedGroups(date, sessions),
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

function exerciseUsage(sessions: Record<string, Session>, id: string, beforeDate: string): { count: number; lastDate: string | null } {
  let count = 0;
  let lastDate: string | null = null;
  for (const [date, session] of Object.entries(sessions)) {
    if (!session.saved || date >= beforeDate) continue;
    const used = session.exerciseLog?.some((item) => item.id === id)
      ?? (Object.values(session.replacements).includes(id)
        || session.extras.includes(id)
        || Boolean(session.completed[id]));
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
  return candidates(all, group, mode, false)
    .filter(allow)
    .filter((e) => !excluded.includes(e.id))
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
    .slice(0, amount)
    .map(({ exercise }) => exercise);
}

export function recentGroupCount(sessions: Record<string, Session>, group: GroupId, now: Date = new Date()): number {
  let count = 0;
  for (const [date, session] of Object.entries(sessions)) {
    if (!session.saved) continue;
    const diff = (now.getTime() - new Date(date).getTime()) / 864e5;
    if (diff <= 7 && diff >= -1 && session.groups.includes(group)) count++;
  }
  return count;
}

export function extendedTargetGroup(session: Session, sessions: Record<string, Session>, now: Date = new Date()): GroupId {
  if (session.extraTarget === 'g1') return session.groups[0];
  if (session.extraTarget === 'g2') return session.groups[1];
  const [a, b] = session.groups;
  return recentGroupCount(sessions, a, now) <= recentGroupCount(sessions, b, now) ? a : b;
}

export function buildExerciseList(
  session: Session,
  all: ExerciseMap,
  sessions: Record<string, Session>,
  now: Date = new Date(),
  allow: (e: CatalogExercise) => boolean = () => true, // filtro del motor (engine.ts) sobre la selección automática
): SessionEntry[] {
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
