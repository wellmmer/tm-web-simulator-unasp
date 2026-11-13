import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openSimulator, pickExample } from './helpers';

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

    test('the 2016 machine with all diagram buttons has no axe violations', async ({ page }) => {
      await openSimulator(page);
      await pickExample(page, 'TCC machine (2016)');
      await page.getByRole('button', { name: 'Step', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveAttribute('aria-pressed', 'true');
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test('the key hints on the buttons, such as [E] and [?], have a contrast of at least 4.5:1', async ({ page }) => {
      // axe skips them, because they are aria-hidden. They are still text that people read (WCAG 1.4.3).
      await openSimulator(page);
      const ratios = await page.locator('main kbd').evaluateAll((hints) => {
        const rgb = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number);
        const luminance = ([r, g, b]: number[]) => {
          const channel = (value: number) => {
            const c = value / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        };
        return hints.map((hint) => {
          // The first ancestor with a background colour is what the hint sits on.
          let box: Element | null = hint;
          while (box !== null && rgb(getComputedStyle(box).backgroundColor)[3] === 0) box = box.parentElement;
          const back = rgb(getComputedStyle(box ?? document.body).backgroundColor);
          const [r, g, b] = rgb(getComputedStyle(hint).color);
          // Opacity mixes the text colour with what is behind it.
          const alpha = Number(getComputedStyle(hint).opacity);
          const text = [r, g, b].map((value, index) => value * alpha + back[index] * (1 - alpha));
          const [light, dark] = [luminance(text), luminance(back)].sort((x, y) => y - x);
          return { hint: hint.textContent, ratio: Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100 };
        });
      });
      expect(ratios.length).toBeGreaterThan(5);
      for (const { hint, ratio } of ratios) expect(ratio, `[${hint}]`).toBeGreaterThanOrEqual(4.5);
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
