// Migración v1 → v2 (Fase 3): aditiva, compatible hacia atrás, y upgrade de Dexie.
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { expect, test } from 'vitest';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { createDatabase } from '../src/db/database';
import { migrateV0toV1, migrateV1toV2 } from '../src/db/migrate';
import { zV2Data, type V1Data } from '../src/db/schema';

const v1Session = {
  date: '2026-07-01',
  groups: ['pierna', 'hombro'] as ['pierna', 'hombro'],
  mode: 'mix' as const,
  format: 'ext' as const,
  extraTarget: 'auto' as const,
  completed: { wall_sit: true },
  replacements: {},
  extras: [],
  saved: true,
  metrics: { lumbarBefore: 2, lumbarAfter: 1, knee: 0, energy: 'media' as const, notes: 'ok' },
};

const v1Data: V1Data = {
  sessions: [v1Session],
  customExercises: [],
  plan: { week: 'Semana 2', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' },
};

test('v1→v2 es aditiva: agrega checkin/setLogs vacíos sin tocar nada más', () => {
  const v2 = migrateV1toV2(v1Data);
  expect(() => zV2Data.parse(v2)).not.toThrow();
  expect(v2.sessions[0].checkin).toBeNull();
  expect(v2.sessions[0].setLogs).toEqual({});
  const { checkin: _c, setLogs: _s, ...rest } = v2.sessions[0];
  expect(rest).toEqual(v1Session);
  expect(v2.plan).toEqual(v1Data.plan);
});

test('un backup v1 exportado por la Fase 1 sigue importando (compatibilidad)', () => {
  const backupV1 = JSON.stringify({ app: 'KINEX', schemaVersion: 1, exportedAt: '2026-07-05T00:00:00.000Z', data: v1Data });
  const parsed = parseBackup(backupV1);
  expect(parsed.source).toBe('v1');
  expect(parsed.data).toEqual(migrateV1toV2(v1Data));
});

test('cadena completa v0→v2: backup de A2.8 llega a v2 válido', () => {
  const v0 = {
    sessions: { '2026-07-03': { groups: ['espalda', 'bicep'], mode: 'mix', format: 'base', done: {}, saved: false, metrics: null } },
    custom: {},
    plan: { week: 'Semana 1', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' },
  };
  const parsed = parseBackup(JSON.stringify(v0));
  expect(parsed.source).toBe('v0');
  expect(() => zV2Data.parse(parsed.data)).not.toThrow();
  expect(parsed.data.sessions[0].checkin).toBeNull();
  expect(parsed.data).toEqual(migrateV1toV2(migrateV0toV1(v0).data));
});

test('roundtrip v2 con checkin y setLogs: export → import idéntico', () => {
  const v2 = migrateV1toV2(v1Data);
  v2.sessions[0] = {
    ...v2.sessions[0],
    checkin: { lumbar: 2, knee: 1, energy: 'alta', timeMinutes: 30 },
    setLogs: { wall_sit: [{ reps: 12, load: null, rpe: 7, done: true }, { reps: 10, load: null, rpe: 8, done: true }] },
  };
  const parsed = parseBackup(serializeBackup(v2));
  expect(parsed.source).toBe('v2');
  expect(parsed.data).toEqual(v2);
});

test('upgrade de Dexie: una base v1 existente se eleva a v2 conservando los datos', async () => {
  const name = 'kinex-upgrade-test';
  // Base v1 tal como la dejó la Fase 1
  const oldDb = new Dexie(name);
  oldDb.version(1).stores({ sessions: 'date', customExercises: 'id', kv: 'key' });
  await oldDb.open();
  await oldDb.table('sessions').put(v1Session);
  await oldDb.table('kv').put({ key: 'meta', value: { schemaVersion: 1, migratedFrom: 'fresh', migratedAt: '2026-07-05T00:00:00.000Z' } });
  await oldDb.table('kv').put({ key: 'plan', value: v1Data.plan });
  oldDb.close();

  // La app actual la abre: el upgrade corre solo
  const db = createDatabase(name);
  const session = await db.sessions.get('2026-07-01');
  expect(session?.checkin).toBeNull();
  expect(session?.setLogs).toEqual({});
  expect(session?.metrics?.lumbarBefore).toBe(2); // nada se perdió
  const meta = await db.kv.get('meta');
  expect(meta?.key === 'meta' && meta.value.schemaVersion).toBe(2);
  db.close();
});
