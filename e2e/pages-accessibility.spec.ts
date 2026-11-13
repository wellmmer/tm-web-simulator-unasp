import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { LOCALE_PATHS, openPage } from './helpers';

/** Every page, after the language prefix. */
const PATHS = ['', '/about', '/support', '/privacy', '/simulator'];

async function axeViolations(page: Page) {
  return (await new AxeBuilder({ page }).analyze()).violations;
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    // Every page in every language. The browser is English, so pages in other languages show the language bar.
    for (const locale of LOCALE_PATHS) {
      for (const path of PATHS) {
        test(`${locale}${path} has no axe violations`, async ({ page }) => {
          await openPage(page, `${locale}${path}`);
          if (path === '/simulator') await expect(page.locator('.react-flow__node').first()).toBeVisible();
          expect(await axeViolations(page)).toEqual([]);
        });
      }
    }

    test('the theme switch set by hand has no axe violations', async ({ page }) => {
      await openPage(page, '/en/privacy');
      await page.getByRole('banner').locator('button[aria-pressed]').click();
      expect(await axeViolations(page)).toEqual([]);
    });

    test('the open language switcher has no axe violations', async ({ page }) => {
      await openPage(page, '/de/about');
      await page.getByRole('button', { name: 'Sprache: Deutsch' }).click();
      await expect(page.getByRole('link', { name: 'Português' })).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });

    test('the tour has no axe violations on any of its 7 steps', async ({ page }) => {
      await openPage(page, '/en/simulator');
      await expect(page.locator('.react-flow__node').first()).toBeVisible();
      await page.getByRole('button', { name: 'Take the tour' }).click();
      const panel = page.getByRole('dialog', { name: 'Tour of the simulator' });
      for (let step = 1; step <= 7; step++) {
        await expect(panel.getByText(`Step ${step} of 7`)).toBeVisible();
        expect(await axeViolations(page), `step ${step}`).toEqual([]);
        await panel.getByRole('button', { name: step === 7 ? 'Finish' : 'Next' }).click();
      }
    });
  });
}
