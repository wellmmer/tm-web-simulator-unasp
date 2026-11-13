import { expect, test, type Page } from '@playwright/test';
import { openPage, openSimulator } from './helpers';

const TITLES = [
  'The tape',
  'The head and its state',
  'The step sentence',
  'The controls',
  'The rule table',
  'The state diagram',
  'Keyboard and examples',
];

/** The part each step spotlights, by its data-tour mark. */
const TARGETS = ['tape', 'head', 'sentence', 'controls', 'rules', 'diagram', 'keys'];

const panel = (page: Page) => page.getByRole('dialog', { name: 'Tour of the simulator' });

/** True when the spotlight frames the part: the part's box sits inside the spotlight's box. */
async function spotlightFrames(page: Page, target: string) {
  const light = await page.getByTestId('tour-spotlight').boundingBox();
  const part = await page.locator(`[data-tour="${target}"]`).boundingBox();
  if (light === null || part === null) return false;
  return light.x <= part.x && light.y <= part.y && light.x + light.width >= part.x + part.width && light.y + light.height >= part.y + part.height;
}

test.describe('the tour (spec 5.5)', () => {
  test('finishes: 7 steps, each with its spotlight, and the visitor acts on the way (spec 9)', async ({ page }) => {
    await openSimulator(page);
    const prompt = page.getByRole('region', { name: 'New here? Take the 1-minute tour.' });
    await prompt.getByRole('button', { name: 'Take the tour' }).click();
    await expect(prompt).toBeHidden();

    for (const [index, title] of TITLES.entries()) {
      await expect(panel(page).getByText(`Step ${index + 1} of 7`)).toBeVisible();
      await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText(title);
      await expect(panel(page).getByRole('heading', { level: 2 })).toBeFocused();
      await expect(panel(page).getByRole('button', { name: 'Skip tour' })).toBeVisible();
      await expect.poll(() => spotlightFrames(page, TARGETS[index])).toBe(true);
      if (title === 'The rule table') {
        await expect(panel(page)).toContainText('Press Step and watch which row lights up.');
        await panel(page).getByRole('button', { name: 'Step' }).click();
        await expect(page.getByRole('row', { name: /q0/ }).and(page.locator('[aria-current="true"]'))).toHaveCount(1);
      }
      if (title === 'The controls') {
        await page.getByRole('slider', { name: 'Speed' }).fill('5');
        await page.getByRole('button', { name: 'Run', exact: true }).click();
        await expect(page.getByTestId('result-line')).toContainText('Accepted');
      }
      await panel(page).getByRole('button', { name: index === 6 ? 'Finish' : 'Next' }).click();
    }

    await expect(panel(page)).toBeHidden();
    await expect(page.getByTestId('tour-spotlight')).toHaveCount(0);
    // The prompt is gone, so the focus goes to the menu's Tour button.
    await expect(page.getByRole('button', { name: 'Tour', exact: true })).toBeFocused();
    await page.reload();
    await expect(prompt).toBeHidden();
  });

  test('works from the keyboard: Enter opens it, → steps the machine, Esc closes it', async ({ page }) => {
    await openSimulator(page);
    const tour = page.getByRole('button', { name: 'Tour', exact: true });
    await tour.focus();
    await page.keyboard.press('Enter');
    await expect(panel(page).getByRole('heading', { name: 'The tape' })).toBeFocused();
    // Back is off on the first step, so Tab goes to Next. "Skip tour" sits before the title.
    await page.keyboard.press('Tab');
    await expect(panel(page).getByRole('button', { name: 'Next' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(panel(page).getByRole('button', { name: 'Skip tour' })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(panel(page).getByRole('heading', { name: 'The head and its state' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('step-sentence')).toHaveText('In q0 reading 1: write 1, move right, go to q0.');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(tour).toBeFocused();
  });

  test('Esc closes the tour after the visitor uses the page, but first ends tape editing or closes the shortcuts or language list', async ({ page }) => {
    await openSimulator(page);
    const tour = page.getByRole('button', { name: 'Tour', exact: true });
    await tour.click();
    for (let step = 1; step < 4; step++) await panel(page).getByRole('button', { name: 'Next' }).click();
    await expect(panel(page).getByRole('heading', { name: 'The controls' })).toBeVisible();

    // The focus is in the tape editor: Esc ends editing only.
    await page.keyboard.press('e');
    await expect(page.getByRole('textbox', { name: 'Tape input' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('textbox', { name: 'Tape input' })).toHaveCount(0);
    await expect(panel(page)).toBeVisible();

    // The shortcuts list is open: Esc closes the list only.
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeHidden();
    await expect(panel(page)).toBeVisible();

    // The language list is open: Esc closes the list only.
    await page.getByRole('button', { name: 'Language: English' }).click();
    await expect(page.getByRole('link', { name: 'Français' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Français' })).toBeHidden();
    await expect(panel(page)).toBeVisible();

    // The focus is on the page's Step button, outside the panel: Esc closes the tour.
    await page.locator('[data-tour="controls"]').getByRole('button', { name: 'Step', exact: true }).click();
    await expect(page.getByTestId('step-sentence')).toHaveText('In q0 reading 1: write 1, move right, go to q0.');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(tour).toBeFocused();
  });

  test('"Tour" on another page opens the simulator and starts the tour', async ({ page }) => {
    await openPage(page, '/en/about');
    await page.getByRole('button', { name: 'Tour', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/simulator$/);
    await expect(panel(page).getByRole('heading', { name: 'The tape' })).toBeVisible();
  });

  test('"No, thanks" dismisses the prompt for good', async ({ page }) => {
    await openSimulator(page);
    await page.getByRole('button', { name: 'No, thanks' }).click();
    await expect(page.getByRole('region', { name: 'New here? Take the 1-minute tour.' })).toBeHidden();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Binary +1');
    await expect(page.getByRole('region', { name: 'New here? Take the 1-minute tour.' })).toBeHidden();
  });

  test('with reduced motion, the spotlight jumps instead of sliding', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSimulator(page);
    await page.getByRole('button', { name: 'Take the tour' }).click();
    const duration = () => page.getByTestId('tour-spotlight').evaluate((light) => getComputedStyle(light).transitionDuration);
    expect(await duration()).toBe('0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(duration).toBe('0.2s');
  });

  test('works in Portuguese', async ({ page }) => {
    await page.goto('/pt-br/simulator');
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
    await page.getByRole('button', { name: 'Fazer o tour' }).click();
    await expect(page.getByRole('dialog', { name: 'Tour do simulador' }).getByRole('heading', { name: 'A fita' })).toBeFocused();
    await page.getByRole('button', { name: 'Pular o tour' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
