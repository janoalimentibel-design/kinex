// Mapa de imágenes por ejercicio y fase.
// Los WebP se generan con `npm run images` desde los originales de assets-src/
// (archivados fuera del bundle). Validación: `npm run check:assets`.
// Rutas como literales a propósito: scripts/check-assets.mjs las parsea estáticamente.
export interface ExerciseImages {
  thumb: string;
  phases: { Inicio: string; Medio: string; Final: string };
  /** Los isométricos muestran una postura útil, no tres fotogramas artificiales. */
  display?: 'sequence' | 'hold';
}

export const REAL_IMAGES: Record<string, ExerciseImages> = {
  pushup: {
    thumb: './assets/exercises/pushup/thumb.webp',
    phases: {
      Inicio: './assets/exercises/pushup/inicio.webp',
      Medio: './assets/exercises/pushup/medio.webp',
      Final: './assets/exercises/pushup/final.webp',
    },
  },
  pullup: {
    thumb: './assets/exercises/pullup/thumb.webp',
    phases: {
      Inicio: './assets/exercises/pullup/inicio.webp',
      Medio: './assets/exercises/pullup/medio.webp',
      Final: './assets/exercises/pullup/final.webp',
    },
  },
  step_bajo: {
    thumb: './assets/exercises/step-up-bajo/thumb.webp',
    phases: {
      Inicio: './assets/exercises/step-up-bajo/inicio.webp',
      Medio: './assets/exercises/step-up-bajo/medio.webp',
      Final: './assets/exercises/step-up-bajo/final.webp',
    },
  },
  dead_bug: {
    thumb: './assets/exercises/dead-bug/thumb.webp',
    phases: {
      Inicio: './assets/exercises/dead-bug/inicio.webp',
      Medio: './assets/exercises/dead-bug/medio.webp',
      Final: './assets/exercises/dead-bug/final.webp',
    },
  },
  bird_dog: {
    thumb: './assets/exercises/bird-dog/thumb.webp',
    phases: {
      Inicio: './assets/exercises/bird-dog/inicio.webp',
      Medio: './assets/exercises/bird-dog/medio.webp',
      Final: './assets/exercises/bird-dog/final.webp',
    },
  },
  wall_sit: {
    thumb: './assets/exercises/wall-sit/thumb.webp',
    phases: {
      Inicio: './assets/exercises/wall-sit/inicio.webp',
      Medio: './assets/exercises/wall-sit/medio.webp',
      Final: './assets/exercises/wall-sit/final.webp',
    },
  },
  balance_1: {
    thumb: './assets/exercises/balance-una-pierna/thumb.webp',
    phases: {
      Inicio: './assets/exercises/balance-una-pierna/inicio.webp',
      Medio: './assets/exercises/balance-una-pierna/medio.webp',
      Final: './assets/exercises/balance-una-pierna/final.webp',
    },
  },
  leg_ext: {
    thumb: './assets/exercises/extension-cuadriceps/thumb.webp',
    phases: {
      Inicio: './assets/exercises/extension-cuadriceps/inicio.webp',
      Medio: './assets/exercises/extension-cuadriceps/medio.webp',
      Final: './assets/exercises/extension-cuadriceps/final.webp',
    },
  },
  calf_machine: {
    thumb: './assets/exercises/gemelos-maquina/thumb.webp',
    phases: {
      Inicio: './assets/exercises/gemelos-maquina/inicio.webp',
      Medio: './assets/exercises/gemelos-maquina/medio.webp',
      Final: './assets/exercises/gemelos-maquina/final.webp',
    },
  },
  active_hang: {
    display: 'hold',
    thumb: './assets/exercises/active-hang/thumb.webp',
    phases: {
      Inicio: './assets/exercises/active-hang/inicio.webp',
      Medio: './assets/exercises/active-hang/medio.webp',
      Final: './assets/exercises/active-hang/final.webp',
    },
  },
  band_pulldown: {
    thumb: './assets/exercises/band-lat-pulldown/thumb.webp',
    phases: {
      Inicio: './assets/exercises/band-lat-pulldown/inicio.webp',
      Medio: './assets/exercises/band-lat-pulldown/medio.webp',
      Final: './assets/exercises/band-lat-pulldown/final.webp',
    },
  },
  pull_apart_back: {
    thumb: './assets/exercises/band-pull-apart-espalda/thumb.webp',
    phases: {
      Inicio: './assets/exercises/band-pull-apart-espalda/inicio.webp',
      Medio: './assets/exercises/band-pull-apart-espalda/medio.webp',
      Final: './assets/exercises/band-pull-apart-espalda/final.webp',
    },
  },
  plank_short: {
    display: 'hold',
    thumb: './assets/exercises/plank-full-v2/thumb.webp',
    phases: {
      Inicio: './assets/exercises/plank-full-v2/inicio.webp',
      Medio: './assets/exercises/plank-full-v2/medio.webp',
      Final: './assets/exercises/plank-full-v2/final.webp',
    },
  },
  side_plank: {
    display: 'hold',
    thumb: './assets/exercises/side-plank-full-v2/thumb.webp',
    phases: {
      Inicio: './assets/exercises/side-plank-full-v2/inicio.webp',
      Medio: './assets/exercises/side-plank-full-v2/medio.webp',
      Final: './assets/exercises/side-plank-full-v2/final.webp',
    },
  },
  reverse_crunch: {
    thumb: './assets/exercises/reverse-crunch-v2/thumb.webp',
    phases: {
      Inicio: './assets/exercises/reverse-crunch-v2/inicio.webp',
      Medio: './assets/exercises/reverse-crunch-v2/medio.webp',
      Final: './assets/exercises/reverse-crunch-v2/final.webp',
    },
  },
  face_pull: {
    thumb: './assets/exercises/face-pull/thumb.webp',
    phases: {
      Inicio: './assets/exercises/face-pull/inicio.webp',
      Medio: './assets/exercises/face-pull/medio.webp',
      Final: './assets/exercises/face-pull/final.webp',
    },
  },
  band_sh_press: {
    thumb: './assets/exercises/band-sh-press/thumb.webp',
    phases: {
      Inicio: './assets/exercises/band-sh-press/inicio.webp',
      Medio: './assets/exercises/band-sh-press/medio.webp',
      Final: './assets/exercises/band-sh-press/final.webp',
    },
  },
  pallof: {
    thumb: './assets/exercises/pallof/thumb.webp',
    phases: {
      Inicio: './assets/exercises/pallof/inicio.webp',
      Medio: './assets/exercises/pallof/medio.webp',
      Final: './assets/exercises/pallof/final.webp',
    },
  },
  heel_taps: {
    thumb: './assets/exercises/heel-taps/thumb.webp',
    phases: {
      Inicio: './assets/exercises/heel-taps/inicio.webp',
      Medio: './assets/exercises/heel-taps/medio.webp',
      Final: './assets/exercises/heel-taps/final.webp',
    },
  },
  curl_band: {
    thumb: './assets/exercises/curl-band/thumb.webp',
    phases: {
      Inicio: './assets/exercises/curl-band/inicio.webp',
      Medio: './assets/exercises/curl-band/medio.webp',
      Final: './assets/exercises/curl-band/final.webp',
    },
  },
  pressdown_band: {
    thumb: './assets/exercises/pressdown-band/thumb.webp',
    phases: {
      Inicio: './assets/exercises/pressdown-band/inicio.webp',
      Medio: './assets/exercises/pressdown-band/medio.webp',
      Final: './assets/exercises/pressdown-band/final.webp',
    },
  },
  back_squat: {
    thumb: './assets/exercises/back-squat/thumb.webp',
    phases: {
      Inicio: './assets/exercises/back-squat/inicio.webp',
      Medio: './assets/exercises/back-squat/medio.webp',
      Final: './assets/exercises/back-squat/final.webp',
    },
  },
  hip_thrust: {
    thumb: './assets/exercises/hip-thrust/thumb.webp',
    phases: {
      Inicio: './assets/exercises/hip-thrust/inicio.webp',
      Medio: './assets/exercises/hip-thrust/medio.webp',
      Final: './assets/exercises/hip-thrust/final.webp',
    },
  },
  romanian_deadlift: {
    thumb: './assets/exercises/romanian-deadlift/thumb.webp',
    phases: {
      Inicio: './assets/exercises/romanian-deadlift/inicio.webp',
      Medio: './assets/exercises/romanian-deadlift/medio.webp',
      Final: './assets/exercises/romanian-deadlift/final.webp',
    },
  },
  goblet_squat: {
    thumb: './assets/exercises/goblet-squat/thumb.webp',
    phases: {
      Inicio: './assets/exercises/goblet-squat/inicio.webp',
      Medio: './assets/exercises/goblet-squat/medio.webp',
      Final: './assets/exercises/goblet-squat/final.webp',
    },
  },
  leg_press_incline: {
    thumb: './assets/exercises/leg-press-incline/thumb.webp',
    phases: {
      Inicio: './assets/exercises/leg-press-incline/inicio.webp',
      Medio: './assets/exercises/leg-press-incline/medio.webp',
      Final: './assets/exercises/leg-press-incline/final.webp',
    },
  },
  deadlift_conventional: {
    thumb: './assets/exercises/deadlift-conventional/thumb.webp',
    phases: {
      Inicio: './assets/exercises/deadlift-conventional/inicio.webp',
      Medio: './assets/exercises/deadlift-conventional/medio.webp',
      Final: './assets/exercises/deadlift-conventional/final.webp',
    },
  },
  bulgarian_split_squat: {
    thumb: './assets/exercises/bulgarian-split-squat/thumb.webp',
    phases: {
      Inicio: './assets/exercises/bulgarian-split-squat/inicio.webp',
      Medio: './assets/exercises/bulgarian-split-squat/medio.webp',
      Final: './assets/exercises/bulgarian-split-squat/final.webp',
    },
  },
  reverse_lunge_db: {
    thumb: './assets/exercises/reverse-lunge-db/thumb.webp',
    phases: {
      Inicio: './assets/exercises/reverse-lunge-db/inicio.webp',
      Medio: './assets/exercises/reverse-lunge-db/medio.webp',
      Final: './assets/exercises/reverse-lunge-db/final.webp',
    },
  },
  bench_press: {
    thumb: './assets/exercises/bench-press/thumb.webp',
    phases: {
      Inicio: './assets/exercises/bench-press/inicio.webp',
      Medio: './assets/exercises/bench-press/medio.webp',
      Final: './assets/exercises/bench-press/final.webp',
    },
  },
  dumbbell_row: {
    thumb: './assets/exercises/one-arm-row-db/thumb.webp',
    phases: {
      Inicio: './assets/exercises/one-arm-row-db/inicio.webp',
      Medio: './assets/exercises/one-arm-row-db/medio.webp',
      Final: './assets/exercises/one-arm-row-db/final.webp',
    },
  },
  dumbbell_shoulder_press: {
    thumb: './assets/exercises/dumbbell-shoulder-press/thumb.webp',
    phases: {
      Inicio: './assets/exercises/dumbbell-shoulder-press/inicio.webp',
      Medio: './assets/exercises/dumbbell-shoulder-press/medio.webp',
      Final: './assets/exercises/dumbbell-shoulder-press/final.webp',
    },
  },
  incline_bench_press: {
    thumb: './assets/exercises/incline-bench-press/thumb.webp',
    phases: {
      Inicio: './assets/exercises/incline-bench-press/inicio.webp',
      Medio: './assets/exercises/incline-bench-press/medio.webp',
      Final: './assets/exercises/incline-bench-press/final.webp',
    },
  },
  dumbbell_fly: {
    thumb: './assets/exercises/dumbbell-fly/thumb.webp',
    phases: {
      Inicio: './assets/exercises/dumbbell-fly/inicio.webp',
      Medio: './assets/exercises/dumbbell-fly/medio.webp',
      Final: './assets/exercises/dumbbell-fly/final.webp',
    },
  },
  crunch: {
    thumb: './assets/exercises/crunch/thumb.webp',
    phases: {
      Inicio: './assets/exercises/crunch/inicio.webp',
      Medio: './assets/exercises/crunch/medio.webp',
      Final: './assets/exercises/crunch/final.webp',
    },
  },
  russian_twist: {
    thumb: './assets/exercises/russian-twist/thumb.webp',
    phases: {
      Inicio: './assets/exercises/russian-twist/inicio.webp',
      Medio: './assets/exercises/russian-twist/medio.webp',
      Final: './assets/exercises/russian-twist/final.webp',
    },
  },
  bicycle_crunch: {
    thumb: './assets/exercises/bicycle-crunch/thumb.webp',
    phases: {
      Inicio: './assets/exercises/bicycle-crunch/inicio.webp',
      Medio: './assets/exercises/bicycle-crunch/medio.webp',
      Final: './assets/exercises/bicycle-crunch/final.webp',
    },
  },
  mountain_climber: {
    thumb: './assets/exercises/mountain-climber/thumb.webp',
    phases: {
      Inicio: './assets/exercises/mountain-climber/inicio.webp',
      Medio: './assets/exercises/mountain-climber/medio.webp',
      Final: './assets/exercises/mountain-climber/final.webp',
    },
  },
  burpee: {
    thumb: './assets/exercises/burpee/thumb.webp',
    phases: {
      Inicio: './assets/exercises/burpee/inicio.webp',
      Medio: './assets/exercises/burpee/medio.webp',
      Final: './assets/exercises/burpee/final.webp',
    },
  },
  jumping_jacks: {
    thumb: './assets/exercises/jumping-jacks/thumb.webp',
    phases: {
      Inicio: './assets/exercises/jumping-jacks/inicio.webp',
      Medio: './assets/exercises/jumping-jacks/medio.webp',
      Final: './assets/exercises/jumping-jacks/final.webp',
    },
  },
  jump_rope: {
    thumb: './assets/exercises/jump-rope/thumb.webp',
    phases: {
      Inicio: './assets/exercises/jump-rope/inicio.webp',
      Medio: './assets/exercises/jump-rope/medio.webp',
      Final: './assets/exercises/jump-rope/final.webp',
    },
  },
  lat_pulldown_chest: {
    thumb: './assets/exercises/lat-pulldown-chest/thumb.webp',
    phases: {
      Inicio: './assets/exercises/lat-pulldown-chest/inicio.webp',
      Medio: './assets/exercises/lat-pulldown-chest/medio.webp',
      Final: './assets/exercises/lat-pulldown-chest/final.webp',
    },
  },
  seated_row_machine: {
    thumb: './assets/exercises/seated-row-machine/thumb.webp',
    phases: {
      Inicio: './assets/exercises/seated-row-machine/inicio.webp',
      Medio: './assets/exercises/seated-row-machine/medio.webp',
      Final: './assets/exercises/seated-row-machine/final.webp',
    },
  },
  pec_deck: {
    thumb: './assets/exercises/pec-deck/thumb.webp',
    phases: {
      Inicio: './assets/exercises/pec-deck/inicio.webp',
      Medio: './assets/exercises/pec-deck/medio.webp',
      Final: './assets/exercises/pec-deck/final.webp',
    },
  },
  seated_leg_curl: {
    thumb: './assets/exercises/seated-leg-curl/thumb.webp',
    phases: {
      Inicio: './assets/exercises/seated-leg-curl/inicio.webp',
      Medio: './assets/exercises/seated-leg-curl/medio.webp',
      Final: './assets/exercises/seated-leg-curl/final.webp',
    },
  },
  lying_leg_curl: {
    thumb: './assets/exercises/lying-leg-curl/thumb.webp',
    phases: {
      Inicio: './assets/exercises/lying-leg-curl/inicio.webp',
      Medio: './assets/exercises/lying-leg-curl/medio.webp',
      Final: './assets/exercises/lying-leg-curl/final.webp',
    },
  },
  front_squat: {
    thumb: './assets/exercises/front-squat/thumb.webp',
    phases: {
      Inicio: './assets/exercises/front-squat/inicio.webp',
      Medio: './assets/exercises/front-squat/medio.webp',
      Final: './assets/exercises/front-squat/final.webp',
    },
  },
  hack_squat: {
    thumb: './assets/exercises/hack-squat/thumb.webp',
    phases: {
      Inicio: './assets/exercises/hack-squat/inicio.webp',
      Medio: './assets/exercises/hack-squat/medio.webp',
      Final: './assets/exercises/hack-squat/final.webp',
    },
  },
  cable_crossover: {
    thumb: './assets/exercises/cable-crossover/thumb.webp',
    phases: {
      Inicio: './assets/exercises/cable-crossover/inicio.webp',
      Medio: './assets/exercises/cable-crossover/medio.webp',
      Final: './assets/exercises/cable-crossover/final.webp',
    },
  },
  barbell_military_press: {
    thumb: './assets/exercises/barbell-military-press/thumb.webp',
    phases: {
      Inicio: './assets/exercises/barbell-military-press/inicio.webp',
      Medio: './assets/exercises/barbell-military-press/medio.webp',
      Final: './assets/exercises/barbell-military-press/final.webp',
    },
  },
  lateral_raise_db: {
    thumb: './assets/exercises/lateral-raise-db/thumb.webp',
    phases: {
      Inicio: './assets/exercises/lateral-raise-db/inicio.webp',
      Medio: './assets/exercises/lateral-raise-db/medio.webp',
      Final: './assets/exercises/lateral-raise-db/final.webp',
    },
  },
  dumbbell_curl: {
    thumb: './assets/exercises/dumbbell-curl/thumb.webp',
    phases: {
      Inicio: './assets/exercises/dumbbell-curl/inicio.webp',
      Medio: './assets/exercises/dumbbell-curl/medio.webp',
      Final: './assets/exercises/dumbbell-curl/final.webp',
    },
  },
  rope_pressdown: {
    thumb: './assets/exercises/rope-pressdown/thumb.webp',
    phases: {
      Inicio: './assets/exercises/rope-pressdown/inicio.webp',
      Medio: './assets/exercises/rope-pressdown/medio.webp',
      Final: './assets/exercises/rope-pressdown/final.webp',
    },
  },
  hammer_curl_db: {
    thumb: './assets/exercises/hammer-curl-db/thumb.webp',
    phases: {
      Inicio: './assets/exercises/hammer-curl-db/inicio.webp',
      Medio: './assets/exercises/hammer-curl-db/medio.webp',
      Final: './assets/exercises/hammer-curl-db/final.webp',
    },
  },
  bench_triceps_dip: {
    thumb: './assets/exercises/bench-triceps-dip/thumb.webp',
    phases: {
      Inicio: './assets/exercises/bench-triceps-dip/inicio.webp',
      Medio: './assets/exercises/bench-triceps-dip/medio.webp',
      Final: './assets/exercises/bench-triceps-dip/final.webp',
    },
  },
  cable_glute_kickback: {
    thumb: './assets/exercises/cable-glute-kickback/thumb.webp',
    phases: {
      Inicio: './assets/exercises/cable-glute-kickback/inicio.webp',
      Medio: './assets/exercises/cable-glute-kickback/medio.webp',
      Final: './assets/exercises/cable-glute-kickback/final.webp',
    },
  },
  glute_bridge: {
    thumb: './assets/exercises/glute-bridge/thumb.webp',
    phases: {
      Inicio: './assets/exercises/glute-bridge/inicio.webp',
      Medio: './assets/exercises/glute-bridge/medio.webp',
      Final: './assets/exercises/glute-bridge/final.webp',
    },
  },
  cable_low_row: {
    thumb: './assets/exercises/cable-low-row/thumb.webp',
    phases: {
      Inicio: './assets/exercises/cable-low-row/inicio.webp',
      Medio: './assets/exercises/cable-low-row/medio.webp',
      Final: './assets/exercises/cable-low-row/final.webp',
    },
  },
  french_press: {
    thumb: './assets/exercises/french-press/thumb.webp',
    phases: {
      Inicio: './assets/exercises/french-press/inicio.webp',
      Medio: './assets/exercises/french-press/medio.webp',
      Final: './assets/exercises/french-press/final.webp',
    },
  },
  barbell_curl: {
    thumb: './assets/exercises/barbell-curl/thumb.webp',
    phases: {
      Inicio: './assets/exercises/barbell-curl/inicio.webp',
      Medio: './assets/exercises/barbell-curl/medio.webp',
      Final: './assets/exercises/barbell-curl/final.webp',
    },
  },
  cable_curl: {
    thumb: './assets/exercises/cable-curl/thumb.webp',
    phases: {
      Inicio: './assets/exercises/cable-curl/inicio.webp',
      Medio: './assets/exercises/cable-curl/medio.webp',
      Final: './assets/exercises/cable-curl/final.webp',
    },
  },
  preacher_curl: {
    thumb: './assets/exercises/preacher-curl/thumb.webp',
    phases: {
      Inicio: './assets/exercises/preacher-curl/inicio.webp',
      Medio: './assets/exercises/preacher-curl/medio.webp',
      Final: './assets/exercises/preacher-curl/final.webp',
    },
  },
  overhead_triceps_db: {
    thumb: './assets/exercises/overhead-triceps-db/thumb.webp',
    phases: {
      Inicio: './assets/exercises/overhead-triceps-db/inicio.webp',
      Medio: './assets/exercises/overhead-triceps-db/medio.webp',
      Final: './assets/exercises/overhead-triceps-db/final.webp',
    },
  },
  sumo_deadlift: {
    thumb: './assets/exercises/sumo-deadlift/thumb.webp',
    phases: {
      Inicio: './assets/exercises/sumo-deadlift/inicio.webp',
      Medio: './assets/exercises/sumo-deadlift/medio.webp',
      Final: './assets/exercises/sumo-deadlift/final.webp',
    },
  },
  good_morning: {
    thumb: './assets/exercises/good-morning/thumb.webp',
    phases: {
      Inicio: './assets/exercises/good-morning/inicio.webp',
      Medio: './assets/exercises/good-morning/medio.webp',
      Final: './assets/exercises/good-morning/final.webp',
    },
  },
  hip_abduction_machine: {
    thumb: './assets/exercises/hip-abduction-machine/thumb.webp',
    phases: {
      Inicio: './assets/exercises/hip-abduction-machine/inicio.webp',
      Medio: './assets/exercises/hip-abduction-machine/medio.webp',
      Final: './assets/exercises/hip-abduction-machine/final.webp',
    },
  },
  dumbbell_lunge: {
    thumb: './assets/exercises/dumbbell-lunge/thumb.webp',
    phases: {
      Inicio: './assets/exercises/dumbbell-lunge/inicio.webp',
      Medio: './assets/exercises/dumbbell-lunge/medio.webp',
      Final: './assets/exercises/dumbbell-lunge/final.webp',
    },
  },
  sit_to_stand: {
    thumb: './assets/exercises/sit-to-stand/thumb.webp',
    phases: {
      Inicio: './assets/exercises/sit-to-stand/inicio.webp',
      Medio: './assets/exercises/sit-to-stand/medio.webp',
      Final: './assets/exercises/sit-to-stand/final.webp',
    },
  },
  band_row: {
    thumb: './assets/exercises/band-row/thumb.webp',
    phases: {
      Inicio: './assets/exercises/band-row/inicio.webp',
      Medio: './assets/exercises/band-row/medio.webp',
      Final: './assets/exercises/band-row/final.webp',
    },
  },
  incline_pushup: {
    thumb: './assets/exercises/incline-pushup/thumb.webp',
    phases: {
      Inicio: './assets/exercises/incline-pushup/inicio.webp',
      Medio: './assets/exercises/incline-pushup/medio.webp',
      Final: './assets/exercises/incline-pushup/final.webp',
    },
  },
  caminata_inclinada: {
    thumb: './assets/exercises/caminata-inclinada/thumb.webp',
    phases: {
      Inicio: './assets/exercises/caminata-inclinada/inicio.webp',
      Medio: './assets/exercises/caminata-inclinada/medio.webp',
      Final: './assets/exercises/caminata-inclinada/final.webp',
    },
  },
  one_arm_row: {
    thumb: './assets/exercises/one-arm-row/thumb.webp',
    phases: {
      Inicio: './assets/exercises/one-arm-row/inicio.webp',
      Medio: './assets/exercises/one-arm-row/medio.webp',
      Final: './assets/exercises/one-arm-row/final.webp',
    },
  },
  knee_pushup: {
    thumb: './assets/exercises/knee-pushup/thumb.webp',
    phases: {
      Inicio: './assets/exercises/knee-pushup/inicio.webp',
      Medio: './assets/exercises/knee-pushup/medio.webp',
      Final: './assets/exercises/knee-pushup/final.webp',
    },
  },
  bicicleta_estatica: {
    thumb: './assets/exercises/bicicleta-estatica/thumb.webp',
    phases: {
      Inicio: './assets/exercises/bicicleta-estatica/inicio.webp',
      Medio: './assets/exercises/bicicleta-estatica/medio.webp',
      Final: './assets/exercises/bicicleta-estatica/final.webp',
    },
  },
  lunge_back_assist: {
    thumb: './assets/exercises/lunge-back-assist/thumb.webp',
    phases: {
      Inicio: './assets/exercises/lunge-back-assist/inicio.webp',
      Medio: './assets/exercises/lunge-back-assist/medio.webp',
      Final: './assets/exercises/lunge-back-assist/final.webp',
    },
  },
  band_press: {
    thumb: './assets/exercises/band-press/thumb.webp',
    phases: {
      Inicio: './assets/exercises/band-press/inicio.webp',
      Medio: './assets/exercises/band-press/medio.webp',
      Final: './assets/exercises/band-press/final.webp',
    },
  },
  barbell_row: {
    thumb: './assets/exercises/barbell-row/thumb.webp',
    phases: {
      Inicio: './assets/exercises/barbell-row/inicio.webp',
      Medio: './assets/exercises/barbell-row/medio.webp',
      Final: './assets/exercises/barbell-row/final.webp',
    },
  },
  cable_pullover: {
    thumb: './assets/exercises/cable-pullover/thumb.webp',
    phases: {
      Inicio: './assets/exercises/cable-pullover/inicio.webp',
      Medio: './assets/exercises/cable-pullover/medio.webp',
      Final: './assets/exercises/cable-pullover/final.webp',
    },
  },
  straight_bar_pressdown: {
    thumb: './assets/exercises/straight-bar-pressdown/thumb.webp',
    phases: {
      Inicio: './assets/exercises/straight-bar-pressdown/inicio.webp',
      Medio: './assets/exercises/straight-bar-pressdown/medio.webp',
      Final: './assets/exercises/straight-bar-pressdown/final.webp',
    },
  },
  hanging_leg_raise: {
    thumb: './assets/exercises/hanging-leg-raise/thumb.webp',
    phases: {
      Inicio: './assets/exercises/hanging-leg-raise/inicio.webp',
      Medio: './assets/exercises/hanging-leg-raise/medio.webp',
      Final: './assets/exercises/hanging-leg-raise/final.webp',
    },
  },
  eliptico: {
    thumb: './assets/exercises/eliptico/thumb.webp',
    phases: {
      Inicio: './assets/exercises/eliptico/inicio.webp',
      Medio: './assets/exercises/eliptico/medio.webp',
      Final: './assets/exercises/eliptico/final.webp',
    },
  },
  step_medio: {
    thumb: './assets/exercises/step-medio/thumb.webp',
    phases: {
      Inicio: './assets/exercises/step-medio/inicio.webp',
      Medio: './assets/exercises/step-medio/medio.webp',
      Final: './assets/exercises/step-medio/final.webp',
    },
  },
  pike: {
    thumb: './assets/exercises/pike/thumb.webp',
    phases: {
      Inicio: './assets/exercises/pike/inicio.webp',
      Medio: './assets/exercises/pike/medio.webp',
      Final: './assets/exercises/pike/final.webp',
    },
  },
  ab_wheel: {
    thumb: './assets/exercises/ab-wheel/thumb.webp',
    phases: {
      Inicio: './assets/exercises/ab-wheel/inicio.webp',
      Medio: './assets/exercises/ab-wheel/medio.webp',
      Final: './assets/exercises/ab-wheel/final.webp',
    },
  },
  rowing_erg: {
    thumb: './assets/exercises/rowing-erg/thumb.webp',
    phases: {
      Inicio: './assets/exercises/rowing-erg/inicio.webp',
      Medio: './assets/exercises/rowing-erg/medio.webp',
      Final: './assets/exercises/rowing-erg/final.webp',
    },
  },
  parallel_dips: {
    thumb: './assets/exercises/parallel-dips/thumb.webp',
    phases: {
      Inicio: './assets/exercises/parallel-dips/inicio.webp',
      Medio: './assets/exercises/parallel-dips/medio.webp',
      Final: './assets/exercises/parallel-dips/final.webp',
    },
  },
};
