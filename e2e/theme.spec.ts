import { expect, test, type Page } from '@playwright/test';
import { openPage } from './helpers';

const SQUARED_PAPER = 'rgb(244, 247, 251)';
const NIGHT_PAPER = 'rgb(18, 26, 44)';

const paperColor = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('the theme switch (spec 6)', () => {
  test('follows the system setting while nothing is saved', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openPage(page, '/en/about');
    expect(await paperColor(page)).toBe(NIGHT_PAPER);
    await expect(page.getByRole('button', { name: 'Night paper' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
  });

  test('overrides the system setting, and the choice survives a reload and other pages', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openPage(page, '/en/about');
    await page.getByRole('button', { name: 'Night paper' }).click();
    await expect(page.getByRole('button', { name: 'Night paper' })).toHaveAttribute('aria-pressed', 'false');
    expect(await paperColor(page)).toBe(SQUARED_PAPER);
    expect(await page.evaluate(() => localStorage.getItem('computable.theme'))).toBe('light');

    await page.reload();
    expect(await paperColor(page)).toBe(SQUARED_PAPER);
    await page.getByRole('link', { name: 'Simulator' }).click();
    await expect(page).toHaveURL(/\/en\/simulator$/);
    expect(await paperColor(page)).toBe(SQUARED_PAPER);
  });

  test('shows the saved theme before any of the app scripts run, so the page never flashes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('computable.theme', 'dark'));
    // Block every script file of the app: React never loads, so only the script in <head> can set the theme.
    await page.route('**/_next/static/**/*.js', (route) => route.abort());
    await page.goto('/en');
    // React did not hydrate the switch.
    expect(await page.getByRole('button', { name: 'Night paper' }).getAttribute('aria-pressed')).toBeNull();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    expect(await paperColor(page)).toBe(NIGHT_PAPER);
    await expect(page.locator('.on-night')).toBeVisible();
    await expect(page.locator('.on-paper')).toBeHidden();
  });
});
