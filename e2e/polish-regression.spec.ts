import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const endpoint = 'https://script.google.com/macros/s/test/exec';

async function seedLegacyHistory(page: Page) {
  await page.clock.install({ time: new Date('2026-10-27T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(['sessions', 'kv'], 'readwrite');
      for (let index = 0; index < 50; index++) {
        const date = new Date(Date.UTC(2026, 9, 27 - index)).toISOString().slice(0, 10);
        tx.objectStore('sessions').put({ date, groups: ['pecho', 'bicep'], mode: 'mix', format: 'base', extraTarget: 'auto', completed: { pushup: true }, replacements: {}, extras: [], saved: true, metrics: { lumbarBefore: 0, lumbarAfter: 0, knee: 0, energy: 'media', notes: 'Sesión sintética' } });
      }
      tx.objectStore('kv').put({ key: 'syncConnection', value: { endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64), device: '11111111-1111-4111-8111-111111111111', version: 2, lastSync: '2026-10-26T12:00:00.000Z' } });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    database.close();
  });
  await page.reload();
  await expect(page.locator('.logo')).toBeVisible();
  await page.clock.runFor(2000);
}

async function editToday(page: Page) {
  await page.getByRole('button', { name: 'Marcar hecha' }).click();
  await page.locator('.sheet .field', { hasText: 'Notas' }).locator('textarea').fill('Corrección sintética');
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click();
  await page.clock.runFor(2000);
}

test('conexión antigua y 50 sesiones no inventan cambios al abrir ni sobrescriben automáticamente', async ({ page }) => {
  let uploads = 0;
  await page.route(endpoint, route => { uploads++; return route.fulfill({ json: { ok: true, version: 3 }, headers: { 'Access-Control-Allow-Origin': '*' } }); });
  await seedLegacyHistory(page);
  const connection = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result); });
    const entry = await new Promise<any>(resolve => { const request = database.transaction('kv').objectStore('kv').get('syncConnection'); request.onsuccess = () => resolve(request.result); });
    database.close(); return entry.value;
  });
  expect(connection.syncedSessions).toBeUndefined();
  expect(connection.sessionReviewOrigin).toBe('observed');
  expect(connection.lastSync).toBe('2026-10-26T12:00:00.000Z');
  await expect(page.getByRole('button', { name: 'Enviar datos actualizados', exact: true })).toHaveCount(0);
  expect(uploads).toBe(0);
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  await expect(page.getByTestId('sync-feedback')).not.toContainText(/cambios pendientes|ya enviado \(/i);
  await page.locator('.nav button', { hasText: 'Hoy' }).click();
  expect((await page.locator('#view-today').innerText()).match(/2026-\d{2}-\d{2}/g)?.length ?? 0).toBeLessThan(3);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.clock.runFor(61000);
  expect(uploads).toBe(0);
  await page.reload();
  await page.clock.runFor(2000);
  await expect(page.getByRole('button', { name: 'Enviar datos actualizados', exact: true })).toHaveCount(0);
  expect(uploads).toBe(0);
});

test('editar un día antiguo conserva confirmación contextual, cancelación y fallo sin falso éxito', async ({ page }) => {
  let uploads = 0;
  let failing = true;
  await page.route(endpoint, async route => { uploads++; if (failing) await route.abort(); else await route.fulfill({ json: { ok: true, version: 3 }, headers: { 'Access-Control-Allow-Origin': '*' } }); });
  await seedLegacyHistory(page);
  await editToday(page);
  await page.reload();
  await page.clock.runFor(2000);
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByText('Perfil y seguimiento privado', { exact: true }).click();
  const retry = page.getByRole('button', { name: 'Reintentar envío', exact: true });
  let accept = false;
  let confirmations = 0;
  page.on('dialog', async dialog => {
    expect(dialog.message()).toBe('Ya existe una copia anterior en Drive. ¿Querés actualizarla con los datos guardados en este dispositivo?');
    expect(dialog.message().length).toBeLessThan(500);
    expect(dialog.message()).toMatch(/envi|reempla|copia/i);
    if (accept) await dialog.accept(); else await dialog.dismiss();
    confirmations++;
  });
  await retry.click();
  await expect.poll(() => confirmations).toBe(1);
  expect(uploads).toBe(0);
  await expect(retry).toBeEnabled();
  accept = true;
  await retry.click();
  await expect.poll(() => uploads).toBe(1);
  await expect(page.getByTestId('sync-feedback')).toContainText(/pendiente|no se confirmó/i);
  await expect(page.getByTestId('sync-feedback')).not.toContainText('Enviado a Drive:');
  failing = false;
  await retry.click();
  await expect.poll(() => uploads).toBe(2);
  await expect(page.getByTestId('sync-feedback')).toContainText('Enviado a Drive:');
});

for (const size of [{ width: 320, height: 720 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
  test(`calendario separa fecha y flecha en ${size.width}x${size.height} con ambos temas y texto ampliado`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    for (const theme of ['light', 'dark']) {
      const appearance = page.getByLabel('Apariencia', { exact: true });
      if (!await appearance.isVisible()) await page.getByRole('button', { name: 'Cambiar apariencia', exact: true }).click();
      await appearance.selectOption(theme);
      const toggle = page.getByRole('button', { name: 'Cambiar apariencia', exact: true });
      if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
      for (const zoom of ['100%', '140%']) {
        await page.evaluate(value => {
          const scale = parseInt(value, 10) / 100;
          document.documentElement.style.setProperty('-webkit-text-size-adjust', value);
          document.querySelectorAll<HTMLElement>('.weekwrap *').forEach(element => {
            element.dataset.originalFontSize ??= getComputedStyle(element).fontSize;
            element.style.fontSize = `${parseFloat(element.dataset.originalFontSize) * scale}px`;
          });
        }, zoom);
        const date = page.getByLabel('Buscar día', { exact: true });
        const next = page.getByRole('button', { name: 'Semana siguiente', exact: true });
        const input = await date.boundingBox();
        const arrow = await next.boundingBox();
        expect(input).not.toBeNull(); expect(arrow).not.toBeNull();
        const intersects = Math.min(input!.x + input!.width, arrow!.x + arrow!.width) > Math.max(input!.x, arrow!.x) && Math.min(input!.y + input!.height, arrow!.y + arrow!.height) > Math.max(input!.y, arrow!.y);
        expect(intersects).toBe(false);
        for (const control of [date, next, page.getByRole('button', { name: 'Semana anterior', exact: true }), page.locator('.week-navigation').getByRole('button', { name: 'Hoy', exact: true })]) {
          const rect = await control.boundingBox();
          expect(rect!.x).toBeGreaterThanOrEqual(0); expect(rect!.x + rect!.width).toBeLessThanOrEqual(size.width);
          expect(await control.evaluate(element => { const box = element.getBoundingClientRect(); const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2); return hit === element || element.contains(hit); })).toBe(true);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  });
}

test('revisión visual sintética de vistas, formulario y diálogo en claro y oscuro', async ({ page }) => {
  const { mkdir } = await import('node:fs/promises');
  const output = '/private/tmp/kinex-v347-review';
  await mkdir(output, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    const appearance = page.getByLabel('Apariencia', { exact: true });
    if (!await appearance.isVisible()) await page.getByRole('button', { name: 'Cambiar apariencia', exact: true }).click();
    await appearance.selectOption(theme);
    const toggle = page.getByRole('button', { name: 'Cambiar apariencia', exact: true });
    if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
    for (const label of ['Hoy', 'Historial', 'Plan', 'Biblioteca', 'Pedidos']) {
      await page.locator('.nav button', { hasText: label }).click();
      await page.evaluate(() => scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('img:visible').evaluateAll(async images => { await Promise.all(images.filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; }).map(image => (image as HTMLImageElement).decode().catch(() => undefined))); });
      await page.screenshot({ path: `${output}/${theme}-${label.toLowerCase()}-390.png` });
    }
    await page.locator('.nav button', { hasText: 'Hoy' }).click();
    await page.locator('.activity-log').scrollIntoViewIfNeeded();
    if (await page.getByLabel('Minutos 1', { exact: true }).count() === 0) {
      await page.getByRole('button', { name: 'Añadir actividad aeróbica', exact: true }).click();
      await page.getByLabel('Minutos 1', { exact: true }).fill('18');
      await page.getByLabel('Calorías 1', { exact: true }).fill('125');
      await page.getByLabel('Kilómetros 1', { exact: true }).fill('6.2');
    }
    const saveActivity = page.getByRole('button', { name: 'Guardar actividad y calorías', exact: true });
    if (await saveActivity.isEnabled()) { await saveActivity.click(); await expect(saveActivity).toBeDisabled(); }
    await page.locator('.activity-log').evaluate(element => { const header = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 100; scrollTo(0, scrollY + element.getBoundingClientRect().top - header - 12); });
    await page.screenshot({ path: `${output}/${theme}-actividad-390.png` });
    await page.locator('.activity-summary').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${theme}-actividad-resumen-390.png` });
    await page.getByRole('button', { name: 'Marcar hecha' }).click();
    await expect(page.locator('.sheet')).toBeInViewport();
    await page.screenshot({ path: `${output}/${theme}-guardar-dialog-390.png` });
    await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click();
  }
});


test('selector de apariencia permite teclado, Escape devuelve foco y tocar fuera lo cierra', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Cambiar apariencia', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Apariencia', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('.logo').click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('hoja de guardar ofrece cierre, mantiene foco dentro y devuelve foco al abrir y cerrar', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Marcar hecha' });
  await trigger.click();
  const dialog = page.locator('dialog.modal.show');
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: /Cerrar/ });
  await expect(close).toBeVisible();
  await expect(close).toBeInViewport();
  for (let count = 0; count < 12; count++) {
    await page.keyboard.press('Tab');
    // Native Tab may visit browser chrome; background app controls must remain inert.
    expect(await dialog.evaluate(element => element.contains(document.activeElement) || (document.activeElement === document.body && !document.hasFocus()))).toBe(true);
  }
  await close.focus();
  await page.getByRole('button', { name: 'Cambiar apariencia', exact: true }).evaluate(element => (element as HTMLElement).focus());
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await close.click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button', { name: 'Guardar sesión', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.streak .n')).toHaveText('1');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.click({ position: { x: 5, y: 5 } });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('capturas compactas de calendario y panel de apariencia a 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  const { mkdir } = await import('node:fs/promises');
  await mkdir('/private/tmp/kinex-v347-review', { recursive: true });
  for (const theme of ['light', 'dark']) {
    const trigger = page.getByRole('button', { name: 'Cambiar apariencia', exact: true });
    await trigger.click();
    await page.getByLabel('Apariencia', { exact: true }).selectOption(theme);
    expect((await page.getByLabel('Apariencia', { exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: `/private/tmp/kinex-v347-review/${theme}-appearance-panel-320.png` });
    await trigger.click();
    await page.screenshot({ path: `/private/tmp/kinex-v347-review/${theme}-calendar-320.png` });
  }
});
