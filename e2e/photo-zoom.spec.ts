import { expect, test } from '@playwright/test';

test('las fotos abren ampliadas y cierran conservando el detalle del ejercicio', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill('Pallof');
  await page.locator('.libcard', { hasText: 'Pallof' }).first().click();
  await page.getByRole('button', { name: /Ampliar .*Pallof.*Inicio/ }).click();
  const dialog = page.getByRole('dialog', { name: /Pallof.*Inicio ampliada/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.zoom-photo')).toBeVisible();
  await expect(dialog).toContainText('pecho');
  await dialog.getByRole('button', { name: 'Cerrar foto' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.lib-gallery')).toBeVisible();
  await page.getByRole('button', { name: /Ampliar .*Pallof.*Final/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.photo-dialog[open]')).toHaveCount(0);
  await expect(page.locator('.lib-gallery')).toBeVisible();
});

for (const [name, directory, labels] of [
  ['Crunch en banco abdominal inclinado', 'decline-bench-crunch-v344', ['Inicio', 'Final']],
  ['Crunch en banco inclinado con brazos al frente', 'decline-bench-reach-v344', ['Inicio', 'Final']],
  ['Sostén abdominal en banco inclinado', 'decline-bench-hold-v344', ['Posición']],
] as const) {
  test(`banco inclinado: ${name} carga y amplía sus fases vigentes`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
    await page.locator('.search').fill(name);
    await page.locator('.libcard', { hasText: name }).click();
    await expect(page.locator('.lib-gallery .phase-lab-inline')).toHaveText([...labels]);
    if (labels[0] === 'Posición') {
      await expect(page.locator('.sheet .stats .k')).toHaveText(['Series', 'Tiempo', 'Descanso']);
    }
    const sources: string[] = [];
    for (const label of labels) {
      const photo = page.getByRole('button', { name: `Ampliar ${name} · ${label}`, exact: true });
      await expect(photo.locator('img')).toHaveAttribute('src', new RegExp(`/assets/exercises/${directory}/`));
      sources.push((await photo.locator('img').getAttribute('src'))!);
      await photo.click();
      const dialog = page.getByRole('dialog', { name: `${name} · ${label} ampliada`, exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('.zoom-photo')).toHaveAttribute('src', sources.at(-1)!);
      await expect.poll(() => dialog.locator('.zoom-photo').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(dialog.locator('p')).not.toHaveText('');
      await dialog.getByRole('button', { name: 'Cerrar foto' }).click();
      await expect(dialog).not.toBeVisible();
    }
    expect(new Set(sources).size).toBe(labels.length);
  });
}

test('la biblioteca retira ejercicios descartados y ofrece las incorporaciones y variantes vigentes', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  for (const name of ['Flexiones con rodillas', 'Respiración 90/90', 'Dominadas asistidas con banda', 'Abdominal corto en banco con rodillos']) {
    await page.locator('.search').fill(name);
    await expect(page.locator('.libcard')).toHaveCount(0);
  }
  for (const name of ['Extensión de cuádriceps en accesorio de banco', 'Remo con mancuernas y pecho apoyado', 'Press de pecho con mancuernas en el suelo', 'Press de banca declinado con mancuernas', 'Apertura inversa con pecho apoyado', 'Curl de bíceps sentado en banco inclinado', 'Patada de tríceps con mancuerna y apoyo', 'Crunch en banco abdominal inclinado', 'Crunch en banco inclinado con brazos al frente', 'Sostén abdominal en banco inclinado', 'Elevación de talones de pie con apoyo']) {
    await page.locator('.search').fill(name);
    await expect(page.locator('.libcard')).toHaveCount(1);
  }
});

test('chin-up supino muestra las tres fases vigentes y Escape conserva la ficha abierta', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill('Dominadas supinas');
  await page.locator('.libcard', { hasText: 'Chin-Ups' }).click();
  await expect(page.locator('.lib-gallery .phase-lab-inline')).toHaveText(['Inicio', 'Medio', 'Final']);
  for (const [label, file] of [['Inicio', 'inicio'], ['Medio', 'medio'], ['Final', 'final']]) {
    const button = page.getByRole('button', { name: `Ampliar Dominadas supinas (Chin-Ups) · ${label}`, exact: true });
    await expect(button.locator('img')).toHaveAttribute('src', new RegExp(`/assets/exercises/chinup-v348/${file}[.]webp$`));
    await button.click();
    const zoom = page.getByRole('dialog', { name: `Dominadas supinas (Chin-Ups) · ${label} ampliada`, exact: true });
    await expect(zoom).toBeVisible();
    await expect.poll(() => zoom.locator('.zoom-photo').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(zoom).not.toBeVisible();
    await expect(page.locator('.lib-gallery')).toBeVisible();
  }
});
