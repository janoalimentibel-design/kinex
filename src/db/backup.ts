// Exportación e importación de backups — ver docs/DATA_MODEL.md §7.
// Detección: schemaVersion 1 → validación estricta; sin schemaVersion pero con
// `sessions` → backup v0 (A2.6/A2.7/A2.8) → misma migración que el localStorage.
import { migrateV0toV1, MigrationError } from './migrate';
import { zBackupV1 } from './schema';
import type { BackupV1, V1Data } from './schema';

export class BackupError extends Error {}

export interface ParsedBackup {
  data: V1Data;
  warnings: string[];
  source: 'v0' | 'v1';
}

export function createBackup(data: V1Data, now: Date = new Date()): BackupV1 {
  return { app: 'KINEX', schemaVersion: 1, exportedAt: now.toISOString(), data };
}

export function serializeBackup(data: V1Data, now: Date = new Date()): string {
  return JSON.stringify(createBackup(data, now), null, 2);
}

export function parseBackup(json: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupError('El archivo no es un JSON válido.');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new BackupError('El archivo no tiene el formato de un backup de KINEX.');
  }

  const record = raw as Record<string, unknown>;
  if ('schemaVersion' in record) {
    if (record.schemaVersion !== 1) {
      throw new BackupError(`Versión de backup desconocida (${String(record.schemaVersion)}). Esta app entiende hasta la versión 1.`);
    }
    const parsed = zBackupV1.safeParse(record);
    if (!parsed.success) {
      throw new BackupError('El backup v1 está dañado o incompleto: ' + parsed.error.issues[0].message);
    }
    return { data: parsed.data.data, warnings: [], source: 'v1' };
  }

  // Sin schemaVersion: candidato a backup v0 (formato A2.6/A2.7/A2.8).
  try {
    const { data, warnings } = migrateV0toV1(record);
    return { data, warnings, source: 'v0' };
  } catch (error) {
    if (error instanceof MigrationError) throw new BackupError(error.message);
    throw error;
  }
}
