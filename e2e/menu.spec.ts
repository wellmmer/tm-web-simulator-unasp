import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

test.describe('the menu and the footer (spec 4.2)', () => {
  test('open every page and mark the current one', async ({ page }) => {
    await openPage(page, '/en');
    const menu = page.getByRole('navigation', { name: 'Main menu' });

    await menu.getByRole('link', { name: 'Simulator' }).click();
    await expect(page).toHaveURL(/\/en\/simulator$/);
    await expect(menu.getByRole('link', { name: 'Simulator' })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('banner').getByRole('link', { name: 'Support the dev' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buy the dev a coffee');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Support the dev' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.getByRole('link', { name: 'Simulator' })).not.toHaveAttribute('aria-current', 'page');

    const footer = page.getByRole('navigation', { name: 'Site' });
    await footer.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Computable');
    await footer.getByRole('link', { name: 'Privacy' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');

    await page.getByRole('link', { name: 'Computable', exact: true }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Computable');
  });

  test('shows Learn, Enigma and Bombe as coming soon, without a link', async ({ page }) => {
    await openPage(page, '/en/about');
    const menu = page.getByRole('navigation', { name: 'Main menu' });
    await expect(menu.getByRole('link')).toHaveText(['Simulator']);
    for (const name of ['Learn', 'Enigma', 'Bombe']) {
      await expect(menu.getByText(`${name}, coming soon`, { exact: true })).toBeVisible();
    }
  });

  test('works from the keyboard: the skip link, the menu and the theme switch', async ({ page }) => {
    await openPage(page, '/en/privacy');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to the page' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    // The focus outline is pencil red (spec 6).
    expect(await skip.evaluate((link) => getComputedStyle(link).outlineColor)).toBe('rgb(179, 38, 30)');

    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'How Vercel Web Analytics handles privacy' })).toBeFocused();

    // Back up through the menu bar, from its last stop to its first.
    for (const name of ['Night paper', 'Support the dev', 'Simulator', 'Computable']) {
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByRole('banner').getByRole(name === 'Night paper' ? 'button' : 'link', { name, exact: true })).toBeFocused();
    }

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/simulator$/);
  });
});
