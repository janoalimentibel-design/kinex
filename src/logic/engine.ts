// Motor de sugerencias — funciones puras que ajustan y explican la sesión
// usando el check-in del día y el historial (dolor post-sesión, RPE registrado).
//
// Principios (INFORME §13): el motor SUGIERE y explica, nunca diagnostica ni
// bloquea. Solo afecta la selección automática; la elección manual sigue libre
// (los ejercicios riesgosos se marcan, no se ocultan).
import { PROGRESSIONS } from '../data/exercises';
import type { CatalogExercise, Session } from '../db/schema';
import type { ExerciseMap } from './session';

export interface Adjustments {
  reasons: string[];
  /** filtro para la selección automática */
  allow(e: CatalogExercise): boolean;
  /** marca ⚠ en las opciones manuales que hoy convendría evitar */
  risky(e: CatalogExercise): boolean;
}

function previousSaved(session: Session, sessions: Record<string, Session>): Session[] {
  return Object.values(sessions)
    .filter((s) => s.saved && s.date < session.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function computeAdjustments(session: Session, sessions: Record<string, Session>): Adjustments {
  const reasons: string[] = [];
  const checkin = session.checkin;
  const kneeHigh = Boolean(checkin && checkin.knee >= 4);
  const lumbarHigh = Boolean(checkin && checkin.lumbar >= 4);

  if (kneeHigh) reasons.push(`Rodilla ${checkin!.knee}/10 hoy: piernas en variantes iniciales y sin impacto.`);
  if (lumbarHigh) reasons.push(`Lumbar ${checkin!.lumbar}/10 hoy: core de control, sin gestos explosivos ni impacto.`);

  const prev = previousSaved(session, sessions);
  const last = prev[0];
  if (!checkin && last?.metrics && (last.metrics.lumbarAfter >= 4 || last.metrics.knee >= 4)) {
    reasons.push('La última sesión terminó con molestia alta: hacé el check-in y arrancá suave.');
  }

  const rpes: number[] = [];
  for (const s of prev.slice(0, 2)) {
    for (const sets of Object.values(s.setLogs)) {
      for (const set of sets) if (set.done && set.rpe !== null) rpes.push(set.rpe);
    }
  }
  if (rpes.length >= 3) {
    const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length;
    if (avg >= 8.5) reasons.push(`RPE promedio ${avg.toFixed(1)} en las últimas sesiones: buen día para formato Base.`);
  }

  const allow = (e: CatalogExercise): boolean => {
    if ((kneeHigh || lumbarHigh) && e.tags.includes('impacto')) return false;
    if (kneeHigh && e.group === 'pierna' && e.level !== 'Inicial') return false;
    if (lumbarHigh && e.group === 'core' && e.level !== 'Inicial') return false;
    return true;
  };

  return { reasons, allow, risky: (e) => !allow(e) };
}

export interface ProgressionHint {
  type: 'harder' | 'easier';
  targetId: string;
  avgRpe: number;
}

// Sugerencia por ejercicio: si la última vez que lo registraste el RPE promedio
// fue bajo (≤7) propone la progresión; si fue muy alto (≥9) propone la regresión.
export function progressionHint(
  id: string,
  session: Session,
  sessions: Record<string, Session>,
  all: ExerciseMap,
): ProgressionHint | null {
  const links = PROGRESSIONS[id];
  if (!links) return null;
  const lastWithLog = previousSaved(session, sessions).find((s) => s.setLogs[id]?.some((x) => x.done));
  if (!lastWithLog) return null;
  const sets = lastWithLog.setLogs[id]!.filter((x) => x.done && x.rpe !== null);
  if (sets.length < 2) return null;
  const avg = sets.reduce((acc, x) => acc + x.rpe!, 0) / sets.length;
  if (avg <= 7 && links.harder && all[links.harder]) return { type: 'harder', targetId: links.harder, avgRpe: avg };
  if (avg >= 9 && links.easier && all[links.easier]) return { type: 'easier', targetId: links.easier, avgRpe: avg };
  return null;
}
