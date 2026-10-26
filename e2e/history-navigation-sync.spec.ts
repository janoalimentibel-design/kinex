import { expect, test } from '@playwright/test';

// Keep mocked uploads inside Playwright; active service workers can bypass page.route.
test.use({ serviceWorkers: 'block' });

test('desde historial se recorren semanas, se busca una fecha y se vuelve a hoy sin recargar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.clock.install({ time: new Date('2026-10-26T12:00:00') });
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  await page.locator('.cal-day').filter({ hasText: /^19$/ }).click();
  await expect(page.locator('.dlabel')).toContainText('19 OCT');
  await page.getByRole('button', { name: 'Semana siguiente', exact: true }).click();
  await expect(page.locator('.dlabel')).toContainText('26 OCT');
  await page.getByRole('button', { name: 'Semana siguiente', exact: true }).click();
  await expect(page.locator('.dlabel')).toContainText('2 NOV');
  await page.getByRole('button', { name: 'Semana anterior', exact: true }).click();
  await expect(page.locator('.dlabel')).toContainText('26 OCT');
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await expect(page.locator('.dlabel')).toContainText('15 SEP');
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(page.locator('.dlabel')).toContainText('26 OCT');
  await expect(page.locator('.day.active')).toContainText('26');
  expect(await page.locator('.weekwrap').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  for (const label of ['Semana anterior', 'Semana siguiente', 'Buscar día']) {
    await expect(page.getByLabel(label, { exact: true })).toBeInViewport();
  }
});

test('editar un día enviado requiere confirmar la sobrescritura y cancelar conserva la copia remota', async ({ page }) => {
  let calls = 0;
  let latestPayload = '';
  await page.route('https://script.google.com/macros/s/test/exec', async route => {
    calls++;
    latestPayload = JSON.parse(route.request().postData()!).payload;
    await route.fulfill({ json: { ok: true, version: calls }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Marcar hecha' }).click();
  await page.locator('.sheet .field', { hasText: 'Notas' }).locator('textarea').fill('Registro inicial');
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos', exact: true }).click();
  await expect(page.getByTestId('sync-feedback')).toContainText('Enviado a Drive:');
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
  await page.getByRole('button', { name: 'Marcar hecha' }).click();
  await page.locator('.sheet .field', { hasText: 'Notas' }).locator('textarea').fill('Registro corregido');
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  const before = calls;
  await expect(page.getByTestId('sync-feedback')).toContainText(/pendiente/i);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByTestId('sync-feedback')).toContainText(/pendiente/i);
  expect(calls).toBe(before);
  expect(latestPayload).toContain('Registro inicial');
  let acceptReplacement = false;
  let confirmations = 0;
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('ya se envió');
    if (acceptReplacement) await dialog.accept();
    else await dialog.dismiss();
    confirmations++;
  });
  const retry = page.getByRole('button', { name: 'Reintentar envío', exact: true });
  await expect(retry).toBeEnabled();
  await retry.click();
  await expect.poll(() => confirmations).toBe(1);
  await expect(retry).toBeEnabled();
  expect(calls).toBe(before);
  acceptReplacement = true;
  await retry.click();
  await expect.poll(() => confirmations).toBe(2);
  await expect.poll(() => calls).toBe(before + 1);
  await expect(page.getByTestId('sync-feedback')).toContainText('Enviado a Drive:');
  expect(latestPayload).toContain('Registro corregido');
});
