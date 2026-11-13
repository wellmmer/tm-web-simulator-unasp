import { expect, test } from '@playwright/test';
import { openPage, PAGES } from './helpers';

for (const width of [390, 768, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`at ${width}px in ${colorScheme} mode, every page and the menu fit`, async ({ page }) => {
      // Reduced motion keeps Home's tape still, so the screenshots do not change from run to run.
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      for (const { name, path, heading } of PAGES) {
        await openPage(page, path);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
        const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(scroll, name).toBe(0);

        // Every menu entry sits inside the window, and on one row from 1280 px.
        const entries = page.getByRole('navigation', { name: 'Main menu' }).getByRole('listitem');
        const boxes = await entries.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON()));
        expect(boxes).toHaveLength(4);
        for (const box of boxes) expect(box.right, name).toBeLessThanOrEqual(width);
        const wordmark = await page.getByRole('link', { name: 'Computable', exact: true }).boundingBox();
        if (wordmark === null) throw new Error('no wordmark');
        const sameRow = boxes.every((box) => Math.abs(box.y + box.height / 2 - (wordmark.y + wordmark.height / 2)) < 12);
        expect(sameRow, name).toBe(width >= 1280);

        // The footer stays at the bottom of the window on short pages.
        const footer = await page.getByRole('contentinfo').boundingBox();
        if (footer === null) throw new Error('no footer');
        expect(footer.y + footer.height, name).toBeGreaterThanOrEqual(900 - 1);

        await page.screenshot({ path: `test-results/screenshots/${name}-${width}-${colorScheme}.png`, fullPage: true });
      }
    });
  }
}
