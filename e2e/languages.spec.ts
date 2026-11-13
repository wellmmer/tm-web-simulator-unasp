import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

test.describe('a Brazilian browser (spec 3, "Language on first visit")', () => {
  test.use({ locale: 'pt-BR' });

  test('opens "/" in Portuguese at once, with the language bar', async ({ page }) => {
    await openPage(page, '/');
    await expect(page).toHaveURL(/\/pt-br$/);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('pt-BR');
    await expect(page.getByRole('link', { name: 'Abrir o simulador' })).toBeVisible();
    const bar = page.getByRole('region', { name: 'Idioma' });
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('Mostrando em português. Mudar para o inglês?');
  });

  test('"English" opens the same page in English, and "/" remembers it', async ({ page }) => {
    await openPage(page, '/pt-br/about');
    await page.getByRole('region', { name: 'Idioma' }).getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Computable');
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
  });

  test('"Continuar em português" hides the bar for good', async ({ page }) => {
    await openPage(page, '/pt-br');
    await page.getByRole('button', { name: 'Continuar em português' }).click();
    await expect(page.getByRole('region', { name: 'Idioma' })).toBeHidden();
    await page.reload();
    await expect(page.getByRole('region', { name: 'Idioma' })).toBeHidden();
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt-br$/);
  });

  test('shows the bar before any of the app scripts run, so the page never moves', async ({ page }) => {
    // Block every script file of the app: only the script in <head> can show the bar.
    await page.route('**/_next/static/**/*.js', (route) => route.abort());
    await page.goto('/pt-br/support');
    await expect(page.getByRole('region', { name: 'Idioma' })).toBeVisible();
    await page.evaluate(() => localStorage.setItem('computable.language', 'pt-BR'));
    await page.reload();
    await expect(page.getByRole('region', { name: 'Idioma' })).toBeHidden();
  });
});

test.describe('the language switcher (spec 4.2)', () => {
  test('opens the same page in another language, and "/" remembers it', async ({ page }) => {
    await openPage(page, '/en/simulator');
    await page.getByRole('button', { name: 'Language: English' }).click();
    await page.getByRole('link', { name: 'Deutsch' }).click();
    await expect(page).toHaveURL(/\/de\/simulator$/);
    await expect(page.getByRole('combobox', { name: 'Beispiel' })).toBeVisible();
    // The visitor chose German, so the bar does not ask.
    await expect(page.getByRole('region', { name: 'Sprache' })).toBeHidden();
    await page.goto('/');
    await expect(page).toHaveURL(/\/de$/);
  });

  test('closes with Esc and gives the focus back', async ({ page }) => {
    await openPage(page, '/en/about');
    const toggle = page.getByRole('button', { name: 'Language: English' });
    await toggle.click();
    await expect(page.getByRole('link', { name: 'Français' })).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Français' })).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});

test.describe('pages in other languages', () => {
  test('an English browser on a Portuguese link sees the bar', async ({ page }) => {
    await openPage(page, '/pt-br/simulator');
    await expect(page.getByRole('region', { name: 'Idioma' })).toBeVisible();
  });

  test('/pt-BR redirects to the lower-case URL', async ({ page }) => {
    await openPage(page, '/pt-BR/support');
    await expect(page).toHaveURL(/\/pt-br\/support$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pague um café para o dev');
  });

  test('a machine-translated page asks for help with the translation; Portuguese does not', async ({ page }) => {
    await openPage(page, '/fr/about');
    await expect(page.getByRole('link', { name: 'Aidez à améliorer la traduction' })).toHaveAttribute(
      'href',
      'https://github.com/wellmmer/tm-web-simulator-unasp/edit/master/messages/fr.json',
    );
    await openPage(page, '/pt-br/about');
    await expect(page.getByRole('contentinfo').getByRole('link', { name: /tradução/ })).toHaveCount(0);
  });
});
