import { zSession, type Session } from '../db/schema';
import type { SyncConnection } from './protocol';

/** Stable serialization: database/import key order is not a user edit. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Only performed/saved records participate. Routine/planner changes are not edits to a workout. */
export function sessionFingerprint(session: Session): string | null {
  const done = new Set(Object.entries(session.completed ?? {}).filter(([, value]) => value).map(([id]) => id));
  for (const item of session.exerciseLog ?? []) if (item.completed && session.completed?.[item.id] !== false) done.add(item.id);
  const sets = Object.fromEntries(Object.entries(session.setLogs ?? {}).filter(([, rows]) => rows.length));
  const aerobic = [...(session.aerobicActivities ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  if (!session.saved && !done.size && !Object.keys(sets).length && !aerobic.length && session.trainingCalories === undefined) return null;
  return stable({
    saved: Boolean(session.saved), done: [...done].sort(), sets,
    metrics: session.metrics ?? null,
    // Some older explicitly saved workouts only recorded groups, without exercise IDs.
    groups: session.saved && !done.size && !Object.keys(sets).length ? [...session.groups].sort() : undefined,
    aerobic,
    trainingCalories: session.trainingCalories,
    trainingCaloriesIncludeAerobic: session.trainingCalories === undefined ? undefined : Boolean(session.trainingCaloriesIncludeAerobic),
  });
}
export function sessionBaselines(sessions: Session[]): Record<string, string> {
  return Object.fromEntries(sessions.flatMap(session => {
    const signature = sessionFingerprint(session);
    return signature === null ? [] : [[session.date, signature]];
  }));
}
export function reviewBaseline(connection: SyncConnection, sessions: Session[]) {
  if (connection.sessionReview && connection.sessionReviewOrigin) return { baseline: connection.sessionReview, origin: connection.sessionReviewOrigin };
  if (connection.syncedSessions) {
    // v3.46 kept full JSON of confirmed sessions. Normalize it without rewriting the acknowledgement.
    const confirmed: Session[] = [];
    let unreadable = false;
    for (const [date, raw] of Object.entries(connection.syncedSessions)) {
      try {
        const parsed = zSession.safeParse(JSON.parse(raw));
        if (!parsed.success || parsed.data.date !== date) { unreadable = true; continue; }
        confirmed.push(parsed.data);
      } catch { unreadable = true; }
    }
    if (!unreadable) return { baseline: sessionBaselines(confirmed), origin: 'confirmed' as const };
  }
  // Observed locally is deliberately different from successfully sent to Drive.
  return { baseline: connection.lastSync ? sessionBaselines(sessions) : {}, origin: connection.lastSync ? 'observed' as const : 'confirmed' as const };
}
export function changedRecordedDates(baseline: Record<string, string>, sessions: Session[]): string[] {
  const current = sessionBaselines(sessions);
  return Object.keys(baseline).filter(date => baseline[date] !== current[date]).sort();
}
