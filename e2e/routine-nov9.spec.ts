import { expect, test, type Page } from '@playwright/test';

const base = { mode: 'mix', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null };
const mondayIds = ['bench_press', 'pec_deck', 'pushup', 'straight_bar_pressdown', 'overhead_triceps_db'];
async function seed(page: Page, sessions: object[], revision?: string) {
  await page.evaluate(async ({ sessions, revision }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'kv'], 'readwrite');
      if (revision) {
        const request = tx.objectStore('kv').get('plan');
        request.onsuccess = () => tx.objectStore('kv').put({ ...request.result, value: { ...request.result.value, routineRevision: revision, week: '9–15 nov' } });
      }
      for (const session of sessions) tx.objectStore('sessions').put(session);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, { sessions, revision });
}
async function state(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['sessions', 'kv']);
    const read = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const [sessions, plan] = await Promise.all([read(tx.objectStore('sessions').getAll()), read(tx.objectStore('kv').get('plan'))]);
    db.close();
    return { sessions, plan: plan.value };
  });
}
async function expectChestToday(page: Page) {
  await expect(page.locator('.dlabel')).toContainText('9 NOV');
  await expect(page.locator('.grp-head')).toHaveCount(2);
  await expect(page.locator('.grp-head').nth(0)).toContainText('Pecho');
  await expect(page.locator('.grp-head').nth(1)).toContainText('Tríceps');
  await expect(page.locator('.ex')).toHaveCount(5);
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-09T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
});

test('recent history automatically loads chest today, replacing an untouched adaptive draft and persisting across reload', async ({ page }) => {
  const history = { ...base, date: '2026-10-29', groups: ['pecho', 'tricep'], completed: { pushup: true } };
  await seed(page, [history, { ...base, date: '2026-11-08', groups: ['pierna', 'hombro'], programmed: ['glute_bridge'], planner: { source: 'adaptive', week: '2026-10-26' } }, {
    ...base, date: '2026-11-09', groups: ['espalda', 'bicep'], programmed: ['pullup', 'hammer_curl_db'],
    programTitle: 'Próxima semana · Espalda + Bíceps', planner: { source: 'adaptive', week: '2026-11-09' },
  }]);
  await page.reload();
  await expectChestToday(page);
  const loaded = await state(page);
  expect(loaded.plan.routineRevision).toBe('2026-11-09-r2');
  expect(loaded.sessions.find(s => s.date === '2026-11-09').programmed).toEqual(mondayIds);
  expect(loaded.sessions.find(s => s.date === history.date)).toEqual(history);
  await page.reload();
  await expectChestToday(page);
  expect(await state(page)).toEqual(loaded);
});

test('an empty installation loads the week manually and opens chest today', async ({ page }) => {
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByRole('button', { name: 'Cargar semana del 9 de noviembre' }).click();
  await expectChestToday(page);
  const loaded = await state(page);
  expect(loaded.sessions.find(s => s.date === '2026-11-09').programmed).toEqual(mondayIds);
  await page.reload();
  await expectChestToday(page);
  expect(await state(page)).toEqual(loaded);
});

test('loading preserves explicit empty days, manual programs and locked adaptive choices', async ({ page }) => {
  const protectedSessions = [
    { ...base, date: '2026-11-10', groups: ['core'], selectedExercises: [], manuallyEdited: true },
    { ...base, date: '2026-11-12', groups: ['core'], programmed: ['bird_dog'], programTitle: 'Synthetic personal program' },
    { ...base, date: '2026-11-14', groups: ['core'], programmed: ['pallof'], planner: { source: 'adaptive', week: '2026-11-09', locked: true } },
  ];
  await seed(page, protectedSessions);
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByRole('button', { name: 'Cargar semana del 9 de noviembre' }).click();
  await expectChestToday(page);
  const loaded = await state(page);
  for (const session of protectedSessions) expect(loaded.sessions.find(s => s.date === session.date)).toEqual(session);
  await page.reload();
  expect(await state(page)).toEqual(loaded);
});

test('Sunday preview loads next Monday and keeps the week across reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T12:00:00'));
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(page.getByTestId('reviewed-routine-nov9')).toBeVisible();
  await expect(page.getByTestId('reviewed-routine-nov2')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cargar semana del 9 de noviembre' }).click();
  await expectChestToday(page);
  const loaded = await state(page);
  expect(loaded.plan.week).toBe('9–15 nov');
  await page.reload();
  expect(await state(page)).toEqual(loaded);
});

test('startup migrates an untouched r1 Monday after unsaved Sunday legs and core, preserving history across reload', async ({ page }) => {
  const sunday = { ...base, date: '2026-11-08', groups: ['pierna', 'core'], completed: { glute_bridge: true, bird_dog: true }, saved: false };
  await seed(page, [sunday, {
    ...base, date: '2026-11-09', groups: ['pierna', 'hombro'], format: 'ext',
    programmed: ['bench_leg_extension', 'glute_bridge', 'seated_calf_raise_db', 'dumbbell_shoulder_press', 'lateral_raise_db'],
    programTitle: 'Rutina semanal · 9–15 nov',
  }], '2026-11-09-r1');
  await page.reload();
  await expectChestToday(page);
  const loaded = await state(page);
  expect(loaded.plan.routineRevision).toBe('2026-11-09-r2');
  expect(loaded.sessions.find(session => session.date === sunday.date)).toEqual(sunday);
  await page.reload();
  await expectChestToday(page);
  expect(await state(page)).toEqual(loaded);
});
