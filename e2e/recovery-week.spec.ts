import { expect, test } from '@playwright/test';
import { CATALOG } from '../src/data/exercises';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-16T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
});

const lightDays: Record<string, string[]> = {
  '2026-11-16': ['dumbbell_floor_press', 'dumbbell_curl'],
  '2026-11-19': ['bench_leg_extension', 'straight_bar_pressdown'],
  '2026-11-21': ['chest_supported_db_row', 'seated_calf_raise_db'],
};

test('el mix semanal carga tres días cortos con dosificación ligera real y deja vacíos los otros días al recargar', async ({ page }) => {
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  const routine = page.getByTestId('reviewed-routine-nov16');
  await expect(routine.locator('li')).toHaveCount(7);
  await routine.locator('summary', { hasText: 'Activación suave opcional' }).click();
  await expect(routine).toContainText('solo si es indolora');
  await expect(routine).toContainText('No fuerces estiramientos');
  await routine.getByRole('button', { name: 'Cargar semana suave' }).click();
  await expect(page.getByTestId('recovery-day')).toBeVisible();
  await expect(page.locator('#view-today .ex .nm')).toHaveText(lightDays['2026-11-16'].map(id => CATALOG[id].name));
  for (const date of ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']) {
    await page.locator('input[aria-label="Buscar día"]').fill(date);
    await expect(page.locator('.day.active .dd')).toHaveText(String(Number(date.slice(-2))));
    const ids = lightDays[date] ?? [];
    await expect(page.locator('#view-today .ex')).toHaveCount(ids.length);
    if (!ids.length) continue;
    await expect(page.locator('#view-today .ex .nm')).toHaveText(ids.map(id => CATALOG[id].name));
    for (const id of ids) {
      const card = page.locator('#view-today .ex').filter({ has: page.getByText(CATALOG[id].name, { exact: true }) });
      await expect(card.locator('.sub')).toHaveText('1–2×10–12 · desc 60–90s');
      await card.locator('.ex-head').click();
      await expect(card.locator('.stats .v')).toHaveText(['1–2', '10–12', '60–90s']);
      await expect(card.locator('.notice')).toContainText('Probá una serie');
      await expect(card.locator('.notice')).toContainText('solo si no reproduce el pinchazo');
      await expect(card.locator('.rest-start')).toContainText('60–90s');
    }
  }
  await page.reload();
  await expect(page.getByTestId('recovery-day')).toBeVisible();
  await expect(page.locator('#view-today .ex .nm')).toHaveText(lightDays['2026-11-16'].map(id => CATALOG[id].name));
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await expect(routine.getByRole('button', { name: 'Abrir semana suave' })).toBeVisible();
});

test('cargar descarga conserva un día ya empezado y sus series', async ({ page }) => {
  const recorded = {
    date: '2026-11-16', groups: ['core'], mode: 'sinpeso', format: 'base', extraTarget: 'auto',
    completed: { bird_dog: true }, replacements: {}, extras: [], saved: false, metrics: null,
    selectedExercises: ['bird_dog'], setLogs: { bird_dog: [{ reps: 5, load: null, rpe: null, done: true }] },
  };
  await page.evaluate(async recorded => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put(recorded);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, recorded);
  await page.reload();
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByTestId('reviewed-routine-nov16').getByRole('button', { name: 'Cargar semana suave' }).click();
  await expect(page.getByTestId('recovery-day')).toBeVisible();
  const persisted = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result);
    });
    const session = await new Promise(resolve => {
      const request = db.transaction('sessions').objectStore('sessions').get('2026-11-16');
      request.onsuccess = () => resolve(request.result);
    });
    db.close(); return session;
  });
  expect(persisted).toEqual(recorded);
});

test('actualizar r1 exige cargar desde Plan y conserva un miércoles manual mientras renueva los días vacíos propios', async ({ page }) => {
  const base = { mode: 'sinpeso', format: 'base', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null };
  const days = [
    ['2026-11-16', 'Lunes'], ['2026-11-17', 'Martes'], ['2026-11-18', 'Miércoles'], ['2026-11-19', 'Jueves'],
    ['2026-11-20', 'Viernes'], ['2026-11-21', 'Sábado'], ['2026-11-22', 'Domingo'],
  ];
  const sessions = days.map(([date, label]) => ({
    ...base, date, groups: ['aerobico'], selectedExercises: [] as string[], programTitle: `Semana suave · 16–22 nov · ${label}`,
    ...(date === '2026-11-18' ? { groups: ['core'], selectedExercises: ['bird_dog'], manuallyEdited: true } : {}),
  }));
  await page.evaluate(async sessions => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex'); request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'kv'], 'readwrite');
      for (const session of sessions) tx.objectStore('sessions').put(session);
      const request = tx.objectStore('kv').get('plan');
      request.onsuccess = () => tx.objectStore('kv').put({ ...request.result, value: { ...request.result.value, routineRevision: '2026-11-16-descarga-r1' } });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, sessions);
  await page.reload();
  await expect(page.locator('.logo')).toBeVisible();
  await expect(page.locator('#view-today .ex')).toHaveCount(0);
  await page.locator('.nav button', { hasText: 'Plan' }).click();
  await page.getByTestId('reviewed-routine-nov16').getByRole('button', { name: 'Cargar semana suave' }).click();
  await expect(page.locator('#view-today .ex .nm')).toHaveText(lightDays['2026-11-16'].map(id => CATALOG[id].name));
  await page.locator('input[aria-label="Buscar día"]').fill('2026-11-18');
  await expect(page.locator('#view-today .ex .nm')).toHaveText([CATALOG.bird_dog.name]);
  await page.reload();
  await page.locator('input[aria-label="Buscar día"]').fill('2026-11-18');
  await expect(page.locator('#view-today .ex .nm')).toHaveText([CATALOG.bird_dog.name]);
});
