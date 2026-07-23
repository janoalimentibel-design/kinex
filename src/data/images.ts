// Mapa de imágenes por ejercicio y fase.
// Los WebP se generan con `npm run images` desde los originales de assets-src/
// (archivados fuera del bundle). Validación: `npm run check:assets`.
// Rutas como literales a propósito: scripts/check-assets.mjs las parsea estáticamente.
export interface ExerciseImages {
  thumb: string;
  phases: { Inicio: string; Medio: string; Final: string };
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
    thumb: './assets/exercises/plank-short/thumb.webp',
    phases: {
      Inicio: './assets/exercises/plank-short/inicio.webp',
      Medio: './assets/exercises/plank-short/medio.webp',
      Final: './assets/exercises/plank-short/final.webp',
    },
  },
  side_plank: {
    thumb: './assets/exercises/side-plank/thumb.webp',
    phases: {
      Inicio: './assets/exercises/side-plank/inicio.webp',
      Medio: './assets/exercises/side-plank/medio.webp',
      Final: './assets/exercises/side-plank/final.webp',
    },
  },
  reverse_crunch: {
    thumb: './assets/exercises/reverse-crunch/thumb.webp',
    phases: {
      Inicio: './assets/exercises/reverse-crunch/inicio.webp',
      Medio: './assets/exercises/reverse-crunch/medio.webp',
      Final: './assets/exercises/reverse-crunch/final.webp',
    },
  },
};
