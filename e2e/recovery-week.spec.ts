import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-16T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
});

test('la semana suave se carga desde Plan, muestra los siete días y no introduce fuerza al recargar', async ({ page }) => {
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  const routine = page.getByTestId('reviewed-routine-nov16');
  await expect(routine.locator('li')).toHaveCount(7);
  await routine.locator('summary').click();
  await expect(routine).toContainText('solo si es indolora');
  await expect(routine).toContainText('No fuerces estiramientos');
  await routine.getByRole('button', { name: 'Cargar semana suave' }).click();
  await expect(page.getByTestId('recovery-day')).toBeVisible();
  await expect(page.locator('#view-today .ex')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('recovery-day')).toBeVisible();
  await expect(page.locator('#view-today .ex')).toHaveCount(0);
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(routine.getByRole('button', { name: 'Abrir semana suave' })).toBeVisible();
});

test('cargar descarga conserva un día ya empezado y sus series', async ({ page }) => {
  const recorded = {
    date: '2026-11-16', groups: ['core'], mode: 'sinpeso', format: 'base', extraTarget: 'auto',
    completed: { bird_dog: true }, replacements: {}, extras: [], saved: false, metrics: null,
    selectedExercises: ['bird_dog'], setLogs: { bird_dog: [{ reps: 5, load: null, rpe: null, done: true }] },
  };
  await page.evaluate(async recorded => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put(recorded);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, recorded);
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByTestId('reviewed-routine-nov16').getByRole('button', { name: 'Cargar semana suave' }).click();
  await expect(page.getByTestId('recovery-day')).toBeVisible();
  const persisted = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result);
    });
    const session = await new Promise(resolve => {
      const request = db.transaction('sessions').objectStore('sessions').get('2026-11-16');
      request.onsuccess = () => resolve(request.result);
    });
    db.close(); return session;
  });
  expect(persisted).toEqual(recorded);
});
