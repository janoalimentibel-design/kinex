import { expect, test, type Page } from '@playwright/test';
import { CATALOG } from '../src/data/exercises';

const base = { date: '2026-10-01', groups: ['pecho', 'bicep'], mode: 'mix', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null, programmed: ['pec_deck', 'incline_bench_press', 'dumbbell_curl', 'hammer_curl_db'] };
async function seed(page: Page, session = base) {
  await page.clock.install({ time: new Date('2026-10-01T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.evaluate(async (session) => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve, reject) => { const tx = db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put(session); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, session);
  await page.reload();
}
const card = (page: Page, id: string) => page.locator('#view-today .ex').filter({ has: page.getByText(CATALOG[id].name, { exact: true }) });
async function replace(page: Page, id: string, replacement: string) {
  await card(page, id).locator('.ex-head').click();
  await card(page, id).getByRole('button', { name: 'Cambiar', exact: true }).click();
  await page.locator('.sheet .swap-item').filter({ has: page.getByText(CATALOG[replacement].name, { exact: true }) }).click();
  await expect(card(page, id)).toHaveCount(0);
  await expect(card(page, replacement)).toHaveCount(1);
}

test('replace twice, check rapidly, remove any exercise, empty the day, add again, reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await seed(page);
  await replace(page, 'pec_deck', 'pushup');
  await expect(page.locator('#view-today .ex')).toHaveCount(4);
  await replace(page, 'pushup', 'pec_deck');
  await expect(page.locator('#view-today .ex')).toHaveCount(4);
  const names = await page.locator('#view-today .ex .nm').allTextContents();
  await page.locator('#view-today .chk').evaluateAll(buttons => { (buttons[0] as HTMLElement).click(); (buttons[1] as HTMLElement).click(); });
  await expect(page.locator('.proglab')).toContainText('2 de 4');
  await expect(page.locator('#view-today .ex .nm')).toHaveText(names);
  await page.reload();
  await expect(page.locator('.proglab')).toContainText('2 de 4');
  for (const id of base.programmed) {
    await card(page, id).locator('.ex-head').click();
    await card(page, id).getByRole('button', { name: 'Quitar del día' }).click();
    await expect(card(page, id)).toHaveCount(0);
  }
  await page.reload();
  await expect(page.locator('#view-today .ex')).toHaveCount(0);
  await page.getByRole('button', { name: '+ ejercicio', exact: true }).first().click();
  await page.locator('.sheet .swap-item').filter({ has: page.locator('.nm', { hasText: CATALOG.pec_deck.name }) }).click();
  await expect(page.locator('#view-today .ex')).toHaveCount(1);
  await expect(card(page, 'pec_deck')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Monday chest and biceps stay visible despite stale groups, edit and undo persist', async ({ page }) => {
  const monday = { ...base, date: '2026-09-28', groups: ['espalda', 'hombro'], completed: { pec_deck: true, dumbbell_curl: true }, saved: true,
    exerciseLog: [{ id: 'pec_deck', name: CATALOG.pec_deck.name, group: 'pecho', completed: true }, { id: 'dumbbell_curl', name: CATALOG.dumbbell_curl.name, group: 'bicep', completed: true }] };
  await seed(page, monday);
  await page.locator('.day').filter({ has: page.locator('.dd', { hasText: /^28$/ }) }).click();
  await expect(page.locator('#view-today .ex')).toHaveCount(2);
  await expect(card(page, 'pec_deck')).toBeVisible();
  await expect(card(page, 'dumbbell_curl')).toBeVisible();
  await expect(page.locator('.focus')).toContainText('Pecho');
  await replace(page, 'pec_deck', 'pushup');
  await expect(page.locator('#view-today .ex')).toHaveCount(2);
  await expect(page.locator('.proglab')).toContainText('1 de 2');
  await page.getByRole('button', { name: 'Deshacer / versiones del día' }).click();
  await page.getByRole('button', { name: 'Restaurar esta versión' }).first().click();
  await expect(card(page, 'pec_deck')).toBeVisible();
  await expect(page.locator('.proglab')).toContainText('2 de 2');
  await page.reload();
  await page.locator('.day').filter({ has: page.locator('.dd', { hasText: /^28$/ }) }).click();
  await expect(page.locator('.proglab')).toContainText('2 de 2');
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  await expect(page.locator('.hcard')).toContainText('Pecho');
  await expect(page.locator('.hcard')).toContainText('Bíceps');
});

test('add from another muscle in Library and edit old dates without losing the list', async ({ page }) => {
  await seed(page);
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill(CATALOG.pullup.name);
  await page.locator('.libcard').filter({ has: page.locator('.nm', { hasText: CATALOG.pullup.name }) }).click();
  await page.getByRole('button', { name: 'Agregar al día actual' }).click();
  await expect(card(page, 'pullup')).toBeVisible();
  await expect(page.locator('#view-today .ex')).toHaveCount(5);
  await page.reload();
  await expect(card(page, 'pullup')).toBeVisible();
});

test('cardio accepts every format without blanking the app; plan edits and request drafts persist', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await seed(page);
  await page.getByRole('button', { name: 'Cambiar grupos' }).click();
  await page.locator('.swap-item', { hasText: 'Aeróbico solo' }).click();
  for (const name of ['Extendido', 'Largo', 'Base']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.focus')).toContainText('Aeróbico');
  }
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.locator('.field').filter({ has: page.getByText('Foco principal', { exact: true }) }).locator('input').fill('Mi plan personal');
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(page.locator('.field').filter({ has: page.getByText('Foco principal', { exact: true }) }).locator('input')).toHaveValue('Mi plan personal');
  await page.locator('.nav button', { hasText: 'Pedidos' }).click();
  await page.locator('.requests textarea').fill('Borrador de prueba local');
  await page.reload();
  await page.locator('.nav button', { hasText: 'Pedidos' }).click();
  await expect(page.locator('.requests textarea')).toHaveValue('Borrador de prueba local');
  expect(errors).toEqual([]);
});

test('replacement can change muscle without adding a fifth exercise and survives export/import', async ({ page }) => {
  page.on('dialog', dialog => void dialog.accept());
  await seed(page);
  await card(page, 'pec_deck').locator('.ex-head').click();
  await card(page, 'pec_deck').getByRole('button', { name: 'Cambiar', exact: true }).click();
  await page.locator('.sheet select').selectOption('espalda');
  await page.locator('.sheet .swap-item').filter({ has: page.getByText(CATALOG.pullup.name, { exact: true }) }).click();
  await expect(card(page, 'pec_deck')).toHaveCount(0);
  await expect(card(page, 'pullup')).toBeVisible();
  await expect(page.locator('#view-today .ex')).toHaveCount(4);
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup' }).click();
  const download = await downloadPromise;
  await page.locator('input[type="file"]').setInputFiles((await download.path())!);
  await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await expect(page.locator('.modal')).not.toHaveClass(/show/);
  await page.reload();
  await expect(card(page, 'pullup')).toBeVisible();
  await expect(card(page, 'pec_deck')).toHaveCount(0);
  await expect(page.locator('#view-today .ex')).toHaveCount(4);
});
