// Verificación visual de las galerías en viewport móvil: abre cada detalle,
// comprueba que las 3 fases cargan de verdad (naturalWidth > 0) y guarda la
// captura en verification/a3-fase2/ como evidencia.
import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const GALLERIES: [string, string, number?][] = [
  ['Flexiones', 'flexiones'],
  ['Dominadas estrictas', 'dominadas'],
  ['Step-Up bajo', 'step-up-bajo'],
  ['Dead Bug', 'dead-bug'],
  ['Bird Dog', 'bird-dog'],
  ['Wall Sit', 'wall-sit'],
  ['Balance a una pierna', 'balance-una-pierna'],
  ['Extensión de cuádriceps en máquina', 'extension-cuadriceps'],
  ['Gemelos en máquina', 'gemelos-maquina'],
  ['Active Hang', 'active-hang', 1],
  ['Band Lat Pulldown', 'band-lat-pulldown'],
  ['Band Pull-Apart', 'band-pull-apart-espalda'],
  ['Sit-to-Stand', 'sit-to-stand'],
  ['Remo con banda', 'band-row'],
  ['Flexiones inclinadas', 'incline-pushup'],
  ['Caminata en cinta con inclinación', 'caminata-inclinada'],
  ['Remo unilateral con banda', 'one-arm-row'],
  ['Flexiones con rodillas', 'knee-pushup'],
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
  ['Dominadas asistidas con banda', 'pullup-band'],
  ['Shoulder Taps', 'shoulder-taps'],
  ['Rotación externa con banda', 'external-rotation'],
  ['Curl martillo con banda', 'hammer-band'],
  ['Extensión overhead con banda', 'overhead-triceps'],
  ['Estocada lateral', 'lunge-lateral'],
  ['Press cerrado con banda', 'band-close-press'],
  ['Wall Angels', 'wall-angels'],
  ['Elevación lateral con banda', 'lateral-raise-band'],
  ['Extensión de tríceps con banda', 'triceps-extension-band'],
  ['Kickback con banda', 'kickback-band'],
];

const OUT = new URL('../verification/a3-fase2/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

for (const [name, slug, expectedShots = 3] of GALLERIES) {
  test(`galería de ${name}: 3 fases cargadas y captura guardada`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
    await page.locator('.search').fill(name);
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
