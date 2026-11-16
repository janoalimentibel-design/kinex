import type { AppData } from '../db/bootstrap';
import type { Session } from '../db/schema';
import { hasActivity } from './activity';
import { createSession } from './session';
import { GROUPS } from '../data/exercises';

export const NOV16_PREVIOUS_ID = '2026-11-16-descarga-r1';
export const NOV16_ID = '2026-11-16-descarga-r2';
export const NOV16_START = '2026-11-16';
export const NOV16_END = '2026-11-22';
export const NOV16_AVAILABLE = NOV16_START;
export const NOV16_DAYS = [
  { date: '2026-11-16', label: 'Lunes', walkingText: 'Pecho + bíceps: 5–10 minutos de caminata cómoda; press de pecho con mancuernas en el suelo y curl sentado con respaldo. Una serie ligera de prueba por ejercicio; hasta 2 de 10–12 si seguís cómodo.' },
  { date: '2026-11-17', label: 'Martes', walkingText: 'Repetí los tramos cómodos de ayer. Acortalos si hace falta; no hay una cuota que completar.' },
  { date: '2026-11-18', label: 'Miércoles', walkingText: 'Reevaluá cómo te sentís. Mantené los tramos cómodos; si no seguís mejorando, pedí valoración antes de retomar cargas.' },
  { date: '2026-11-19', label: 'Jueves', walkingText: 'Piernas + tríceps, si seguís mejorando: extensión de cuádriceps en el accesorio de banco con espalda apoyada y jalón de tríceps ligero. Una serie de prueba; hasta 2 de 10–12. Si no, caminata tolerable.' },
  { date: '2026-11-20', label: 'Viernes', walkingText: 'Repetí la actividad que toleraste bien. Aumentar tiempo es opcional, no un objetivo obligatorio.' },
  { date: '2026-11-21', label: 'Sábado', walkingText: 'Opcional, solo si seguís mejorando y las sesiones anteriores no te dejaron peor: remo muy ligero con pecho apoyado y gemelos sentado. Hasta 2 series de 10–12. El remo sigue cargando la espalda media aunque tenga apoyo; no es una prueba obligatoria.' },
  { date: '2026-11-22', label: 'Domingo', walkingText: 'Revisá la evolución de la semana antes de decidir la siguiente rutina. Si persiste la molestia, consultá.' },
];

const LIGHT_DAYS: Record<string, string[]> = {
  '2026-11-16': ['dumbbell_floor_press', 'dumbbell_curl'],
  '2026-11-19': ['bench_leg_extension', 'straight_bar_pressdown'],
  '2026-11-21': ['chest_supported_db_row', 'seated_calf_raise_db'],
};

const LIGHT_GROUPS: Record<string, Session['groups']> = {
  '2026-11-16': ['pecho', 'bicep'], '2026-11-19': ['pierna', 'tricep'], '2026-11-21': ['espalda', 'pierna'],
};

export function nov16Prescription(date: string, id: string) {
  if (!LIGHT_DAYS[date]?.includes(id)) return undefined;
  return {
    sets: '1–2', reps: '10–12', rest: '60–90s',
    instruction: ({
      dumbbell_floor_press: 'Press con mancuernas muy ligeras: cabeza y espalda apoyadas, rodillas flexionadas y sin hacer puente ni forzar el arco. Acostarte, colocar las mancuernas y levantarte también deben resultar cómodos. Si no, omitilo; Pec Deck con respaldo es una alternativa manual, no otro ejercicio para sumar.',
      dumbbell_curl: 'Curl sentado con espalda apoyada, cuello cómodo y mancuernas muy ligeras. Sin balancearte ni contener la respiración.',
      bench_leg_extension: 'Espalda apoyada en el banco y carga muy ligera. Extendé las rodillas sin levantar la cadera ni inclinarte para ayudar.',
      straight_bar_pressdown: 'Jalón de tríceps muy ligero, cuello cómodo y tronco quieto. No te inclines ni empujes con el peso del cuerpo.',
      chest_supported_db_row: 'Solo si seguís mejorando: pecho apoyado, cuello alineado sin forzar la mirada hacia abajo y carga muy ligera. Este ejercicio sí solicita la espalda media; el apoyo no garantiza tolerancia. Podés omitirlo por completo.',
      seated_calf_raise_db: 'Sentado en banco firme, cuello cómodo y carga muy ligera sobre los muslos, sin redondear el tronco para sostenerla. Podés empezar sin carga.',
    } as Record<string, string>)[id] + ' Probá una serie; completá una segunda solo si no reproduce el pinchazo, no aumenta la molestia y no te deja peor después. No busques fatiga ni fallo.',
  };
}

function untouchedPreviousDay(session: Session): boolean {
  const day = NOV16_DAYS.find(day => day.date === session.date);
  return Boolean(day && session.programTitle === `Semana suave · 16–22 nov · ${day.label}` &&
    session.groups.length === 1 && session.groups[0] === 'aerobico' && session.mode === 'sinpeso' &&
    session.format === 'base' && session.selectedExercises?.length === 0 &&
    !session.manuallyEdited && !session.saved && !hasActivity(session) &&
    !session.metrics && !session.checkin && !session.exerciseLog?.length &&
    Object.keys(session.completed).length === 0 && Object.keys(session.setLogs ?? {}).length === 0 &&
    Object.keys(session.replacements).length === 0 && session.extras.length === 0 && !session.planner?.locked);
}

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
    (revision.startsWith('2026-11-16-') && revision !== NOV16_PREVIOUS_ID) ||
    (/^\d{4}-\d{2}-\d{2}/.test(revision) && revision.slice(0, 10) > NOV16_START)) return data;
  const sessions = { ...data.sessions };
  for (const day of NOV16_DAYS) {
    const existing = sessions[day.date];
    if (day.date < today || (existing && hasPersonalWork(existing) &&
      !(revision === NOV16_PREVIOUS_ID && untouchedPreviousDay(existing)))) continue;
    const ids = LIGHT_DAYS[day.date] ?? [];
    sessions[day.date] = {
      ...createSession(day.date), groups: LIGHT_GROUPS[day.date] ?? ['aerobico'], mode: ids.length ? 'mix' : 'sinpeso', format: 'base',
      selectedExercises: [...ids], programTitle: `Semana mixta suave · 16–22 nov · ${day.label}`,
    };
  }
  return {
    ...data, sessions,
    plan: {
      ...data.plan, routineRevision: NOV16_ID, reviewedWeek: NOV16_START, week: '16–22 nov',
      focus: 'Descarga activa', secondary: 'Carga ligera opcional · movimiento cómodo',
      objective: 'Combinar actividad cómoda con sesiones breves y ligeras: lunes pecho y bíceps, jueves piernas y tríceps; sábado espalda con apoyo y gemelos solo si continúa la mejoría.',
      rule: 'No busques reproducir el pinchazo ni fuerces estiramientos. Acortá o detené la actividad si aumenta la molestia.',
      notes: 'Carga muy ligera: una serie de prueba y como máximo dos de 10–12, descanso de 60–90 segundos, sin buscar fatiga ni fallo. Se prioriza apoyo de cabeza o tronco y ausencia de balanceo; el apoyo no garantiza que un ejercicio se tolere. Press con mancuernas en el suelo sin puente; si la colocación molesta, omitir o elegir manualmente Pec Deck con respaldo. El remo apoyado sigue solicitando la espalda media y queda como opción tardía. Si un ejercicio reproduce el pinchazo, aumenta la molestia o te deja peor después, omitilo. Las sesiones siguientes dependen de la evolución, no solo de la fecha. El resto: caminatas cómodas y activación abdominal suave opcional. Se posponen cargas intensas, pesos muertos, remos inclinados sin apoyo, carries, dominadas, polea alta de espalda y core avanzado. Si no sigue mejorando, pedí valoración antes de aumentar cargas. Se conservan actividad y elecciones personales.',
    },
  };
}
