import Dexie, { type EntityTable } from 'dexie';
import type { CustomExercise, Meta, Plan, Session } from './schema';

export type KvEntry = { key: 'plan'; value: Plan } | { key: 'meta'; value: Meta };
export interface SessionRevision { id?: number; date: string; recordedAt: string; session: Session; customExercises?: CustomExercise[] }

export type KinexDB = Dexie & {
  sessions: EntityTable<Session, 'date'>;
  customExercises: EntityTable<CustomExercise, 'id'>;
  kv: EntityTable<KvEntry, 'key'>;
  sessionRevisions: EntityTable<SessionRevision, 'id'>;
};

export function createDatabase(name = 'kinex'): KinexDB {
  const db = new Dexie(name) as KinexDB;
  db.version(1).stores({ sessions: 'date', customExercises: 'id', kv: 'key' });
  // v2: check-in y registro por serie. Migración aditiva en el upgrade de Dexie;
  // el meta pasa a schemaVersion 2 en la misma transacción.
  db.version(2)
    .stores({ sessions: 'date', customExercises: 'id', kv: 'key' })
    .upgrade(async (tx) => {
      await tx.table('sessions').toCollection().modify((s: Record<string, unknown>) => {
        s.checkin ??= null;
        s.setLogs ??= {};
      });
      const meta = await tx.table('kv').get('meta');
      if (meta) {
        await tx.table('kv').put({
          key: 'meta',
          value: { ...meta.value, schemaVersion: 2, migratedFrom: 'upgrade-v1', migratedAt: new Date().toISOString() },
        });
      }
    });
  // Additive local undo history; no session records are rewritten by this upgrade.
  db.version(3).stores({ sessions: 'date', customExercises: 'id', kv: 'key', sessionRevisions: '++id,date' });
  return db;
}
