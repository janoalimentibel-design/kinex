import { expect, test } from '@playwright/test';

test('repairs a delivered chest draft against yesterday, persists it, and preserves history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-01T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  const previous = { date: '2026-09-30', groups: ['pecho', 'bicep'], mode: 'mix', format: 'base', extraTarget: 'auto', completed: { pec_deck: true }, replacements: {}, extras: [], saved: false, metrics: null };
  await page.evaluate(async (previous) => {
    const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'kv'], 'readwrite');
      tx.objectStore('sessions').put(previous);
      tx.objectStore('sessions').put({ ...previous, date: '2026-10-01', groups: ['pecho', 'tricep'], completed: {}, programmed: ['incline_bench_press', 'pec_deck', 'straight_bar_pressdown', 'overhead_triceps_db'], programTitle: 'Semana revisada · Pecho + Tríceps' });
      tx.objectStore('kv').put({ key: 'plan', value: { week: '28 sep – 4 oct', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '', routineRevision: '2026-09-28-r1' } });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, previous);
  await page.reload();
  await expect(page.locator('.version')).toHaveText('v3.38');
  await expect(page.locator('.grp-head .gn')).not.toContainText(['Pecho']);
  const groups = await page.locator('.grp-head .gn').allTextContents();
  expect(groups).not.toContain('Pecho');
  expect(groups).not.toContain('Bíceps');
  await page.reload();
  await expect(page.locator('.grp-head .gn')).toHaveText(groups);
  const actual = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    const result = await new Promise((resolve) => { const r = db.transaction('sessions').objectStore('sessions').get('2026-09-30'); r.onsuccess = () => resolve(r.result); });
    db.close(); return result;
  });
  expect(actual).toEqual(previous);
});
