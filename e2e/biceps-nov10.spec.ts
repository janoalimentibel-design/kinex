import { expect, test, type Page } from '@playwright/test';
import { CATALOG } from '../src/data/exercises';

const originalTuesday = {
  date: '2026-11-10', groups: ['espalda', 'bicep'], mode: 'mix', format: 'ext', extraTarget: 'auto',
  completed: {}, replacements: {}, extras: [], saved: false, metrics: null,
  programmed: ['pullup', 'cable_low_row', 'pull_apart_back', 'dumbbell_curl', 'hammer_curl_db'],
  programTitle: 'Rutina semanal · 9–15 nov',
};

async function seed(page: Page, session: object) {
  await page.evaluate(async session => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'kv'], 'readwrite');
      tx.objectStore('sessions').put(session);
      const request = tx.objectStore('kv').get('plan');
      request.onsuccess = () => tx.objectStore('kv').put({ ...request.result, value: { ...request.result.value, routineRevision: '2026-11-09-r2', week: '9–15 nov' } });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, session);
}

async function tuesday(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    const row = await new Promise(resolve => { const r = db.transaction('sessions').objectStore('sessions').get('2026-11-10'); r.onsuccess = () => resolve(r.result); });
    db.close(); return row;
  });
}

test('untouched Tuesday gets distinct supinated barbell and neutral hammer curls with working mobile photos', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-11-10T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await seed(page, originalTuesday);
  await page.reload();
  const card = page.locator('#view-today .ex').filter({ has: page.getByText(CATALOG.barbell_curl.name, { exact: true }) });
  await expect(card).toBeVisible();
  await expect(page.locator('#view-today .nm').filter({ hasText: CATALOG.hammer_curl_db.name })).toBeVisible();
  await expect(page.locator('#view-today .nm').filter({ hasText: CATALOG.dumbbell_curl.name })).toHaveCount(0);
  await card.locator('.ex-head').click();
  await expect(card).toContainText(/palmas hacia arriba/i);
  const photos = card.locator('.phases img');
  await expect(photos).toHaveCount(3);
  for (const photo of await photos.all()) await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await card.screenshot({ path: testInfo.outputPath('barbell-curl-mobile.png') });
  const corrected = await tuesday(page);
  await page.reload();
  expect(await tuesday(page)).toEqual(corrected);
});

test('updating on Wednesday preserves the complete recorded Tuesday and set history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-11T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  const recorded = {
    ...originalTuesday, saved: true, completed: { dumbbell_curl: true },
    setLogs: { dumbbell_curl: [{ reps: 12, load: 8, rpe: 7, done: true }] },
    exerciseLog: [{ id: 'dumbbell_curl', name: 'Synthetic historical curl', group: 'bicep', completed: true }],
  };
  await seed(page, recorded);
  await page.reload();
  expect(await tuesday(page)).toEqual(recorded);
  await page.reload();
  expect(await tuesday(page)).toEqual(recorded);
});
