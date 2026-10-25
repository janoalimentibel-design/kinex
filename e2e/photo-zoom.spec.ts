import { expect, test } from '@playwright/test';

test('las fotos abren ampliadas y cierran conservando el detalle del ejercicio', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill('Pallof');
  await page.locator('.libcard', { hasText: 'Pallof' }).first().click();
  await page.getByRole('button', { name: /Ampliar .*Pallof.*Inicio/ }).click();
  const dialog = page.getByRole('dialog', { name: /Pallof.*Inicio ampliada/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.zoom-photo')).toBeVisible();
  await expect(dialog).toContainText('pecho');
  await dialog.getByRole('button', { name: 'Cerrar foto' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.lib-gallery')).toBeVisible();
  await page.getByRole('button', { name: /Ampliar .*Pallof.*Final/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.photo-dialog[open]')).toHaveCount(0);
  await expect(page.locator('.lib-gallery')).toBeVisible();
});

test('la biblioteca retira ejercicios descartados y ofrece las incorporaciones y variantes vigentes', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  for (const name of ['Flexiones con rodillas', 'Respiración 90/90', 'Dominadas asistidas con banda', 'Abdominal corto en banco con rodillos']) {
    await page.locator('.search').fill(name);
    await expect(page.locator('.libcard')).toHaveCount(0);
  }
  for (const name of ['Extensión de cuádriceps en accesorio de banco', 'Remo con mancuernas y pecho apoyado', 'Press de pecho con mancuernas en el suelo', 'Press de banca declinado con mancuernas', 'Apertura inversa con pecho apoyado', 'Curl de bíceps sentado en banco inclinado', 'Patada de tríceps con mancuerna y apoyo', 'Crunch en banco abdominal inclinado', 'Crunch en banco inclinado con brazos al frente', 'Sostén abdominal en banco inclinado', 'Elevación de talones de pie con apoyo']) {
    await page.locator('.search').fill(name);
    await expect(page.locator('.libcard')).toHaveCount(1);
  }
});
