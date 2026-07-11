// Esquema v1 de KINEX — ver docs/DATA_MODEL.md.
// Regla de oro: los VALORES de los enums nunca cambian (vienen de v0); solo los nombres de campos.
import { z } from 'zod';

export const GROUP_IDS = ['pierna', 'espalda', 'pecho', 'hombro', 'bicep', 'tricep', 'core'] as const;

export const zGroupId = z.enum(GROUP_IDS);
export const zMode = z.enum(['peso', 'sinpeso', 'mix']);
export const zFormat = z.enum(['base', 'ext', 'long']);
export const zLevel = z.enum(['Inicial', 'Progresivo', 'Avanzado']);
export const zEnergy = z.enum(['baja', 'media', 'alta']);
export const zExtraTarget = z.enum(['auto', 'g1', 'g2']);

export const zScore = z.number().int().min(0).max(10);

export const zSessionMetrics = z.object({
  lumbarBefore: zScore,
  lumbarAfter: zScore,
  knee: zScore,
  energy: zEnergy,
  notes: z.string(),
});

// Forma v1 de la sesión: se conserva para validar backups v1 al importar.
export const zSessionV1 = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groups: z.tuple([zGroupId, zGroupId]),
  mode: zMode,
  format: zFormat,
  extraTarget: zExtraTarget,
  completed: z.record(z.string(), z.boolean()),
  replacements: z.record(z.string(), z.string()),
  extras: z.array(z.string()),
  saved: z.boolean(),
  metrics: zSessionMetrics.nullable(),
});

// v2: check-in previo a la sesión y registro por serie (aditivos sobre v1).
export const zCheckin = z.object({
  lumbar: zScore,
  knee: zScore,
  energy: zEnergy,
  timeMinutes: z.number().int().min(5).max(180),
});

export const zSetEntry = z.object({
  reps: z.number().int().min(0).max(999).nullable(),
  load: z.number().min(0).max(999).nullable(), // kg; null = sin peso/no registrado
  rpe: z.number().min(1).max(10).nullable(),
  done: z.boolean(),
});

export const zSession = zSessionV1.extend({
  // Campos de v2 aceptados solo para que los backups históricos sigan importando.
  // La interfaz actual ya no los crea ni los utiliza.
  checkin: zCheckin.nullable().optional(),
  setLogs: z.record(z.string(), z.array(zSetEntry)).optional(),
});

// El modo de un ejercicio concreto solo puede ser peso/sinpeso; 'mix' es un modo de sesión.
export const zExerciseMode = z.enum(['peso', 'sinpeso']);

export const zCustomExercise = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  group: zGroupId,
  modes: z.array(zExerciseMode).min(1),
  level: zLevel,
  sets: z.string(),
  reps: z.string(),
  rest: z.string(),
  tags: z.array(z.string()),
  cues: z.array(z.string()),
  errors: z.array(z.string()),
  notes: z.string(),
});

export const zPlan = z.object({
  week: z.string(),
  focus: z.string(),
  secondary: z.string(),
  objective: z.string(),
  rule: z.string(),
  notes: z.string(),
});

export const zMeta = z.object({
  schemaVersion: z.literal(2),
  migratedFrom: z.enum(['localStorage-v0', 'backup-v0', 'fresh', 'backup-v1', 'backup-v2', 'upgrade-v1']),
  migratedAt: z.string(),
});

// Forma v1 completa: solo para importar backups v1.
export const zV1Data = z.object({
  sessions: z.array(zSessionV1),
  customExercises: z.array(zCustomExercise),
  plan: zPlan,
});

// Forma v2: la canónica actual.
export const zV2Data = z.object({
  sessions: z.array(zSession),
  customExercises: z.array(zCustomExercise),
  plan: zPlan,
});

export const zBackupV1 = z.object({
  app: z.literal('KINEX'),
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  data: zV1Data,
});

export const zBackupV2 = z.object({
  app: z.literal('KINEX'),
  schemaVersion: z.literal(2),
  exportedAt: z.string(),
  data: zV2Data,
});

export type GroupId = z.infer<typeof zGroupId>;
export type Mode = z.infer<typeof zMode>;
export type Format = z.infer<typeof zFormat>;
export type Level = z.infer<typeof zLevel>;
export type Energy = z.infer<typeof zEnergy>;
export type ExtraTarget = z.infer<typeof zExtraTarget>;
export type SessionMetrics = z.infer<typeof zSessionMetrics>;
export type SessionV1 = z.infer<typeof zSessionV1>;
export type Session = z.infer<typeof zSession>;
export type Checkin = z.infer<typeof zCheckin>;
export type SetEntry = z.infer<typeof zSetEntry>;
export type CustomExercise = z.infer<typeof zCustomExercise>;
export type Plan = z.infer<typeof zPlan>;
export type Meta = z.infer<typeof zMeta>;
export type V1Data = z.infer<typeof zV1Data>;
export type V2Data = z.infer<typeof zV2Data>;
export type BackupV1 = z.infer<typeof zBackupV1>;
export type BackupV2 = z.infer<typeof zBackupV2>;

// Los ejercicios del catálogo (código) comparten forma con los personalizados (datos).
export type CatalogExercise = CustomExercise;

export function createDefaultPlan(): Plan {
  return { week: 'Semana 1', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' };
}
