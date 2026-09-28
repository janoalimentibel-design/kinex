import { expect, test } from '@playwright/test';
import fs from 'node:fs';

// Optional private regression input stays outside the repository and build.
test('current-week delivery preserves the real private backup and persists on mobile', async ({ page }) => {
  const path = process.env.KINEX_PRIVATE_BACKUP;
  test.skip(!path, 'Provide a local private backup for this additional regression check.');
  const backup = JSON.parse(fs.readFileSync(path!, 'utf8'));
  await page.clock.install({ time: new Date('2026-09-28T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.evaluate(async (data) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'customExercises', 'kv'], 'readwrite');
      for (const s of data.sessions) tx.objectStore('sessions').put(s);
      for (const e of data.customExercises) tx.objectStore('customExercises').put(e);
      tx.objectStore('kv').put({ key: 'plan', value: data.plan });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, backup.data);
  await page.reload();
  await expect(page.locator('.version')).toHaveText('v3.36');
  await expect(page.locator('.program-title')).toHaveText('Semana revisada · Espalda + Bíceps');
  await expect(page.locator('.ex .nm')).toHaveText([
    'Dominadas estrictas', 'Remo en máquina sentado', 'Curl de bíceps con mancuerna', 'Curl martillo con mancuernas',
  ]);
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(page.getByTestId('reviewed-routine')).toContainText('Rutina cargada');
  await expect(page.locator('.festival-routine .routine-session')).toHaveCount(4);
  await expect(page.locator('.plan')).not.toContainText('Llegar al festival');
  await page.getByRole('button', { name: 'Ver remo ergómetro' }).click();
  await expect(page.locator('.sheet')).toContainText('Remo');
  // Reload also checks that this delivery survives a second startup.
  await page.reload();
  const actual = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result);
    });
    const sessions = await new Promise<unknown[]>((resolve) => {
      const r = db.transaction('sessions').objectStore('sessions').getAll(); r.onsuccess = () => resolve(r.result);
    });
    db.close(); return sessions;
  }) as typeof backup.data.sessions;
  for (const before of backup.data.sessions.filter((s: { date: string }) => s.date < '2026-09-28')) {
    expect(actual.find((s: { date: string }) => s.date === before.date)).toEqual(before);
  }
  await page.screenshot({ path: '/tmp/kinex-v3-35-mobile.png', fullPage: true });
  await page.locator('.ex .chk').first().click();
  await expect(page.locator('.proglab')).toHaveText(/^1 de 4 ejercicios/);
  await page.reload();
  await expect(page.locator('.proglab')).toHaveText(/^1 de 4 ejercicios/);
});
