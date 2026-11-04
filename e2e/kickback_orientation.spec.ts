import { expect, test } from '@playwright/test';

test('kickback displays the corrected three phases on mobile and zoom preserves the exercise detail', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.nav button', { hasText: 'Biblioteca' }).click();
  await page.locator('.search').fill('Kickback con banda');
  await page.locator('.libcard', { hasText: 'Kickback con banda' }).click();
  await expect(page.locator('.lib-gallery .phase-lab-inline')).toHaveText(['Inicio', 'Medio', 'Final']);
  const sources: string[] = [];
  for (const [label, file] of [['Inicio', 'inicio'], ['Medio', 'medio'], ['Final', 'final']]) {
    const button = page.getByRole('button', { name: `Ampliar Kickback con banda · ${label}`, exact: true });
    const img = button.locator('img');
    await expect(img).toHaveAttribute('src', new RegExp(`/assets/exercises/kickback-band-v352/${file}[.]webp$`));
    await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    sources.push((await img.getAttribute('src'))!);
    await button.click();
    const dialog = page.getByRole('dialog', { name: `Kickback con banda · ${label} ampliada`, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.zoom-photo')).toHaveAttribute('src', sources.at(-1)!);
    await expect.poll(() => dialog.locator('.zoom-photo').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`kickback-${file}-390.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('.lib-gallery')).toBeVisible();
  }
  expect(new Set(sources).size).toBe(3);
  expect(await page.locator('.sheet').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.locator('.lib-gallery').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('kickback-gallery-390.png') });
});
