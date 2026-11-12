import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openSimulator } from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('the simulator has no axe violations', async ({ page }) => {
      await openSimulator(page);
      await page.getByRole('button', { name: 'Step', exact: true }).click();
      await page.locator('summary', { hasText: 'Machine file' }).click();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test('the rule table with mistakes and the tape editor have no axe violations', async ({ page }) => {
      await openSimulator(page);
      await page.getByRole('textbox', { name: 'Rule 2: and reading' }).fill('0');
      await page.getByRole('textbox', { name: 'Rule 3: write' }).fill('');
      await page.getByRole('button', { name: 'Edit the tape' }).click();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
