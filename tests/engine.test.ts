// Motor de sugerencias (Fase 5): ajustes por check-in, historial y RPE,
// e hints de progresión por ejercicio.
import { expect, test } from 'vitest';
import { CATALOG, PROGRESSIONS } from '../src/data/exercises';
import { computeAdjustments, progressionHint } from '../src/logic/engine';
import { buildExerciseList, createSession, levelScore } from '../src/logic/session';
import type { Session, SetEntry } from '../src/db/schema';

const set = (rpe: number | null, done = true): SetEntry => ({ reps: 10, load: null, rpe, done });

function savedSession(date: string, patch: Partial<Session> = {}): Session {
  return { ...createSession(date), date, saved: true, metrics: { lumbarBefore: 1, lumbarAfter: 1, knee: 1, energy: 'media', notes: '' }, ...patch };
}

test('PROGRESSIONS: ids válidos, mismo grupo, sin auto-enlaces y niveles coherentes', () => {
  for (const [id, links] of Object.entries(PROGRESSIONS)) {
    const e = CATALOG[id];
    expect(e, `id inexistente: ${id}`).toBeDefined();
    for (const [dir, target] of Object.entries(links) as ['easier' | 'harder', string][]) {
      const t = CATALOG[target];
      expect(t, `${id}.${dir} apunta a id inexistente: ${target}`).toBeDefined();
      expect(target, `${id} se enlaza a sí mismo`).not.toBe(id);
      expect(t.group, `${id}.${dir} cruza de grupo`).toBe(e.group);
      if (dir === 'easier') expect(levelScore(t.level), `${id}.easier no es más fácil`).toBeLessThanOrEqual(levelScore(e.level));
      if (dir === 'harder') expect(levelScore(t.level), `${id}.harder no es más difícil`).toBeGreaterThanOrEqual(levelScore(e.level));
    }
  }
});

test('sin check-in ni historial no hay razones ni filtros', () => {
  const session = createSession('2026-07-06');
  const adj = computeAdjustments(session, {});
  expect(adj.reasons).toEqual([]);
  expect(Object.values(CATALOG).every((e) => adj.allow(e))).toBe(true);
});

test('rodilla alta en el check-in: filtra pierna no-Inicial e impacto, y lo explica', () => {
  const session: Session = { ...createSession('2026-07-06'), checkin: { lumbar: 0, knee: 5, energy: 'media', timeMinutes: 30 } };
  const adj = computeAdjustments(session, {});
  expect(adj.reasons.some((r) => r.includes('Rodilla 5/10'))).toBe(true);
  expect(adj.allow(CATALOG.wall_sit)).toBe(true); // pierna Inicial pasa
  expect(adj.allow(CATALOG.lunge_static)).toBe(false); // pierna Progresivo no
  expect(adj.allow(CATALOG.jump_rope)).toBe(false); // impacto no
  expect(adj.risky(CATALOG.lunge_static)).toBe(true);
  expect(adj.allow(CATALOG.pullup)).toBe(true); // otros grupos siguen normales
  // la selección automática sigue completando la sesión
  const list = buildExerciseList({ ...session, groups: ['pierna', 'core'] }, CATALOG, {}, new Date(), adj.allow);
  expect(list).toHaveLength(4);
  for (const entry of list) if (entry.group === 'pierna') expect(CATALOG[entry.id].level).toBe('Inicial');
});

test('lumbar alta: core solo Inicial, con razón visible', () => {
  const session: Session = { ...createSession('2026-07-06'), checkin: { lumbar: 6, knee: 0, energy: 'media', timeMinutes: 30 } };
  const adj = computeAdjustments(session, {});
  expect(adj.reasons.some((r) => r.includes('Lumbar 6/10'))).toBe(true);
  expect(adj.allow(CATALOG.dead_bug)).toBe(true);
  expect(adj.allow(CATALOG.bear_hold)).toBe(false); // core Progresivo
});

test('molestia alta en la última sesión sin check-in de hoy: aviso, sin filtro', () => {
  const prev = savedSession('2026-07-04', { metrics: { lumbarBefore: 3, lumbarAfter: 5, knee: 1, energy: 'baja', notes: '' } });
  const adj = computeAdjustments(createSession('2026-07-06'), { '2026-07-04': prev });
  expect(adj.reasons.some((r) => r.includes('última sesión terminó con molestia alta'))).toBe(true);
  expect(adj.allow(CATALOG.lunge_static)).toBe(true);
});

test('RPE promedio alto en las últimas sesiones genera aviso de fatiga', () => {
  const prev = savedSession('2026-07-04', { setLogs: { pushup: [set(9), set(9), set(8.5)] } });
  const adj = computeAdjustments(createSession('2026-07-06'), { '2026-07-04': prev });
  expect(adj.reasons.some((r) => r.includes('RPE promedio'))).toBe(true);
});

test('hint de progresión: RPE bajo sugiere la variante más difícil', () => {
  const prev = savedSession('2026-07-04', { setLogs: { pushup: [set(6), set(6.5), set(7)] } });
  const hint = progressionHint('pushup', createSession('2026-07-06'), { '2026-07-04': prev }, CATALOG);
  expect(hint).toEqual({ type: 'harder', targetId: 'pause_pushup', avgRpe: expect.closeTo(6.5, 1) });
});

test('hint de regresión: RPE muy alto sugiere la variante más fácil', () => {
  const prev = savedSession('2026-07-04', { setLogs: { pushup: [set(9.5), set(9), set(10)] } });
  const hint = progressionHint('pushup', createSession('2026-07-06'), { '2026-07-04': prev }, CATALOG);
  expect(hint?.type).toBe('easier');
  expect(hint?.targetId).toBe('knee_pushup');
});

test('sin registro suficiente no hay hint', () => {
  expect(progressionHint('pushup', createSession('2026-07-06'), {}, CATALOG)).toBeNull();
  const oneSet = savedSession('2026-07-04', { setLogs: { pushup: [set(6)] } });
  expect(progressionHint('pushup', createSession('2026-07-06'), { '2026-07-04': oneSet }, CATALOG)).toBeNull();
  const noRpe = savedSession('2026-07-04', { setLogs: { pushup: [set(null), set(null), set(null)] } });
  expect(progressionHint('pushup', createSession('2026-07-06'), { '2026-07-04': noRpe }, CATALOG)).toBeNull();
});
