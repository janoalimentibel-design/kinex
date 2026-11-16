import { expect, test, type Page } from '@playwright/test';
import { CATALOG } from '../src/data/exercises';

test.use({ serviceWorkers: 'block', locale: 'es-ES' });

const base = { mode: 'mix', format: 'ext', extraTarget: 'auto', completed: {}, replacements: {}, extras: [], saved: false, metrics: null };
const oldSaturday = {
  ...base, date: '2026-11-14', groups: ['pierna', 'core'],
  programmed: ['romanian_deadlift', 'tibialis', 'dead_bug', 'side_plank', 'pallof'],
  programTitle: 'Rutina semanal · 9–15 nov',
};
const recordedFriday = {
  ...base, date: '2026-11-13', groups: ['bicep'], saved: true,
  selectedExercises: ['supine_hang'], completed: { supine_hang: true },
  setLogs: { supine_hang: [{ reps: null, load: null, rpe: 6, done: true }] },
  exerciseLog: [{ id: 'supine_hang', name: 'Synthetic recorded hang', group: 'bicep', completed: true }],
};

async function seed(page: Page, sessions: object[], revision = '2026-11-09-r3') {
  await page.evaluate(async ({ sessions, revision }) => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessions', 'kv'], 'readwrite');
      for (const session of sessions) tx.objectStore('sessions').put(session);
      const request = tx.objectStore('kv').get('plan');
      request.onsuccess = () => tx.objectStore('kv').put({ ...request.result, value: { ...request.result.value, routineRevision: revision } });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, { sessions, revision });
}

async function readSession(page: Page, date: string) {
  return page.evaluate(async date => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('kinex');
      request.onsuccess = () => resolve(request.result);
    });
    const session = await new Promise(resolve => {
      const request = db.transaction('sessions').objectStore('sessions').get(date);
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return session;
  }, date);
}

async function expectCoreMix(page: Page) {
  await expect(page.getByTestId('core-difficulty-summary')).toHaveText('Dificultad: 1 avanzado · 2 intermedios · 1 fácil.');
  const names = await page.locator('#view-today .list .ex .nm').allTextContents();
  const core = names.map(name => Object.values(CATALOG).find(exercise => exercise.name === name))
    .filter(exercise => exercise?.group === 'core');
  expect(core).toHaveLength(4);
  expect(core.map(exercise => exercise!.level).sort()).toEqual(['Avanzado', 'Inicial', 'Progresivo', 'Progresivo']);
  expect(new Set(core.map(exercise => exercise!.id)).size).toBe(4);
  expect(core.map(exercise => exercise!.id)).not.toContain('farmer');
  expect(core.map(exercise => exercise!.id)).not.toContain('suitcase');
  const badges = page.getByTestId('core-difficulty-summary').locator('..').locator('.ex .badge');
  await expect(badges.filter({ hasText: /^Avanzado$/ })).toHaveCount(1);
  await expect(badges.filter({ hasText: /^Intermedio$/ })).toHaveCount(2);
  await expect(badges.filter({ hasText: /^Fácil$/ })).toHaveCount(1);
}

test('core automático mantiene cuatro dificultades variadas incluso al elegir el extra extendido para Core', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-11-16T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await seed(page, [{ ...base, date: '2026-11-16', groups: ['core', 'bicep'], extraTarget: 'g1' }]);
  await page.reload();
  await expect(page.locator('#view-today .ex')).toHaveCount(6);
  await expectCoreMix(page);
  await page.getByRole('button', { name: 'Base', exact: true }).click();
  await expectCoreMix(page);
  await page.getByRole('button', { name: 'Extendido', exact: true }).click();
  await expectCoreMix(page);
  await page.reload();
  await expectCoreMix(page);
  await page.locator('#view-today .list').screenshot({ path: testInfo.outputPath('core-difficulty-mix.png') });
});

test('la propuesta de sábado pendiente recibe el bloque core nuevo sin alterar el hang histórico ni sus series', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-14T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await seed(page, [oldSaturday, recordedFriday]);
  await page.reload();
  await expect(page.locator('#view-today .ex')).toHaveCount(6);
  await expectCoreMix(page);
  expect(await readSession(page, recordedFriday.date)).toEqual(recordedFriday);
  const migrated = await readSession(page, oldSaturday.date);
  await page.reload();
  await expectCoreMix(page);
  expect(await readSession(page, oldSaturday.date)).toEqual(migrated);
  expect(await readSession(page, recordedFriday.date)).toEqual(recordedFriday);
});

test('una serie anotada sin marcar realizada protege la elección anterior de core al actualizar', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-14T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  const started = { ...oldSaturday, setLogs: { dead_bug: [{ reps: 8, load: null, rpe: null, done: false }] } };
  await seed(page, [started, recordedFriday]);
  await page.reload();
  await expect(page.locator('#view-today .ex .nm')).toHaveText(oldSaturday.programmed.map(id => CATALOG[id].name));
  expect(await readSession(page, oldSaturday.date)).toEqual(started);
  expect(await readSession(page, recordedFriday.date)).toEqual(recordedFriday);
  await page.reload();
  expect(await readSession(page, oldSaturday.date)).toEqual(started);
});

for (const [id, directory, width] of [
  ['tke', 'tke-v358', 320],
  ['supine_hang', 'supine-hang-v358', 390],
] as const) {
  test(`${id}: las tres escenas se entienden y amplían desde el día y Biblioteca sin marcar ni cerrar la ficha`, async ({ page }, testInfo) => {
    const exercise = CATALOG[id];
    await page.setViewportSize({ width, height: 844 });
    await page.clock.install({ time: new Date('2026-11-16T12:00:00') });
    await page.goto('/');
    await expect(page.locator('.logo')).toBeVisible();
    const chosen = { ...base, date: '2026-11-16', groups: [exercise.group], manuallyEdited: true, selectedExercises: [id] };
    await seed(page, [chosen, recordedFriday]);
    await page.reload();
    const card = page.locator('#view-today .ex');
    await expect(card).toHaveCount(1);
    await card.locator('.ex-head').click();
    await expect(card.locator('.ph-lab')).toHaveText(['Inicio', 'Medio', 'Final']);
    const instructions = card.locator('.phase-instruction');
    await expect(instructions).toHaveCount(3);
    for (const instruction of await instructions.all()) await expect(instruction).not.toHaveText('');
    for (const cue of exercise.cues) await expect(card).toContainText(cue);
    const beforeZoom = await readSession(page, chosen.date);
    const sources: string[] = [];
    for (const label of ['Inicio', 'Medio', 'Final']) {
      const photo = card.getByRole('button', { name: `Ampliar ${exercise.name} · ${label}`, exact: true });
      await expect(photo.locator('img')).toHaveAttribute('src', new RegExp(`/assets/exercises/${directory}/`));
      const source = (await photo.locator('img').getAttribute('src'))!;
      sources.push(source);
      await photo.click();
      const zoom = page.getByRole('dialog', { name: `${exercise.name} · ${label} ampliada`, exact: true });
      await expect(zoom).toBeVisible();
      await expect.poll(() => zoom.locator('.zoom-photo').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(zoom.locator('.zoom-photo')).toHaveAttribute('src', source);
      await expect(zoom.locator('p')).not.toHaveText('');
      if (label === 'Medio') await page.keyboard.press('Escape');
      else await zoom.getByRole('button', { name: 'Cerrar foto', exact: true }).click();
      await expect(zoom).not.toBeVisible();
      await expect(card).toHaveClass(/open/);
      await expect(card.locator('.chk')).toHaveAttribute('aria-pressed', 'false');
    }
    expect(new Set(sources).size).toBe(3);
    expect(await readSession(page, chosen.date)).toEqual(beforeZoom);
    expect(await readSession(page, recordedFriday.date)).toEqual(recordedFriday);
    await card.screenshot({ path: testInfo.outputPath(`${id}-day-${width}.png`) });

    await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
    await page.locator('.search').fill(exercise.name);
    await page.locator('.libcard').click();
    await expect(page.locator('.sheet h3').first()).toHaveText(exercise.name);
    await expect(page.locator('.lib-gallery .phase-lab-inline')).toHaveText(['Inicio', 'Medio', 'Final']);
    if (id === 'tke') {
      await expect(page.locator('.sheet')).toContainText(/cuádriceps/i);
      await expect(page.locator('.sheet')).toContainText(/detrás de (?:la|una sola) rodilla/i);
    } else {
      await expect(page.locator('.sheet')).toContainText(/palmas hacia vos/i);
      await expect(page.locator('.sheet')).toContainText(/no.*dominada/i);
      await expect(page.locator('.sheet')).toContainText(/apoy.*pies|pies.*apoy/i);
    }
    const libraryPhotos = page.locator('.sheet .lib-gallery .photo-open img');
    await expect(libraryPhotos).toHaveCount(3);
    for (const photo of await libraryPhotos.all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    await page.locator('.sheet .lib-gallery .photo-open').nth(1).click();
    await page.getByRole('dialog', { name: `${exercise.name} · Medio ampliada`, exact: true }).getByRole('button', { name: 'Cerrar foto', exact: true }).click();
    await expect(page.locator('.sheet h3').first()).toHaveText(exercise.name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await readSession(page, chosen.date)).toEqual(beforeZoom);
    await page.locator('.sheet').screenshot({ path: testInfo.outputPath(`${id}-library-${width}.png`) });
  });
}
