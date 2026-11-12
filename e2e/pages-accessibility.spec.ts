import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openPage, PAGES } from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const { name, path } of PAGES) {
      test(`${name} has no axe violations`, async ({ page }) => {
        await openPage(page, path);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }

    test('the theme switch set by hand has no axe violations', async ({ page }) => {
      await openPage(page, '/en/privacy');
      await page.getByRole('button', { name: 'Night paper' }).click();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
