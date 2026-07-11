// Flujo simple: marcar un ejercicio y descanso, sin check-in ni registro por serie.
import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
}

test.beforeEach(({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
});

test('marcar un ejercicio como hecho persiste con un único toque', async ({ page }) => {
  await openApp(page);
  await page.locator('.ex .chk').first().click();
  await expect(page.locator('.proglab')).toContainText('1 de 4');
  await expect(page.locator('.ex').first()).toHaveClass(/done/);
  await page.reload();
  await expect(page.locator('.proglab')).toContainText('1 de 4');
});

test('temporizador de descanso: aparece, cuenta hacia atrás, se extiende y se cierra', async ({ page }) => {
  await openApp(page);
  await page.locator('.ex .ex-head').first().click();
  await page.locator('.ex.open .rest-start').click();

  const timer = page.locator('.resttimer');
  await expect(timer).toBeVisible();
  const first = await timer.locator('.rt-time').textContent();
  await page.waitForTimeout(1600);
  const second = await timer.locator('.rt-time').textContent();
  expect(first).not.toBe(second); // la cuenta bajó

  await timer.getByRole('button', { name: '+15s' }).click();
  await timer.getByRole('button', { name: '✕' }).click();
  await expect(timer).not.toBeVisible();
});

test('compatibilidad: un backup v1 de la Fase 1 se importa con vista previa', async ({ page }, testInfo) => {
  const backupV1 = {
    app: 'KINEX',
    schemaVersion: 1,
    exportedAt: '2026-07-05T00:00:00.000Z',
    data: {
      sessions: [{
        date: '2026-07-04', groups: ['pecho', 'tricep'], mode: 'mix', format: 'base', extraTarget: 'auto',
        completed: {}, replacements: {}, extras: [], saved: true,
        metrics: { lumbarBefore: 1, lumbarAfter: 0, knee: 0, energy: 'alta', notes: 'backup fase 1' },
      }],
      customExercises: [],
      plan: { week: 'Semana 9', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' },
    },
  };
  const file = testInfo.outputPath('backup-v1.json');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(file, JSON.stringify(backupV1));

  await openApp(page);
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.locator('.sheet')).toContainText('1 sesiones');
  await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await expect(page.locator('.hcard')).toContainText('backup fase 1');
});
