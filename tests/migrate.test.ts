// Los 9 tests de migración definidos en docs/DATA_MODEL.md §8 — criterio de cierre.
import { describe, expect, test } from 'vitest';
import { parseBackup, serializeBackup, BackupError } from '../src/db/backup';
import { migrateV0toV1, migrateV1toV2, MigrationError } from '../src/db/migrate';
import { zV1Data } from '../src/db/schema';

// Fixture con la estructura EXACTA que produce A2.8 (createDefaultDB + app.js).
function realV0Backup() {
  return {
    sessions: {
      '2026-07-01': {
        groups: ['pierna', 'hombro'],
        mode: 'mix',
        format: 'ext',
        extraTarget: 'g1',
        done: { wall_sit: true, step_bajo: false },
        repl: { step_bajo: 'leg_ext' },
        extra: ['dead_bug'],
        saved: true,
        metrics: { lba: 2, lbd: 1, knee: 0, energy: 'media', notes: 'rodilla bien' },
      },
      '2026-07-03': {
        // sesión mínima sin campos opcionales, como las crea createSession de A2.8
        groups: ['espalda', 'bicep'],
        mode: 'sinpeso',
        format: 'base',
        done: {},
        saved: false,
        metrics: null,
      },
    },
    custom: {
      u_abc: {
        id: 'u_xyz', // id divergente: bug real de doble Date.now() en saveCustom
        nm: 'Remo en polea baja',
        g: 'espalda',
        m: ['peso'],
        lvl: 'Inicial',
        sets: '3',
        reps: '10–12',
        rest: '60s',
        tags: ['personal'],
        cues: [],
        errs: [],
        why: 'agarre cerrado',
      },
    },
    plan: { week: 'Semana 2', focus: 'Espalda', secondary: '', objective: 'volver a escalar', rule: '', notes: '' },
  };
}

test('1. fixture real v0 migra y pasa la validación v1 estricta', () => {
  const { data, warnings } = migrateV0toV1(realV0Backup());
  expect(() => zV1Data.parse(data)).not.toThrow();
  expect(data.sessions).toHaveLength(2);
  const s = data.sessions[0];
  expect(s.date).toBe('2026-07-01');
  expect(s.completed).toEqual({ wall_sit: true, step_bajo: false });
  expect(s.replacements).toEqual({ step_bajo: 'leg_ext' });
  expect(s.extras).toEqual(['dead_bug']);
  expect(s.metrics).toEqual({ lumbarBefore: 2, lumbarAfter: 1, knee: 0, energy: 'media', notes: 'rodilla bien' });
  expect(data.plan.week).toBe('Semana 2');
  // El único warning esperado del fixture es el id divergente del custom.
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toMatch(/id interno divergente/);
});

test('2. sesión v0 mínima recibe todos los defaults', () => {
  const { data } = migrateV0toV1(realV0Backup());
  const s = data.sessions[1];
  expect(s.extraTarget).toBe('auto');
  expect(s.replacements).toEqual({});
  expect(s.extras).toEqual([]);
  expect(s.metrics).toBeNull();
  expect(s.saved).toBe(false);
});

test('3. valores sucios: clamps, defaults y warnings sin explotar', () => {
  const dirty = {
    sessions: {
      '2026-07-02': {
        groups: ['pierna', 'nogroup'],
        mode: 'volando',
        format: 'gigante',
        done: { a: 1, b: 0 },
        saved: 1,
        metrics: { lba: '3', lbd: 15, knee: 'mucho', energy: 'altísima', notes: 42 },
      },
      'no-es-fecha': { groups: ['pierna', 'core'], mode: 'mix', format: 'base', done: {}, saved: true, metrics: null },
      '2026-02-30': { groups: ['pierna', 'core'], mode: 'mix', format: 'base', done: {}, saved: true, metrics: null },
    },
  };
  const { data, warnings } = migrateV0toV1(dirty);
  expect(data.sessions).toHaveLength(1); // fechas inválidas descartadas con warning, nunca en silencio
  const s = data.sessions[0];
  expect(s.groups[0]).toBe('pierna'); // se salva el grupo válido
  expect(s.mode).toBe('mix');
  expect(s.format).toBe('base');
  expect(s.completed).toEqual({ a: true, b: false });
  expect(s.saved).toBe(true);
  expect(s.metrics).toEqual({ lumbarBefore: 3, lumbarAfter: 10, knee: 0, energy: 'media', notes: '42' });
  expect(warnings.filter((w) => w.includes('descartada'))).toHaveLength(2);
  expect(warnings.some((w) => w.includes('fuera de rango'))).toBe(true);
  expect(() => zV1Data.parse(data)).not.toThrow();
});

test('4. custom con id divergente: id resultante = clave, nada se pierde', () => {
  const { data } = migrateV0toV1(realV0Backup());
  expect(data.customExercises).toHaveLength(1);
  expect(data.customExercises[0].id).toBe('u_abc');
  expect(data.customExercises[0].name).toBe('Remo en polea baja');
  expect(data.customExercises[0].notes).toBe('agarre cerrado');
});

test('5. roundtrip: export → import → datos idénticos', () => {
  const { data } = migrateV0toV1(realV0Backup());
  const v2 = migrateV1toV2(data);
  const parsed = parseBackup(serializeBackup(v2));
  expect(parsed.source).toBe('v2');
  expect(parsed.data).toEqual(v2);
  expect(parsed.warnings).toEqual([]);
});

test('6. idempotencia: migrar el mismo v0 dos veces da exactamente lo mismo', () => {
  const a = migrateV0toV1(realV0Backup());
  const b = migrateV0toV1(realV0Backup());
  expect(a.data).toEqual(b.data);
  expect(a.warnings).toEqual(b.warnings);
});

test('7. equivalencia de caminos: backup v0 importado = migración directa encadenada', () => {
  const direct = migrateV0toV1(realV0Backup());
  const viaBackup = parseBackup(JSON.stringify(realV0Backup()));
  expect(viaBackup.source).toBe('v0');
  expect(viaBackup.data).toEqual(migrateV1toV2(direct.data));
  expect(viaBackup.warnings).toEqual(direct.warnings);
});

describe('8. rechazos con mensaje claro', () => {
  test('JSON corrupto', () => {
    expect(() => parseBackup('{esto no es json')).toThrow(BackupError);
  });
  test('JSON de otra app', () => {
    expect(() => parseBackup(JSON.stringify({ foo: 'bar' }))).toThrow(/formato/);
  });
  test('schemaVersion futura', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'KINEX', schemaVersion: 99, data: {} }))).toThrow(/versión/i);
  });
  test('v2 con estructura rota', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'KINEX', schemaVersion: 2, exportedAt: 'x', data: { sessions: 'no' } }))).toThrow(BackupError);
  });
  test('v1 con estructura rota', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'KINEX', schemaVersion: 1, exportedAt: 'x', data: { sessions: 'no' } }))).toThrow(BackupError);
  });
  test('migración directa de entrada irreconocible', () => {
    expect(() => migrateV0toV1({ nada: true })).toThrow(MigrationError);
  });
});

test('9. la base por defecto de A2.8 migra a una v1 vacía con plan por defecto', () => {
  // Estructura literal de createDefaultDB() en src/storage.js de A2.8
  const defaultDb = {
    sessions: {},
    custom: {},
    plan: { week: 'Semana 1', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' },
  };
  const { data, warnings } = migrateV0toV1(defaultDb);
  expect(data.sessions).toEqual([]);
  expect(data.customExercises).toEqual([]);
  expect(data.plan).toEqual(defaultDb.plan);
  expect(warnings).toEqual([]);
});
