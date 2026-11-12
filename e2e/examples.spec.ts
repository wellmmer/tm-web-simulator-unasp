import { expect, test } from '@playwright/test';
import { openSimulator, pickExample, runFast } from './helpers';

test.describe('the four examples (spec 5.3)', () => {
  test('Binary +1 accepts after 8 steps with 1100 on the tape', async ({ page }) => {
    await openSimulator(page);
    for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Step', exact: true }).click();
    await expect(page.getByTestId('result-line')).toHaveText('Accepted after 8 steps. The tape now reads 1100.');
  });

  test('the palindrome checker accepts its input 0110', async ({ page }) => {
    await openSimulator(page);
    await pickExample(page, 'Palindrome checker');
    await expect(await runFast(page)).toHaveText('Accepted after 15 steps. The tape is now blank.');
  });

  test('the 2016 machine accepts after 71 steps', async ({ page }) => {
    await openSimulator(page);
    await pickExample(page, 'TCC machine (2016)');
    await expect(await runFast(page)).toHaveText('Accepted after 71 steps. The tape now reads _WYZX_WYZX_.');
  });

  test("Turing's 1936 machine pauses at the step limit", async ({ page }) => {
    await openSimulator(page);
    await pickExample(page, 'Turing 1936: 0 1 0 1…');
    await expect(await runFast(page)).toHaveText('Paused after 10,000 steps. This machine may never halt. Continue?', { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });
});
