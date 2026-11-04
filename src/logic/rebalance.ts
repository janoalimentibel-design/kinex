import { CATALOG, GROUPS } from '../data/exercises';
import type { AppData } from '../db/bootstrap';
import { activityGroups, hasActivity } from './activity';
import { adjacentGroups, buildExerciseList, isoDate, suggestedGroups } from './session';

/** Repair pending conflicts on startup and after edits, without rewriting activity. */
export function rebalancePending(data: AppData, today: string, keepDate?: string): AppData {
  const sessions = { ...data.sessions };
  const all = { ...CATALOG, ...data.custom };
  let changed = false;
  for (const date of Object.keys(sessions).sort()) {
    const session = sessions[date];
    if (date < today || date === keepDate || hasActivity(session) || session.saved || session.planner?.locked || session.manuallyEdited || session.selectedExercises !== undefined || Object.keys(session.replacements).length > 0 || session.extras.length > 0 || session.groups.includes('aerobico')) continue;
    // Explicit programs from imports or other planners are not adaptive drafts.
    if (session.programmed?.length && session.planner?.source !== 'adaptive' &&
      !session.programTitle?.startsWith('Semana revisada') && !session.programTitle?.startsWith('Próxima semana')) continue;
    const blocked = adjacentGroups(date, sessions, all, today);
    const groups = suggestedGroups(date, sessions, data.plan, all, today);
    const weekStart = new Date(`${date}T12:00:00`);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
    const start = isoDate(weekStart);
    const performed = new Set(Object.entries(sessions).flatMap(([otherDate, other]) =>
      otherDate >= start && otherDate < date && hasActivity(other) ? activityGroups(other, all) : []));
    const repeats = (chosen: typeof session.groups) => chosen.filter(group => performed.has(group)).length;
    const weeklyConflict = repeats(groups) < repeats(session.groups);
    const adjacentConflict = session.groups.some(group => blocked.has(group)) && groups.every(group => !blocked.has(group))
      && repeats(groups) <= repeats(session.groups);
    if (!weeklyConflict && !adjacentConflict) continue;
    if (groups.length === session.groups.length && groups.every(group => session.groups.includes(group))) continue;
    const updated = {
      ...session, groups, programmed: undefined, replacements: {}, extras: [],
      programTitle: session.programTitle
        ? `${session.programTitle.split(' · ')[0]} · ${groups.map((g) => GROUPS[g].label).join(' + ')}` : undefined,
    };
    sessions[date] = session.programmed?.length
      ? { ...updated, programmed: buildExerciseList(updated, all, sessions, new Date(`${date}T12:00:00`)).map((entry) => entry.id) }
      : updated;
    changed = true;
  }
  return changed ? { ...data, sessions } : data;
}
