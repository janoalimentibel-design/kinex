import type { AppData } from '../db/bootstrap';
import { completedIds } from './activity';

const REQUESTED_REMOVALS = new Set(['band_pulldown', 'towel_hold']);

/** Reapply on startup/import: remove pending choices, never performed records. */
export function removeRequestedRoutineExercises(data: AppData, today: string): AppData {
  const sessions = { ...data.sessions };
  let changed = false;
  for (const [date, session] of Object.entries(sessions)) {
    if (date < today) continue;
    const recorded = new Set([
      ...completedIds(session),
      ...Object.entries(session.setLogs ?? {}).filter(([, sets]) => sets.length > 0).map(([id]) => id),
    ]);
    const remove = (id: string) => REQUESTED_REMOVALS.has(id) && !recorded.has(id);
    // Preserve a user's replacement of a retired original with another exercise.
    const clean = (ids: string[]) => ids.flatMap(id => {
      const replacement = session.replacements[id];
      if (replacement && remove(replacement)) return [];
      if (remove(id)) return replacement ? [replacement] : [];
      return [id];
    });
    const programmed = session.programmed === undefined ? undefined : clean(session.programmed);
    const selectedExercises = session.selectedExercises?.filter(id => !remove(id));
    const extras = clean(session.extras);
    const exerciseLog = session.exerciseLog?.filter(entry => !remove(entry.id));
    const replacements = Object.fromEntries(Object.entries(session.replacements)
      .filter(([from, to]) => !remove(from) && !remove(to)));
    if (JSON.stringify([programmed, selectedExercises, extras, replacements, exerciseLog]) ===
      JSON.stringify([session.programmed, session.selectedExercises, session.extras, session.replacements, session.exerciseLog])) continue;
    sessions[date] = { ...session, programmed, selectedExercises, extras, replacements, exerciseLog };
    changed = true;
  }
  return changed ? { ...data, sessions } : data;
}
