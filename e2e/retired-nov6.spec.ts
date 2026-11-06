import { expect, test } from '@playwright/test';
import { CATALOG } from '../src/data/exercises';

const base = { mode: 'mix', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null };
test('requested removals persist while unrelated choices and historical activity survive', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  const historical = { ...base, date: '2026-11-05', groups: ['espalda', 'bicep'], selectedExercises: ['band_pulldown', 'towel_hold'], completed: { band_pulldown: true }, saved: true, exerciseLog: [{ id: 'band_pulldown', name: CATALOG.band_pulldown.name, group: 'espalda', completed: true }, { id: 'towel_hold', name: CATALOG.towel_hold.name, group: 'bicep', completed: false }] };
  await page.evaluate(async ({ base, historical }) => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put(historical);
      tx.objectStore('sessions').put({ ...base, date: '2026-11-06', groups: ['espalda', 'bicep'], manuallyEdited: true, selectedExercises: ['band_pulldown', 'towel_hold', 'supine_row_band'] });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, { base, historical });
  await page.reload();
  const names = page.locator('#view-today .ex .nm');
  await expect(names).toHaveText([CATALOG.supine_row_band.name]);
  await page.reload();
  await expect(names).toHaveText([CATALOG.supine_row_band.name]);
  const history = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    const result = await new Promise(resolve => { const r = db.transaction('sessions').objectStore('sessions').get('2026-11-05'); r.onsuccess = () => resolve(r.result); });
    db.close(); return result;
  });
  expect(history).toEqual(historical);
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  for (const id of ['band_pulldown', 'towel_hold']) {
    await page.locator('.search').fill(CATALOG[id].name);
    await expect(page.locator('.libcard')).toHaveCount(0);
  }
});

test('mobile exercise sheets explain the row and distinguish elbows from shoulder shrugging', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill(CATALOG.supine_row_band.name);
  await page.locator('.libcard').click();
  await expect(page.locator('.sheet')).toContainText('no es un ejercicio de tríceps');
  await expect(page.locator('.sheet')).toContainText('palmas hacia arriba');
  await page.locator('.modal').click({ position: { x: 5, y: 5 } });
  await page.locator('.search').fill(CATALOG.face_pull.name);
  await page.locator('.libcard').filter({ has: page.getByText(CATALOG.face_pull.name, { exact: true }) }).click();
  await expect(page.locator('.sheet')).toContainText('aproximadamente a la altura de los hombros');
  await expect(page.locator('.sheet')).toContainText('ni los empujes hacia abajo');
  await expect(page.locator('.sheet img').first()).toBeVisible();
});
