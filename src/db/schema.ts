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

const zScore = z.number().int().min(0).max(10);

export const zSessionMetrics = z.object({
  lumbarBefore: zScore,
  lumbarAfter: zScore,
  knee: zScore,
  energy: zEnergy,
  notes: z.string(),
});

export const zSession = z.object({
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
  schemaVersion: z.literal(1),
  migratedFrom: z.enum(['localStorage-v0', 'backup-v0', 'fresh', 'backup-v1']),
  migratedAt: z.string(),
});

export const zV1Data = z.object({
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

export type GroupId = z.infer<typeof zGroupId>;
export type Mode = z.infer<typeof zMode>;
export type Format = z.infer<typeof zFormat>;
export type Level = z.infer<typeof zLevel>;
export type Energy = z.infer<typeof zEnergy>;
export type ExtraTarget = z.infer<typeof zExtraTarget>;
export type SessionMetrics = z.infer<typeof zSessionMetrics>;
export type Session = z.infer<typeof zSession>;
export type CustomExercise = z.infer<typeof zCustomExercise>;
export type Plan = z.infer<typeof zPlan>;
export type Meta = z.infer<typeof zMeta>;
export type V1Data = z.infer<typeof zV1Data>;
export type BackupV1 = z.infer<typeof zBackupV1>;

// Los ejercicios del catálogo (código) comparten forma con los personalizados (datos).
export type CatalogExercise = CustomExercise;

export function createDefaultPlan(): Plan {
  return { week: 'Semana 1', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' };
}
