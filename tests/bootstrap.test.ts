// Flujo de arranque contra IndexedDB simulada: migración única desde localStorage
// legacy, arranque en frío y re-arranque sin re-migrar.
import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { bootstrap, hydrateHistoricalExerciseLogs, replaceAll, toExportData } from '../src/db/bootstrap';
import { createDatabase } from '../src/db/database';
import { LEGACY_STORAGE_KEY } from '../src/data/exercises';
import { migrateV0toV1, migrateV1toV2 } from '../src/db/migrate';

let dbCount = 0;
const freshDb = () => createDatabase(`kinex-test-${++dbCount}`);

const legacyPayload = {
  sessions: {
    '2026-07-01': { groups: ['pierna', 'hombro'], mode: 'mix', format: 'base', done: { wall_sit: true }, saved: true, metrics: { lba: 1, lbd: 0, knee: 2, energy: 'alta', notes: 'ok' } },
  },
  custom: {},
  plan: { week: 'Semana 3', focus: 'Rodilla', secondary: '', objective: '', rule: '', notes: '' },
};

function fakeStore(value: string | null) {
  let reads = 0;
  return {
    getItem(key: string) {
      reads++;
      return key === LEGACY_STORAGE_KEY ? value : null;
    },
    get reads() { return reads; },
  };
}

test('arranque en frío sin datos legacy crea base vacía', async () => {
  const result = await bootstrap(freshDb(), fakeStore(null));
  expect(result.migrationNotice).toBeNull();
  expect(Object.keys(result.data.sessions)).toHaveLength(0);
  expect(result.data.plan.week).toBe('Semana 1');
});

test('primer arranque migra desde localStorage y avisa; el segundo no re-migra', async () => {
  const db = freshDb();
  const store = fakeStore(JSON.stringify(legacyPayload));

  const first = await bootstrap(db, store);
  expect(first.migrationNotice).toMatch(/1 sesiones/);
  expect(first.data.sessions['2026-07-01'].completed).toEqual({ wall_sit: true });
  expect(first.data.sessions['2026-07-01'].exerciseLog?.find((exercise) => exercise.id === 'wall_sit')?.completed).toBe(true);
  expect(first.data.plan.week).toBe('Semana 3');

  const second = await bootstrap(db, store);
  expect(second.migrationNotice).toBeNull(); // meta presente → no vuelve a migrar
  expect(second.data.sessions['2026-07-01'].metrics?.energy).toBe('alta');
});

test('localStorage corrupto: arranca vacío con aviso, sin lanzar', async () => {
  const result = await bootstrap(freshDb(), fakeStore('{roto'));
  expect(result.migrationNotice).toMatch(/no se pudieron leer/);
  expect(Object.keys(result.data.sessions)).toHaveLength(0);
});

test('replaceAll + bootstrap congelan las sesiones históricas importadas (import de backup)', async () => {
  const db = freshDb();
  const data = migrateV1toV2(migrateV0toV1(legacyPayload).data);
  await replaceAll(db, data, 'backup-v0');
  const result = await bootstrap(db, fakeStore(null));
  expect(toExportData(result.data)).toEqual(hydrateHistoricalExerciseLogs(data));
});

test('la hidratación usa el selector histórico y no la rotación actual', () => {
  const data = migrateV1toV2(migrateV0toV1(legacyPayload).data);
  const hydrated = hydrateHistoricalExerciseLogs(data);
  const log = hydrated.sessions[0].exerciseLog;
  expect(log).toBeDefined();
  expect(log?.map((exercise) => exercise.id)).toContain('wall_sit');
  expect(log?.find((exercise) => exercise.id === 'wall_sit')?.completed).toBe(true);
});
