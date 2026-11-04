import { expect, test, type Page } from '@playwright/test';

const base = { mode: 'mix', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null };
const history = { ...base, date: '2026-11-02', groups: ['pierna', 'hombro'], saved: true, completed: { glute_bridge: true, lateral_raise_db: true }, exerciseLog: [{ id: 'glute_bridge', name: 'Puente de glúteos', group: 'pierna', completed: true }, { id: 'lateral_raise_db', name: 'Elevaciones laterales con mancuernas', group: 'hombro', completed: true }] };
const drafts = [
  { ...base, date: '2026-11-03', groups: ['pecho', 'tricep'], programmed: ['pushup', 'rope_pressdown'], planner: { source: 'adaptive', week: '2026-11-02' } },
  { ...base, date: '2026-11-04', groups: ['hombro', 'core'], programmed: ['lateral_raise_db', 'bird_dog'], planner: { source: 'adaptive', week: '2026-11-02' } },
  { ...base, date: '2026-11-05', groups: ['espalda', 'bicep'], programmed: ['pullup', 'hammer_curl_db'], planner: { source: 'adaptive', week: '2026-11-02' } },
];
async function seed(page: Page) {
  await page.evaluate(async sessions => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'kv'], 'readwrite');
      for (const session of sessions) tx.objectStore('sessions').put(session);
      // Delivery has already run: this regression concerns adaptive scheduling.
      const store = tx.objectStore('kv'), request = store.get('plan');
      request.onsuccess = () => store.put({ key: 'plan', value: { ...request.result.value, routineRevision: '2026-11-02-r1' } });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    }); db.close();
  }, [history, ...drafts]);
}
async function readSessions(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    const request = db.transaction('sessions').objectStore('sessions').getAll();
    const sessions = await new Promise<any[]>(resolve => { request.onsuccess = () => resolve(request.result); });
    db.close(); return sessions;
  });
}
async function expectPendingGroups(page: Page) {
  await expect(page.locator('.dlabel')).toContainText('4 NOV');
  await expect(page.locator('.grp-head')).toHaveCount(2);
  await expect(page.locator('.grp-head').filter({ hasText: 'Hombro' })).toHaveCount(0);
  await expect(page.locator('.grp-head').filter({ hasText: 'Piernas' })).toHaveCount(0);
}

test('reload repairs Wednesday using actual Monday activity and preserves missed Tuesday history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00') });
  await page.goto('/'); await expect(page.locator('.logo')).toBeVisible();
  await seed(page); await page.reload();
  await expectPendingGroups(page);
  const sessions = await readSessions(page);
  expect(sessions.find(s => s.date === history.date)).toEqual(history);
  expect(sessions.find(s => s.date === '2026-11-03')).toEqual(drafts[0]);
  await page.reload(); await expectPendingGroups(page);
  expect(await readSessions(page)).toEqual(sessions);
});

test('returning to an open PWA after a missed day advances today without reloading', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
  await page.goto('/'); await expect(page.locator('.logo')).toBeVisible();
  await seed(page); await page.reload();
  await expect(page.locator('.dlabel')).toContainText('3 NOV');
  await page.clock.setSystemTime(new Date('2026-11-04T12:00:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expectPendingGroups(page);
  expect((await readSessions(page)).find(s => s.date === history.date)).toEqual(history);
});

test('an open PWA advances to Wednesday after midnight and recalculates pending groups', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T23:59:00') });
  await page.goto('/'); await expect(page.locator('.logo')).toBeVisible();
  await seed(page); await page.reload();
  await expect(page.locator('.dlabel')).toContainText('3 NOV');
  await page.clock.fastForward(120_000);
  await expectPendingGroups(page);
  expect((await readSessions(page)).find(s => s.date === history.date)).toEqual(history);
});
