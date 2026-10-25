import { expect, test } from '@playwright/test';
import { CATALOG } from '../src/data/exercises';

test('solo la extensión del banco está disponible en Biblioteca, agregar y reemplazar', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put({ date: '2026-10-25', groups: ['pierna'], mode: 'mix', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null, selectedExercises: ['hip_thrust'] });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill('Extensión de cuádriceps');
  await expect(page.locator('.libcard')).toHaveCount(1);
  await expect(page.locator('.libcard')).toContainText(CATALOG.bench_leg_extension.name);
  await expect(page.getByText(CATALOG.leg_ext.name, { exact: true })).toHaveCount(0);

  await page.locator('.nav button', { hasText: 'Hoy' }).click();
  const hip = page.locator('#view-today .ex').filter({ has: page.getByText(CATALOG.hip_thrust.name, { exact: true }) });
  await hip.locator('.ex-head').click();
  await hip.getByRole('button', { name: 'Cambiar', exact: true }).click();
  await expect(page.locator('.sheet').getByText(CATALOG.bench_leg_extension.name, { exact: true })).toBeVisible();
  await expect(page.locator('.sheet').getByText(CATALOG.leg_ext.name, { exact: true })).toHaveCount(0);
  await page.locator('.modal').click({ position: { x: 5, y: 5 } });
  await page.getByRole('button', { name: '+ ejercicio', exact: true }).first().click();
  await expect(page.locator('.sheet').getByText(CATALOG.bench_leg_extension.name, { exact: true })).toBeVisible();
  await expect(page.locator('.sheet').getByText(CATALOG.leg_ext.name, { exact: true })).toHaveCount(0);
  await page.locator('.sheet .swap-item').filter({ has: page.getByText(CATALOG.bench_leg_extension.name, { exact: true }) }).click();
  const extension = page.locator('#view-today .ex').filter({ has: page.getByText(CATALOG.bench_leg_extension.name, { exact: true }) });
  await expect(extension).toBeVisible();
  await page.reload();
  await expect(extension).toBeVisible();
});
