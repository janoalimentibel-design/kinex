import { expect, test, type Page } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
const endpoint = 'https://script.google.com/macros/s/test/exec';
async function connect(page: Page) {
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint, token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar Drive', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Desconectar', exact: true })).toBeVisible();
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
}
async function readToday(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    const r = db.transaction('sessions').objectStore('sessions').get('2026-11-04');
    const row = await new Promise<any>(resolve => { r.onsuccess = () => resolve(r.result); }); db.close(); return row;
  });
}
async function complete(page: Page) {
  const checks = page.locator('.ex .chk');
  const count = await checks.count();
  for (let i = 0; i < count; i++) await checks.nth(i).click();
  // A click queues an IndexedDB write. Start the form scenario only after its
  // exercise fixture has committed and React displays the completed session.
  await expect.poll(async () => Object.values((await readToday(page))?.completed ?? {}).filter(Boolean).length).toBe(count);
  await expect(page.locator('.ex .chk[aria-pressed="true"]')).toHaveCount(count);
}
const send = (page: Page) => page.getByRole('button', { name: 'Guardar y enviar entrenamiento', exact: true });
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00') });
});

test('completion, local save, timer, online and reload never upload; one explicit gesture sends the latest persisted data', async ({ page }, testInfo) => {
  const payloads: any[] = [];
  await page.route(endpoint, async route => { payloads.push(JSON.parse(JSON.parse(route.request().postData()!).payload)); await route.fulfill({ json: { ok: true, version: payloads.length } }); });
  await page.goto('/'); await connect(page);
  await complete(page);
  await expect(page.getByRole('dialog', { name: 'Entrenamiento completado' })).toHaveCount(0);
  await expect(page.getByTestId('training-complete')).toHaveCount(0);
  await page.getByLabel('Minutos totales en gimnasio', { exact: true }).fill('80');
  await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
  await page.getByLabel('Minutos 1', { exact: true }).fill('20');
  await page.getByLabel('Calorías 1', { exact: true }).fill('125');
  await page.getByLabel('Calorías del entrenamiento', { exact: true }).fill('400');
  await page.getByLabel('Incluyen la actividad aeróbica', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar en este dispositivo', exact: true }).click();
  await expect.poll(async () => (await readToday(page))?.gymMinutes).toBe(80);
  await page.clock.runFor(61000); await page.evaluate(() => window.dispatchEvent(new Event('online')));
  expect(payloads).toHaveLength(0);
  await page.reload(); await page.clock.runFor(2000);
  expect(payloads).toHaveLength(0);
  await page.getByLabel('Minutos totales en gimnasio', { exact: true }).fill('85');
  await page.getByLabel('Calorías del entrenamiento', { exact: true }).fill('420');
  // Dispatch twice in the same event turn, before React can disable the button.
  await send(page).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect.poll(() => payloads.length).toBe(1);
  await expect(page.locator('.activity-log')).toContainText('Entrenamiento guardado y enviado a Drive.');
  const session = payloads[0].data.sessions.find((s: any) => s.date === '2026-11-04');
  expect(session).toMatchObject({ gymMinutes: 85, trainingCalories: 420, trainingCaloriesIncludeAerobic: true, aerobicActivities: [{ minutes: 20, calories: 125 }] });
  expect(Object.values(session.completed).length).toBeGreaterThan(0);
  expect(Object.values(session.completed).every(Boolean)).toBe(true);
  expect(await readToday(page)).toEqual(session);
  await page.locator('.activity-log').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('manual-delivery-390.png') });
});

test('invalid values and failed local persistence cannot upload; a network failure stays local until successful retry', async ({ page }) => {
  let calls = 0, failNetwork = true;
  await page.route(endpoint, async route => { calls++; if (failNetwork) await route.abort(); else await route.fulfill({ json: { ok: true, version: calls } }); });
  await page.goto('/'); await connect(page); await complete(page);
  await page.getByLabel('Minutos totales en gimnasio', { exact: true }).fill('-1');
  await expect(page.getByLabel('Minutos totales en gimnasio', { exact: true })).toHaveValue('-1');
  await expect(page.locator('.activity-log').getByRole('status').filter({ hasText: 'Borrador sin guardar' }).first()).toBeVisible();
  await send(page).click(); await expect(page.locator('.activity-log [role=alert]')).toContainText('Minutos'); expect(calls).toBe(0);
  await page.getByLabel('Minutos totales en gimnasio', { exact: true }).fill('75');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    (window as any).restorePut = () => { IDBObjectStore.prototype.put = original; };
    IDBObjectStore.prototype.put = function(value, key) {
      if (this.name === 'sessions') throw new DOMException('Synthetic database failure', 'QuotaExceededError');
      return key === undefined ? original.call(this, value) : original.call(this, value, key);
    };
  });
  await send(page).click(); await expect(page.locator('.activity-log [role=alert]')).toBeVisible(); expect(calls).toBe(0);
  expect((await readToday(page)).gymMinutes).toBeUndefined();
  await page.evaluate(() => (window as any).restorePut());
  await send(page).click(); await expect.poll(() => calls).toBe(1);
  await expect(page.locator('.activity-log')).toContainText('No se confirmó el envío');
  expect((await readToday(page)).gymMinutes).toBe(75);
  await page.reload(); await page.clock.runFor(2000); expect(calls).toBe(1);
  await expect(page.getByLabel('Minutos totales en gimnasio', { exact: true })).toHaveValue('75');
  failNetwork = false; await send(page).click(); await expect.poll(() => calls).toBe(2);
  await expect(page.locator('.activity-log')).toContainText('Entrenamiento guardado y enviado a Drive.');
});
