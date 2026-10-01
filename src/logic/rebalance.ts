import { CATALOG, GROUPS } from '../data/exercises';
import type { AppData } from '../db/bootstrap';
import { hasActivity } from './activity';
import { adjacentGroups, buildExerciseList, suggestedGroups } from './session';

/** Repair pending conflicts on startup and after edits, without rewriting activity. */
export function rebalancePending(data: AppData, today: string, keepDate?: string): AppData {
  const sessions = { ...data.sessions };
  const all = { ...CATALOG, ...data.custom };
  let changed = false;
  for (const date of Object.keys(sessions).sort()) {
    const session = sessions[date];
    if (date < today || date === keepDate || hasActivity(session) || session.groups.includes('aerobico')) continue;
    const blocked = adjacentGroups(date, sessions, all);
    if (!session.groups.some((group) => blocked.has(group))) continue;
    const groups = suggestedGroups(date, sessions, data.plan, all);
    if (groups.some((group) => blocked.has(group))) continue;
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
