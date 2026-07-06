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

export function suggestedGroups(date: string): [GroupId, GroupId] {
  const combo = COMBOS[(new Date(date).getDay() + 1) % COMBOS.length];
  return [combo[0], combo[1]];
}

export function createSession(date: string): Session {
  return {
    date,
    groups: suggestedGroups(date),
    mode: 'mix',
    format: 'base',
    extraTarget: 'auto',
    completed: {},
    replacements: {},
    extras: [],
    saved: false,
    metrics: null,
    checkin: null,
    setLogs: {},
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

// Sugerencia de formato según el tiempo disponible del check-in.
export function suggestedFormat(timeMinutes: number): Format {
  if (timeMinutes <= 25) return 'base';
  if (timeMinutes <= 35) return 'ext';
  return 'long';
}

export function candidates(all: ExerciseMap, group: GroupId, mode: Mode, includeAdvanced = false): CatalogExercise[] {
  return Object.values(all)
    .filter((e) => e.group === group && isModeCompatible(e, mode) && (includeAdvanced || e.level !== 'Avanzado'))
    .sort((a, b) => levelScore(a.level) - levelScore(b.level) || a.name.localeCompare(b.name));
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
): SessionEntry[] {
  const format = FORMATS[session.format as Format] ?? FORMATS.base;
  const entries: SessionEntry[] = [];
  for (const group of session.groups) {
    for (const e of candidates(all, group, session.mode, false).slice(0, format.perGroup)) {
      entries.push({ id: e.id, group, src: 'auto' });
    }
  }
  if (format.extraOne && session.groups.length === 2) {
    const target = extendedTargetGroup(session, sessions, now);
    const already = entries.map((x) => x.id);
    const extra = candidates(all, target, session.mode, false).find((e) => !already.includes(e.id));
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
