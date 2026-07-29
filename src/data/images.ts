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
};
