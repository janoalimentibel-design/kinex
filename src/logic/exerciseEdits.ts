import type { Session } from '../db/schema';
import { activityLog, completedIds } from './activity';
import { buildExerciseList, type ExerciseMap } from './session';

export type ExerciseEdit =
  | { type: 'add'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'replace'; id: string; replacement: string }
  | { type: 'toggle'; id: string };

/** Materialize the displayed list before a manual edit; never regenerate it afterward. */
export function editExercise(session: Session, edit: ExerciseEdit, all: ExerciseMap, sessions: Record<string, Session>, now = new Date()): Session {
  const visible = buildExerciseList(session, all, sessions, now).map((entry) => entry.id);
  let selected = [...new Set(visible)];
  const completed = { ...session.completed };
  let log = activityLog(session, all);
  const setLogs = { ...session.setLogs };
  const replacements = { ...session.replacements };
  if (edit.type === 'toggle') {
    completed[edit.id] = !completedIds(session).includes(edit.id);
    // Checkmarks persist the current list too, so later dates cannot hide it.
  } else if (edit.type === 'add') {
    if (!all[edit.id] || selected.includes(edit.id)) return session;
    selected.push(edit.id);
  } else {
    if (!selected.includes(edit.id)) return session;
    if (edit.type === 'replace' && (!all[edit.replacement] || selected.includes(edit.replacement))) return session;
    selected = selected.flatMap((id) => id !== edit.id ? [id] : edit.type === 'replace' ? [edit.replacement] : []);
    // Only an explicit removal/replacement clears this exercise's check.
    completed[edit.id] = false;
    delete setLogs[edit.id];
    log = log.filter((entry) => entry.id !== edit.id);
    for (const [key, value] of Object.entries(replacements)) if (key === edit.id || value === edit.id) delete replacements[key];
    if (edit.type === 'replace') replacements[edit.id] = edit.replacement;
  }
  for (const id of selected) {
    if (!log.some((entry) => entry.id === id)) log.push({ id, name: all[id]?.name ?? id, group: all[id]?.group ?? session.groups[0], completed: false });
  }
  log = log.map((entry) => ({ ...entry, completed: completed[entry.id] ?? entry.completed }));
  return {
    ...session, replacements, selectedExercises: [...new Set(selected)], completed, exerciseLog: log, setLogs,
    manuallyEdited: edit.type === 'toggle' ? session.manuallyEdited : true,
    programTitle: edit.type === 'toggle' ? session.programTitle : undefined,
  };
}
