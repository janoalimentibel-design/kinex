// Progresiones manuales en la tarjeta.
import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
}

async function setGroups(page: Page, combo: string) {
  await page.getByRole('button', { name: 'Cambiar grupos' }).click();
  await page.locator('.swap-item', { hasText: combo }).click();
}

test.beforeEach(({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
});

test('botón de progresión reemplaza el ejercicio por su variante más difícil', async ({ page }) => {
  await openApp(page);
  await setGroups(page, 'Pecho + Tríceps');
  // La selección automática rota según el historial; agregamos Flexiones para
  // probar la progresión sin depender del primer ejercicio sugerido del día.
  await page.locator('.grp-head', { hasText: 'Pecho' }).getByRole('button', { name: '+ ejercicio' }).click();
  await page.locator('.swap-item').filter({ has: page.locator('.nm', { hasText: /^Flexiones$/ }) }).click();
  const pushup = page.locator('.ex').filter({ has: page.locator('.nm', { hasText: /^Flexiones$/ }) });
  await pushup.locator('.ex-head').click();
  await expect(page.locator('.ex.open .nm', { hasText: 'Flexiones' })).toBeVisible();

  await page.locator('.ex.open .prog-btn', { hasText: 'Push-Up con pausa' }).click();
  await expect(page.locator('.ex .nm', { hasText: 'Push-Up con pausa' })).toBeVisible();
  await expect(page.locator('.ex', { hasText: 'Push-Up con pausa' }).locator('.badge', { hasText: 'cambio' })).toBeVisible();
});
