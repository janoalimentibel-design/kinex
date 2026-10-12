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
  await page.getByLabel('Cargar código desde archivo').setInputFiles({ name: 'CONEXION-KINEX.txt', mimeType: 'text/plain', buffer: Buffer.from(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) })) });
  await expect(page.getByText('Código cargado. Tocá Conectar y enviar mis datos.', { exact: true })).toBeVisible();
  expect(received).toBe('');
  await page.getByRole('button', { name: 'Conectar y enviar mis datos' }).click();
  await expect(page.getByText(/^Enviado a Drive:/)).toBeVisible();
  expect(JSON.parse(JSON.parse(received).payload).data.profile.goals).toBe('Objetivo de prueba');
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await expect(page.getByText(/Desconectado\./)).toBeVisible();
});

test('completion offers sending, never claims upload while disconnected, hides on undo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.ex .chk').first()).toBeVisible();
  await expect(page.getByTestId('training-complete')).toHaveCount(0);
  const checks = page.locator('.ex .chk');
  for (let i = 0; i < await checks.count(); i++) await checks.nth(i).click();
  const banner = page.getByTestId('training-complete');
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Enviar datos', exact: true }).click();
  await expect(banner).toContainText('Sin conectar:');
  await expect(banner).not.toContainText('Enviado a Drive:');
  await checks.first().click();
  await expect(banner).toHaveCount(0);
});

test('failed upload remains pending and a manual retry sends the completed session', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  let fail = true;
  let snapshot: { data: { sessions: { completed: Record<string, boolean> }[] } } | undefined;
  await page.route('https://script.google.com/macros/s/test/exec', async route => {
    if (fail) { await route.abort(); return; }
    snapshot = JSON.parse(JSON.parse(route.request().postData()!).payload);
    await route.fulfill({ json: { ok: true, version: 1 } });
  });
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos' }).click();
  await expect(page.getByText(/^Pendiente: no se confirmó/)).toBeVisible();
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
  const checks = page.locator('.ex .chk');
  for (let i = 0; i < await checks.count(); i++) await checks.nth(i).click();
  const banner = page.getByTestId('training-complete');
  await expect(banner).toBeVisible();
  fail = false;
  await banner.getByRole('button', { name: 'Enviar datos', exact: true }).click();
  await expect(banner).toContainText('Enviado a Drive:');
  expect(snapshot?.data.sessions.some(s => Object.values(s.completed).length > 0 && Object.values(s.completed).every(Boolean))).toBe(true);
});
