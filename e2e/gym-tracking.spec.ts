import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', locale: 'es-ES' });
const endpoint = 'https://script.google.com/macros/s/test/exec';
const activity = (page: Page) => page.locator('.activity-log');
async function save(page: Page) {
  const button = activity(page).getByRole('button', { name: 'Guardar entrenamiento', exact: true });
  await button.click();
  await expect(button).toBeEnabled();
  await expect(activity(page)).toContainText('Entrenamiento guardado en este dispositivo.');
}
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
