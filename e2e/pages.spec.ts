import { expect, test, type Page } from '@playwright/test';
import { openPage, openSimulator, pickExample } from './helpers';

/** The symbol in a tape cell. */
const cell = (page: Page, index: number) => page.locator(`[data-cell="${index}"] [data-testid="cell-symbol"]`);

test.describe('Home (spec 4.2)', () => {
  test("runs Turing's first machine until the visitor presses Pause", async ({ page }) => {
    await openPage(page, '/en');
    // Speed 3 makes one step every 700 ms: after 4 steps, cells 0 and 2 hold 0 and 1.
    await expect(cell(page, 0)).toHaveText('0');
    await expect(cell(page, 2)).toHaveText('1', { timeout: 5_000 });
    await page.getByRole('button', { name: 'Pause' }).click();
    const state = await page.getByTestId('head-state').textContent();
    await page.waitForTimeout(1_500);
    await expect(page.getByTestId('head-state')).toHaveText(state ?? '');
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  });

  test('with reduced motion, shows the machine after 11 steps and keeps it still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPage(page, '/en');
    await expect(page.getByText('Head on cell 11, in state 𝔨, reading _.')).toBeAttached();
    await page.waitForTimeout(1_500);
    await expect(page.getByText('Head on cell 11, in state 𝔨, reading _.')).toBeAttached();
    const printed = await Promise.all([0, 2, 4, 6, 8, 10].map((index) => cell(page, index).textContent()));
    expect(printed).toEqual(['0', '1', '0', '1', '0', '1']);
  });

  test('"Open the simulator" opens the machine the visitor saved, not the one on Home', async ({ page }) => {
    await openSimulator(page);
    await pickExample(page, 'Palindrome checker');
    await page.getByRole('link', { name: 'Computable', exact: true }).click();
    await page.getByRole('link', { name: 'Open the simulator' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Palindrome checker');
  });
});

test.describe('Support the dev (spec 7)', () => {
  test('says the links are not ready while every handle is empty, with no amount and no payment link', async ({ page }) => {
    await openPage(page, '/en/support');
    const main = page.getByRole('main');
    await expect(main.getByText('The payment links are not ready yet. Thank you for wanting to help.')).toBeVisible();
    await expect(main.getByRole('radio')).toHaveCount(0);
    await expect(main.getByRole('link')).toHaveCount(0);
  });
});
