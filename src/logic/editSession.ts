import type { Session } from '../db/schema';

/** Changing the requested workout invalidates a pinned plan, not its history. */
export function editSession(session: Session, patch: Partial<Session>): Session {
  const changed = (patch.groups !== undefined && patch.groups.join(',') !== session.groups.join(','))
    || (patch.mode !== undefined && patch.mode !== session.mode)
    || (patch.format !== undefined && patch.format !== session.format)
    || (patch.extraTarget !== undefined && patch.extraTarget !== session.extraTarget);
  if (!changed) return { ...session, ...patch };
  return {
    ...session, ...patch, programmed: undefined, programTitle: undefined, manuallyEdited: true,
    // An explicit new group/mode/format requests a new suggestion. The prior
    // selection is recoverable in local revisions; recorded activity is retained.
    selectedExercises: undefined,
    replacements: {}, completed: session.completed, exerciseLog: session.exerciseLog,
    setLogs: session.setLogs, metrics: session.metrics, saved: session.saved,
  };
}
