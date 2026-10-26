import { expect, test, type Page } from '@playwright/test';

// Keep mocked uploads inside Playwright; active service workers can bypass page.route.
test.use({ serviceWorkers: 'block' });

async function saveActivities(page: Page) {
  const save = page.getByRole('button', { name: 'Guardar actividad y calorías', exact: true });
  await save.click();
  await expect(save).toBeDisabled();
  await expect(page.getByText('Actividad y calorías guardadas en este dispositivo.', { exact: true })).toBeVisible();
}

test('cardio en una fecha pasada permite varios registros, correcciones, eliminación y backup sin fuerza ficticia', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
  await page.getByLabel('Tipo de actividad 1', { exact: true }).fill('Bicicleta');
  await page.getByLabel('Minutos 1', { exact: true }).fill('18');
  await page.getByLabel('Calorías 1', { exact: true }).fill('125');
  await page.getByLabel('Kilómetros 1', { exact: true }).fill('6.2');
  await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
  await page.getByLabel('Tipo de actividad 2', { exact: true }).fill('Caminata');
  await page.getByLabel('Minutos 2', { exact: true }).fill('20');
  await page.getByLabel('Calorías 2', { exact: true }).fill('0');
  await page.getByLabel('Calorías del entrenamiento', { exact: true }).fill('350');
  await saveActivities(page);
  await expect(page.locator('.activity-summary')).toContainText('475 kcal');
  await page.getByLabel('Incluyen la actividad aeróbica', { exact: true }).check();
  await saveActivities(page);
  await expect(page.locator('.activity-summary')).toContainText('350 kcal');
  await page.reload();
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await expect(page.getByLabel('Kilómetros 1', { exact: true })).toHaveValue('6.2');
  await expect(page.getByLabel('Calorías 2', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Kilómetros 2', { exact: true })).toHaveValue('');
  await page.getByLabel('Minutos 1', { exact: true }).fill('19');
  await saveActivities(page);
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  const card = page.locator('.hcard').filter({ hasText: 'Bicicleta' });
  await expect(card).toContainText('19');
  await expect(card).toContainText('Caminata');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup' }).click();
  const download = await downloaded;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream!) text += chunk.toString();
  const session = JSON.parse(text).data.sessions.find((s: { date: string }) => s.date === '2026-09-15');
  expect(session.trainingCalories).toBe(350);
  expect(session.trainingCaloriesIncludeAerobic).toBe(true);
  expect(session.aerobicActivities).toHaveLength(2);
  expect(session.aerobicActivities[0]).toMatchObject({ type: 'Bicicleta', minutes: 19, calories: 125, distanceKm: 6.2 });
  expect(session.aerobicActivities[1]).not.toHaveProperty('distanceKm');
  expect(session.aerobicActivities[1].calories).toBe(0);
  expect(Object.values(session.completed).some(Boolean)).toBe(false);
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await page.getByRole('button', { name: 'Eliminar actividad 2', exact: true }).click();
  await saveActivities(page);
  await page.reload();
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await expect(page.getByLabel('Minutos 2', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Minutos 1', { exact: true })).toHaveValue('19');
});

for (const width of [320, 390]) {
  test(`apariencia respeta sistema, selección y recarga a ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const selector = page.getByLabel('Apariencia', { exact: true });
    await expect(selector).toHaveValue('auto');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(selector).toBeInViewport();
    await selector.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(selector).toHaveValue('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await selector.selectOption('dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await selector.selectOption('auto');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(selector).toHaveValue('auto');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    {
      await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
      await page.getByLabel('Minutos 1', { exact: true }).fill('18');
      await page.getByLabel('Calorías 1', { exact: true }).fill('125');
      await page.getByLabel('Kilómetros 1', { exact: true }).fill('6.2');
      await saveActivities(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const theme of width === 390 ? ['light', 'dark'] : []) {
        await selector.selectOption(theme);
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: testInfo.outputPath(`${theme}-header-390.png`) });
        await page.screenshot({ path: testInfo.outputPath(`${theme}-full-390.png`), fullPage: true });
      }
    }

  });
}

test('corregir cardio ya enviado pide consentimiento y envía las calorías nuevas', async ({ page }) => {
  let calls = 0;
  let payload = '';
  await page.route('https://script.google.com/macros/s/test/exec', async route => {
    calls++;
    payload = JSON.parse(route.request().postData()!).payload;
    await route.fulfill({ json: { ok: true, version: calls }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
  await page.getByLabel('Tipo de actividad 1', { exact: true }).fill('Bicicleta');
  await page.getByLabel('Minutos 1', { exact: true }).fill('20');
  await page.getByLabel('Calorías 1', { exact: true }).fill('100');
  await saveActivities(page);
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos', exact: true }).click();
  await expect(page.getByTestId('sync-feedback')).toContainText('Enviado a Drive:');
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
  await page.getByLabel('Calorías 1', { exact: true }).fill('130');
  await saveActivities(page);
  await expect(page.getByRole('button', { name: 'Enviar datos actualizados', exact: true })).toBeVisible();
  const before = calls;
  expect(JSON.parse(payload).data.sessions.some((s: { aerobicActivities?: { calories: number }[] }) => s.aerobicActivities?.[0]?.calories === 100)).toBe(true);
  const confirmation = page.waitForEvent('dialog').then(async dialog => {
    expect(dialog.message()).toContain('ya se envió');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Enviar datos actualizados', exact: true }).click();
  await confirmation;
  await expect.poll(() => calls).toBe(before + 1);
  expect(JSON.parse(payload).data.sessions.some((s: { aerobicActivities?: { calories: number }[] }) => s.aerobicActivities?.[0]?.calories === 130)).toBe(true);
});

test('borrador aeróbico sobrevive cambiar de fecha aunque sessionStorage falle', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith('kinex:activity-draft:')) throw new Error('Storage blocked in test');
      return original.call(this, key, value);
    };
  });
  await page.goto('/');
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
  await page.getByLabel('Minutos 1', { exact: true }).fill('17');
  await expect(page.locator('.activity-log')).toContainText('no se pudo proteger');
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-16');
  await expect(page.getByLabel('Minutos 1', { exact: true })).toHaveCount(0);
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await expect(page.getByLabel('Minutos 1', { exact: true })).toHaveValue('17');
  await expect(page.locator('.activity-log')).toContainText('no se pudo proteger');
  await saveActivities(page);
  await page.reload();
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await expect(page.getByLabel('Minutos 1', { exact: true })).toHaveValue('17');
});
