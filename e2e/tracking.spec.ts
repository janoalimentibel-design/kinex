import { expect, test } from '@playwright/test';
test('profile persists after reload and sync only acknowledges confirmed uploads', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Objetivos y deportes', { exact: true }).fill('Objetivo de prueba');
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click();
  await expect(page.getByText('Perfil guardado en este dispositivo.', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await expect(page.getByLabel('Objetivos y deportes', { exact: true })).toHaveValue('Objetivo de prueba');
  let received = '';
  await page.route('https://script.google.com/macros/s/test/exec', async route => {
    received = route.request().postData() ?? '';
    await route.fulfill({ json: { ok: true, version: 1 }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos' }).click();
  await expect(page.getByText(/^Sincronizado:/)).toBeVisible();
  expect(JSON.parse(JSON.parse(received).payload).data.profile.goals).toBe('Objetivo de prueba');
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await expect(page.getByText(/Desconectado\./)).toBeVisible();
});
