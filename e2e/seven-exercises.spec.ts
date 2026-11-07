import { expect, test } from '@playwright/test';
import { CATALOG, GROUPS } from '../src/data/exercises';

const ids = ['concentration_curl', 'cable_overhead_triceps', 'decline_barbell_press', 'neutral_lat_pulldown', 'front_raise_db', 'seated_calf_raise_db', 'kneeling_cable_crunch'];
for (const id of ids) test(`${id}: mobile sheet, photos and manual choice persist without changing history`, async ({ page }, testInfo) => {
  const exercise = CATALOG[id];
  await page.clock.install({ time: new Date('2026-11-07T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  const historical = { date: '2026-11-01', groups: ['bicep'], mode: 'mix', format: 'base', extraTarget: 'auto', completed: { dumbbell_curl: true }, replacements: {}, extras: [], saved: true, metrics: null, selectedExercises: ['dumbbell_curl'], exerciseLog: [{ id: 'dumbbell_curl', name: 'Synthetic historical curl', group: 'bicep', completed: true }] };
  await page.evaluate(async historical => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve, reject) => { const tx = db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put(historical); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, historical);
  await page.reload();
  await expect(page.locator('#view-today .ex .nm').filter({ hasText: exercise.name })).toHaveCount(0);
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill(exercise.name);
  const card = page.locator('.libcard').filter({ has: page.getByText(exercise.name, { exact: true }) });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(GROUPS[exercise.group].label);
  await card.click();
  await expect(page.locator('.sheet h3').first()).toHaveText(exercise.name);
  await expect(page.locator('.sheet .sh-sub')).toContainText(GROUPS[exercise.group].label);
  for (const cue of exercise.cues) await expect(page.locator('.sheet')).toContainText(cue);
  await expect(page.locator('.sheet')).toContainText(exercise.notes);
  const photos = page.locator('.sheet .lib-gallery img');
  await expect(photos).toHaveCount(3);
  for (const photo of await photos.all()) {
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  expect(new Set(await photos.evaluateAll(imgs => imgs.map(img => img.getAttribute('src')))).size).toBe(3);
  await page.locator('.sheet').screenshot({ path: testInfo.outputPath(`${id}-sheet.png`) });
  await page.getByRole('button', { name: 'Agregar al día actual', exact: true }).click();
  await expect(page.locator('#view-today .ex .nm').filter({ hasText: exercise.name })).toBeVisible();
  await page.reload();
  await expect(page.locator('#view-today .ex .nm').filter({ hasText: exercise.name })).toBeVisible();
  const history = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    const row = await new Promise(resolve => { const r = db.transaction('sessions').objectStore('sessions').get('2026-11-01'); r.onsuccess = () => resolve(r.result); }); db.close(); return row;
  });
  expect(history).toEqual(historical);
});
