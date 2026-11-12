import { expect, test } from '@playwright/test';
import { openSimulator } from './helpers';

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
