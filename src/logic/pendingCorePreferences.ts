import { CATALOG, GROUPS } from '../data/exercises';
import type { AppData } from '../db/bootstrap';
import type { Session } from '../db/schema';
import { hasActivity } from './activity';
import { automaticCoreExercise } from './coreSelection';
import { buildExerciseList } from './session';

function isUntouchedAutomaticDraft(session: Session): boolean {
  const generatedTitle = `Próxima semana · ${session.groups.map(group => GROUPS[group].label).join(' + ')}`;
  const knownSource = session.programTitle === generatedTitle ||
    (session.planner?.source === 'adaptive' && session.programTitle === 'Próxima semana · Ajustada a la actividad registrada');
  return knownSource && !session.planner?.locked && !session.manuallyEdited && session.selectedExercises === undefined &&
    !hasActivity(session) && !session.metrics && !session.checkin && !session.exerciseLog?.length &&
    Object.keys(session.completed).length === 0 && Object.keys(session.setLogs ?? {}).length === 0 &&
    Object.keys(session.replacements).length === 0 && session.extras.length === 0 &&
    session.trainingCaloriesIncludeAerobic === undefined && Boolean(session.programmed?.length) &&
    new Set(session.programmed).size === session.programmed?.length &&
    session.programmed!.every(id => CATALOG[id] && session.groups.includes(CATALOG[id].group));
}

function alreadyBalanced(ids: string[]): boolean {
  const exercises = ids.map(id => CATALOG[id]);
  return ids.length === 4 && exercises.every(automaticCoreExercise) &&
    exercises.filter(exercise => exercise.level === 'Avanzado').length === 1 &&
    exercises.filter(exercise => exercise.level === 'Progresivo').length === 2 &&
    exercises.filter(exercise => exercise.level === 'Inicial').length === 1 &&
    ids.filter(id => ['bear_hold', 'hollow_reg', 'plank_short'].includes(id)).length <= 1;
}

/** Refresh only application-created, untouched present/future proposals. */
export function refreshPendingCorePreferences(data: AppData, today: string): AppData {
  const sessions = { ...data.sessions };
  let changed = false;
  for (const [date, session] of Object.entries(sessions)) {
    if (date < today || !session.groups.includes('core') || !isUntouchedAutomaticDraft(session)) continue;
    const previous = session.programmed!.filter(id => CATALOG[id].group === 'core');
    if (alreadyBalanced(previous)) continue;
    const core = buildExerciseList({
      ...session, groups: ['core'], programmed: undefined, programTitle: undefined,
    }, { ...CATALOG, ...data.custom }, sessions, new Date(`${date}T12:00:00`)).map(entry => entry.id);
    if (!core.length || (core.length === previous.length && core.every((id, index) => id === previous[index]))) continue;
    let inserted = false;
    const programmed = session.programmed!.flatMap(id => {
      if (CATALOG[id].group !== 'core') return [id];
      if (inserted) return [];
      inserted = true;
      return core;
    });
    if (!inserted) programmed.push(...core);
    sessions[date] = { ...session, programmed };
    changed = true;
  }
  return changed ? { ...data, sessions } : data;
}
