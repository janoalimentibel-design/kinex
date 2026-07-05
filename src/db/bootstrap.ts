// Flujo de arranque — ver docs/DATA_MODEL.md §6.
// El localStorage legacy es SOLO-LECTURA: se lee una vez para migrar y nunca se
// escribe ni se borra, así A2.8 congelada sigue funcionando con sus datos.
import { LEGACY_STORAGE_KEY } from '../data/exercises';
import type { KinexDB } from './database';
import { migrateV0toV1 } from './migrate';
import { createDefaultPlan, type CustomExercise, type Meta, type Plan, type Session, type V1Data } from './schema';

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

export function toAppData(data: V1Data): AppData {
  return {
    sessions: Object.fromEntries(data.sessions.map((s) => [s.date, s])),
    custom: Object.fromEntries(data.customExercises.map((e) => [e.id, e])),
    plan: data.plan,
  };
}

export function toV1Data(data: AppData): V1Data {
  return {
    sessions: Object.values(data.sessions).sort((a, b) => a.date.localeCompare(b.date)),
    customExercises: Object.values(data.custom),
    plan: data.plan,
  };
}

export async function replaceAll(db: KinexDB, data: V1Data, migratedFrom: Meta['migratedFrom']): Promise<void> {
  const meta: Meta = { schemaVersion: 1, migratedFrom, migratedAt: new Date().toISOString() };
  await db.transaction('rw', db.sessions, db.customExercises, db.kv, async () => {
    await Promise.all([db.sessions.clear(), db.customExercises.clear()]);
    await db.sessions.bulkPut(data.sessions);
    await db.customExercises.bulkPut(data.customExercises);
    await db.kv.put({ key: 'plan', value: data.plan });
    await db.kv.put({ key: 'meta', value: meta });
  });
}

async function loadFromDb(db: KinexDB): Promise<AppData> {
  const [sessions, custom, planEntry] = await Promise.all([
    db.sessions.toArray(),
    db.customExercises.toArray(),
    db.kv.get('plan'),
  ]);
  return {
    sessions: Object.fromEntries(sessions.map((s) => [s.date, s])),
    custom: Object.fromEntries(custom.map((e) => [e.id, e])),
    plan: planEntry && planEntry.key === 'plan' ? planEntry.value : createDefaultPlan(),
  };
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
    let data: V1Data;
    try {
      const result = migrateV0toV1(JSON.parse(legacyRaw));
      data = result.data;
      warnings = result.warnings;
      notice = `Datos migrados de la versión anterior: ${data.sessions.length} sesiones y ${data.customExercises.length} ejercicios personalizados. Los datos originales quedan intactos en la versión A2.8.`;
    } catch {
      // localStorage ilegible: se arranca vacío pero se avisa; el original no se toca.
      data = { sessions: [], customExercises: [], plan: createDefaultPlan() };
      notice = 'Se encontraron datos de la versión anterior pero no se pudieron leer. Se empieza con una base vacía; los datos originales quedan intactos en A2.8.';
    }
    await replaceAll(db, data, 'localStorage-v0');
    return { data: toAppData(data), migrationNotice: notice, warnings };
  }

  const fresh: V1Data = { sessions: [], customExercises: [], plan: createDefaultPlan() };
  await replaceAll(db, fresh, 'fresh');
  return { data: toAppData(fresh), migrationNotice: null, warnings: [] };
}
