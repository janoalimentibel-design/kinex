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
  await page.locator('.ex .ex-head').first().click(); // Flexiones
  await expect(page.locator('.ex.open .nm').first()).toHaveText('Flexiones');

  await page.locator('.ex.open .prog-btn', { hasText: 'Push-Up con pausa' }).click();
  await expect(page.locator('.ex .nm', { hasText: 'Push-Up con pausa' })).toBeVisible();
  await expect(page.locator('.ex', { hasText: 'Push-Up con pausa' }).locator('.badge', { hasText: 'cambio' })).toBeVisible();
});
