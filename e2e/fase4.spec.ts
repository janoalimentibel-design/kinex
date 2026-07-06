// Fase 4 end-to-end: racha, calendario y gráficos en Historial, con datos reales importados.
import { expect, test } from '@playwright/test';

function sessionAt(date: string, lumbarAfter: number, knee: number) {
  return {
    date,
    groups: ['pierna', 'core'],
    mode: 'mix',
    format: 'base',
    extraTarget: 'auto',
    completed: {},
    replacements: {},
    extras: [],
    saved: true,
    metrics: { lumbarBefore: 3, lumbarAfter, knee, energy: 'media', notes: '' },
    checkin: null,
    setLogs: {},
  };
}

// Tres semanas consecutivas hacia atrás desde hoy (siempre relativas para no caducar).
function recentDates(): string[] {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  return [0, 7, 14].map((days) => iso(new Date(now.getTime() - days * 864e5)));
}

test('racha, calendario y gráficos aparecen con datos importados; el calendario navega a Hoy', async ({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
  const [d0, d7, d14] = recentDates();
  const backup = {
    app: 'KINEX',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    data: {
      sessions: [sessionAt(d14, 4, 2), sessionAt(d7, 2, 1), sessionAt(d0, 1, 0)],
      customExercises: [],
      plan: { week: 'Semana 5', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' },
    },
  };

  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.locator('.nav button', { hasText: 'Historial' }).click();

  const { writeFileSync } = await import('node:fs');
  const file = test.info().outputPath('backup-fase4.json');
  writeFileSync(file, JSON.stringify(backup));
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();

  // racha de 3 semanas
  await expect(page.locator('.streakcard .sk-n')).toHaveText('3');
  // calendario con al menos un día entrenado marcado
  await expect(page.locator('.cal-day.trained').first()).toBeVisible();
  // ambos gráficos renderizados
  await expect(page.locator('.chart .ch-line.lumbar')).toBeVisible();
  await expect(page.locator('.chart .ch-bar').first()).toBeVisible();

  // tocar un día entrenado abre esa fecha en Hoy
  await page.locator('.cal-day.trained').last().click();
  await expect(page.locator('#view-today')).toHaveClass(/show/);

  // persistencia tras recarga
  await page.reload();
  await page.locator('.nav button', { hasText: 'Historial' }).click();
  await expect(page.locator('.streakcard .sk-n')).toHaveText('3');
});
