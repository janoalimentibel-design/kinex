import type { ParsedBackup } from '../db/backup';
import type { AppData } from '../db/bootstrap';
import type { CustomExercise, GroupId, Plan, Session, V2Data } from '../db/schema';
import type { ExerciseMap } from '../logic/session';

export type View = 'today' | 'lib' | 'hist' | 'plan' | 'requests';

export type ModalState =
  | { type: 'combo' }
  | { type: 'addToGroup'; group: GroupId }
  | { type: 'replace'; origId: string; group: GroupId }
  | { type: 'saveSession' }
  | { type: 'libInfo'; id: string }
  | { type: 'addCustom' }
  | { type: 'summary'; text: string }
  | { type: 'importPreview'; parsed: ParsedBackup }
  | null;

// Contexto que App pasa a vistas y sheets: datos + mutaciones con persistencia write-through.
export interface Ctx {
  data: AppData;
  allEx: ExerciseMap;
  curDate: string;
  session: Session;
  setCurDate(date: string): void;
  setView(view: View): void;
  setModal(modal: ModalState): void;
  patchSession(patch: Partial<Session>): void;
  putPlan(plan: Plan): void;
  putCustom(exercise: CustomExercise): void;
  importAll(data: V2Data, source: 'v0' | 'v1' | 'v2'): Promise<void>;
  startRest(label: string, seconds: number): void;
  startTimer(label: string, seconds: number): void;
}
