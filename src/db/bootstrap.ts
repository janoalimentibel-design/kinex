// Flujo de arranque — ver docs/DATA_MODEL.md §6.
// El localStorage legacy es SOLO-LECTURA: se lee una vez para migrar y nunca se
// escribe ni se borra, así A2.8 congelada sigue funcionando con sus datos.
// Las bases v1 existentes en IndexedDB se elevan a v2 por el upgrade de Dexie.
import { CATALOG, LEGACY_STORAGE_KEY } from '../data/exercises';
import type { KinexDB } from './database';
import { migrateV0toV1, migrateV1toV2 } from './migrate';
import { createDefaultPlan, type CustomExercise, type Meta, type Plan, type Session, type V2Data } from './schema';
import { buildLegacyExerciseList } from '../logic/session';

export interface AppData {
  sessions: Record<string, Session>;
  custom: Record<string, CustomExercise>;
  plan: Plan;
}

export interface BootstrapResult {
  data: AppData;
  migrationNotice: string | null;
  warnings: string[];
}

interface LegacyStore {
  getItem(key: string): string | null;
}

export function toAppData(data: V2Data): AppData {
  return {
    sessions: Object.fromEntries(data.sessions.map((s) => [s.date, s])),
    custom: Object.fromEntries(data.customExercises.map((e) => [e.id, e])),
    plan: data.plan,
  };
}

export function toExportData(data: AppData): V2Data {
  return {
    sessions: Object.values(data.sessions).sort((a, b) => a.date.localeCompare(b.date)),
    customExercises: Object.values(data.custom),
    plan: data.plan,
  };
}

// Antes de v3.6 no existía exerciseLog. Esas sesiones se armaban con el
// selector fijo (orden por nivel/nombre), no con la rotación actual. Al
// importar, congelamos esa lista una sola vez para que el historial nunca
// vuelva a cambiar aunque evolucionen las sugerencias del presente.
export function hydrateHistoricalExerciseLogs(data: V2Data): V2Data {
  const sessions = Object.fromEntries(data.sessions.map((session) => [session.date, session]));
  const all = { ...CATALOG, ...Object.fromEntries(data.customExercises.map((exercise) => [exercise.id, exercise])) };
  let changed = false;
  const hydratedSessions = data.sessions.map((session) => {
    if (!session.saved || session.exerciseLog) return session;
    changed = true;
    const entries = buildLegacyExerciseList(session, all, sessions);
    // Si en una versión previa se marcó un ejercicio agregado manualmente,
    // también se conserva aunque no formara parte de la selección automática.
    for (const [id, completed] of Object.entries(session.completed)) {
      const exercise = all[id];
      if (completed && exercise && !entries.some((entry) => entry.id === id)) {
        entries.push({ id, group: exercise.group, src: 'extra' });
      }
    }
    const exerciseLog = entries.map((entry) => ({
      id: entry.id,
      name: all[entry.id]?.name ?? entry.id,
      group: entry.group,
      completed: Boolean(session.completed[entry.id]),
    }));
    return { ...session, exerciseLog };
  });
  return changed ? { ...data, sessions: hydratedSessions } : data;
}

export async function replaceAll(db: KinexDB, data: V2Data, migratedFrom: Meta['migratedFrom']): Promise<V2Data> {
  const hydrated = hydrateHistoricalExerciseLogs(data);
  const meta: Meta = { schemaVersion: 2, migratedFrom, migratedAt: new Date().toISOString() };
  await db.transaction('rw', db.sessions, db.customExercises, db.kv, async () => {
    await Promise.all([db.sessions.clear(), db.customExercises.clear()]);
    await db.sessions.bulkPut(hydrated.sessions);
    await db.customExercises.bulkPut(hydrated.customExercises);
    await db.kv.put({ key: 'plan', value: hydrated.plan });
    await db.kv.put({ key: 'meta', value: meta });
  });
  return hydrated;
}

async function loadFromDb(db: KinexDB): Promise<AppData> {
  const [sessions, custom, planEntry] = await Promise.all([
    db.sessions.toArray(),
    db.customExercises.toArray(),
    db.kv.get('plan'),
  ]);
  const raw: AppData = {
    sessions: Object.fromEntries(sessions.map((s) => [s.date, s])),
    custom: Object.fromEntries(custom.map((e) => [e.id, e])),
    plan: planEntry && planEntry.key === 'plan' ? planEntry.value : createDefaultPlan(),
  };
  const exported = toExportData(raw);
  const hydrated = hydrateHistoricalExerciseLogs(exported);
  if (hydrated !== exported) await db.sessions.bulkPut(hydrated.sessions);
  return toAppData(hydrated);
}

export async function bootstrap(
  db: KinexDB,
  legacyStore: LegacyStore | null = typeof localStorage === 'undefined' ? null : localStorage,
): Promise<BootstrapResult> {
  const meta = await db.kv.get('meta');
  if (meta) {
    return { data: await loadFromDb(db), migrationNotice: null, warnings: [] };
  }

  const legacyRaw = legacyStore?.getItem(LEGACY_STORAGE_KEY) ?? null;
  if (legacyRaw !== null) {
    let notice: string;
    let warnings: string[] = [];
    let data: V2Data;
    try {
      const result = migrateV0toV1(JSON.parse(legacyRaw));
      data = migrateV1toV2(result.data);
      warnings = result.warnings;
      notice = `Datos migrados de la versión anterior: ${data.sessions.length} sesiones y ${data.customExercises.length} ejercicios personalizados. Los datos originales quedan intactos en la versión A2.8.`;
    } catch {
      // localStorage ilegible: se arranca vacío pero se avisa; el original no se toca.
      data = { sessions: [], customExercises: [], plan: createDefaultPlan() };
      notice = 'Se encontraron datos de la versión anterior pero no se pudieron leer. Se empieza con una base vacía; los datos originales quedan intactos en A2.8.';
    }
    const hydrated = await replaceAll(db, data, 'localStorage-v0');
    return { data: toAppData(hydrated), migrationNotice: notice, warnings };
  }

  const fresh: V2Data = { sessions: [], customExercises: [], plan: createDefaultPlan() };
  await replaceAll(db, fresh, 'fresh');
  return { data: toAppData(fresh), migrationNotice: null, warnings: [] };
}
