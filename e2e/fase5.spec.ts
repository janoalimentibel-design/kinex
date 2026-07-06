// Fase 5 end-to-end: progresiones en la tarjeta, motor de sugerencias por
// check-in (nota + marcas ⚠ en opciones manuales) e hint por RPE histórico.
import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
}

async function setGroups(page: Page, combo: string) {
  await page.getByRole('button', { name: 'Cambiar grupos' }).click();
  await page.locator('.swap-item', { hasText: combo }).click();
}

test.beforeEach(({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
});

test('botón de progresión reemplaza el ejercicio por su variante más difícil', async ({ page }) => {
  await openApp(page);
  await setGroups(page, 'Pecho + Tríceps');
  await page.locator('.ex .ex-head').first().click(); // Flexiones
  await expect(page.locator('.ex.open .nm').first()).toHaveText('Flexiones');

  await page.locator('.ex.open .prog-btn', { hasText: 'Push-Up con pausa' }).click();
  await expect(page.locator('.ex .nm', { hasText: 'Push-Up con pausa' })).toBeVisible();
  await expect(page.locator('.ex', { hasText: 'Push-Up con pausa' }).locator('.badge', { hasText: 'cambio' })).toBeVisible();
});

test('check-in con rodilla alta: nota del motor y marcas ⚠ en opciones manuales', async ({ page }) => {
  await openApp(page);
  await setGroups(page, 'Piernas + Core');

  await page.getByRole('button', { name: 'Check-in del día' }).click();
  const sheet = page.locator('.sheet');
  await sheet.locator('.field', { hasText: 'Rodilla hoy' }).locator('input').fill('5');
  await page.getByRole('button', { name: 'Guardar check-in' }).click();

  await expect(page.locator('.care-note')).toContainText('Rodilla 5/10');

  // en "+ ejercicio" de Piernas, las variantes no-iniciales quedan marcadas
  await page.locator('.grp-head', { hasText: 'PIERNAS' }).locator('.mini').click();
  await expect(page.locator('.riskflag').first()).toBeVisible();
});

test('hint por RPE bajo: la tarjeta sugiere la progresión y aplicarla funciona', async ({ page }, testInfo) => {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const yesterday = iso(new Date(Date.now() - 864e5));
  const today = iso(new Date());
  const session = (date: string, saved: boolean, setLogs: object) => ({
    date, groups: ['pecho', 'tricep'], mode: 'mix', format: 'base', extraTarget: 'auto',
    completed: {}, replacements: {}, extras: [], saved,
    metrics: saved ? { lumbarBefore: 1, lumbarAfter: 1, knee: 0, energy: 'media', notes: '' } : null,
    checkin: null, setLogs,
  });
  const backup = {
    app: 'KINEX', schemaVersion: 2, exportedAt: new Date().toISOString(),
    data: {
      sessions: [
        session(yesterday, true, { pushup: [{ reps: 12, load: null, rpe: 6, done: true }, { reps: 12, load: null, rpe: 6.5, done: true }, { reps: 10, load: null, rpe: 7, done: true }] }),
        session(today, false, {}),
      ],
      customExercises: [],
      plan: { week: 'Semana 6', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' },
    },
  };
  const file = testInfo.outputPath('backup-fase5.json');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(file, JSON.stringify(backup));

  await openApp(page);
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await page.locator('.nav button', { hasText: 'Hoy' }).click();

  await page.locator('.ex .ex-head', { hasText: 'Flexiones' }).first().click();
  const hint = page.locator('.prog-hint');
  await expect(hint).toContainText('RPE 6.5');
  await expect(hint).toContainText('Push-Up con pausa');
  await hint.click();
  await expect(page.locator('.ex .nm', { hasText: 'Push-Up con pausa' })).toBeVisible();
});
