import { expect, test } from '@playwright/test';
import { openSimulator, pickExample, statesCutOff } from './helpers';

for (const width of [390, 768, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`at ${width}px in ${colorScheme} mode, the page fits and the head leaves the cell number visible`, async ({ page }) => {
      // Reduced motion stops the tape from sliding, so the screenshot shows where the tape stops.
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await openSimulator(page);
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Step', exact: true }).click();

      const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(scroll).toBe(0);
      // The rule table of Binary +1 fits without its own sideways scroll, delete buttons included.
      const tableScroll = await page.locator('table').evaluate((table) => table.parentElement!.scrollWidth - table.parentElement!.clientWidth);
      expect(tableScroll).toBe(0);

      const ring = await page.getByTestId('head-ring').boundingBox();
      const cell = await page.locator('[data-cell="3"] [data-testid="cell-symbol"]').boundingBox();
      const number = await page.locator('[data-cell="3"] [data-testid="cell-number"]').boundingBox();
      if (ring === null || cell === null || number === null) throw new Error('the head or cell 3 is not on the page');
      expect(Math.abs(ring.x + ring.width / 2 - (cell.x + cell.width / 2))).toBeLessThanOrEqual(2);
      expect(ring.y + ring.height).toBeLessThanOrEqual(number.y);

      await page.screenshot({ path: `test-results/screenshots/simulator-${width}-${colorScheme}.png`, fullPage: true });
    });
  }

  test(`at ${width}px, the move field is wide enough to show the letter next to its arrow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openSimulator(page);
    const move = page.getByRole('combobox', { name: 'Rule 1: move' });
    // A copy of the field with its natural width shows the letter and the arrow in full.
    const { shown, natural } = await move.evaluate((select) => {
      const copy = select.cloneNode(true);
      if (!(copy instanceof HTMLSelectElement)) throw new Error('the copy is not a select');
      copy.style.width = 'auto';
      copy.style.minWidth = '0';
      document.body.append(copy);
      const natural = copy.clientWidth;
      copy.remove();
      return { shown: select.clientWidth, natural };
    });
    expect(shown).toBeGreaterThanOrEqual(natural);
  });
}

test('the state diagram fits its panel again after the window changes size', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSimulator(page);
  await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 900 });
  // At 390 px the whole of Binary +1 would draw its arrow text at 9.4 px, so the diagram follows the run.
  await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => statesCutOff(page, 'q0')).toBe(0);
  await page.getByRole('button', { name: 'Whole machine' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await expect.poll(() => statesCutOff(page)).toBe(0);
});

for (const width of [390, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`at ${width}px in ${colorScheme} mode, the 2016 diagram follows the run, then shows the whole machine`, async ({ page }) => {
      // Reduced motion makes the view jump, so the screenshot shows where the view stops.
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await openSimulator(page);
      await pickExample(page, 'TCC machine (2016)');
      await page.getByRole('button', { name: 'Step', exact: true }).click();
      await expect.poll(() => statesCutOff(page, 'q1')).toBe(0);
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(scroll).toBe(0);

      const panel = page.locator('section', { has: page.getByTestId('state-diagram') });
      await panel.screenshot({ path: `test-results/screenshots/diagram-2016-${width}-${colorScheme}-follow.png` });
      await page.getByRole('button', { name: 'Whole machine' }).click();
      await expect.poll(() => statesCutOff(page)).toBe(0);
      await panel.screenshot({ path: `test-results/screenshots/diagram-2016-${width}-${colorScheme}-whole.png` });
    });
  }
}
