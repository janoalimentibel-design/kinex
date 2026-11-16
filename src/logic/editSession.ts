import { CATALOG, FORMATS } from '../data/exercises';
import type { GroupId, Session } from '../db/schema';
import { buildExerciseList, extendedTargetGroup, isModeCompatible, type ExerciseMap } from './session';

function targetCount(session: Session, group: GroupId, sessions: Record<string, Session>, now: Date): number {
  const format = FORMATS[session.format];
  const base = group === 'core' ? 4 : format.perGroup;
  return base + (group !== 'core' && format.extraOne && session.groups.length === 2 && extendedTargetGroup(session, sessions, now) === group ? 1 : 0);
}

/** Workout controls preserve the user's choices in every muscle that remains. */
export function editSession(
  session: Session,
  patch: Partial<Session>,
  all: ExerciseMap = CATALOG,
  sessions: Record<string, Session> = {},
  now = new Date(`${session.date}T12:00:00`),
): Session {
  const changed = (patch.groups !== undefined && patch.groups.join(',') !== session.groups.join(','))
    || (patch.mode !== undefined && patch.mode !== session.mode)
    || (patch.format !== undefined && patch.format !== session.format)
    || (patch.extraTarget !== undefined && patch.extraTarget !== session.extraTarget);
  if (!changed) return { ...session, ...patch };
  const next: Session = {
    ...session, ...patch, programmed: undefined, programTitle: undefined, manuallyEdited: true,
    selectedExercises: undefined,
    replacements: {}, completed: session.completed, exerciseLog: session.exerciseLog,
    setLogs: session.setLogs, metrics: session.metrics, saved: session.saved,
  };
  const retained = new Set(next.groups.filter(group => session.groups.includes(group)));
  // A wholly different workout needs new suggestions. Its activity records
  // above remain available independently of the current exercise selection.
  if (!retained.size) return next;

  const visible = buildExerciseList(session, all, sessions, now);
  const selected = visible.filter(entry => retained.has(entry.group) &&
    (!all[entry.id] || isModeCompatible(all[entry.id], next.mode)));
  // A replaced or removed original must not return as a newly added slot.
  const excluded = new Set([
    ...visible.map(entry => entry.id), ...Object.keys(session.replacements),
    ...(session.programmed ?? []), ...session.extras,
    ...Object.keys(session.completed).filter(id => session.completed[id] === false),
  ]);
  const suggestions = buildExerciseList({
    ...next, extras: [], completed: {}, exerciseLog: undefined, setLogs: undefined, saved: false,
  }, all, sessions, new Date(`${session.date}T12:00:00`), exercise => !excluded.has(exercise.id));
  const ids: string[] = [];
  for (const group of next.groups) {
    const previous = visible.filter(entry => entry.group === group);
    const kept = selected.filter(entry => entry.group === group).map(entry => entry.id);
    ids.push(...kept);
    const additional = retained.has(group)
      ? Math.max(0, targetCount(next, group, sessions, now) - targetCount(session, group, sessions, now)) + previous.length - kept.length
      : targetCount(next, group, sessions, now);
    ids.push(...suggestions.filter(entry => entry.group === group && !ids.includes(entry.id)).slice(0, additional).map(entry => entry.id));
  }
  next.selectedExercises = [...new Set(ids)];
  next.replacements = Object.fromEntries(Object.entries(session.replacements).filter(([, to]) => next.selectedExercises!.includes(to)));
  return next;
}
