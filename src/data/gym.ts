/** Equipment identified in supplied photos; unconfirmed machines remain manual. */
export const GYM_EQUIPMENT = [
  'Mancuernas y discos', 'Barras rectas y EZ', 'Banco regulable con accesorio de piernas',
  'Estación con barra guiada', 'Polea alta y baja con barra, cuerda y agarre de remo',
  'Aperturas de pecho en estación', 'Banco abdominal con rodillos',
  'Bandas elásticas y peso corporal', 'Bicicleta estática', 'Remo ergómetro confirmado por el usuario',
];
// Retain catalog records and assets so old sessions/imports remain readable.
export const RETIRED_EXERCISES = new Set(['knee_pushup', 'diamond_reg', 'diamond_tri', 'bracing_90', 'pullup_band', 'chin_assist', 'leg_ext', 'bench_crunch']);
export const UNCONFIRMED_EQUIPMENT = new Set([
  'leg_ext', 'calf_machine', 'hack_squat', 'leg_press_incline', 'seated_leg_curl', 'lying_leg_curl',
  'hip_abduction_machine', 'seated_row_machine', 'barbell_row', 'cable_crossover',
  'cable_glute_kickback', 'step_bajo', 'step_medio', 'caminata_inclinada', 'eliptico', 'decline_db_press',
]);
// Bench flexion awaits the user's clinical limits; keep it available as an explained option.
export const MANUAL_ONLY_EXERCISES = new Set(['bench_crunch', 'decline_bench_crunch', 'decline_bench_reach', 'decline_bench_hold']);
export function automaticInGym(id: string): boolean {
  return !RETIRED_EXERCISES.has(id) && !UNCONFIRMED_EQUIPMENT.has(id) && !MANUAL_ONLY_EXERCISES.has(id);
}
