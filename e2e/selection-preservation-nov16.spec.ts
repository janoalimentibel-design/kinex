import { expect, test, type Page } from '@playwright/test';
import { CATALOG } from '../src/data/exercises';

test.use({ serviceWorkers: 'block', locale: 'es-ES' });

const today = '2026-11-16';
const base = {
  date: today, groups: ['pecho', 'bicep'], mode: 'mix', format: 'base', extraTarget: 'g1',
  completed: {}, replacements: {}, extras: [], saved: false, metrics: null,
  programmed: ['pec_deck', 'incline_bench_press', 'dumbbell_curl', 'hammer_curl_db'],
};

async function seed(page: Page, sessions: object[]) {
  await page.clock.install({ time: new Date(`${today}T12:00:00`) });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await page.evaluate(async sessions => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      for (const session of sessions) tx.objectStore('sessions').put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, sessions);
  await page.reload();
}

async function readSession(page: Page, date = today) {
  return page.evaluate(async date => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const session = await new Promise<any>((resolve, reject) => {
      const request = db.transaction('sessions').objectStore('sessions').get(date);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return session;
  }, date);
}

const card = (page: Page, id: string) => page.locator('#view-today .ex')
  .filter({ has: page.getByText(CATALOG[id].name, { exact: true }) });

async function openCard(page: Page, id: string) {
  if (!(await card(page, id).getAttribute('class'))?.split(' ').includes('open')) {
    await card(page, id).locator('.ex-head').click();
  }
}

async function replace(page: Page, id: string, replacement: string) {
  await openCard(page, id);
  await card(page, id).getByRole('button', { name: 'Cambiar', exact: true }).click();
  await page.locator('.sheet .swap-item')
    .filter({ has: page.getByText(CATALOG[replacement].name, { exact: true }) }).click();
  await expect(card(page, replacement)).toHaveCount(1);
  await expect(card(page, id)).toHaveCount(0);
}

async function expectChosenOnly(page: Page) {
  for (const id of ['pushup', 'dumbbell_curl', 'preacher_curl']) await expect(card(page, id)).toHaveCount(1);
  for (const id of ['pec_deck', 'hammer_curl_db', 'incline_bench_press']) await expect(card(page, id)).toHaveCount(0);
}

test('reemplazar y quitar antes de entrenar conserva las elecciones al ampliar formato y recargar', async ({ page }) => {
  await seed(page, [base]);
  await replace(page, 'pec_deck', 'pushup');
  await replace(page, 'hammer_curl_db', 'preacher_curl');
  await openCard(page, 'incline_bench_press');
  await card(page, 'incline_bench_press').getByRole('button', { name: 'Quitar del día', exact: true }).click();
  await expect(page.locator('#view-today .ex')).toHaveCount(3);
  await expectChosenOnly(page);

  await page.getByRole('button', { name: 'Extendido', exact: true }).click();
  await expectChosenOnly(page);
  await expect(page.locator('#view-today .ex')).toHaveCount(4);
  await page.getByRole('button', { name: 'Largo', exact: true }).click();
  await expectChosenOnly(page);
  await expect(page.locator('#view-today .ex')).toHaveCount(5);
  await page.reload();
  await expectChosenOnly(page);
  await expect(page.locator('#view-today .ex')).toHaveCount(5);
  const session = await readSession(page);
  expect(session.selectedExercises).toContain('pushup');
  expect(session.selectedExercises).toContain('preacher_curl');
  for (const id of ['pec_deck', 'hammer_curl_db', 'incline_bench_press']) expect(session.selectedExercises).not.toContain(id);
});

test('cambiar un grupo conserva los ejercicios elegidos del otro y todos sus registros', async ({ page }, testInfo) => {
  const annotated = {
    ...base,
    setLogs: { dumbbell_curl: [{ reps: 8, load: 6, rpe: 7, done: false }] },
  };
  await seed(page, [annotated]);
  await replace(page, 'hammer_curl_db', 'preacher_curl');
  await card(page, 'dumbbell_curl').locator('.chk').click();
  await expect(card(page, 'dumbbell_curl').locator('.chk')).toHaveAttribute('aria-pressed', 'true');
  const before = await readSession(page);
  await page.getByRole('button', { name: /Cambiar grupos/ }).click();
  await page.locator('.sheet .grpchip').filter({ hasText: /^Pecho$/ }).click();
  await page.locator('.sheet .grpchip').filter({ hasText: /^Espalda$/ }).click();
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.locator('#view-today .grp-head .gn')).toHaveText(['Bíceps', 'Espalda']);
  for (const id of ['dumbbell_curl', 'preacher_curl']) await expect(card(page, id)).toHaveCount(1);
  await expect(card(page, 'hammer_curl_db')).toHaveCount(0);
  await expect(card(page, 'pec_deck')).toHaveCount(0);
  await expect(card(page, 'dumbbell_curl').locator('.chk')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Extendido', exact: true }).click();
  for (const id of ['dumbbell_curl', 'preacher_curl']) await expect(card(page, id)).toHaveCount(1);
  await expect(card(page, 'hammer_curl_db')).toHaveCount(0);
  await page.reload();
  await expect(card(page, 'preacher_curl')).toHaveCount(1);
  await expect(card(page, 'dumbbell_curl').locator('.chk')).toHaveAttribute('aria-pressed', 'true');
  const after = await readSession(page);
  expect(after.completed).toEqual(before.completed);
  expect(after.setLogs).toEqual(before.setLogs);
  expect(after.exerciseLog.find((entry: { id: string }) => entry.id === 'dumbbell_curl'))
    .toEqual(before.exerciseLog.find((entry: { id: string }) => entry.id === 'dumbbell_curl'));
  await page.locator('#view-today .list').screenshot({ path: testInfo.outputPath('retained-muscle-selection.png') });
});

test('la actualización llega a propuestas automáticas intactas de hoy y futuras, conservando elecciones personales e historial', async ({ page }) => {
  const automatic = {
    ...base, groups: ['core', 'bicep'],
    programmed: ['farmer', 'suitcase', 'dead_bug', 'pallof', 'dumbbell_curl', 'hammer_curl_db'],
    programTitle: 'Próxima semana · Core + Bíceps',
  };
  const future = { ...automatic, date: '2026-11-21' };
  const personal = { ...automatic, date: '2026-11-19', manuallyEdited: true, selectedExercises: ['farmer', 'suitcase', 'dumbbell_curl'] };
  const historical = {
    ...automatic, date: '2026-11-13', saved: true,
    completed: { farmer: true },
    exerciseLog: [{ id: 'farmer', name: 'Synthetic carry record', group: 'core', completed: true }],
    setLogs: { farmer: [{ reps: null, load: 8, rpe: 6, done: true }] },
  };
  await seed(page, [automatic, future, personal, historical]);
  for (const date of [today, future.date]) {
    await page.locator('input[aria-label="Buscar día"]').fill(date);
    await expect(page.locator('.day.active .dd')).toHaveText(String(Number(date.slice(-2))));
    await expect(page.getByTestId('core-difficulty-summary')).toHaveText('Dificultad: 1 avanzado · 2 intermedios · 1 fácil.');
    const names = await page.locator('#view-today .ex .nm').allTextContents();
    const core = names.map(name => Object.values(CATALOG).find(exercise => exercise.name === name))
      .filter(exercise => exercise?.group === 'core');
    expect(core).toHaveLength(4);
    expect(core.map(exercise => exercise!.level).sort()).toEqual(['Avanzado', 'Inicial', 'Progresivo', 'Progresivo']);
    expect(core.map(exercise => exercise!.id)).not.toContain('farmer');
    expect(core.map(exercise => exercise!.id)).not.toContain('suitcase');
    for (const id of ['dumbbell_curl', 'hammer_curl_db']) await expect(card(page, id)).toHaveCount(1);
  }
  expect(await readSession(page, personal.date)).toEqual(personal);
  expect(await readSession(page, historical.date)).toEqual(historical);
  const deliveredToday = await readSession(page, today);
  const deliveredFuture = await readSession(page, future.date);
  await page.reload();
  expect(await readSession(page, today)).toEqual(deliveredToday);
  expect(await readSession(page, future.date)).toEqual(deliveredFuture);
  expect(await readSession(page, personal.date)).toEqual(personal);
  expect(await readSession(page, historical.date)).toEqual(historical);
});
