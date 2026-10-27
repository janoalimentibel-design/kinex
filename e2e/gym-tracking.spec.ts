import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', locale: 'es-ES' });
const endpoint = 'https://script.google.com/macros/s/test/exec';
const activity = (page: Page) => page.locator('.activity-log');
async function save(page: Page) {
  const button = activity(page).getByRole('button', { name: 'Guardar actividad y calorías', exact: true });
  await button.click();
  await expect(button).toBeDisabled();
  await expect(activity(page)).toContainText('Actividad y calorías guardadas en este dispositivo.');
}
async function connect(page: Page) {
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint, token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos', exact: true }).click();
  await expect(page.getByTestId('sync-feedback')).toContainText('Enviado a Drive:');
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
}

test('primera copia automática no incluye campos vacíos; guardar minutos y kcal requiere confirmar otra copia', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-27T12:00:00') });
  let uploads = 0;
  let payload: any;
  let failing = false;
  await page.route(endpoint, async route => {
    uploads++;
    if (failing) { await route.abort(); return; }
    payload = JSON.parse(JSON.parse(route.request().postData()!).payload);
    await route.fulfill({ json: { ok: true, version: uploads }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/');
  await connect(page);
  const checks = page.locator('.ex .chk');
  for (let index = 0; index < await checks.count(); index++) await checks.nth(index).click();
  await page.clock.runFor(2500);
  await expect.poll(() => payload.data.sessions.some((session: any) => Object.values(session.completed).length && Object.values(session.completed).every(Boolean))).toBe(true);
  const first = payload.data.sessions.find((session: any) => session.date === '2026-10-27');
  expect(first.gymMinutes).toBeUndefined();
  expect(first.trainingCalories).toBeUndefined();
  const completion = page.getByRole('dialog', { name: 'Entrenamiento completado', exact: true });
  await completion.getByRole('button', { name: 'Revisar actividad y calorías', exact: true }).click();
  await expect(activity(page)).toContainText('Datos guardados de este día enviados a Drive.');
  await page.getByLabel('Minutos totales en gimnasio', { exact: true }).fill('80');
  await page.getByLabel('Calorías del entrenamiento', { exact: true }).fill('400');
  await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
  await page.getByLabel('Minutos 1', { exact: true }).fill('20');
  await page.getByLabel('Calorías 1', { exact: true }).fill('125');
  await page.getByLabel('Incluyen la actividad aeróbica', { exact: true }).check();
  const before = uploads;
  await expect(activity(page).locator('.day-sync-status')).toContainText('Borrador sin guardar');
  await expect(activity(page).locator('.day-sync-status')).not.toContainText('Datos guardados de este día enviados');
  await expect(activity(page).getByRole('button', { name: 'Enviar cambios', exact: true })).toBeDisabled();
  await save(page);
  await page.clock.runFor(2000);
  await expect(activity(page)).toContainText('Pendientes de enviar a Drive.');
  await expect(activity(page).locator('.activity-summary')).toContainText('Gimnasio: 80 min · Aeróbico: 20 min');
  await expect(activity(page).locator('.activity-summary')).toContainText('Total guardado del día: 400 kcal');
  expect(uploads).toBe(before);
  await page.reload();
  await page.clock.runFor(2000);
  await expect(page.getByLabel('Minutos totales en gimnasio', { exact: true })).toHaveValue('80');
  await expect(activity(page)).toContainText('Pendientes de enviar a Drive.');
  let accept = false;
  let confirmations = 0;
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('ya habías enviado');
    if (accept) await dialog.accept(); else await dialog.dismiss();
    confirmations++;
  });
  const send = activity(page).getByRole('button', { name: 'Enviar cambios', exact: true });
  await send.click();
  await expect.poll(() => confirmations).toBe(1);
  expect(uploads).toBe(before);
  await expect(send).toBeEnabled();
  accept = true; failing = true;
  await send.click();
  await expect.poll(() => uploads).toBe(before + 1);
  await expect(send).toBeEnabled();
  await expect(activity(page)).toContainText('Pendientes de enviar a Drive.');
  await expect(activity(page).locator('.day-sync-status [role=alert]')).toContainText('Pendiente: no se confirmó el envío');
  await activity(page).locator('.day-sync-status').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('gym-upload-error.png') });
  failing = false;
  await send.click();
  await expect.poll(() => uploads).toBe(before + 2);
  await expect(activity(page)).toContainText('Datos guardados de este día enviados a Drive.');
  expect(payload.data.sessions.find((session: any) => session.date === '2026-10-27')).toMatchObject({ gymMinutes: 80, trainingCalories: 400, trainingCaloriesIncludeAerobic: true });
  await activity(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('gym-form.png') });
  await activity(page).locator('.day-sync-status').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('gym-saved-sent.png') });
});

test('resumen semanal, mensual y total excluye futuro, separa cardio y conserva cero frente a vacío', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-27T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result); });
    const base = { groups: ['pecho', 'bicep'], mode: 'mix', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null };
    const rows = [
      { date: '2026-10-27', gymMinutes: 80, trainingCalories: 400, trainingCaloriesIncludeAerobic: true, aerobicActivities: [{ id: 'bike', type: 'Bici', minutes: 20, calories: 125, distanceKm: 6 }] },
      { date: '2026-10-26', gymMinutes: 0, trainingCalories: 0 },
      { date: '2026-10-20', gymMinutes: 60, trainingCalories: 300, aerobicActivities: [{ id: 'walk', type: 'Caminar', minutes: 10, calories: 50 }] },
      { date: '2026-09-30', gymMinutes: 40, trainingCalories: 200 },
      { date: '2026-10-28', gymMinutes: 999, trainingCalories: 9999 },
      { date: '2026-10-25' },
    ];
    await new Promise<void>((resolve, reject) => { const tx = database.transaction('sessions', 'readwrite'); rows.forEach(row => tx.objectStore('sessions').put({ ...base, ...row })); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    database.close();
  });
  await page.reload();
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  const summary = page.locator('.activity-period-summary');
  const metric = (label: string) => summary.locator('.activity-metrics > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');
  await expect(metric('Tiempo en gimnasio')).toHaveText('80 min');
  await expect(metric('Tiempo aeróbico')).toHaveText('20 min');
  await expect(metric('Calorías totales')).toHaveText('400 kcal');
  await expect(summary).toContainText('2 días con registro');
  await page.getByLabel('Período del resumen', { exact: true }).selectOption('month');
  await expect(metric('Tiempo en gimnasio')).toHaveText('140 min');
  await expect(metric('Calorías totales')).toHaveText('750 kcal');
  await page.getByLabel('Período del resumen', { exact: true }).selectOption('all');
  await expect(metric('Tiempo en gimnasio')).toHaveText('180 min');
  await expect(metric('Tiempo aeróbico')).toHaveText('30 min');
  await expect(metric('Calorías totales')).toHaveText('950 kcal');
  await summary.screenshot({ path: testInfo.outputPath('gym-summary-all.png') });
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup', exact: true }).click();
  const download = await downloaded;
  const stream = await download.createReadStream(); let text = '';
  for await (const chunk of stream!) text += chunk.toString();
  const rows = JSON.parse(text).data.sessions;
  expect(rows.find((row: any) => row.date === '2026-10-26').gymMinutes).toBe(0);
  expect(rows.find((row: any) => row.date === '2026-10-25')).not.toHaveProperty('gymMinutes');
});

for (const width of [320, 390]) {
  test(`borrador y guardado repetido de minutos gym no duplican registros a ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
    await page.getByLabel('Minutos totales en gimnasio', { exact: true }).fill('75');
    await page.getByLabel('Calorías del entrenamiento', { exact: true }).fill('300');
    await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-16');
    await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
    await expect(page.getByLabel('Minutos totales en gimnasio', { exact: true })).toHaveValue('75');
    await save(page);
    await page.getByLabel('Minutos totales en gimnasio', { exact: true }).fill('80');
    await save(page);
    await page.reload();
    await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
    await expect(page.getByLabel('Minutos totales en gimnasio', { exact: true })).toHaveValue('80');
    await page.locator('.nav button', { hasText: 'Historial' }).click();
    await page.getByLabel('Período del resumen', { exact: true }).selectOption('all');
    await expect(page.locator('.activity-period-summary')).toContainText('1 días con registro');
    const gym = page.locator('.activity-period-summary .activity-metrics > div').filter({ hasText: 'Tiempo en gimnasio' });
    await expect(gym).toContainText('80 min');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`gym-history-${width}.png`) });
  });
}


test('borrador anterior sin campo gym se recupera sin conflicto ni duración inventada', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('kinex:activity-draft:v1:2026-09-15', JSON.stringify({ rows: [], training: '250', includes: false, baseline: JSON.stringify([[], null, false]) })));
  await page.goto('/');
  await page.getByLabel('Buscar día', { exact: true }).fill('2026-09-15');
  await expect(page.getByLabel('Minutos totales en gimnasio', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Calorías del entrenamiento', { exact: true })).toHaveValue('250');
  await expect(activity(page)).not.toContainText('Los datos guardados cambiaron');
  await save(page);
  expect(await page.evaluate(() => sessionStorage.getItem('kinex:activity-draft:v1:2026-09-15'))).toBeNull();
  await expect(activity(page).locator('.activity-summary')).toContainText('Gimnasio: sin minutos registrados');
  await expect(activity(page).locator('.activity-summary')).toContainText('Total guardado del día: 250 kcal');
});
