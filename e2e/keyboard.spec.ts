import { expect, test } from '@playwright/test';
import { openSimulator } from './helpers';

test.describe('keyboard only (spec 5.4)', () => {
  test('runs, edits the tape and reaches the rule table without a mouse', async ({ page }) => {
    await openSimulator(page);
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('result-line')).toHaveText('Accepted after 8 steps. The tape now reads 1100.');

    // E after the run sends it back to the start, then the keys write the input.
    await page.keyboard.press('e');
    await expect(page.getByRole('textbox', { name: 'Tape input' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('1');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('textbox', { name: 'Input' })).toHaveValue('1111');
    await expect(page.getByRole('button', { name: 'Edit the tape' })).toBeFocused();

    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('result-line')).toHaveText('Accepted after 10 steps. The tape now reads 10000.');

    // Tab reaches the rule table, then the diagram's buttons. The drawing holds no stop for the focus.
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      if (await page.getByRole('textbox', { name: 'Rule 1: If in state' }).evaluate((field) => field === document.activeElement)) break;
    }
    await expect(page.getByRole('textbox', { name: 'Rule 1: If in state' })).toBeFocused();
    await page.getByRole('button', { name: 'Add a rule' }).focus();
    for (const name of ['Zoom in', 'Zoom out', 'Whole machine']) {
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name })).toBeFocused();
    }
    // On a diagram button, the arrows still step the machine: one step back hides the result.
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('result-line')).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(page.locator('summary', { hasText: 'Machine file' })).toBeFocused();
  });
});
