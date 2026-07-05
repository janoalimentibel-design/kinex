import Dexie, { type EntityTable } from 'dexie';
import type { CustomExercise, Meta, Plan, Session } from './schema';

export type KvEntry = { key: 'plan'; value: Plan } | { key: 'meta'; value: Meta };

export type KinexDB = Dexie & {
  sessions: EntityTable<Session, 'date'>;
  customExercises: EntityTable<CustomExercise, 'id'>;
  kv: EntityTable<KvEntry, 'key'>;
};

export function createDatabase(name = 'kinex'): KinexDB {
  const db = new Dexie(name) as KinexDB;
  // Versiones futuras de esquema: encadenar db.version(2).stores(...).upgrade(...), nunca reemplazar.
  db.version(1).stores({ sessions: 'date', customExercises: 'id', kv: 'key' });
  return db;
}
