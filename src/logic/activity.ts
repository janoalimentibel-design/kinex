import { CATALOG } from '../data/exercises';
import type { CatalogExercise, GroupId, Session } from '../db/schema';

/** A check is evidence of activity even when the optional session form was never saved. */
export function completedIds(session: Session): string[] {
  const ids = new Set(Object.entries(session.completed).filter(([, done]) => done).map(([id]) => id));
  for (const item of session.exerciseLog ?? []) {
    if (item.completed && session.completed[item.id] !== false) ids.add(item.id);
  }
  for (const [id, sets] of Object.entries(session.setLogs ?? {})) {
    if (session.completed[id] !== false && sets.some((set) => set.done)) ids.add(id);
  }
  return [...ids];
}

export function hasActivity(session: Session): boolean {
  return session.saved || completedIds(session).length > 0;
}

export function activityGroups(session: Session, all: Record<string, CatalogExercise> = CATALOG): GroupId[] {
  const ids = completedIds(session);
  const groups = ids.map((id) => all[id]?.group ?? session.exerciseLog?.find((item) => item.id === id)?.group)
    .filter((group): group is GroupId => Boolean(group));
  // Older explicitly saved sessions can have no exercise-level record.
  return [...new Set(groups.length ? groups : session.saved && !ids.length ? session.groups : [])];
}

export function activityLog(session: Session, all: Record<string, CatalogExercise>) {
  const ids = new Set([...(session.exerciseLog ?? []).map((item) => item.id), ...completedIds(session)]);
  const done = new Set(completedIds(session));
  return [...ids].map((id) => {
    const old = session.exerciseLog?.find((item) => item.id === id);
    return { id, name: old?.name ?? all[id]?.name ?? id, group: old?.group ?? all[id]?.group ?? session.groups[0], completed: done.has(id) };
  });
}

/** Normalize aliases for ranking only; never rewrite historical IDs. */
export function exerciseKey(exercise: CatalogExercise | undefined, id: string): string {
  const name = exercise?.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? '';
  if (/extension.*cuadriceps/.test(name)) return 'leg_ext';
  return id;
}
