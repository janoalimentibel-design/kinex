import { expect, test, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';

// Exercise real generated Workbox workers on one origin across deployments.
// The older shell uses this build's UI with a generation marker; this does not
// pretend that historical releases already contained today's update notice.
async function deployments() {
  const root = resolve('dist');
  let generation = 0;
  let broken = false;
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    const file = resolve(root, `.${path === '/' ? '/index.html' : path}`);
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    try {
      let body: string | Buffer = readFileSync(file);
      if (path === '/' || path === '/index.html') {
        body = body.toString().replace('<head>', `<head><meta name="pwa-test-generation" content="${generation}">`);
      }
      if (path === '/sw.js') {
        const original = body.toString();
        body = original.replace(/(url:"index\.html",revision:")[^"]+("\})/, `$1fixture-generation-${generation}$2`);
        if (body === original) throw new Error('Generated worker index revision not found');
        if (broken) body = body.replace('precacheAndRoute([', 'precacheAndRoute([{url:"__missing-deployment.webp",revision:"broken"},');
      }
      const mime: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.png': 'image/png' };
      response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not start');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    publish(failInstall = false) { generation++; broken = failInstall; },
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

async function installOldShell(page: Page, origin: string) {
  await page.goto(origin);
  await expect(page.locator('.logo')).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByRole('button', { name: 'Recargar KINEX' })).toHaveCount(0);
  // Synthetic state predates every distributed routine, so startup cannot
  // legitimately replace it with a current-week exercise suggestion.
  const session = {
    date: '2020-01-06', groups: ['core'], mode: 'mix', format: 'base', extraTarget: 'auto',
    completed: { bird_dog: true }, replacements: {}, extras: [], saved: true, metrics: null,
    exerciseLog: [{ id: 'bird_dog', name: 'Bird Dog de prueba', group: 'core', completed: true }],
  };
  await page.evaluate(async session => {
    localStorage.setItem('kinex-codex-draft', 'Borrador ficticio protegido');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put(session);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, session);
  return session;
}

async function expectSyntheticData(page: Page, expected: unknown) {
  const actual = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result); });
    const session = await new Promise(resolve => {
      const request = db.transaction('sessions').objectStore('sessions').get('2020-01-06'); request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return { session, draft: localStorage.getItem('kinex-codex-draft') };
  });
  expect(actual).toEqual({ session: expected, draft: 'Borrador ficticio protegido' });
}

test('a foreground check installs the new worker but waits for consent to reload, preserving local records', async ({ page }) => {
  test.setTimeout(60_000);
  const deployment = await deployments();
  try {
    const session = await installOldShell(page, deployment.origin);
    deployment.publish();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('button', { name: 'Recargar KINEX' })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('meta[name="pwa-test-generation"]')).toHaveAttribute('content', '0');
    await expectSyntheticData(page, session);
    await page.getByRole('button', { name: 'Recargar KINEX' }).click();
    await expect(page.locator('meta[name="pwa-test-generation"]')).toHaveAttribute('content', '1');
    await expect(page.locator('.logo')).toBeVisible();
    await expectSyntheticData(page, session);
  } finally { await page.goto('about:blank'); await deployment.close(); }
});

test('a failed worker install keeps the old shell and data, and the next foreground check can recover', async ({ page }) => {
  test.setTimeout(60_000);
  const deployment = await deployments();
  try {
    const session = await installOldShell(page, deployment.origin);
    deployment.publish(true);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error('Missing initial registration');
      const failed = new Promise<void>((resolve, reject) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) { reject(new Error('Missing installing worker')); return; }
          worker.addEventListener('statechange', () => {
            if (worker.state === 'redundant') resolve();
            if (worker.state === 'activated') reject(new Error('Broken deployment unexpectedly activated'));
          });
        }, { once: true });
      });
      await registration.update();
      await failed;
    });
    await expect(page.getByRole('button', { name: 'Recargar KINEX' })).toHaveCount(0);
    await expect(page.locator('meta[name="pwa-test-generation"]')).toHaveAttribute('content', '0');
    await expectSyntheticData(page, session);
    deployment.publish();
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByRole('button', { name: 'Recargar KINEX' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Recargar KINEX' }).click();
    await expect(page.locator('meta[name="pwa-test-generation"]')).toHaveAttribute('content', '2');
    await expect(page.locator('.logo')).toBeVisible();
    await expectSyntheticData(page, session);
  } finally { await page.goto('about:blank'); await deployment.close(); }
});
