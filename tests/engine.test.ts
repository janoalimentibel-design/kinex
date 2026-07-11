// Progresiones manuales: los enlaces del catálogo tienen que seguir siendo seguros.
import { expect, test } from 'vitest';
import { CATALOG, PROGRESSIONS } from '../src/data/exercises';
import { levelScore } from '../src/logic/session';

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
