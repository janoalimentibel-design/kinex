import { expect, test } from '@playwright/test';
test('profile persists after reload and sync only acknowledges confirmed uploads', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Objetivos y deportes', { exact: true }).fill('Objetivo de prueba');
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click();
  await expect(page.getByText('Perfil guardado en este dispositivo.', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await expect(page.getByLabel('Objetivos y deportes', { exact: true })).toHaveValue('Objetivo de prueba');
  let received = '';
  await page.route('https://script.google.com/macros/s/test/exec', async route => {
    received = route.request().postData() ?? '';
    await route.fulfill({ json: { ok: true, version: 1 }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.getByLabel('Cargar código desde archivo').setInputFiles({ name: 'CONEXION-KINEX.txt', mimeType: 'text/plain', buffer: Buffer.from(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) })) });
  await expect(page.getByText('Código cargado. Tocá Conectar y enviar mis datos.', { exact: true })).toBeVisible();
  expect(received).toBe('');
  await page.getByRole('button', { name: 'Conectar y enviar mis datos' }).click();
  await expect(page.getByTestId('sync-feedback')).toContainText('Enviado a Drive:');
  expect(JSON.parse(JSON.parse(received).payload).data.profile.goals).toBe('Objetivo de prueba');
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await expect(page.getByTestId('sync-feedback')).toContainText('Desconectado.');
});

test('completion offers sending, never claims upload while disconnected, hides on undo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.ex .chk').first()).toBeVisible();
  await expect(page.getByTestId('training-complete')).toHaveCount(0);
  const checks = page.locator('.ex .chk');
  for (let i = 0; i < await checks.count(); i++) await checks.nth(i).click();
  const banner = page.getByTestId('training-complete');
  await expect(banner).toBeVisible();
  const prompt = page.getByRole('dialog', { name: 'Entrenamiento completado' });
  await expect(prompt).toBeVisible();
  await expect(prompt).toBeInViewport();
  await prompt.getByRole('button', { name: 'Enviar datos', exact: true }).click();
  await expect(prompt).toContainText('Sin conectar:');
  await prompt.getByRole('button', { name: 'Volver a la sesión' }).click();
  await expect(banner).toContainText('Sin conectar:');
  await expect(banner).not.toContainText('Enviado a Drive:');
  await checks.first().click();
  await expect(banner).toHaveCount(0);
});

test('failed upload remains pending and a manual retry sends the completed session', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  let fail = true;
  let snapshot: { data: { sessions: { completed: Record<string, boolean> }[] } } | undefined;
  await page.route('https://script.google.com/macros/s/test/exec', async route => {
    if (fail) { await route.abort(); return; }
    snapshot = JSON.parse(JSON.parse(route.request().postData()!).payload);
    await route.fulfill({ json: { ok: true, version: 1 } });
  });
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos' }).click();
  await expect(page.getByTestId('sync-feedback')).toContainText('Pendiente: no se confirmó');
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
  const checks = page.locator('.ex .chk');
  for (let i = 0; i < await checks.count(); i++) await checks.nth(i).click();
  const banner = page.getByTestId('training-complete');
  await expect(banner).toBeVisible();
  fail = false;
  const prompt = page.getByRole('dialog', { name: 'Entrenamiento completado' });
  await expect(prompt).toBeInViewport();
  await prompt.getByRole('button', { name: 'Enviar datos', exact: true }).click();
  await expect(prompt).toContainText('Enviado a Drive:');
  expect(snapshot?.data.sessions.some(s => Object.values(s.completed).length > 0 && Object.values(s.completed).every(Boolean))).toBe(true);
});

test('a key-only input reports the correction beside Connect without sending data', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Código de conexión personal').fill('a'.repeat(64));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos', exact: true }).click();
  await expect(page.getByTestId('connection-feedback')).toContainText('Cargaste solo la clave');
  await expect(page.getByTestId('connection-feedback')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Conectar y enviar mis datos', exact: true })).toBeEnabled();
});

test('connect works without Web Locks or randomUUID and retry preserves the same device', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { value: undefined });
    Object.defineProperty(crypto, 'randomUUID', { value: undefined });
  });
  let device = '';
  let calls = 0;
  await page.route('https://script.google.com/macros/s/test/exec', async route => {
    const request = JSON.parse(route.request().postData()!);
    if (device) expect(request.device).toBe(device);
    device = request.device; calls++;
    await route.fulfill({ json: { ok: true, version: calls } });
  });
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await page.getByLabel('Código de conexión personal').fill(JSON.stringify({ endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) }));
  await page.getByRole('button', { name: 'Conectar y enviar mis datos', exact: true }).click();
  await expect(page.getByTestId('sync-feedback')).toContainText('Enviado a Drive:');
  expect(device).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  await page.getByRole('button', { name: 'Reintentar envío', exact: true }).click();
  await expect.poll(() => calls).toBe(2);
});

test('seven selected exercises trigger a visible finish dialog despite removed unfinished log entries', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-17T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.evaluate(async () => {
    const ids = ['external_rot', 'dumbbell_shoulder_press', 'bracing_90', 'bird_dog', 'suitcase', 'hollow_reg', 'lat_raise_band'];
    const database = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('kinex'); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put({ date: '2026-10-17', groups: ['hombro', 'core'], mode: 'mix', format: 'ext', extraTarget: 'auto', completed: Object.fromEntries(ids.slice(0, 6).map(id => [id, true])), replacements: {}, extras: [], saved: false, metrics: null, selectedExercises: ids, exerciseLog: [{ id: 'ab_wheel', name: 'Rueda abdominal', group: 'core', completed: false }] });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    database.close();
  });
  await page.reload();
  await expect(page.locator('.ex .chk')).toHaveCount(7);
  await expect(page.getByRole('dialog', { name: 'Entrenamiento completado' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Marcar Elevación lateral con banda', exact: true }).click();
  const prompt = page.getByRole('dialog', { name: 'Entrenamiento completado' });
  await expect(prompt).toBeInViewport();
  await expect(prompt.getByRole('button', { name: 'Enviar datos', exact: true })).toBeInViewport();
  await prompt.getByRole('button', { name: 'Volver a la sesión' }).click();
  await page.reload();
  await expect(prompt).not.toBeVisible();
  await page.getByRole('button', { name: 'Marcar Elevación lateral con banda', exact: true }).click();
  await page.getByRole('button', { name: 'Marcar Elevación lateral con banda', exact: true }).click();
  await expect(prompt).toBeInViewport();
});
