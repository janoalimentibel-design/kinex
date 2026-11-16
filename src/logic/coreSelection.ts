import type { CatalogExercise } from '../db/schema';

// The requested advanced slot uses the confirmed pull-up bar. A wheel has not
// been confirmed; ballistic/loaded rotation and the two similar carries are
// not automatic abdominal choices. Manual choices and history remain intact.
const EXCLUDED = new Set(['farmer', 'suitcase', 'ab_wheel', 'rot_expl', 'russian_twist']);
const ADVANCED = new Set(['hanging_leg_raise']);

export function automaticCoreExercise(exercise: CatalogExercise): boolean {
  return !EXCLUDED.has(exercise.id) && (exercise.level !== 'Avanzado' || ADVANCED.has(exercise.id));
}

function pattern(exercise: CatalogExercise): string {
  if (['bear_hold', 'hollow_reg', 'plank_short'].includes(exercise.id)) return 'static-anti-extension';
  if (exercise.id === 'mountain_climber') return 'dynamic-plank';
  if (['dead_bug', 'heel_taps'].includes(exercise.id)) return 'supine-limb-control';
  if (exercise.id === 'bird_dog') return 'quadruped-limb-control';
  if (exercise.id === 'side_plank') return 'lateral-stability';
  if (exercise.id === 'pallof') return 'anti-rotation';
  if (['hanging_leg_raise', 'reverse_crunch', 'crunch', 'bicycle_crunch', 'mcgill'].includes(exercise.id)) return 'abdominal-flexion';
  return exercise.tags[0] ?? exercise.id;
}

/** Balance the requested levels while preserving the caller's usage ranking. */
export function selectCoreExercises(ranked: CatalogExercise[], amount: number): CatalogExercise[] {
  const eligible = ranked.filter(automaticCoreExercise);
  const selected: CatalogExercise[] = [];
  const choose = (level?: CatalogExercise['level']) => {
    const remaining = eligible.filter(exercise => !selected.includes(exercise) && (!level || exercise.level === level));
    const usedPatterns = new Set(selected.map(pattern));
    const next = remaining.find(exercise => !usedPatterns.has(pattern(exercise))) ?? remaining[0];
    if (next) selected.push(next);
  };
  for (const level of ['Avanzado', 'Progresivo', 'Progresivo', 'Inicial'] as const) {
    if (selected.length < amount) choose(level);
  }
  // Filters/mode can make the ideal distribution impossible. Fill only from
  // eligible choices; never override the mode, equipment or caller's filter.
  while (selected.length < amount) {
    const before = selected.length;
    choose();
    if (selected.length === before) break;
  }
  return selected;
}
