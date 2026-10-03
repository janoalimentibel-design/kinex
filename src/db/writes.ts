import type { AppData } from './bootstrap';
import type { KinexDB } from './database';

/** Commit a snapshot and its new value together, so failed writes cannot lose either. */
export async function persistChanges(db: KinexDB, before: AppData, after: AppData): Promise<void> {
  await db.transaction('rw', db.sessions, db.sessionRevisions, db.kv, db.customExercises, async () => {
    for (const session of Object.values(after.sessions)) {
      if (session === before.sessions[session.date]) continue;
      const previous = await db.sessions.get(session.date);
      if (previous && JSON.stringify(previous) !== JSON.stringify(session)) {
        await db.sessionRevisions.add({ date: session.date, recordedAt: new Date().toISOString(), session: previous, customExercises: Object.values(before.custom) });
      }
      await db.sessions.put(session);
    }
    if (after.plan !== before.plan) await db.kv.put({ key: 'plan', value: after.plan });
    for (const exercise of Object.values(after.custom)) {
      if (exercise !== before.custom[exercise.id]) await db.customExercises.put(exercise);
    }
  });
}

/** Serialize transformations against the last successful state, including rapid taps. */
export function createDataWriter(db: KinexDB, initial: AppData, onChange: (data: AppData) => void) {
  let current = initial;
  let queue = Promise.resolve();
  return (transform: (data: AppData) => AppData | Promise<AppData>) => {
    const operation = queue.then(async () => {
      const next = await db.transaction('rw', db.sessions, db.sessionRevisions, db.kv, db.customExercises, async () => {
        // Read the committed database, including changes from another tab.
        const sessions = await db.sessions.toArray();
        const custom = await db.customExercises.toArray();
        const plan = await db.kv.get('plan');
        const before: AppData = {
          sessions: Object.fromEntries(sessions.map(s => [s.date, s])),
          custom: Object.fromEntries(custom.map(e => [e.id, e])),
          plan: plan?.key === 'plan' ? plan.value : current.plan,
        };
        const after = await transform(before);
        await persistChanges(db, before, after);
        return after;
      });
      current = next;
      onChange(next);
    });
    queue = operation.catch(() => {});
    return operation;
  };
}
