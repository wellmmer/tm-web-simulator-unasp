import { expect, test, type Page } from '@playwright/test';
import { LOCALE_PATHS, openPage } from './helpers';

const PATHS = ['', '/about', '/support', '/privacy', '/simulator'];

const sidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const width of [390, 768, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`at ${width}px in ${colorScheme} mode, every page fits in Portuguese, Spanish, French and German`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      for (const locale of LOCALE_PATHS.filter((path) => path !== '/en')) {
        for (const path of PATHS) {
          await openPage(page, `${locale}${path}`);
          if (path === '/simulator') await expect(page.locator('.react-flow__node').first()).toBeVisible();
          expect(await sidewaysScroll(page), `${locale}${path}`).toBe(0);
        }
      }
    });

    test(`at ${width}px in ${colorScheme} mode, the language bar, Support in Portuguese and the open tour fit`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });

      // The browser is English, so the Portuguese page shows the language bar.
      await openPage(page, '/pt-br/support');
      await expect(page.getByRole('region', { name: 'Idioma' })).toBeVisible();
      await page.screenshot({ path: `test-results/screenshots/support-pt-br-${width}-${colorScheme}.png`, fullPage: true });

      await openPage(page, '/en/simulator');
      await expect(page.locator('.react-flow__node').first()).toBeVisible();
      await page.getByRole('button', { name: 'Take the tour' }).click();
      const panel = page.getByRole('dialog', { name: 'Tour of the simulator' });
      for (let step = 1; step < 5; step++) await panel.getByRole('button', { name: 'Next' }).click();
      await panel.getByRole('button', { name: 'Step' }).click();
      const box = await panel.boundingBox();
      if (box === null) throw new Error('no tour panel');
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(900);
      expect(await sidewaysScroll(page)).toBe(0);
      await page.screenshot({ path: `test-results/screenshots/tour-${width}-${colorScheme}.png` });
    });
  }
}
