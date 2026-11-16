import type { AppData } from '../db/bootstrap';
import type { Session } from '../db/schema';
import { hasActivity } from './activity';
import { createSession } from './session';
import { GROUPS } from '../data/exercises';

export const NOV16_ID = '2026-11-16-descarga-r1';
export const NOV16_START = '2026-11-16';
export const NOV16_END = '2026-11-22';
export const NOV16_AVAILABLE = NOV16_START;
export const NOV16_DAYS = [
  { date: '2026-11-16', label: 'Lunes', walkingText: 'Caminatas cómodas de 5–10 minutos, repartidas en 2–3 momentos si las tolerás.' },
  { date: '2026-11-17', label: 'Martes', walkingText: 'Repetí los tramos cómodos de ayer. Acortalos si hace falta; no hay una cuota que completar.' },
  { date: '2026-11-18', label: 'Miércoles', walkingText: 'Reevaluá cómo te sentís. Mantené los tramos cómodos; si no seguís mejorando, pedí valoración antes de retomar cargas.' },
  { date: '2026-11-19', label: 'Jueves', walkingText: 'Solo si estás más cómodo, probá un tramo de 10–15 minutos. Si no, conservá los tramos cortos.' },
  { date: '2026-11-20', label: 'Viernes', walkingText: 'Repetí la actividad que toleraste bien. Aumentar tiempo es opcional, no un objetivo obligatorio.' },
  { date: '2026-11-21', label: 'Sábado', walkingText: 'Actividad suave según tolerancia. La fecha no marca una vuelta automática a las pesas.' },
  { date: '2026-11-22', label: 'Domingo', walkingText: 'Revisá la evolución de la semana antes de decidir la siguiente rutina. Si persiste la molestia, consultá.' },
];

function hasPersonalWork(session: Session): boolean {
  const ownedProgram = session.programTitle === `Próxima semana · ${session.groups.map(group => GROUPS[group].label).join(' + ')}` ||
    (session.planner?.source === 'adaptive' && session.programTitle === 'Próxima semana · Ajustada a la actividad registrada') ||
    session.programTitle === 'Rutina semanal · 9–15 nov';
  return hasActivity(session) || session.saved || Boolean(session.manuallyEdited || session.planner?.locked) ||
    session.selectedExercises !== undefined || Boolean(session.metrics || session.checkin || session.exerciseLog?.length) ||
    Object.keys(session.completed).length > 0 || Object.keys(session.setLogs ?? {}).length > 0 ||
    Object.keys(session.replacements).length > 0 || session.extras.length > 0 ||
    (Boolean(session.programmed?.length) && !ownedProgram);
}

/** An explicitly loaded deload week; it never injects a rehabilitation plan into a backup. */
export function applyNov16Routine(data: AppData, today: string, force = false): AppData {
  const revision = data.plan.routineRevision ?? '';
  if (today < NOV16_AVAILABLE || today > NOV16_END || !force ||
    revision.startsWith('2026-11-16-') ||
    (/^\d{4}-\d{2}-\d{2}/.test(revision) && revision.slice(0, 10) > NOV16_START)) return data;
  const sessions = { ...data.sessions };
  for (const day of NOV16_DAYS) {
    if (day.date < today || (sessions[day.date] && hasPersonalWork(sessions[day.date]))) continue;
    sessions[day.date] = {
      ...createSession(day.date), groups: ['aerobico'], mode: 'sinpeso', format: 'base',
      selectedExercises: [], programTitle: `Semana suave · 16–22 nov · ${day.label}`,
    };
  }
  return {
    ...data, sessions,
    plan: {
      ...data.plan, routineRevision: NOV16_ID, reviewedWeek: NOV16_START, week: '16–22 nov',
      focus: 'Descarga activa', secondary: 'Movimiento cómodo · reevaluación',
      objective: 'Mantener actividad suave y recuperar comodidad. Esta semana no programa sesiones de fuerza.',
      rule: 'No busques reproducir el pinchazo ni fuerces estiramientos. Acortá o detené la actividad si aumenta la molestia.',
      notes: 'Caminatas cortas en terreno cómodo, repartidas según tolerancia. Activación abdominal suave opcional: 4 repeticiones de 5 segundos, respirando y sin mover cuello ni tronco, solo si es indolora. No hay progresión obligatoria por fecha ni cargas programadas. Si no continúa la mejoría, pedí valoración antes de retomar fuerza. Se conservan los días con actividad o elecciones personales.',
    },
  };
}
