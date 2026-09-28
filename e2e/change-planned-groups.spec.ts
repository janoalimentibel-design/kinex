import { expect, test } from '@playwright/test';

test('published mobile routine allows every muscle choice and keeps old checks after reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-28T12:00:00') });
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByRole('button', { name: 'Cargar rutina revisada' }).click();
  await expect(page.locator('.program-title')).toContainText('Espalda + Bíceps');
  await page.locator('.ex .chk').first().click();
  await expect(page.locator('.proglab')).toHaveText(/^1 de 4 ejercicios/);
  await page.getByRole('button', { name: 'Cambiar grupos' }).click();
  await expect(page.locator('.grpchip')).toHaveCount(8);
  await page.getByRole('button', { name: 'Pecho', exact: true }).click();
  await page.getByRole('button', { name: 'Tríceps', exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.locator('.grp-head .gn')).toHaveText(['Pecho', 'Tríceps']);
  await expect(page.locator('.ex')).toHaveCount(4);
  await page.reload();
  await expect(page.locator('.grp-head .gn')).toHaveText(['Pecho', 'Tríceps']);
  await expect(page.locator('.ex')).toHaveCount(4);
  await page.getByRole('button', { name: 'Largo', exact: true }).click();
  await expect(page.locator('.ex')).toHaveCount(6);
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  await page.getByText('Ver ejercicios registrados', { exact: true }).click();
  await expect(page.locator('.hcard')).toContainText('Dominadas estrictas');
});
