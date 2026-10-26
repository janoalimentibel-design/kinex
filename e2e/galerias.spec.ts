// Verificación visual de las galerías en viewport móvil: abre cada detalle,
// comprueba que las 3 fases cargan de verdad (naturalWidth > 0) y guarda la
// captura en verification/a3-fase2/ como evidencia.
import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const GALLERIES: [string, string, number?, string?][] = [
  ['Tibialis Raise', 'tibialis-v3', 3],
  ['Polea alta tras nuca / a la espalda', 'lat-pulldown-back', 3],
  ['Serratus Push-Up', 'serratus-pushup', 2],
  ['Chin-Up isométrica', 'chinup-isometric', 1],
  ['Isométrico de extensión', 'triceps-isometric', 1],
  ['Fondos asistidos', 'dips-assisted', 3],
  ['Rotaciones explosivas', 'rotations-explosive', 3],
  ['Sentadilla Sissy', 'sissy-squat', 3],
  ['Isométrico arriba de flexión', 'top-hold', 1],
  ['Hollow Hold regresado', 'hollow-regressed', 1],
  ['Curl isométrico con banda', 'curl-isometric', 1],
  ['Hang supino', 'supine-hang', 1],
  ['Toalla Hold / Grip Hold', 'towel-hold', 1],
  ['Flexiones', 'flexiones'],
  ['Dominadas estrictas', 'dominadas'],
  ['Step-Up bajo', 'step-up-bajo'],
  ['Dead Bug', 'dead-bug'],
  ['Bird Dog', 'bird-dog'],
  ['Wall Sit', 'wall-sit'],
  ['Balance a una pierna', 'balance-una-pierna'],
  ['Gemelos en máquina', 'gemelos-maquina'],
  ['Active Hang', 'active-hang', 1],
  ['Band Lat Pulldown', 'band-lat-pulldown'],
  ['Band Pull-Apart', 'band-pull-apart-espalda'],
  ['Sit-to-Stand', 'sit-to-stand'],
  ['Remo con banda', 'band-row'],
  ['Flexiones inclinadas', 'incline-pushup'],
  ['Caminata en cinta con inclinación', 'caminata-inclinada'],
  ['Remo unilateral con banda', 'one-arm-row'],
  ['Bicicleta estática', 'bicicleta-estatica'],
  ['Estocada hacia atrás asistida', 'lunge-back-assist'],
  ['Press con banda', 'band-press'],
  ['Remo con barra T', 'barbell-row'],
  ['Pullover en polea alta', 'cable-pullover'],
  ['Jalón de tríceps con barra recta', 'straight-bar-pressdown'],
  ['Elevación de piernas colgado', 'hanging-leg-raise'],
  ['Elíptico', 'eliptico'],
  ['Step-Up medio', 'step-medio'],
  ['Pike Push-Up', 'pike'],
  ['Rueda abdominal (Ab Wheel)', 'ab-wheel'],
  ['Remo en máquina (ergómetro)', 'rowing-erg'],
  ['Fondos en paralelas', 'parallel-dips'],
  ['Estocada estática corta', 'lunge-static'],
  ['Shoulder Taps', 'shoulder-taps'],
  ['Rotación externa con banda', 'external-rotation-v342'],
  ['Curl martillo con banda', 'hammer-band'],
  ['Extensión overhead con banda', 'overhead-triceps'],
  ['Estocada lateral', 'lunge-lateral'],
  ['Press cerrado con banda', 'band-close-press'],
  ['Wall Angels', 'wall-angels'],
  ['Elevación lateral con banda', 'lateral-raise-band'],
  ['Extensión de tríceps con banda', 'triceps-extension-band'],
  ['Kickback con banda', 'kickback-band'],
  ['Terminal Knee Extension con banda', 'tke'],
  ['Estocada caminando', 'lunge-walk'],
  ['Face Pull', 'face-pull-h'],
  ['Y-T-W', 'ytw'],
  ['McGill Curl-Up', 'mcgill-v342', 2],
  ['Remo supino con banda', 'supine-row-band'],
  ['Dominada escapular', 'scap-pull'],
  ['Push-Up con pausa', 'pause-pushup'],
  ['Dominadas supinas (Chin-Ups)', 'chinup'],
  ['Bear Hold', 'bear-hold'],
  ['Flexiones de tríceps brazos pegados', 'triceps-pushup'],
  ['Farmer Carry con mochila', 'farmer-carry'],
  ['Spanish Squat isométrico', 'spanish-squat'],
  ['Dead Hang', 'dead-hang', 1],
  ['Scapular Push-Up', 'scap-pushup-v2-v342', 2],
  ['Flexión excéntrica controlada', 'ecc-pushup'],
  ['Curl alterno con banda', 'alt-curl-band'],
  ['Suitcase Carry', 'suitcase-carry-v342'],
  ['Curl corto alta repetición', 'short-curl'],
  ['Extensión unilateral con banda', 'triceps-unilateral'],
  ['Press cerrado con banda', 'close-band-triceps', 3, 'Tríceps'],
  ['Band Pull-Apart', 'pull-apart-shoulders', 3, 'Hombro'],
  ['Jalón al pecho agarre supino', 'lat-pulldown-supine'],
  ["Extensión de cuádriceps en accesorio de banco", "bench-leg-extension"],
  ["Remo con mancuernas y pecho apoyado", "chest-supported-db-row", 2],
  ["Press de pecho con mancuernas en el suelo", "dumbbell-floor-press"],
  ["Press de banca declinado con mancuernas", "decline-db-press"],
  ["Apertura inversa con pecho apoyado", "incline-reverse-fly"],
  ["Curl de bíceps sentado en banco inclinado", "incline-db-curl"],
  ["Patada de tríceps con mancuerna y apoyo", "supported-db-kickback", 2],
  ['Pallof Press', 'pallof-press-v342'],
  ['Heel Taps', 'heel-taps-v342'],
  ["Crunch en banco abdominal inclinado", "decline-bench-crunch-v344", 2],
  ["Crunch en banco inclinado con brazos al frente", "decline-bench-reach-v344", 2],
  ["Sostén abdominal en banco inclinado", "decline-bench-hold-v344", 1],
  ["Elevación de talones de pie con apoyo", "standing-calf-raise-v343", 2],
];

const OUT = new URL('../verification/a3-fase2/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

for (const [name, slug, expectedShots = 3, group] of GALLERIES) {
  test(`galería de ${name}${group ? ' · ' + group : ''}: fases cargadas y captura guardada`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
    await page.locator('.search').fill(name);
    if (group) await page.locator('.filters').getByRole('button', { name: group, exact: true }).click();
    await page.locator('.libcard', { hasText: name }).first().click();

    const shots = page.locator('.lib-gallery .shot img');
    await expect(shots).toHaveCount(expectedShots);
    for (let i = 0; i < expectedShots; i++) {
      await expect(shots.nth(i)).toBeVisible();
      await expect.poll(
        () => shots.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        { message: `${name}: la fase ${i + 1} no cargó` },
      ).toBe(true);
    }
    await page.locator('.sheet').screenshot({ path: `${OUT}${slug}.png` });
  });
}
