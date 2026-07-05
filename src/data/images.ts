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
};
