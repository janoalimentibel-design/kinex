// Migración v0 → v1 — función pura, sin navegador ni IndexedDB.
// Usada por los DOS caminos de entrada (localStorage legacy y backups importados),
// lo que garantiza resultados idénticos. Ver docs/DATA_MODEL.md §5.
//
// Contrato: nunca lanza por datos sucios — normaliza, aplica defaults y acumula
// warnings visibles. Solo lanza MigrationError si la entrada no es un backup v0
// reconocible (sin objeto `sessions`).
import {
  GROUP_IDS,
  createDefaultPlan,
  zEnergy,
  zExtraTarget,
  zFormat,
  zGroupId,
  zLevel,
  zMode,
  zV1Data,
} from './schema';
import type { CustomExercise, GroupId, Plan, Session, SessionMetrics, V1Data } from './schema';

export class MigrationError extends Error {}

export interface MigrationResult {
  data: V1Data;
  warnings: string[];
}

const DEFAULT_GROUPS: [GroupId, GroupId] = ['pierna', 'hombro'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = new Date(key + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === key;
}

function toScore(v: unknown, field: string, date: string, warnings: string[]): number {
  const n = Number(v);
  if (Number.isNaN(n)) {
    if (v !== undefined && v !== null && v !== '') warnings.push(`Sesión ${date}: ${field} no numérico ("${String(v)}") → 0`);
    return 0;
  }
  const clamped = Math.min(10, Math.max(0, Math.round(n)));
  if (clamped !== n) warnings.push(`Sesión ${date}: ${field} fuera de rango (${n}) → ${clamped}`);
  return clamped;
}

function migrateMetrics(raw: unknown, date: string, warnings: string[]): SessionMetrics | null {
  if (!isRecord(raw)) return null;
  const energyParsed = zEnergy.safeParse(raw.energy);
  if (!energyParsed.success && raw.energy !== undefined) {
    warnings.push(`Sesión ${date}: energía desconocida ("${String(raw.energy)}") → "media"`);
  }
  return {
    lumbarBefore: toScore(raw.lba, 'lumbar antes', date, warnings),
    lumbarAfter: toScore(raw.lbd, 'lumbar después', date, warnings),
    knee: toScore(raw.knee, 'rodilla', date, warnings),
    energy: energyParsed.success ? energyParsed.data : 'media',
    notes: typeof raw.notes === 'string' ? raw.notes : String(raw.notes ?? ''),
  };
}

function migrateGroups(raw: unknown, date: string, warnings: string[]): [GroupId, GroupId] {
  const input = Array.isArray(raw) ? raw : [];
  const valid = input.filter((g): g is GroupId => zGroupId.safeParse(g).success);
  if (valid.length === 2 && input.length === 2) return [valid[0], valid[1]];
  // Se salva lo salvable: se conservan los grupos válidos y se rellena con la combinación por defecto.
  warnings.push(`Sesión ${date}: grupos inválidos (${JSON.stringify(raw)}) → se completan con los por defecto`);
  const first = valid[0] ?? DEFAULT_GROUPS[0];
  const second = valid[1] ?? (first === DEFAULT_GROUPS[1] ? DEFAULT_GROUPS[0] : DEFAULT_GROUPS[1]);
  return [first, second];
}

function migrateBoolMap(raw: unknown): Record<string, boolean> {
  if (!isRecord(raw)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Boolean(v);
  return out;
}

function migrateStringMap(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === 'string' && v) out[k] = v;
  return out;
}

function migrateSession(date: string, raw: unknown, warnings: string[]): Session {
  const s = isRecord(raw) ? raw : {};
  const mode = zMode.safeParse(s.mode);
  if (!mode.success && s.mode !== undefined) warnings.push(`Sesión ${date}: modo desconocido ("${String(s.mode)}") → "mix"`);
  const format = zFormat.safeParse(s.format);
  if (!format.success && s.format !== undefined) warnings.push(`Sesión ${date}: formato desconocido ("${String(s.format)}") → "base"`);
  const extraTarget = zExtraTarget.safeParse(s.extraTarget);
  return {
    date,
    groups: migrateGroups(s.groups, date, warnings),
    mode: mode.success ? mode.data : 'mix',
    format: format.success ? format.data : 'base',
    extraTarget: extraTarget.success ? extraTarget.data : 'auto',
    completed: migrateBoolMap(s.done),
    replacements: migrateStringMap(s.repl),
    extras: Array.isArray(s.extra) ? s.extra.filter((x): x is string => typeof x === 'string') : [],
    saved: Boolean(s.saved),
    metrics: migrateMetrics(s.metrics, date, warnings),
  };
}

function migrateCustom(key: string, raw: unknown, warnings: string[]): CustomExercise | null {
  if (!isRecord(raw)) return null;
  const name = typeof raw.nm === 'string' ? raw.nm.trim() : '';
  if (!name) {
    warnings.push(`Ejercicio personalizado "${key}" sin nombre → descartado`);
    return null;
  }
  // Se impone id = clave: corrige el bug histórico de doble Date.now() en saveCustom.
  if (raw.id !== key) warnings.push(`Ejercicio personalizado "${name}": id interno divergente → corregido a la clave`);
  const group = zGroupId.safeParse(raw.g);
  if (!group.success) warnings.push(`Ejercicio personalizado "${name}": grupo desconocido ("${String(raw.g)}") → "core"`);
  const level = zLevel.safeParse(raw.lvl);
  if (!level.success) warnings.push(`Ejercicio personalizado "${name}": nivel desconocido ("${String(raw.lvl)}") → "Inicial"`);
  const rawModes = Array.isArray(raw.m) ? raw.m : [];
  let modes = rawModes.filter((m): m is 'peso' | 'sinpeso' => m === 'peso' || m === 'sinpeso');
  if (rawModes.includes('mix')) modes = ['peso', 'sinpeso'];
  if (!modes.length) {
    warnings.push(`Ejercicio personalizado "${name}": sin modo válido → "sinpeso"`);
    modes = ['sinpeso'];
  }
  const strArray = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  return {
    id: key,
    name,
    group: group.success ? group.data : 'core',
    modes: [...new Set(modes)],
    level: level.success ? level.data : 'Inicial',
    sets: String(raw.sets ?? '3'),
    reps: String(raw.reps ?? '10–12'),
    rest: String(raw.rest ?? '60s'),
    tags: strArray(raw.tags),
    cues: strArray(raw.cues),
    errors: strArray(raw.errs),
    notes: typeof raw.why === 'string' ? raw.why : '',
  };
}

function migratePlan(raw: unknown): Plan {
  const defaults = createDefaultPlan();
  if (!isRecord(raw)) return defaults;
  const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
  return {
    week: str(raw.week, defaults.week),
    focus: str(raw.focus, defaults.focus),
    secondary: str(raw.secondary, defaults.secondary),
    objective: str(raw.objective, defaults.objective),
    rule: str(raw.rule, defaults.rule),
    notes: str(raw.notes, defaults.notes),
  };
}

export function migrateV0toV1(raw: unknown): MigrationResult {
  if (!isRecord(raw) || !isRecord(raw.sessions)) {
    throw new MigrationError('El contenido no tiene el formato de un backup de KINEX (falta "sessions").');
  }
  const warnings: string[] = [];

  const sessions: Session[] = [];
  for (const [key, value] of Object.entries(raw.sessions)) {
    if (!isValidDateKey(key)) {
      warnings.push(`Sesión con fecha inválida ("${key}") → descartada`);
      continue;
    }
    sessions.push(migrateSession(key, value, warnings));
  }
  sessions.sort((a, b) => a.date.localeCompare(b.date));

  const customExercises: CustomExercise[] = [];
  if (isRecord(raw.custom)) {
    for (const [key, value] of Object.entries(raw.custom)) {
      const migrated = migrateCustom(key, value, warnings);
      if (migrated) customExercises.push(migrated);
    }
  }

  const data = zV1Data.parse({ sessions, customExercises, plan: migratePlan(raw.plan) });
  return { data, warnings };
}
