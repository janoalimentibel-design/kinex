// Verificación visual de las 6 galerías en viewport móvil: abre cada detalle,
// comprueba que las 3 fases cargan de verdad (naturalWidth > 0) y guarda la
// captura en verification/a3-fase2/ como evidencia.
import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const GALLERIES: [string, string][] = [
  ['Flexiones', 'flexiones'],
  ['Dominadas estrictas', 'dominadas'],
  ['Step-Up bajo', 'step-up-bajo'],
  ['Dead Bug', 'dead-bug'],
  ['Bird Dog', 'bird-dog'],
  ['Wall Sit', 'wall-sit'],
];

const OUT = new URL('../verification/a3-fase2/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

for (const [name, slug] of GALLERIES) {
  test(`galería de ${name}: 3 fases cargadas y captura guardada`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
    await page.locator('.search').fill(name);
    await page.locator('.libcard', { hasText: name }).first().click();

    const shots = page.locator('.lib-gallery .shot img');
    await expect(shots).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(shots.nth(i)).toBeVisible();
      const loaded = await shots.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(loaded, `${name}: la fase ${i + 1} no cargó`).toBe(true);
    }
    await page.locator('.sheet').screenshot({ path: `${OUT}${slug}.png` });
  });
}
