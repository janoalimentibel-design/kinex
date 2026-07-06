// Flujos críticos de KINEX end-to-end: sesión completa, persistencia, grupos,
// ejercicio personalizado, export/import y migración legacy.
import { expect, test, type Page } from '@playwright/test';

const V0_LEGACY = {
  sessions: {
    '2026-07-03': {
      groups: ['pierna', 'core'], mode: 'mix', format: 'ext', extraTarget: 'auto',
      done: { wall_sit: true }, repl: {}, extra: [], saved: true,
      metrics: { lba: 3, lbd: 1, knee: 2, energy: 'alta', notes: 'rodilla estable' },
    },
  },
  custom: {},
  plan: { week: 'Semana 4', focus: 'Rodilla', secondary: '', objective: '', rule: '', notes: '' },
};

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
}

function nav(page: Page, label: string) {
  return page.locator('.nav button', { hasText: label }).click();
}

test.beforeEach(({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
});

test('sesión completa: checks, guardar métricas, historial y persistencia tras recarga', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('.proglab')).toContainText('0 de 4');

  await page.locator('.ex .chk').first().click();
  await expect(page.locator('.proglab')).toContainText('1 de 4');

  await page.getByRole('button', { name: 'Marcar hecha' }).click();
  const sheet = page.locator('.sheet');
  await sheet.locator('.field', { hasText: 'Lumbar antes' }).locator('input').fill('2');
  await sheet.locator('.field', { hasText: 'Lumbar después' }).locator('input').fill('1');
  await sheet.locator('.field', { hasText: 'Rodilla' }).locator('input').fill('1');
  await sheet.locator('.field', { hasText: 'Notas' }).locator('textarea').fill('sesión e2e');
  await page.getByRole('button', { name: 'Guardar sesión' }).click();

  await expect(page.locator('.streak .n')).toHaveText('1');
  await nav(page, 'Historial');
  await expect(page.locator('.hcard')).toContainText('Lumbar 2→1');
  await expect(page.locator('.hcard')).toContainText('sesión e2e');

  await page.reload();
  await expect(page.locator('.streak .n')).toHaveText('1');
});

test('cambiar grupos por combinación rápida rearma la sesión', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Cambiar grupos' }).click();
  await page.locator('.swap-item', { hasText: 'Pecho + Tríceps' }).click();
  await expect(page.locator('.focus')).toContainText('Pecho');
  await expect(page.locator('.focus')).toContainText('Tríceps');
  await expect(page.locator('.proglab')).toContainText('0 de 4');
});

test('ejercicio personalizado: se crea y aparece en la Biblioteca', async ({ page }) => {
  await openApp(page);
  await nav(page, 'Biblioteca');
  await page.getByRole('button', { name: '+ Nuevo' }).click();
  await page.locator('.field', { hasText: 'Nombre' }).locator('input').fill('Remo e2e');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.locator('.search').fill('Remo e2e');
  await expect(page.locator('.libcard')).toHaveCount(1);
  await expect(page.locator('.libcard')).toContainText('Remo e2e');
});

test('exportar backup y reimportarlo con vista previa restaura los datos', async ({ page }) => {
  await openApp(page);
  await page.locator('.ex .chk').first().click();
  await page.getByRole('button', { name: 'Marcar hecha' }).click();
  await page.getByRole('button', { name: 'Guardar sesión' }).click();
  await expect(page.locator('.streak .n')).toHaveText('1');

  await nav(page, 'Historial');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();

  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await expect(page.locator('.sheet')).toContainText('1 sesiones');
  await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await expect(page.locator('.streak .n')).toHaveText('1');
});

test('backup v0 de A2.8 se importa con conversión y vista previa', async ({ page }, testInfo) => {
  await openApp(page);
  const v0File = testInfo.outputPath('backup-v0.json');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(v0File, JSON.stringify(V0_LEGACY));

  await nav(page, 'Historial');
  await page.locator('input[type="file"]').setInputFiles(v0File);
  await expect(page.locator('.sheet')).toContainText('versión anterior');
  await expect(page.locator('.sheet')).toContainText('1 sesiones');
  await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await expect(page.locator('.hcard')).toContainText('rodilla estable');
});

test('migración automática desde localStorage legacy al primer arranque', async ({ page }) => {
  await page.addInitScript((payload) => {
    localStorage.setItem('kinex_A2_6_pullups_corregidas', payload);
  }, JSON.stringify(V0_LEGACY));
  await openApp(page);
  await expect(page.locator('.notice')).toContainText('Migración completada');
  await expect(page.locator('.streak .n')).toHaveText('1');
  // el localStorage legacy queda intacto
  const legacy = await page.evaluate(() => localStorage.getItem('kinex_A2_6_pullups_corregidas'));
  expect(JSON.parse(legacy!).sessions['2026-07-03'].metrics.lba).toBe(3);
});

test('la app funciona offline gracias al service worker', async ({ page, context }) => {
  await openApp(page);
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.logo')).toBeVisible();
  await expect(page.locator('.proglab')).toContainText('de 4');
  await context.setOffline(false);
});
