import { expect, test } from '@playwright/test';

test('Sunday loading persists the reviewed week and preserves explicit future choices across reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  const base = { mode: 'mix', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null };
  // Synthetic choices with no activity: automatic delivery must wait for the explicit button.
  const protectedSessions = [
    { ...base, date: '2026-10-24', groups: ['core'], selectedExercises: ['bench_crunch'], manuallyEdited: true },
    { ...base, date: '2026-10-26', groups: ['core'], selectedExercises: [], manuallyEdited: true },
    { ...base, date: '2026-10-27', groups: ['core'], programmed: ['bench_crunch'], programTitle: 'Plan ficticio propio' },
  ];
  await page.evaluate(async (sessions) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      for (const session of sessions) tx.objectStore('sessions').put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, protectedSessions);
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByRole('button', { name: 'Cargar semana del 26 de octubre' }).click();
  await expect(page.getByTestId('reviewed-routine-oct26')).not.toBeVisible();
  await expect(page.locator('.weekhead .wk')).toHaveText('26 OCT – 1 NOV');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(page.getByRole('button', { name: 'Abrir próximo día de la rutina' })).toBeVisible();

  const readState = () => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['sessions', 'kv']);
    const read = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const [sessions, plan] = await Promise.all([
      read(tx.objectStore('sessions').getAll()), read(tx.objectStore('kv').get('plan')),
    ]);
    db.close();
    return { sessions, plan: plan.value };
  });
  const loaded = await readState();
  expect(loaded.plan.routineRevision).toBe('2026-10-26-r1');
  for (const session of protectedSessions) {
    expect(loaded.sessions.find((candidate: { date: string }) => candidate.date === session.date)).toEqual(session);
  }
  expect(loaded.sessions.find((session: { date: string }) => session.date === '2026-10-29').programmed).toEqual([
    'bench_leg_extension', 'glute_bridge', 'standing_calf_raise', 'dumbbell_shoulder_press', 'lateral_raise_db',
  ]);
  expect(loaded.sessions.find((session: { date: string }) => session.date === '2026-10-31').programmed).toContain('decline_bench_crunch');
  await page.reload();
  await expect(page.locator('.logo')).toBeVisible();
  expect(await readState()).toEqual(loaded);
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(page.getByRole('button', { name: 'Abrir próximo día de la rutina' })).toBeVisible();
});

test('a failed plan write rolls back every new session and remains retryable', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  // Fail the final plan write after session writes: the enclosing transaction
  // must roll them all back, rather than reporting a partially loaded week.
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'kv' && value?.key === 'plan' && value.value?.routineRevision === '2026-10-26-r1') {
        throw new DOMException('Synthetic write failure', 'QuotaExceededError');
      }
      return key === undefined ? original.call(this, value) : original.call(this, value, key);
    };
  });
  await page.getByRole('button', { name: 'Cargar semana del 26 de octubre' }).click();
  await expect(page.getByTestId('reviewed-routine-oct26').getByRole('alert')).toContainText('No se pudo guardar la rutina');
  const failed = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(['sessions', 'kv']);
    const sessionRequest = tx.objectStore('sessions').getAll();
    const planRequest = tx.objectStore('kv').get('plan');
    const [sessions, plan] = await Promise.all([
      new Promise<any[]>(resolve => { sessionRequest.onsuccess = () => resolve(sessionRequest.result); }),
      new Promise<any>(resolve => { planRequest.onsuccess = () => resolve(planRequest.result); }),
    ]);
    db.close();
    return { sessions, revision: plan?.value?.routineRevision };
  });
  expect(failed.sessions).toEqual([]);
  expect(failed.revision).not.toBe('2026-10-26-r1');
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByRole('button', { name: 'Cargar semana del 26 de octubre' }).click();
  await expect(page.getByTestId('reviewed-routine-oct26')).not.toBeVisible();
  await expect(page.locator('.weekhead .wk')).toHaveText('26 OCT – 1 NOV');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(page.getByRole('button', { name: 'Abrir próximo día de la rutina' })).toBeVisible();
});
