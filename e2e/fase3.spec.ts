// Fase 3 end-to-end: check-in diario, registro por serie y temporizador de descanso.
import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
}

test.beforeEach(({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
});

test('check-in: sugiere formato por tiempo, muestra chip y aviso de molestia alta; persiste', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Check-in del día' }).click();

  const sheet = page.locator('.sheet');
  await sheet.locator('.field', { hasText: 'Lumbar hoy' }).locator('input').fill('5');
  await sheet.locator('.field', { hasText: 'Tiempo disponible' }).locator('select').selectOption('45');
  await expect(sheet).toContainText('Formato sugerido: Largo');
  await page.getByRole('button', { name: 'Guardar check-in' }).click();

  // formato aplicado + chip + nota de cuidado (lumbar 5 ≥ 4)
  await expect(page.locator('.segment button.on', { hasText: 'Largo' })).toBeVisible();
  await expect(page.locator('.checkin-chip')).toContainText('lumbar 5');
  await expect(page.locator('.care-note')).toContainText('Molestia alta');

  await page.reload();
  await expect(page.locator('.checkin-chip')).toContainText('lumbar 5');
});

test('registro por serie: completar todas las series marca el ejercicio y persiste', async ({ page }) => {
  await openApp(page);
  await page.locator('.ex .ex-head').first().click(); // abre la tarjeta

  const card = page.locator('.ex.open');
  const rows = card.locator('.setlog-row');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(2);

  for (let i = 0; i < count; i++) {
    await rows.nth(i).locator('input').first().fill('10');
    await rows.nth(i).locator('select').selectOption('8');
    await rows.nth(i).locator('.setchk').click();
  }

  // todas las series hechas ⇒ ejercicio completado
  await expect(page.locator('.proglab')).toContainText('1 de 4');
  await expect(page.locator('.ex').first()).toHaveClass(/done/);

  await page.reload();
  await page.locator('.ex .ex-head').first().click();
  await expect(page.locator('.ex.open .setlog-row').first().locator('input').first()).toHaveValue('10');
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
